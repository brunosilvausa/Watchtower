CREATE OR REPLACE FUNCTION worker_claim_checks(worker text,location text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,config_version integer,config jsonb) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; item monitors%ROWTYPE; claimed integer:=0; active integer; capabilities text[]; private_workspace uuid;
BEGIN
 IF batch<1 OR batch>16 THEN RAISE EXCEPTION 'Invalid batch'; END IF;
 SELECT p.capabilities,p.workspace_id INTO capabilities,private_workspace FROM probes p WHERE p.id=worker AND p.region=location AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds';
 IF capabilities IS NULL THEN RETURN; END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a WHERE private_workspace IS NULL OR a.workspace_id=private_workspace GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF NOT pg_try_advisory_xact_lock(hashtextextended(tenant::text,616)) OR EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE; END IF;
  SELECT count(*) INTO active FROM monitors m WHERE m.lease_until>now();
  FOR item IN SELECT m.* FROM monitors m WHERE NOT m.paused AND m.archived_at IS NULL AND m.next_check_at<=now() AND (m.lease_until IS NULL OR m.lease_until<=now()) AND m.type=ANY(capabilities) AND ((private_workspace IS NULL AND NOT m.config ? 'privateProbeId') OR (private_workspace IS NOT NULL AND m.config->>'privateProbeId'=worker)) AND (NOT m.config ? 'regions' OR m.config->'regions' ? location) ORDER BY m.next_check_at,m.id LIMIT greatest(0,least(batch-claimed,3-active)) FOR UPDATE SKIP LOCKED LOOP
   UPDATE monitors m SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',lease_worker=worker WHERE m.id=item.id RETURNING m.lease_token INTO lease_token;
   id:=item.id;workspace_id:=tenant;config_version:=item.config_version;
   config:=item.config||jsonb_build_object('type',item.type,'target',item.target,'heartbeatLastSeenAt',item.heartbeat_seen_at,'heartbeatIntervalSeconds',item.interval_seconds);
   RETURN NEXT; claimed:=claimed+1;
  END LOOP;
  EXIT WHEN claimed>=batch;
 END LOOP;
END $$;

CREATE OR REPLACE FUNCTION worker_enqueue(tenant uuid,incident uuid,kind text,title text,policy jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
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
 INSERT INTO notification_outbox(workspace_id,incident_id,event,payload,idempotency_key) SELECT tenant,incident,kind,jsonb_build_object('webhookId',w.id,'subject',title,'message',title),incident::text||':webhook:'||kind||':'||w.id::text FROM webhooks w WHERE w.enabled AND kind=ANY(w.events) ON CONFLICT(idempotency_key) DO NOTHING;
END $$;

CREATE OR REPLACE FUNCTION worker_complete_check(tenant uuid,monitor uuid,fence uuid,version integer,worker text,location text,result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item monitors%ROWTYPE; incident incidents%ROWTYPE; policy jsonb; observation text; failures integer; successes integer; new_incident_id uuid; in_maintenance boolean; quorum integer;
BEGIN
 PERFORM set_config('app.workspace_id',tenant::text,true);
 SELECT * INTO item FROM monitors WHERE id=monitor AND workspace_id=tenant FOR UPDATE;
 IF NOT FOUND OR item.lease_token IS DISTINCT FROM fence OR item.lease_worker IS DISTINCT FROM worker OR item.lease_until<=clock_timestamp() OR item.config_version<>version OR item.paused OR item.archived_at IS NOT NULL OR EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN RETURN false; END IF;
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND region=location AND (workspace_id IS NULL OR (workspace_id=tenant AND item.config->>'privateProbeId'=worker))) THEN RETURN false; END IF;
 observation:=result->>'state';
 IF observation NOT IN ('up','down','degraded','unknown') OR coalesce((result->>'durationMs')::numeric,0)<0 OR length(coalesce(result->>'errorCode',''))>100 THEN RAISE EXCEPTION 'Invalid result'; END IF;
 SELECT config INTO policy FROM alert_policies ORDER BY created_at,id LIMIT 1; policy:=coalesce(policy,'{}');
 quorum:=coalesce((policy->>'quorum')::integer,1);
 -- One public worker cannot certify multi-region quorum; keep state explicitly unknown until enough fresh distinct observations exist.
 IF quorum>1 AND (SELECT count(DISTINCT r.region) FROM check_results r WHERE r.monitor_id=monitor AND r.observed_at>now()-make_interval(secs=>item.interval_seconds*2) AND coalesce(r.raw_state,r.state)=observation AND r.region<>location AND EXISTS(SELECT 1 FROM probes p WHERE p.region=r.region AND p.last_seen_at>now()-interval '90 seconds' AND NOT p.draining AND p.workspace_id IS NULL))<quorum-1 THEN observation:='unknown'; END IF;
 in_maintenance:=worker_maintenance(monitor,now());
 INSERT INTO check_results(workspace_id,monitor_id,state,duration_ms,status_code,error_code,region,observed_at,expires_at,raw_state,maintenance) VALUES(tenant,monitor,CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,(result->>'durationMs')::double precision,(result->>'statusCode')::integer,CASE WHEN observation='unknown' AND quorum>1 THEN 'QUORUM_UNAVAILABLE' ELSE result->>'errorCode' END,location,now(),(result->>'expiresAt')::timestamptz,result->>'state',in_maintenance);
 failures:=CASE WHEN in_maintenance THEN 0 WHEN observation IN ('down','degraded') THEN item.failure_count+1 ELSE 0 END;
 successes:=CASE WHEN in_maintenance THEN 0 WHEN observation='up' THEN item.success_count+1 ELSE 0 END;
 UPDATE monitors SET state=CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,failure_count=failures,success_count=successes,lease_token=NULL,lease_until=NULL,lease_worker=NULL,next_check_at=now()+make_interval(secs=>item.interval_seconds),updated_at=now() WHERE id=monitor;
 SELECT * INTO incident FROM incidents WHERE monitor_id=monitor AND resolved_at IS NULL FOR UPDATE;
 IF NOT in_maintenance AND failures>=2 AND incident.id IS NULL THEN
  INSERT INTO incidents(workspace_id,monitor_id,title) VALUES(tenant,monitor,item.name||' is unavailable') RETURNING id INTO new_incident_id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,new_incident_id,'opened','Confirmed by two consecutive failed checks');
  PERFORM worker_enqueue(tenant,new_incident_id,'alert',item.name||' is unavailable',policy);
 ELSIF successes>=2 AND incident.id IS NOT NULL THEN
  UPDATE incidents SET state='resolved',resolved_at=now(),resolution='observed_recovery' WHERE id=incident.id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,incident.id,'recovered','Confirmed by two consecutive successful checks');
  UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE incident_id=incident.id AND event IN ('escalation','reminder') AND state IN ('pending','retry');
  IF NOT in_maintenance AND coalesce((policy->>'recovery')::boolean,true) THEN PERFORM worker_enqueue(tenant,incident.id,'recovery',item.name||' recovered',policy); END IF;
 END IF;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION worker_claim_deliveries(worker text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,channel text,destination text,encrypted_credentials text,event text,payload jsonb,incident_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
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
  FOR item IN SELECT o.*,CASE WHEN wh.id IS NOT NULL THEN 'webhook' WHEN o.event='phone-verification' THEN 'sms' ELSE coalesce(c.type,'email') END channel_type,coalesce(c.destination,wh.url,o.payload->>'destination') channel_destination,CASE WHEN wh.id IS NOT NULL THEN wh.encrypted_secret WHEN c.id IS NULL THEN '__SYSTEM_EMAIL__' ELSE c.encrypted_credentials END credentials FROM notification_outbox o LEFT JOIN alert_channels c ON c.id=o.channel_id AND c.workspace_id=o.workspace_id LEFT JOIN webhooks wh ON wh.id::text=o.payload->>'webhookId' AND wh.workspace_id=o.workspace_id LEFT JOIN incidents i ON i.id=o.incident_id WHERE (c.enabled OR wh.enabled OR (o.channel_id IS NULL AND NOT o.payload ? 'webhookId' AND o.event IN ('subscription-verification','status-update','weekly-summary','phone-verification'))) AND o.state IN ('pending','retry') AND o.attempts<5 AND o.next_attempt_at<=now() AND (o.lease_until IS NULL OR o.lease_until<=now()) AND (i.id IS NULL OR NOT worker_maintenance(i.monitor_id,now())) ORDER BY o.next_attempt_at,o.id LIMIT least(3,batch-claimed) FOR UPDATE OF o SKIP LOCKED LOOP
   UPDATE notification_outbox o SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',attempts=attempts+1 WHERE o.id=item.id RETURNING o.lease_token INTO lease_token;
   id:=item.id; workspace_id:=tenant; channel:=item.channel_type; destination:=item.channel_destination; encrypted_credentials:=item.credentials;event:=item.event;payload:=item.payload;incident_id:=item.incident_id; RETURN NEXT;claimed:=claimed+1;
  END LOOP;
  EXIT WHEN claimed>=batch;
 END LOOP;
END $$;

CREATE FUNCTION manage_private_probe(actor text,tenant uuid,action text,identifier text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE access record; result jsonb;
BEGIN
 SELECT * INTO access FROM authorize_workspace(actor,tenant);
 IF access IS NULL OR access.suspended OR access.role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Workspace access denied' USING ERRCODE='42501'; END IF;
 PERFORM set_config('app.workspace_id',tenant::text,true);
 IF action='list' THEN SELECT coalesce(jsonb_agg(to_jsonb(p)-'enrollment_hash'),'[]') INTO result FROM probes p WHERE workspace_id=tenant;RETURN result;
 ELSIF action='create' THEN
  IF identifier !~ '^[a-zA-Z0-9_-]{1,100}$' OR payload->>'region' !~ '^[a-z0-9-]{1,30}$' OR payload->>'hash' !~ '^[a-f0-9]{64}$' OR (SELECT count(*) FROM probes WHERE workspace_id=tenant)>=10 THEN RAISE EXCEPTION 'Invalid probe enrollment'; END IF;
  INSERT INTO probes(id,workspace_id,region,capabilities,last_seen_at,enrollment_hash) VALUES(identifier,tenant,payload->>'region',ARRAY(SELECT jsonb_array_elements_text(payload->'capabilities')),'epoch',payload->>'hash');
 ELSIF action='revoke' THEN UPDATE probes SET draining=true,enrollment_hash=NULL WHERE id=identifier AND workspace_id=tenant;IF NOT FOUND THEN RAISE EXCEPTION 'Probe unavailable';END IF;
 ELSE RAISE EXCEPTION 'Invalid action';END IF;
 INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id) VALUES(tenant,actor,'probe.'||action,'probe',identifier);
 RETURN jsonb_build_object('id',identifier);
END $$;
CREATE FUNCTION private_probe_action(hash text,action text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE probe probes%ROWTYPE; result jsonb; applied boolean;
BEGIN
 SELECT * INTO probe FROM probes WHERE enrollment_hash=hash AND workspace_id IS NOT NULL AND NOT draining;
 IF NOT FOUND THEN RAISE EXCEPTION 'Probe access denied' USING ERRCODE='42501';END IF;
 PERFORM set_config('app.workspace_id',probe.workspace_id::text,true);
 IF EXISTS(SELECT 1 FROM workspaces WHERE id=probe.workspace_id AND suspended) THEN RAISE EXCEPTION 'Probe access denied' USING ERRCODE='42501';END IF;
 UPDATE probes SET last_seen_at=now() WHERE id=probe.id;
 IF action='heartbeat' THEN RETURN jsonb_build_object('id',probe.id,'region',probe.region);
 ELSIF action='claim' THEN SELECT coalesce(jsonb_agg(to_jsonb(c)),'[]') INTO result FROM worker_claim_checks(probe.id,probe.region,3)c;RETURN result;
 ELSIF action='complete' THEN
  SELECT worker_complete_check(probe.workspace_id,(payload->>'id')::uuid,(payload->>'leaseToken')::uuid,(payload->>'configVersion')::integer,probe.id,probe.region,payload->'result') INTO applied;
  RETURN jsonb_build_object('applied',applied);
 ELSE RAISE EXCEPTION 'Invalid action';END IF;
END $$;
CREATE FUNCTION worker_housekeeping(worker text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; recipient record; total integer:=0; removed integer; report text;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND workspace_id IS NULL AND NOT draining AND last_seen_at>now()-interval '90 seconds') OR NOT pg_try_advisory_xact_lock(616,9) THEN RETURN 0; END IF;
 FOR tenant IN SELECT DISTINCT workspace_id FROM workspace_access LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  DELETE FROM audit_events WHERE id IN (SELECT id FROM audit_events WHERE created_at<now()-interval '365 days' LIMIT 1000);
  GET DIAGNOSTICS removed=ROW_COUNT;total:=total+removed;
  IF EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN CONTINUE; END IF;
  SELECT 'Monitors: '||count(*)::text||'. Currently healthy: '||count(*) FILTER(WHERE state='up')::text||'. Unknown: '||count(*) FILTER(WHERE state='unknown')::text||'. Open incidents: '||(SELECT count(*) FROM incidents WHERE resolved_at IS NULL)::text INTO report FROM monitors WHERE archived_at IS NULL;
  FOR recipient IN SELECT u.id,u.email,p.preferences FROM memberships m JOIN auth_user u ON u.id=m.user_id JOIN user_preferences p ON p.user_id=u.id WHERE u."emailVerified" AND p.preferences->>'weeklyReport'='true' LOOP
   IF extract(isodow FROM now() AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'))=1 AND extract(hour FROM now() AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'))>=9 THEN
    INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES(tenant,'weekly-summary',jsonb_build_object('destination',recipient.email,'subject','Watchtower weekly summary','message',report),tenant::text||':weekly:'||recipient.id||':'||to_char(now() AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'),'IYYY-IW')) ON CONFLICT(idempotency_key) DO NOTHING;
   END IF;
  END LOOP;
 END LOOP;
 RETURN total;
END $$;
REVOKE ALL ON FUNCTION manage_private_probe(text,uuid,text,text,jsonb),private_probe_action(text,text,jsonb),worker_housekeeping(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION manage_private_probe(text,uuid,text,text,jsonb),private_probe_action(text,text,jsonb) TO watchtower_app;
GRANT EXECUTE ON FUNCTION worker_housekeeping(text) TO watchtower_worker;
