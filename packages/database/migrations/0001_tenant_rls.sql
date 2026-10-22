ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY workspace_isolation ON workspaces
  USING (id = nullif(current_setting('app.workspace_id', true), '')::uuid)
  WITH CHECK (id = nullif(current_setting('app.workspace_id', true), '')::uuid);
CREATE POLICY membership_isolation ON memberships
  USING (workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid)
  WITH CHECK (workspace_id = nullif(current_setting('app.workspace_id', true), '')::uuid);
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON workspaces, memberships TO watchtower_app;
COMMENT ON TABLE users IS 'M1 identity key only. Better Auth generated storage and access rules arrive in M2.';
COMMENT ON TABLE workspaces IS 'Tenant root. Runtime sets workspace context locally only after server authorization in M2.';
COMMENT ON TABLE memberships IS 'Tenant membership foundation; runtime context alone is not user authentication.';
