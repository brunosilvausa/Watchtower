ALTER TABLE auth_session ADD COLUMN "mfaVerifiedAt" timestamptz;
ALTER TABLE auth_user ADD COLUMN "scimWorkspace" text, ADD COLUMN "scimActive" boolean;
CREATE FUNCTION sync_scim_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$ BEGIN
IF NEW."scimWorkspace" IS NULL THEN RETURN NEW; END IF;
PERFORM set_config('app.workspace_id',NEW."scimWorkspace",true);
PERFORM 1 FROM workspaces WHERE id=NEW."scimWorkspace"::uuid AND plan='enterprise' AND NOT suspended FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Enterprise workspace unavailable' USING ERRCODE='42501'; END IF;
IF NEW."scimActive" THEN INSERT INTO users(id) VALUES(NEW.id) ON CONFLICT DO NOTHING; INSERT INTO memberships(workspace_id,user_id,role) VALUES(NEW."scimWorkspace"::uuid,NEW.id,'viewer') ON CONFLICT DO NOTHING;
ELSE DELETE FROM memberships WHERE workspace_id=NEW."scimWorkspace"::uuid AND user_id=NEW.id AND role<>'owner'; DELETE FROM auth_session WHERE "userId"=NEW.id; END IF;
RETURN NEW; END $$;
CREATE TRIGGER scim_membership AFTER UPDATE OF "scimWorkspace","scimActive" ON auth_user FOR EACH ROW EXECUTE FUNCTION sync_scim_membership();
REVOKE ALL ON FUNCTION sync_scim_membership() FROM PUBLIC;
