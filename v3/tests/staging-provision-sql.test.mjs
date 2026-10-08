import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';

test('staging remote PIN provisioning generates D1-compatible SQL without explicit transaction', () => {
 const temp=mkdtempSync(join(tmpdir(),'bhh-staging-pin-test-'));
 try {
  const env={...process.env,RUNNER_TEMP:temp,STAGING_EDITOR_EMAIL:'individual.staging@example.invalid',
    STAGING_EDITOR_PIN:'1293485706',STAGING_PASSWORD_PEPPER:'SYNTHETIC_TEST_ONLY_DO_NOT_USE_REMOTE_32_CHARS'};
  const run=spawnSync(process.execPath,['v3/scripts/provision-staging-editor-ci.mjs'],{env,encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  const sql=readFileSync(join(temp,'bhh-staging-editor-pin.sql'),'utf8');
  assert.doesNotMatch(sql,/\b(?:BEGIN\s+TRANSACTION|SAVEPOINT|COMMIT)\s*;/i);
  assert.doesNotMatch(run.stdout,/1293485706|SYNTHETIC_TEST_ONLY/);
  const db=new DatabaseSync(':memory:');
  for(const name of ['0001_schema.sql','0004_staging_internal_auth.sql','0005_editor_pin.sql'])
    db.exec(readFileSync('v3/migrations/'+name,'utf8'));
  db.exec(sql);
  const row=db.prepare(`SELECT u.email,u.role_code,p.pin_hash
    FROM users u JOIN staging_editor_pins p ON p.user_id=u.id`).get();
  assert.equal(row.email,'individual.staging@example.invalid');
  assert.equal(row.role_code,'regimen_editor');
  assert.match(row.pin_hash,/^[0-9a-f]{64}$/);
  assert.notEqual(row.pin_hash,'1293485706');
  db.close();
 } finally { rmSync(temp,{recursive:true,force:true}); }
});
