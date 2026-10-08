import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
function db() {
  const d = new DatabaseSync(':memory:');
  for (const p of [
    '0001_schema.sql',
    '0002_import.sql',
    '0003_governance_constraints.sql',
    '0004_staging_internal_auth.sql',
  ])
    d.exec(fs.readFileSync(`v3/migrations/${p}`, 'utf8'));
  return d;
}
test('D1-compatible SQLite schema imports all original records and six pilots', () => {
  const d = db();
  assert.equal(d.prepare('SELECT count(*) n FROM regimens').get().n, 142);
  assert.equal(
    d
      .prepare(
        "SELECT count(*) n FROM regimen_versions WHERE status='published'",
      )
      .get().n,
    6,
  );
  assert.equal(
    d
      .prepare(
        'SELECT count(*) n FROM regimens WHERE source_record IS NOT NULL',
      )
      .get().n,
    136,
  );
  const n = d
    .prepare(
      'SELECT source_record FROM regimens WHERE source_record IS NOT NULL',
    )
    .all()
    .reduce((n, r) => n + JSON.parse(r.source_record)['รายการยา'].length, 0);
  assert.equal(n, 432);
  assert.equal(d.prepare('PRAGMA foreign_key_check').all().length, 0);
});
test('Published definition immutable and audit append only', () => {
  const d = db();
  const v = d
    .prepare("SELECT id FROM regimen_versions WHERE status='published' LIMIT 1")
    .get();
  assert.throws(
    () =>
      d
        .prepare('UPDATE regimen_versions SET document=? WHERE id=?')
        .run('{}', v.id),
    /Immutable/,
  );
  assert.throws(
    () => d.prepare('DELETE FROM regimen_versions WHERE id=?').run(v.id),
    /cannot be deleted/,
  );
  assert.throws(() => d.exec('DELETE FROM audit_logs'), /append-only/);
  assert.throws(
    () => d.exec("UPDATE approval_history SET comment='oops'"),
    /append-only/,
  );
});
test('Only one active published version and approval provenance required', () => {
  const d = db();
  const v = d
    .prepare("SELECT * FROM regimen_versions WHERE status='published' LIMIT 1")
    .get();
  assert.throws(
    () =>
      d
        .prepare(
          "INSERT INTO regimen_versions(id,regimen_id,version,status,document,created_at,created_by,updated_at,updated_by) VALUES('duplicate',?,'2','published',?,'now','x','now','x')",
        )
        .run(v.regimen_id, v.document),
    /UNIQUE/,
  );
  const draft = d
    .prepare("SELECT id FROM regimen_versions WHERE status='draft' LIMIT 1")
    .get();
  assert.throws(() =>
    d
      .prepare("UPDATE regimen_versions SET status='approved' WHERE id=?")
      .run(draft.id),
  );
});
test('Import is reproducible and classifier never publishes ambiguous originals', () => {
  const report = JSON.parse(fs.readFileSync('v3/docs/import-report.json'));
  assert.equal(report.records.length, 136);
  assert.equal(
    report.records.reduce((n, r) => n + r.drugCount, 0),
    432,
  );
  assert.ok(report.records.some((r) => r.flags.includes('AUC RANGE')));
  assert.ok(
    report.records.some((r) =>
      r.flags.includes('DUPLICATE NAME — preserve distinct indication and ID'),
    ),
  );
  assert.ok(
    report.records.every((r) =>
      ['AUTO-STRUCTURABLE', 'REVIEW REQUIRED', 'BLOCKED'].includes(
        r.classification,
      ),
    ),
  );
});

test('staging authentication migration seeds no credentials or sessions', () => {
  const d = db();
  for (const table of ['staging_auth_credentials','staging_auth_sessions','staging_auth_limits','staging_auth_events'])
    assert.equal(d.prepare(`SELECT count(*) n FROM ${table}`).get().n, 0);
  assert.equal(d.prepare('PRAGMA foreign_key_check').all().length, 0);
});
