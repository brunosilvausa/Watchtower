CREATE TABLE public_rate_limits (key text PRIMARY KEY, count integer NOT NULL, window_start timestamptz NOT NULL);
CREATE FUNCTION consume_public_limit(bucket text,maximum integer,window_seconds integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE total integer; BEGIN
IF maximum<1 OR maximum>10000 OR window_seconds<1 OR window_seconds>86400 THEN RAISE EXCEPTION 'Invalid rate limit'; END IF;
INSERT INTO public_rate_limits AS limits VALUES(bucket,1,clock_timestamp()) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN limits.window_start<=clock_timestamp()-make_interval(secs=>window_seconds) THEN 1 ELSE limits.count+1 END,window_start=CASE WHEN limits.window_start<=clock_timestamp()-make_interval(secs=>window_seconds) THEN clock_timestamp() ELSE limits.window_start END RETURNING count INTO total;
RETURN total<=maximum; END $$;
ALTER TABLE status_subscribers ADD COLUMN expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours';
ALTER TABLE status_pages ADD COLUMN domain_challenge text;
CREATE FUNCTION public_status_action(page_slug text,action text,payload jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE item record; page record; subscriber uuid; BEGIN
SELECT * INTO item FROM product_public_index WHERE kind='status_pages' AND lookup=page_slug; IF NOT FOUND THEN RETURN false; END IF;
PERFORM set_config('app.workspace_id',item.workspace_id::text,true);
SELECT p.* INTO page FROM status_pages p JOIN workspaces w ON w.id=p.workspace_id WHERE p.id=item.resource_id AND p.published AND NOT w.suspended FOR UPDATE OF p; IF NOT FOUND THEN RETURN false; END IF;
IF action='view' THEN UPDATE status_pages SET views=views+1 WHERE id=page.id;
ELSIF action='subscribe' THEN
INSERT INTO status_subscribers(workspace_id,page_id,email,token_hash,expires_at) VALUES(page.workspace_id,page.id,payload->>'email',payload->>'hash',now()+interval '24 hours') ON CONFLICT(page_id,email) DO UPDATE SET token_hash=EXCLUDED.token_hash,expires_at=EXCLUDED.expires_at WHERE status_subscribers.verified_at IS NULL RETURNING id INTO subscriber;
IF subscriber IS NOT NULL THEN INSERT INTO notification_outbox(workspace_id,event,payload,idempotency_key) VALUES(page.workspace_id,'subscription-verification',payload->'notification',payload->>'hash'); END IF;
ELSIF action='verify' THEN UPDATE status_subscribers SET verified_at=now() WHERE page_id=page.id AND token_hash=payload->>'hash' AND expires_at>now() AND verified_at IS NULL; RETURN FOUND;
ELSIF action='unsubscribe' THEN DELETE FROM status_subscribers WHERE page_id=page.id AND token_hash=payload->>'hash'; RETURN FOUND;
ELSE RAISE EXCEPTION 'Unsupported public status action'; END IF; RETURN true; END $$;
CREATE FUNCTION resolve_status_domain(hostname text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ DECLARE item record; result text; BEGIN FOR item IN SELECT * FROM product_public_index WHERE kind='status_pages' LOOP PERFORM set_config('app.workspace_id',item.workspace_id::text,true); SELECT p.slug INTO result FROM status_pages p JOIN workspaces w ON w.id=p.workspace_id WHERE p.id=item.resource_id AND p.custom_domain=hostname AND p.domain_verified_at IS NOT NULL AND p.published AND NOT w.suspended; IF result IS NOT NULL THEN RETURN result; END IF; END LOOP; RETURN NULL; END $$;
ALTER TABLE passkey ADD CONSTRAINT passkey_user_fk FOREIGN KEY("userId") REFERENCES auth_user(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX passkey_credential_unique ON passkey("credentialID");
REVOKE ALL ON FUNCTION consume_public_limit(text,integer,integer),public_status_action(text,text,jsonb),resolve_status_domain(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_public_limit(text,integer,integer),public_status_action(text,text,jsonb),resolve_status_domain(text) TO watchtower_app;
