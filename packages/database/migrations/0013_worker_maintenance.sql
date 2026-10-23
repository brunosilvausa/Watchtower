ALTER TABLE probes ADD COLUMN name text;
CREATE OR REPLACE FUNCTION manage_private_probe(actor text,tenant uuid,action text,identifier text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE access record; result jsonb;
BEGIN
 SELECT * INTO access FROM authorize_workspace(actor,tenant);
 IF access IS NULL OR access.suspended OR access.role NOT IN ('owner','admin') THEN RAISE EXCEPTION 'Workspace access denied' USING ERRCODE='42501'; END IF;
 PERFORM set_config('app.workspace_id',tenant::text,true);
 IF action='list' THEN SELECT coalesce(jsonb_agg(to_jsonb(p)-'enrollment_hash'),'[]') INTO result FROM probes p WHERE workspace_id=tenant;RETURN result;
 ELSIF action='create' THEN
  IF identifier !~ '^[a-zA-Z0-9_-]{1,100}$' OR payload->>'region' !~ '^[a-z0-9-]{1,30}$' OR payload->>'hash' !~ '^[a-f0-9]{64}$' OR (SELECT count(*) FROM probes WHERE workspace_id=tenant)>=10 THEN RAISE EXCEPTION 'Invalid probe enrollment'; END IF;
  INSERT INTO probes(id,workspace_id,region,capabilities,last_seen_at,enrollment_hash,name) VALUES(identifier,tenant,payload->>'region',ARRAY(SELECT jsonb_array_elements_text(payload->'capabilities')),'epoch',payload->>'hash',left(coalesce(payload->>'name',identifier),100));
 ELSIF action='revoke' THEN UPDATE probes SET draining=true,enrollment_hash=NULL WHERE id=identifier AND workspace_id=tenant;IF NOT FOUND THEN RAISE EXCEPTION 'Probe unavailable';END IF;
 ELSE RAISE EXCEPTION 'Invalid action';END IF;
 INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id) VALUES(tenant,actor,'probe.'||action,'probe',identifier);
 RETURN jsonb_build_object('id',identifier);
END $$;
CREATE FUNCTION worker_retain_tenant() RETURNS integer LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE removed integer;
BEGIN
 DELETE FROM audit_events WHERE id IN (SELECT id FROM audit_events WHERE created_at<now()-interval '365 days' LIMIT 1000);
 GET DIAGNOSTICS removed=ROW_COUNT;RETURN removed;
END $$;
CREATE FUNCTION worker_schedule_weekly(tenant uuid,at_time timestamptz) RETURNS integer LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE recipient record; report text; inserted integer; total integer:=0;
BEGIN
 SELECT 'Monitors: '||count(*)::text||'. Currently healthy: '||count(*) FILTER(WHERE state='up')::text||'. Unknown: '||count(*) FILTER(WHERE state='unknown')::text||'. Open incidents: '||(SELECT count(*) FROM incidents WHERE resolved_at IS NULL)::text INTO report FROM monitors WHERE archived_at IS NULL;
 FOR recipient IN SELECT u.id,u.email,p.preferences FROM memberships m JOIN auth_user u ON u.id=m.user_id JOIN user_preferences p ON p.user_id=u.id WHERE u."emailVerified" AND p.preferences->>'weeklyReport'='true' LOOP
  IF extract(isodow FROM at_time AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'))=1 AND extract(hour FROM at_time AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'))>=9 THEN
   INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES(tenant,'weekly-summary',jsonb_build_object('destination',recipient.email,'subject','Watchtower weekly summary','message',report),tenant::text||':weekly:'||recipient.id||':'||to_char(at_time AT TIME ZONE coalesce(recipient.preferences->>'timezone','UTC'),'IYYY-IW')) ON CONFLICT(idempotency_key) DO NOTHING;
   GET DIAGNOSTICS inserted=ROW_COUNT;total:=total+inserted;
  END IF;
 END LOOP;RETURN total;
END $$;
CREATE OR REPLACE FUNCTION worker_housekeeping(worker text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE tenant uuid;total integer:=0;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM probes WHERE id=worker AND workspace_id IS NULL AND NOT draining AND last_seen_at>now()-interval '90 seconds') OR NOT pg_try_advisory_xact_lock(616,9) THEN RETURN 0;END IF;
 FOR tenant IN SELECT DISTINCT workspace_id FROM workspace_access LOOP
  PERFORM set_config('app.workspace_id',tenant::text,true);total:=total+worker_retain_tenant();
  IF NOT EXISTS(SELECT 1 FROM workspaces WHERE id=tenant AND suspended) THEN PERFORM worker_schedule_weekly(tenant,now());END IF;
 END LOOP;RETURN total;
END $$;
REVOKE ALL ON FUNCTION worker_retain_tenant(),worker_schedule_weekly(uuid,timestamptz) FROM PUBLIC;
