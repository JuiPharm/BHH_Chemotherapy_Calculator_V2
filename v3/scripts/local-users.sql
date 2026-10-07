-- LOCAL D1 ONLY. Test identities cannot authenticate on deployed staging/production.
INSERT OR IGNORE INTO users VALUES('calculator@local.test','calculator@local.test','calculator_user',1,datetime('now'),'local-fixture',datetime('now'),'local-fixture');
INSERT OR IGNORE INTO users VALUES('editor@local.test','editor@local.test','regimen_editor',1,datetime('now'),'local-fixture',datetime('now'),'local-fixture');
INSERT OR IGNORE INTO users VALUES('reviewer@local.test','reviewer@local.test','oncology_pharmacist',1,datetime('now'),'local-fixture',datetime('now'),'local-fixture');
INSERT OR IGNORE INTO users VALUES('admin@local.test','admin@local.test','clinical_admin',1,datetime('now'),'local-fixture',datetime('now'),'local-fixture');
