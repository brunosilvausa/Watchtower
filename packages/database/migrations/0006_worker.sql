-- Workers can execute these narrow operations, never read identity or tenant tables directly.
GRANT USAGE ON SCHEMA public TO watchtower_worker;
ALTER TABLE check_results ADD COLUMN raw_state text, ADD COLUMN maintenance boolean NOT NULL DEFAULT false;
CREATE INDEX monitor_schedule ON monitors(workspace_id,next_check_at) WHERE archived_at IS NULL AND NOT paused;
CREATE INDEX outbox_schedule ON notification_outbox(workspace_id,next_attempt_at) WHERE state IN ('pending','retry');
CREATE FUNCTION worker_register(worker text, location text, features text[]) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 IF worker !~ '^[a-zA-Z0-9_-]{1,100}$' OR location !~ '^[a-z0-9-]{1,30}$' OR cardinality(features)>9 OR NOT features <@ ARRAY['http','keyword','ping','port','heartbeat','ssl','domain','dns','api'] THEN RAISE EXCEPTION 'Invalid worker'; END IF;
 INSERT INTO probes(id,region,capabilities) VALUES(worker,location,features) ON CONFLICT(id) DO UPDATE SET last_seen_at=now(),capabilities=EXCLUDED.capabilities WHERE probes.workspace_id IS NULL AND probes.region=EXCLUDED.region;
 RETURN EXISTS(SELECT 1 FROM probes WHERE id=worker AND workspace_id IS NULL AND region=location AND NOT draining);
END $$;
CREATE FUNCTION worker_claim_checks(worker text,location text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,config_version integer,config jsonb) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; item monitors%ROWTYPE; claimed integer:=0; active integer; capabilities text[];
BEGIN
 IF batch<1 OR batch>16 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 SELECT p.capabilities INTO capabilities FROM probes p WHERE p.id=worker AND p.region=location AND p.workspace_id IS NULL AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds';
 IF capabilities IS NULL THEN RETURN; END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF NOT pg_try_advisory_xact_lock(hashtextextended(tenant::text,616)) OR EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE; END IF;
  SELECT count(*) INTO active FROM monitors m WHERE m.lease_until>now();
  FOR item IN SELECT m.* FROM monitors m WHERE NOT m.paused AND m.archived_at IS NULL AND m.next_check_at<=now() AND (m.lease_until IS NULL OR m.lease_until<=now()) AND m.type=ANY(capabilities) AND (NOT m.config ? 'regions' OR m.config->'regions' ? location) ORDER BY m.next_check_at,m.id LIMIT greatest(0,least(batch-claimed,3-active)) FOR UPDATE SKIP LOCKED LOOP
   UPDATE monitors m SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',lease_worker=worker WHERE m.id=item.id RETURNING m.lease_token INTO lease_token;
   id:=item.id;workspace_id:=tenant;config_version:=item.config_version;
   config:=item.config||jsonb_build_object('type',item.type,'target',item.target,'heartbeatLastSeenAt',item.heartbeat_seen_at,'heartbeatIntervalSeconds',item.interval_seconds);
   RETURN NEXT; claimed:=claimed+1;
  END LOOP;
  EXIT WHEN claimed>=batch;
 END LOOP;
END $$;
CREATE FUNCTION worker_maintenance(monitor uuid,at_time timestamptz) RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM maintenance_windows w WHERE (cardinality(w.monitor_ids)=0 OR monitor=ANY(w.monitor_ids)) AND at_time>=w.starts_at AND (
 (w.recurrence='once' AND at_time<w.ends_at) OR
 (w.recurrence='weekly' AND mod(extract(epoch FROM ((at_time AT TIME ZONE w.timezone)-(w.starts_at AT TIME ZONE w.timezone))),604800)<extract(epoch FROM ((w.ends_at AT TIME ZONE w.timezone)-(w.starts_at AT TIME ZONE w.timezone))))));
$$;
CREATE FUNCTION worker_quiet(policy jsonb,at_time timestamptz) RETURNS boolean LANGUAGE sql STABLE SET search_path=public,pg_temp AS $$
 SELECT CASE policy->>'quiet' WHEN 'night' THEN extract(hour FROM at_time AT TIME ZONE coalesce(policy->>'timezone','UTC'))>=22 OR extract(hour FROM at_time AT TIME ZONE coalesce(policy->>'timezone','UTC'))<7 WHEN 'weekend' THEN extract(isodow FROM at_time AT TIME ZONE coalesce(policy->>'timezone','UTC')) IN (6,7) ELSE false END;
$$;
CREATE FUNCTION worker_enqueue(tenant uuid,incident uuid,kind text,title text,policy jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE channel record; delay integer;
BEGIN
 IF worker_quiet(policy,now()) THEN RETURN; END IF;
 FOR channel IN SELECT * FROM alert_channels WHERE enabled LOOP
  INSERT INTO notification_outbox(workspace_id,channel_id,incident_id,event,payload,idempotency_key) VALUES(tenant,channel.id,incident,kind,jsonb_build_object('subject',title,'message',title),incident::text||':'||kind||':'||channel.id::text) ON CONFLICT(idempotency_key) DO NOTHING;
  IF kind='alert' AND coalesce((policy->>'escalation')::boolean,false) THEN
   FOREACH delay IN ARRAY ARRAY[5,15] LOOP
    INSERT INTO notification_outbox(workspace_id,channel_id,incident_id,event,payload,idempotency_key,next_attempt_at) VALUES(tenant,channel.id,incident,'escalation',jsonb_build_object('subject',title,'message',title),incident::text||':escalation:'||delay::text||':'||channel.id::text,now()+make_interval(mins=>delay)) ON CONFLICT(idempotency_key) DO NOTHING;
   END LOOP;
  END IF;
 END LOOP;
END $$;
CREATE FUNCTION worker_complete_check(tenant uuid,monitor uuid,fence uuid,version integer,worker text,location text,result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item monitors%ROWTYPE; incident incidents%ROWTYPE; policy jsonb; observation text; failures integer; successes integer; incident_id uuid; in_maintenance boolean; quorum integer;
BEGIN
 PERFORM set_config('app.workspace_id',tenant::text,true);
 SELECT * INTO item FROM monitors WHERE id=monitor AND workspace_id=tenant FOR UPDATE;
 IF NOT FOUND OR item.lease_token IS DISTINCT FROM fence OR item.lease_worker IS DISTINCT FROM worker OR item.lease_until<=clock_timestamp() OR item.config_version<>version OR item.paused OR item.archived_at IS NOT NULL OR EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND region=location AND workspace_id IS NULL) THEN RETURN false; END IF;
 observation:=result->>'state';
 IF observation NOT IN ('up','down','degraded','unknown') OR coalesce((result->>'durationMs')::numeric,0)<0 OR length(coalesce(result->>'errorCode',''))>100 THEN RAISE EXCEPTION 'Invalid result'; END IF;
 SELECT config INTO policy FROM alert_policies ORDER BY created_at,id LIMIT 1; policy:=coalesce(policy,'{}');
 quorum:=coalesce((policy->>'quorum')::integer,1);
 -- One public worker cannot certify multi-region quorum; keep state explicitly unknown until enough fresh distinct observations exist.
 IF quorum>1 AND (SELECT count(DISTINCT r.region) FROM check_results r WHERE r.monitor_id=monitor AND r.observed_at>now()-make_interval(secs=>item.interval_seconds*2) AND coalesce(r.raw_state,r.state)=observation AND r.region<>location)<quorum-1 THEN observation:='unknown'; END IF;
 in_maintenance:=worker_maintenance(monitor,now());
 INSERT INTO check_results(workspace_id,monitor_id,state,duration_ms,status_code,error_code,region,observed_at,expires_at,raw_state,maintenance) VALUES(tenant,monitor,CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,(result->>'durationMs')::double precision,(result->>'statusCode')::integer,CASE WHEN observation='unknown' AND quorum>1 THEN 'QUORUM_UNAVAILABLE' ELSE result->>'errorCode' END,location,now(),(result->>'expiresAt')::timestamptz,result->>'state',in_maintenance);
 failures:=CASE WHEN observation IN ('down','degraded') THEN item.failure_count+1 ELSE 0 END;
 successes:=CASE WHEN observation='up' THEN item.success_count+1 ELSE 0 END;
 UPDATE monitors SET state=CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,failure_count=failures,success_count=successes,lease_token=NULL,lease_until=NULL,lease_worker=NULL,next_check_at=now()+make_interval(secs=>item.interval_seconds),updated_at=now() WHERE id=monitor;
 SELECT * INTO incident FROM incidents WHERE monitor_id=monitor AND resolved_at IS NULL FOR UPDATE;
 IF NOT in_maintenance AND failures>=2 AND incident.id IS NULL THEN
  INSERT INTO incidents(workspace_id,monitor_id,title) VALUES(tenant,monitor,item.name||' is unavailable') RETURNING id INTO incident_id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,incident_id,'opened','Confirmed by two consecutive failed checks');
  PERFORM worker_enqueue(tenant,incident_id,'alert',item.name||' is unavailable',policy);
 ELSIF successes>=2 AND incident.id IS NOT NULL THEN
  UPDATE incidents SET state='resolved',resolved_at=now(),resolution='observed_recovery' WHERE id=incident.id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,incident.id,'recovered','Confirmed by two consecutive successful checks');
  UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE incident_id=incident.id AND event IN ('escalation','reminder') AND state IN ('pending','retry');
  IF NOT in_maintenance AND coalesce((policy->>'recovery')::boolean,true) THEN PERFORM worker_enqueue(tenant,incident.id,'recovery',item.name||' recovered',policy); END IF;
 END IF;
 RETURN true;
END $$;
CREATE FUNCTION worker_claim_deliveries(worker text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,channel text,destination text,encrypted_credentials text,event text,payload jsonb,incident_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; item record; claimed integer:=0; policy jsonb;
BEGIN
 IF batch<1 OR batch>16 OR NOT EXISTS(SELECT 1 FROM probes p WHERE p.id=worker AND p.workspace_id IS NULL AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds') THEN RETURN; END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE; END IF;
  SELECT p.config INTO policy FROM alert_policies p ORDER BY p.created_at,p.id LIMIT 1;policy:=coalesce(policy,'{}');
  UPDATE notification_outbox o SET state='cancelled',lease_token=NULL,lease_until=NULL FROM incidents i WHERE o.incident_id=i.id AND o.event='escalation' AND (i.acknowledged_at IS NOT NULL OR i.resolved_at IS NOT NULL) AND o.state IN ('pending','retry');
  IF worker_quiet(policy,now()) THEN CONTINUE; END IF;
  IF coalesce((policy->>'reminders')::boolean,false) THEN
   INSERT INTO notification_outbox(workspace_id,channel_id,incident_id,event,payload,idempotency_key)
   SELECT tenant,c.id,i.id,'reminder',jsonb_build_object('subject',i.title,'message',i.title),i.id::text||':reminder:'||floor(extract(epoch FROM (now()-i.opened_at))/1800)::text||':'||c.id::text FROM incidents i CROSS JOIN alert_channels c WHERE i.resolved_at IS NULL AND i.opened_at<now()-interval '30 minutes' AND c.enabled AND NOT worker_maintenance(i.monitor_id,now()) ON CONFLICT(idempotency_key) DO NOTHING;
  END IF;
  FOR item IN SELECT o.*,c.type channel_type,c.destination channel_destination,c.encrypted_credentials credentials FROM notification_outbox o JOIN alert_channels c ON c.id=o.channel_id AND c.workspace_id=o.workspace_id LEFT JOIN incidents i ON i.id=o.incident_id WHERE c.enabled AND o.state IN ('pending','retry') AND o.attempts<5 AND o.next_attempt_at<=now() AND (o.lease_until IS NULL OR o.lease_until<=now()) AND (i.id IS NULL OR NOT worker_maintenance(i.monitor_id,now())) ORDER BY o.next_attempt_at,o.id LIMIT least(3,batch-claimed) FOR UPDATE OF o SKIP LOCKED LOOP
   UPDATE notification_outbox o SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',attempts=attempts+1 WHERE o.id=item.id RETURNING o.lease_token INTO lease_token;
   id:=item.id; workspace_id:=tenant; channel:=item.channel_type; destination:=item.channel_destination; encrypted_credentials:=item.credentials;event:=item.event;payload:=item.payload;incident_id:=item.incident_id; RETURN NEXT;claimed:=claimed+1;
  END LOOP;
  EXIT WHEN claimed>=batch;
 END LOOP;
END $$;
CREATE FUNCTION worker_complete_delivery(tenant uuid,delivery uuid,fence uuid,outcome text,provider text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE attempts_count integer;
BEGIN
 PERFORM set_config('app.workspace_id',tenant::text,true);
 IF outcome NOT IN ('accepted','unconfigured','retry','failed') OR length(coalesce(provider,''))>200 THEN RAISE EXCEPTION 'Invalid outcome'; END IF;
 SELECT attempts INTO attempts_count FROM notification_outbox WHERE id=delivery AND lease_token=fence AND lease_until>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE notification_outbox SET state=CASE WHEN outcome='retry' AND attempts_count>=5 THEN 'failed' ELSE outcome END,provider_id=provider,lease_token=NULL,lease_until=NULL,next_attempt_at=now()+make_interval(secs=>least(3600,30*power(2,attempts_count)::integer)),error_code=CASE WHEN outcome='unconfigured' THEN 'PROVIDER_UNCONFIGURED' ELSE NULL END WHERE id=delivery;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION worker_register(text,text,text[]),worker_claim_checks(text,text,integer),worker_maintenance(uuid,timestamptz),worker_quiet(jsonb,timestamptz),worker_enqueue(uuid,uuid,text,text,jsonb),worker_complete_check(uuid,uuid,uuid,integer,text,text,jsonb),worker_claim_deliveries(text,integer),worker_complete_delivery(uuid,uuid,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION worker_register(text,text,text[]),worker_claim_checks(text,text,integer),worker_complete_check(uuid,uuid,uuid,integer,text,text,jsonb),worker_claim_deliveries(text,integer),worker_complete_delivery(uuid,uuid,uuid,text,text) TO watchtower_worker;
