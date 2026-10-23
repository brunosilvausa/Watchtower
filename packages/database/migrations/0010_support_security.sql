CREATE FUNCTION authorize_support(actor text,session_id text,workspace uuid) RETURNS TABLE(role text,suspended boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
IF NOT EXISTS(SELECT 1 FROM auth_user u JOIN auth_session s ON s."userId"=u.id WHERE u.id=actor AND u."platformAdmin" AND u."twoFactorEnabled" AND s.id=session_id AND s."expiresAt">now() AND s."mfaVerifiedAt" IS NOT NULL) THEN RETURN; END IF;
IF NOT EXISTS(SELECT 1 FROM support_sessions WHERE actor_id=actor AND workspace_id=workspace AND expires_at>now()) THEN RETURN; END IF;
PERFORM set_config('app.workspace_id',workspace::text,true);
RETURN QUERY SELECT 'viewer'::text,w.suspended FROM workspaces w WHERE w.id=workspace FOR UPDATE;
END $$;
CREATE FUNCTION start_support_session(actor text,session_id text,workspace uuid,justification text,duration integer) RETURNS TABLE(id uuid,expires_at timestamptz) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
IF duration<1 OR duration>30 OR length(trim(justification))<10 OR length(justification)>500 THEN RAISE EXCEPTION 'Support reason and bounded duration required' USING ERRCODE='22023'; END IF;
IF NOT EXISTS(SELECT 1 FROM auth_user u JOIN auth_session s ON s."userId"=u.id WHERE u.id=actor AND u."platformAdmin" AND u."twoFactorEnabled" AND s.id=session_id AND s."expiresAt">now() AND s."mfaVerifiedAt">now()-interval '30 minutes') THEN RAISE EXCEPTION 'Recent administrator MFA required' USING ERRCODE='42501'; END IF;
PERFORM set_config('app.workspace_id',workspace::text,true);PERFORM 1 FROM workspaces WHERE workspaces.id=workspace AND NOT suspended FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'Workspace unavailable' USING ERRCODE='42501'; END IF;
INSERT INTO audit_events(workspace_id,actor_id,action,resource_type,resource_id,details) VALUES(workspace,actor,'start-support','workspace',workspace::text,jsonb_build_object('reason',justification,'durationMinutes',duration));
RETURN QUERY INSERT INTO support_sessions(actor_id,workspace_id,reason,expires_at) VALUES(actor,workspace,justification,now()+make_interval(mins=>duration)) RETURNING support_sessions.id,support_sessions.expires_at;
END $$;
CREATE FUNCTION list_support_workspaces(actor text,session_id text) RETURNS TABLE(id uuid,name text,role text) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE item record; BEGIN
FOR item IN SELECT DISTINCT workspace_id FROM support_sessions WHERE actor_id=actor AND expires_at>now() LOOP
IF EXISTS(SELECT 1 FROM authorize_support(actor,session_id,item.workspace_id) a WHERE NOT a.suspended) THEN RETURN QUERY SELECT w.id,w.name,'viewer'::text FROM workspaces w WHERE w.id=item.workspace_id; END IF;
END LOOP;END $$;
REVOKE ALL ON FUNCTION authorize_support(text,text,uuid),start_support_session(text,text,uuid,text,integer),list_support_workspaces(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION authorize_support(text,text,uuid),start_support_session(text,text,uuid,text,integer),list_support_workspaces(text,text) TO watchtower_app;
