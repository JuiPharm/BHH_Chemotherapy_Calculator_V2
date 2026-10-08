-- Staging-only individual Regimen Editor PIN sessions. PIN NEVER authorizes review or publication.
CREATE TABLE staging_editor_pins(
 user_id TEXT PRIMARY KEY REFERENCES users(id),
 pin_hash TEXT NOT NULL UNIQUE CHECK(length(pin_hash)=64),
 created_at TEXT NOT NULL,
 created_by TEXT NOT NULL
);
CREATE TABLE staging_editor_sessions(
 token_hash TEXT PRIMARY KEY CHECK(length(token_hash)=64),
 user_id TEXT NOT NULL REFERENCES staging_editor_pins(user_id),
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL CHECK(expires_at>created_at)
);
CREATE INDEX staging_editor_sessions_expiry ON staging_editor_sessions(expires_at);
