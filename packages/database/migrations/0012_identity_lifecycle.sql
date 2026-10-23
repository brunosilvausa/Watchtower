CREATE TABLE phone_challenges (user_id text PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE, phone text NOT NULL, code_hash text NOT NULL, attempts integer NOT NULL DEFAULT 0, expires_at timestamptz NOT NULL);
GRANT SELECT,INSERT,UPDATE,DELETE ON phone_challenges TO watchtower_app;
CREATE FUNCTION cancel_workspace_deletion(actor text,session_id text,workspace uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE previous record; BEGIN
IF NOT EXISTS(SELECT 1 FROM workspace_access WHERE user_id=actor AND workspace_id=workspace AND role='owner') OR NOT EXISTS(SELECT 1 FROM auth_session WHERE id=session_id AND "userId"=actor AND "createdAt">now()-interval '10 minutes' AND "expiresAt">now()) THEN RAISE EXCEPTION 'Recent owner authentication required' USING ERRCODE='42501'; END IF;
PERFORM set_config('app.workspace_id',workspace::text,true);SELECT * INTO previous FROM workspaces WHERE id=workspace FOR UPDATE;
IF NOT FOUND OR NOT previous.settings ? 'deletionRequestedAt' THEN RETURN false; END IF;
UPDATE workspaces SET suspended=false,settings=settings-'deletionRequestedAt'-'deletionRequestedBy'-'deletionPausedMonitorIds' WHERE id=workspace;
UPDATE monitors SET paused=false,next_check_at=now() WHERE workspace_id=workspace AND id::text IN(SELECT jsonb_array_elements_text(coalesce(previous.settings->'deletionPausedMonitorIds','[]'::jsonb)));
INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id) VALUES(workspace,actor,'cancel-deletion','workspace',workspace::text);RETURN true;END $$;
CREATE FUNCTION worker_purge_deleted_workspaces() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE tenant uuid; table_name text; total integer:=0; BEGIN
FOR tenant IN SELECT DISTINCT workspace_id FROM workspace_access LOOP
PERFORM set_config('app.workspace_id',tenant::text,true);
PERFORM 1 FROM workspaces WHERE id=tenant AND suspended AND settings ? 'deletionRequestedAt' AND (settings->>'deletionRequestedAt')::timestamptz<=now()-interval '30 days' FOR UPDATE;
IF NOT FOUND THEN CONTINUE; END IF;
IF EXISTS(SELECT 1 FROM subscriptions WHERE workspace_id=tenant AND state IN('active','trialing') AND provider_subscription_id IS NOT NULL) THEN CONTINUE; END IF;
UPDATE auth_user SET "scimWorkspace"=NULL,"scimActive"=false WHERE "scimWorkspace"=tenant::text;
FOREACH table_name IN ARRAY ARRAY['notification_outbox','check_results','incident_events','incidents','maintenance_windows','alert_policies','alert_channels','status_subscribers','status_updates','status_components','status_pages','api_keys','webhooks','audit_events','subscriptions','invitations','monitors','support_sessions','probes','memberships'] LOOP EXECUTE format('DELETE FROM %I WHERE workspace_id=$1',table_name) USING tenant; END LOOP;
DELETE FROM workspaces WHERE id=tenant;total:=total+1;
END LOOP;DELETE FROM public_rate_limits WHERE window_start<now()-interval '2 days';DELETE FROM phone_challenges WHERE expires_at<now()-interval '1 day';RETURN total;END $$;
REVOKE ALL ON FUNCTION cancel_workspace_deletion(text,text,uuid),worker_purge_deleted_workspaces() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION cancel_workspace_deletion(text,text,uuid) TO watchtower_app;
GRANT EXECUTE ON FUNCTION worker_purge_deleted_workspaces() TO watchtower_worker;
