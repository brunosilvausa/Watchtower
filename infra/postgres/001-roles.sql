-- Local development only. These public credentials must never be reused outside localhost.
CREATE ROLE watchtower_migrator LOGIN PASSWORD 'local-migrator-only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE watchtower_app LOGIN PASSWORD 'local-app-only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
CREATE ROLE watchtower_worker LOGIN PASSWORD 'local-worker-only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
REVOKE ALL ON DATABASE watchtower_dev FROM PUBLIC;
GRANT CONNECT ON DATABASE watchtower_dev TO watchtower_migrator, watchtower_app, watchtower_worker;
GRANT CREATE ON DATABASE watchtower_dev TO watchtower_migrator;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO watchtower_migrator;
GRANT USAGE ON SCHEMA public TO watchtower_app;
