CREATE TABLE monitor_region_schedules (
 workspace_id uuid NOT NULL,monitor_id uuid NOT NULL,region text NOT NULL,config_version integer NOT NULL,
 next_check_at timestamptz NOT NULL DEFAULT now(),lease_token uuid,lease_until timestamptz,lease_worker text,
 last_state text,last_observed_at timestamptz,failure_count integer NOT NULL DEFAULT 0,success_count integer NOT NULL DEFAULT 0,
 PRIMARY KEY(monitor_id,region),FOREIGN KEY(workspace_id,monitor_id) REFERENCES monitors(workspace_id,id) ON DELETE CASCADE
);
ALTER TABLE monitor_region_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitor_region_schedules FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON monitor_region_schedules USING(workspace_id=nullif(current_setting('app.workspace_id',true),'')::uuid) WITH CHECK(workspace_id=nullif(current_setting('app.workspace_id',true),'')::uuid);
CREATE INDEX region_schedule_due ON monitor_region_schedules(workspace_id,region,next_check_at);
CREATE FUNCTION request_monitor_check(monitor uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 UPDATE monitor_region_schedules SET next_check_at=now() WHERE monitor_id=monitor;
 UPDATE monitors SET next_check_at=now() WHERE id=monitor;
END $$;
CREATE OR REPLACE FUNCTION worker_claim_checks(worker text,location text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,config_version integer,config jsonb) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid;item record;claimed integer:=0;active integer;capabilities text[];private_workspace uuid;
BEGIN
 IF batch<1 OR batch>16 THEN RAISE EXCEPTION 'Invalid batch';END IF;
 SELECT p.capabilities,p.workspace_id INTO capabilities,private_workspace FROM probes p WHERE p.id=worker AND p.region=location AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds';
 IF capabilities IS NULL THEN RETURN;END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a WHERE private_workspace IS NULL OR a.workspace_id=private_workspace GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF NOT pg_try_advisory_xact_lock(hashtextextended(tenant::text,616)) OR EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE;END IF;
  INSERT INTO monitor_region_schedules(workspace_id,monitor_id,region,config_version,next_check_at)
  SELECT tenant,m.id,r.region,m.config_version,m.next_check_at FROM monitors m CROSS JOIN LATERAL jsonb_array_elements_text(CASE WHEN m.config ? 'privateProbeId' THEN jsonb_build_array((SELECT p.region FROM probes p WHERE p.id=m.config->>'privateProbeId' AND p.workspace_id=tenant)) ELSE coalesce(m.config->'regions','["local"]'::jsonb) END) r(region)
  WHERE NOT m.paused AND m.archived_at IS NULL AND r.region IS NOT NULL
  ON CONFLICT(monitor_id,region) DO UPDATE SET config_version=EXCLUDED.config_version,next_check_at=now(),lease_token=NULL,lease_until=NULL,lease_worker=NULL,last_state=NULL,last_observed_at=NULL,failure_count=0,success_count=0 WHERE monitor_region_schedules.config_version<>EXCLUDED.config_version;
  SELECT count(*) INTO active FROM monitor_region_schedules s WHERE s.lease_until>now();
  FOR item IN SELECT m.*,s.region FROM monitor_region_schedules s JOIN monitors m ON m.id=s.monitor_id AND m.workspace_id=s.workspace_id WHERE s.region=location AND NOT m.paused AND m.archived_at IS NULL AND s.next_check_at<=now() AND (s.lease_until IS NULL OR s.lease_until<=now()) AND m.type=ANY(capabilities) AND ((private_workspace IS NULL AND NOT m.config ? 'privateProbeId' AND (coalesce(m.config->'regions','["local"]'::jsonb) ? location)) OR (private_workspace IS NOT NULL AND m.config->>'privateProbeId'=worker)) ORDER BY s.next_check_at,m.id LIMIT greatest(0,least(batch-claimed,3-active)) FOR UPDATE OF s SKIP LOCKED LOOP
   UPDATE monitor_region_schedules s SET lease_token=gen_random_uuid(),lease_until=now()+interval '45 seconds',lease_worker=worker WHERE s.monitor_id=item.id AND s.region=location RETURNING s.lease_token INTO lease_token;
   id:=item.id;workspace_id:=tenant;config_version:=item.config_version;config:=item.config||jsonb_build_object('type',item.type,'target',item.target,'heartbeatLastSeenAt',item.heartbeat_seen_at,'heartbeatIntervalSeconds',item.interval_seconds);RETURN NEXT;claimed:=claimed+1;
  END LOOP;EXIT WHEN claimed>=batch;
 END LOOP;
END $$;
CREATE OR REPLACE FUNCTION worker_complete_check(tenant uuid,monitor uuid,fence uuid,version integer,worker text,location text,result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE item monitors%ROWTYPE;schedule monitor_region_schedules%ROWTYPE;incident incidents%ROWTYPE;policy jsonb;observation text;new_incident_id uuid;in_maintenance boolean;quorum integer;failed integer;recovered integer;
BEGIN
 PERFORM set_config('app.workspace_id',tenant::text,true);
 SELECT * INTO schedule FROM monitor_region_schedules WHERE monitor_id=monitor AND region=location FOR UPDATE;
 IF NOT FOUND OR schedule.lease_token IS DISTINCT FROM fence OR schedule.lease_worker IS DISTINCT FROM worker OR schedule.lease_until<=clock_timestamp() OR schedule.config_version<>version THEN RETURN false;END IF;
 SELECT * INTO item FROM monitors WHERE id=monitor AND workspace_id=tenant FOR UPDATE;
 IF NOT FOUND OR item.config_version<>version OR item.paused OR item.archived_at IS NOT NULL OR EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN RETURN false;END IF;
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND region=location AND (workspace_id IS NULL OR (workspace_id=tenant AND item.config->>'privateProbeId'=worker))) THEN RETURN false;END IF;
 IF NOT (CASE WHEN item.config ? 'privateProbeId' THEN item.config->>'privateProbeId'=worker ELSE coalesce(item.config->'regions','["local"]'::jsonb) ? location END) THEN RETURN false;END IF;
 observation:=result->>'state';
 IF observation NOT IN ('up','down','degraded','unknown') OR coalesce((result->>'durationMs')::numeric,0)<0 OR length(coalesce(result->>'errorCode',''))>100 THEN RAISE EXCEPTION 'Invalid result';END IF;
 SELECT config INTO policy FROM alert_policies ORDER BY created_at,id LIMIT 1;policy:=coalesce(policy,'{}');quorum:=coalesce((policy->>'quorum')::integer,1);
 in_maintenance:=worker_maintenance(monitor,now());
 UPDATE monitor_region_schedules SET last_state=observation,last_observed_at=now(),failure_count=CASE WHEN in_maintenance THEN 0 WHEN observation IN ('down','degraded') THEN failure_count+1 ELSE 0 END,success_count=CASE WHEN in_maintenance THEN 0 WHEN observation='up' THEN success_count+1 ELSE 0 END,lease_token=NULL,lease_until=NULL,lease_worker=NULL,next_check_at=now()+make_interval(secs=>item.interval_seconds) WHERE monitor_id=monitor AND region=location;
 SELECT count(*) FILTER(WHERE s.failure_count>=2),count(*) FILTER(WHERE s.success_count>=2) INTO failed,recovered FROM monitor_region_schedules s WHERE s.monitor_id=monitor AND s.config_version=version AND s.last_observed_at>now()-make_interval(secs=>item.interval_seconds*2) AND (item.config ? 'privateProbeId' OR coalesce(item.config->'regions','["local"]'::jsonb) ? s.region) AND EXISTS(SELECT 1 FROM probes p WHERE p.region=s.region AND p.last_seen_at>now()-interval '90 seconds' AND NOT p.draining AND (p.workspace_id IS NULL OR p.id=item.config->>'privateProbeId'));
 SELECT CASE WHEN count(*) FILTER(WHERE s.last_state IN ('down','degraded'))>=quorum THEN 'down' WHEN count(*) FILTER(WHERE s.last_state='up')>=quorum THEN 'up' ELSE 'unknown' END INTO observation FROM monitor_region_schedules s WHERE s.monitor_id=monitor AND s.config_version=version AND s.last_observed_at>now()-make_interval(secs=>item.interval_seconds*2) AND (item.config ? 'privateProbeId' OR coalesce(item.config->'regions','["local"]'::jsonb) ? s.region) AND EXISTS(SELECT 1 FROM probes p WHERE p.region=s.region AND p.last_seen_at>now()-interval '90 seconds' AND NOT p.draining AND (p.workspace_id IS NULL OR p.id=item.config->>'privateProbeId'));
 INSERT INTO check_results(workspace_id,monitor_id,state,duration_ms,status_code,error_code,region,observed_at,expires_at,raw_state,maintenance) VALUES(tenant,monitor,CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,(result->>'durationMs')::double precision,(result->>'statusCode')::integer,CASE WHEN observation='unknown' AND quorum>1 THEN 'QUORUM_UNAVAILABLE' ELSE result->>'errorCode' END,location,now(),(result->>'expiresAt')::timestamptz,result->>'state',in_maintenance);
 UPDATE monitors SET state=CASE WHEN in_maintenance THEN 'maintenance' ELSE observation END,failure_count=failed,success_count=recovered,lease_token=NULL,lease_until=NULL,lease_worker=NULL,next_check_at=(SELECT min(s.next_check_at) FROM monitor_region_schedules s WHERE s.monitor_id=monitor AND s.config_version=version),updated_at=now() WHERE id=monitor;
 SELECT * INTO incident FROM incidents WHERE monitor_id=monitor AND resolved_at IS NULL FOR UPDATE;
 IF NOT in_maintenance AND failed>=quorum AND incident.id IS NULL THEN
  INSERT INTO incidents(workspace_id,monitor_id,title) VALUES(tenant,monitor,item.name||' is unavailable') RETURNING id INTO new_incident_id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,new_incident_id,'opened','Two consecutive failed checks in the required regional quorum');
  PERFORM worker_enqueue(tenant,new_incident_id,'alert',item.name||' is unavailable',policy);
 ELSIF recovered>=quorum AND incident.id IS NOT NULL THEN
  UPDATE incidents SET state='resolved',resolved_at=now(),resolution='observed_recovery' WHERE id=incident.id;
  INSERT INTO incident_events(workspace_id,incident_id,kind,message) VALUES(tenant,incident.id,'recovered','Two consecutive successful checks in the required regional quorum');
  UPDATE notification_outbox SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE incident_id=incident.id AND event IN ('escalation','reminder') AND state IN ('pending','retry');
  IF NOT in_maintenance AND coalesce((policy->>'recovery')::boolean,true) THEN PERFORM worker_enqueue(tenant,incident.id,'recovery',item.name||' recovered',policy);END IF;
 END IF;RETURN true;
END $$;
REVOKE ALL ON FUNCTION request_monitor_check(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION request_monitor_check(uuid) TO watchtower_app;

CREATE OR REPLACE FUNCTION worker_claim_deliveries(worker text,batch integer) RETURNS TABLE(id uuid,workspace_id uuid,lease_token uuid,channel text,destination text,encrypted_credentials text,event text,payload jsonb,incident_id uuid) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid; item record; claimed integer:=0; policy jsonb;
BEGIN
 IF batch<1 OR batch>16 OR NOT EXISTS(SELECT 1 FROM probes p WHERE p.id=worker AND p.workspace_id IS NULL AND NOT p.draining AND p.last_seen_at>now()-interval '90 seconds') THEN RETURN; END IF;
 FOR tenant IN SELECT a.workspace_id FROM workspace_access a GROUP BY a.workspace_id ORDER BY md5(a.workspace_id::text||date_trunc('minute',now())::text) LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);
  IF EXISTS(SELECT 1 FROM workspaces w WHERE w.id=tenant AND w.suspended) THEN CONTINUE; END IF;
  UPDATE notification_outbox SET state='failed',error_code='DELIVERY_ATTEMPTS_EXHAUSTED',lease_token=NULL,lease_until=NULL WHERE state IN ('pending','retry') AND attempts>=5 AND (lease_until IS NULL OR lease_until<=now());
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
