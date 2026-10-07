PRAGMA foreign_keys=ON;
CREATE TABLE roles(code TEXT PRIMARY KEY);
INSERT INTO roles VALUES('calculator_user'),('regimen_editor'),('oncology_pharmacist'),('clinical_admin');
CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,role_code TEXT NOT NULL REFERENCES roles(code),active INTEGER NOT NULL DEFAULT 1 CHECK(active IN(0,1)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE cancer_types(id TEXT PRIMARY KEY,name TEXT NOT NULL UNIQUE,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE drugs(id TEXT PRIMARY KEY,name TEXT NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE regimens(id TEXT PRIMARY KEY,name TEXT NOT NULL,cancer_type TEXT NOT NULL,indication TEXT NOT NULL,keywords TEXT NOT NULL,source_record TEXT,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE regimen_versions(id TEXT PRIMARY KEY,regimen_id TEXT NOT NULL REFERENCES regimens(id),version TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('draft','submitted','clinical_review_required','approved','published','retired','rejected')),document TEXT NOT NULL CHECK(json_valid(document)),revision INTEGER NOT NULL DEFAULT 1,previous_version TEXT REFERENCES regimen_versions(id),approved_by TEXT,approved_at TEXT,approval_comment TEXT,published_at TEXT,published_by TEXT,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL,UNIQUE(regimen_id,version));
CREATE UNIQUE INDEX one_published ON regimen_versions(regimen_id) WHERE status='published';
CREATE INDEX versions_status ON regimen_versions(status);
CREATE TABLE regimen_phases(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),definition TEXT NOT NULL CHECK(json_valid(definition)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE regimen_drugs(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),phase_id TEXT NOT NULL REFERENCES regimen_phases(id),drug_id TEXT NOT NULL REFERENCES drugs(id),definition TEXT NOT NULL CHECK(json_valid(definition)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE regimen_rules(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),order_id TEXT NOT NULL REFERENCES regimen_drugs(id),definition TEXT NOT NULL CHECK(json_valid(definition)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE regimen_references(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),definition TEXT NOT NULL CHECK(json_valid(definition)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE rounding_policies(id TEXT PRIMARY KEY,definition TEXT NOT NULL CHECK(json_valid(definition)),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE drug_rounding_policies(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),order_id TEXT NOT NULL REFERENCES regimen_drugs(id),policy_id TEXT NOT NULL REFERENCES rounding_policies(id),created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE approval_requests(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),status TEXT NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE approval_history(id TEXT PRIMARY KEY,version_id TEXT NOT NULL REFERENCES regimen_versions(id),action TEXT NOT NULL,previous_version TEXT,source TEXT NOT NULL,comment TEXT NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE audit_logs(id TEXT PRIMARY KEY,entity TEXT NOT NULL,entity_id TEXT NOT NULL,version TEXT,action TEXT NOT NULL,previous_value TEXT,new_value TEXT,user_id TEXT NOT NULL,timestamp TEXT NOT NULL,reason TEXT NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
CREATE TABLE system_revision(id INTEGER PRIMARY KEY CHECK(id=1),revision INTEGER NOT NULL,created_at TEXT NOT NULL,created_by TEXT NOT NULL,updated_at TEXT NOT NULL,updated_by TEXT NOT NULL);
INSERT INTO system_revision VALUES(1,1,datetime('now'),'import',datetime('now'),'import');
CREATE TABLE operation_guards(id TEXT PRIMARY KEY,ok INTEGER NOT NULL CHECK(ok=1));
CREATE TRIGGER frozen_definition BEFORE UPDATE OF document ON regimen_versions WHEN OLD.status IN('submitted','clinical_review_required','approved','published','retired','rejected') BEGIN SELECT RAISE(ABORT,'Immutable submitted/approved definition; create a new version'); END;
CREATE TRIGGER no_version_delete BEFORE DELETE ON regimen_versions BEGIN SELECT RAISE(ABORT,'Clinical versions cannot be deleted'); END;
CREATE TRIGGER approved_provenance BEFORE UPDATE OF status ON regimen_versions WHEN NEW.status IN('approved','published') AND (NEW.approved_by IS NULL OR NEW.approved_at IS NULL OR NEW.approval_comment IS NULL) BEGIN SELECT RAISE(ABORT,'Approval provenance required'); END;
CREATE TRIGGER state_transition BEFORE UPDATE OF status ON regimen_versions WHEN NOT (
 (OLD.status='draft' AND NEW.status IN('draft','submitted')) OR
 (OLD.status='submitted' AND NEW.status='clinical_review_required') OR
 (OLD.status='clinical_review_required' AND NEW.status IN('approved','draft','rejected')) OR
 (OLD.status='approved' AND NEW.status='published') OR
 (OLD.status='published' AND NEW.status='retired') OR
 (OLD.status='retired' AND NEW.status='retired') OR
 (OLD.status='rejected' AND NEW.status='rejected')
) BEGIN SELECT RAISE(ABORT,'Invalid workflow transition'); END;
CREATE TRIGGER audit_no_update BEFORE UPDATE ON audit_logs BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER audit_no_delete BEFORE DELETE ON audit_logs BEGIN SELECT RAISE(ABORT,'Audit is append-only'); END;
CREATE TRIGGER history_no_update BEFORE UPDATE ON approval_history BEGIN SELECT RAISE(ABORT,'Approval history is append-only'); END;
CREATE TRIGGER history_no_delete BEFORE DELETE ON approval_history BEGIN SELECT RAISE(ABORT,'Approval history is append-only'); END;
