DROP FUNCTION worker_purge_deleted_workspaces();
CREATE FUNCTION worker_purge_deleted_workspaces(only_workspace uuid DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE tenant uuid; table_name text; total integer:=0; BEGIN
FOR tenant IN SELECT DISTINCT workspace_id FROM workspace_access WHERE only_workspace IS NULL OR workspace_id=only_workspace LOOP
PERFORM set_config('app.workspace_id',tenant::text,true);
PERFORM 1 FROM workspaces WHERE id=tenant AND suspended AND settings ? 'deletionRequestedAt' AND (settings->>'deletionRequestedAt')::timestamptz<=now()-interval '30 days' FOR UPDATE;
IF NOT FOUND THEN CONTINUE; END IF;
IF EXISTS(SELECT 1 FROM subscriptions WHERE workspace_id=tenant AND state IN('active','trialing') AND provider_subscription_id IS NOT NULL) THEN CONTINUE; END IF;
UPDATE auth_user SET "scimWorkspace"=NULL,"scimActive"=false WHERE "scimWorkspace"=tenant::text;
FOREACH table_name IN ARRAY ARRAY['notification_outbox','check_results','incident_events','incidents','maintenance_windows','alert_policies','alert_channels','status_subscribers','status_updates','status_components','status_pages','api_keys','webhooks','audit_events','subscriptions','invitations','monitors','support_sessions','probes','memberships'] LOOP EXECUTE format('DELETE FROM %I WHERE workspace_id=$1',table_name) USING tenant; END LOOP;
DELETE FROM workspaces WHERE id=tenant;total:=total+1;
END LOOP;DELETE FROM public_rate_limits WHERE window_start<now()-interval '2 days';DELETE FROM phone_challenges WHERE expires_at<now()-interval '1 day';RETURN total;END $$;
REVOKE ALL ON FUNCTION worker_purge_deleted_workspaces(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION worker_purge_deleted_workspaces(uuid) TO watchtower_worker;
CREATE OR REPLACE FUNCTION manage_private_probe(actor text,tenant uuid,action text,identifier text,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE access record; result jsonb;
BEGIN
 SELECT * INTO access FROM authorize_workspace(actor,tenant);
 IF access IS NULL OR access.suspended OR (action<>'list' AND access.role NOT IN ('owner','admin')) THEN RAISE EXCEPTION 'Workspace access denied' USING ERRCODE='42501'; END IF;
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
