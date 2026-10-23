CREATE TABLE checkout_intents (
 workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
 generation uuid NOT NULL UNIQUE,
 plan text NOT NULL CHECK(plan IN('solo','team')),
 idempotency_key text NOT NULL UNIQUE,
 request_body text NOT NULL,
 expires_at timestamptz NOT NULL,
 provider_session_id text UNIQUE,
 provider_url text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE checkout_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_intents FORCE ROW LEVEL SECURITY;
CREATE POLICY checkout_tenant_isolation ON checkout_intents USING(workspace_id=nullif(current_setting('app.workspace_id',true),'')::uuid) WITH CHECK(workspace_id=nullif(current_setting('app.workspace_id',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON checkout_intents TO watchtower_app;
