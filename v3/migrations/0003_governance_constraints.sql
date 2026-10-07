-- Governance metadata and protected query projections.
ALTER TABLE roles ADD COLUMN created_at TEXT NOT NULL DEFAULT '2026-10-07T00:00:00.000Z';
ALTER TABLE roles ADD COLUMN created_by TEXT NOT NULL DEFAULT 'schema-migration';
ALTER TABLE roles ADD COLUMN updated_at TEXT NOT NULL DEFAULT '2026-10-07T00:00:00.000Z';
ALTER TABLE roles ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'schema-migration';
UPDATE roles SET created_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now');
CREATE TRIGGER freeze_approval_provenance BEFORE UPDATE OF approved_by,approved_at,approval_comment,published_at,published_by ON regimen_versions WHEN OLD.status IN('published','retired') BEGIN SELECT RAISE(ABORT,'Published approval provenance is immutable'); END;
CREATE TRIGGER role_no_update BEFORE UPDATE ON roles BEGIN SELECT RAISE(ABORT,'System role definitions are immutable'); END;
CREATE TRIGGER role_no_delete BEFORE DELETE ON roles BEGIN SELECT RAISE(ABORT,'System role definitions are immutable'); END;
