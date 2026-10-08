-- Bind this database as REGIMENS_DB in Cloudflare Pages (D1).
CREATE TABLE IF NOT EXISTS regimens (
  id TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  status TEXT NOT NULL CHECK (status IN ('draft','published')),
  document TEXT NOT NULL CHECK (json_valid(document)),
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_regimens_status ON regimens(status);
CREATE TABLE IF NOT EXISTS regimen_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  regimen_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('draft','publish')),
  happened_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_regimen_audit_regimen ON regimen_audit(regimen_id,id);
