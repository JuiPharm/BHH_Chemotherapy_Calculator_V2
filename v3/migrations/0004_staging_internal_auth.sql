-- Staging-only internal authentication tables. Never provision passwords into production.
-- This migration creates tables without altering existing clinical regimen data or Access roles.
CREATE TABLE staging_auth_credentials(
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 salt TEXT NOT NULL CHECK(length(salt)=32),
 password_hash TEXT NOT NULL CHECK(length(password_hash)=64),
 totp_secret TEXT NOT NULL CHECK(length(totp_secret)>=32),
 last_totp_step INTEGER,
 created_at TEXT NOT NULL
);
CREATE TABLE staging_auth_sessions(
 token_hash TEXT PRIMARY KEY CHECK(length(token_hash)=64),
 user_id TEXT NOT NULL REFERENCES users(id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at)
);
CREATE INDEX staging_auth_sessions_user ON staging_auth_sessions(user_id);
CREATE INDEX staging_auth_sessions_expiry ON staging_auth_sessions(expires_at);
CREATE TABLE staging_auth_limits(
 key TEXT PRIMARY KEY,
 started INTEGER NOT NULL,
 attempts INTEGER NOT NULL CHECK(attempts>=1)
);
CREATE TABLE staging_auth_events(
 id TEXT PRIMARY KEY,
 user_id TEXT REFERENCES users(id),
 fingerprint TEXT NOT NULL,
 action TEXT NOT NULL CHECK(action IN('login','denied','rate_limited')),
 at INTEGER NOT NULL
);
CREATE INDEX staging_auth_events_time ON staging_auth_events(at);
CREATE TRIGGER staging_auth_events_no_update BEFORE UPDATE ON staging_auth_events
BEGIN SELECT RAISE(ABORT,'Authentication history is append-only'); END;
CREATE TRIGGER staging_auth_events_no_delete BEFORE DELETE ON staging_auth_events
BEGIN SELECT RAISE(ABORT,'Authentication history is append-only'); END;
