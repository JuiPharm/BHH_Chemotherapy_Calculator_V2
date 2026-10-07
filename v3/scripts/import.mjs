import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { policies, validateDefinition } from '../shared/clinical.js';
import { projections } from '../shared/projections.js';
const source = JSON.parse(fs.readFileSync('data/legacy-regimens.v1.json'))[
  'สูตรยาเคมีบำบัด'
];
const pilots = JSON.parse(fs.readFileSync('data/regimens.published.json'));
if (
  source.length !== 136 ||
  source.reduce((n, r) => n + r['รายการยา'].length, 0) !== 432
)
  throw Error('Source count mismatch');
const actor = 'v2-approved-import',
  now = { sql: "strftime('%Y-%m-%dT%H:%M:%fZ','now')" };
let sql =
  '-- Generated deterministically from preserved V2 source. No guessed clinical doses.\n';
const quote = (v) =>
  v?.sql
    ? v.sql
    : v === null || v === undefined
      ? 'NULL'
      : typeof v === 'number'
        ? String(v)
        : `'${String(v).replaceAll("'", "''")}'`;
function emit(q, ...args) {
  let i = 0;
  sql += q.replaceAll('?', () => quote(args[i++])) + ';\n';
  if (i !== args.length) throw Error('SQL placeholder mismatch');
}
const meta = [now, actor, now, actor];
for (const p of Object.values(policies))
  emit(
    'INSERT INTO rounding_policies VALUES(?,?,?,?,?,?)',
    p.id,
    JSON.stringify(p),
    ...meta,
  );
function insert(r, id, status, raw, provenance) {
  emit(
    'INSERT INTO cancer_types VALUES(?,?,?,?,?,?) ON CONFLICT(name) DO NOTHING',
    r.cancerGroup,
    r.cancerGroup,
    ...meta,
  );
  emit(
    'INSERT INTO regimens VALUES(?,?,?,?,?,?,?,?,?,?)',
    id,
    r.name,
    r.cancerGroup,
    r.indication,
    JSON.stringify([
      r.name,
      r.indication,
      r.cancerGroup,
      ...(r.alias || []),
      ...(r.phases || []).flatMap((p) => p.orders.map((o) => o.drugName)),
      ...(raw?.['รายการยา'] || []).map((o) => o['ชื่อยา']),
    ]),
    raw ? JSON.stringify(raw) : null,
    ...meta,
  );
  const vid = `${id}:1`;
  r.id = id;
  r.version = '1';
  r.status = status;
  emit(
    'INSERT INTO regimen_versions(id,regimen_id,version,status,document,revision,previous_version,approved_by,approved_at,approval_comment,published_at,published_by,created_at,created_by,updated_at,updated_by) VALUES(?,?,?,?,?,1,NULL,?,?,?,?,?,?,?,?,?)',
    vid,
    id,
    '1',
    status,
    JSON.stringify(r),
    provenance ? actor : null,
    provenance ? r.lastReviewed : null,
    provenance || null,
    provenance ? r.effectiveDate : null,
    provenance ? actor : null,
    ...meta,
  );
  for (const x of projections(vid, r, actor, now)) emit(x.sql, ...x.args);
  emit(
    'INSERT INTO audit_logs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    `${vid}:import`,
    'regimen_version',
    vid,
    '1',
    'import',
    null,
    JSON.stringify(r),
    actor,
    now,
    provenance || 'Original source retained; calculation disabled',
    ...meta,
  );
  if (provenance)
    emit(
      'INSERT INTO approval_history VALUES(?,?,?,?,?,?,?,?,?,?)',
      `${vid}:approval`,
      vid,
      'import_prior_approval',
      null,
      JSON.stringify(r.references),
      provenance,
      ...meta,
    );
}
const nameCounts = new Map();
source.forEach((r) =>
  nameCounts.set(r['ชื่อสูตรยา'], (nameCounts.get(r['ชื่อสูตรยา']) || 0) + 1),
);
const report = [];
source.forEach((r, i) => {
  const flags = [];
  let blocked = false;
  if (nameCounts.get(r['ชื่อสูตรยา']) > 1)
    flags.push('DUPLICATE NAME — preserve distinct indication and ID');
  if (
    /induction|maintenance|loading|followed|then|weekly|รายสัปดาห์/i.test(
      r['รอบการรักษา'] || '',
    )
  )
    flags.push('MULTI-PHASE / SCHEDULE REVIEW');
  for (const d of r['รายการยา']) {
    const t = d['ขนาดยา'] || '';
    if (!t.trim()) {
      flags.push('MISSING DOSE');
      blocked = true;
    }
    if (/\d\s*[-–]\s*\d/.test(t))
      flags.push(/AUC/i.test(t) ? 'AUC RANGE' : 'DOSE RANGE');
    if (/\bg\s*\/m[²2]/i.test(t)) flags.push('g/m² UNIT REVIEW');
    if (/IU|units?/i.test(t)) flags.push('IU/UNITS SEMANTICS');
    if (/\/day|ต่อวัน/i.test(t)) flags.push('PER-DAY DOSE');
    if (/continuous|infusion|\d+\s*h|loading|maintenance|then/i.test(t))
      flags.push('INFUSION / MULTI-PHASE');
    if (d.maximum_dose) flags.push('MAXIMUM DOSE REVIEW');
    // This classifier never produces a usable dose. Only explicit structured reviewed documents calculate.
    if (
      !/^(?:\d+(?:\.\d+)?\s*mg(?:\/m²|\/kg)?|AUC\s*\d+(?:\.\d+)?)\s+(?:IV|PO|SC|IM)\s+day\s+\d+$/i.test(
        t,
      )
    ) {
      flags.push('UNSTRUCTURED EXPRESSION');
    }
  }
  const classification = blocked
    ? 'BLOCKED'
    : flags.length
      ? 'REVIEW REQUIRED'
      : 'AUTO-STRUCTURABLE';
  const id = `BHH-CATALOG-${String(i + 1).padStart(3, '0')}`;
  const doc = {
    id,
    version: '1',
    name: r['ชื่อสูตรยา'],
    cancerGroup: r['ชนิดของมะเร็ง'],
    indication: r['ชนิดของมะเร็ง'],
    status: 'draft',
    localApproval: false,
    phases: [],
    references: [],
    clinicalNotes: [],
    sourceRecord: r,
  };
  insert(doc, id, 'draft', r, null);
  report.push({
    id,
    name: doc.name,
    drugCount: r['รายการยา'].length,
    classification,
    flags: [...new Set(flags)],
  });
});
for (const p of pilots) {
  for (const phase of p.phases)
    for (const o of phase.orders) {
      o.roundingProfileId ||= 'NO_ROUND';
      o.allowedRoundingPolicies =
        o.dose.unit === 'mg'
          ? [...new Set(['NO_ROUND', o.roundingProfileId])]
          : ['NO_ROUND'];
    }
  p.alias = [p.name];
  validateDefinition(p);
  insert(
    p,
    p.id,
    'published',
    null,
    'Prior local approval recorded in docs/CLINICAL_VALIDATION_REQUIRED.md and confirmed by project owner; imported V2.1.0 exact clinical definition. Original named reviewer unavailable; not a new V3 review.',
  );
}
// Existing pilots remain separate: do not falsely equate FOLFOX-4 with mFOLFOX6 or adult/pediatric R-CHOP.
fs.writeFileSync('v3/migrations/0002_import.sql', sql);
fs.writeFileSync(
  'v3/docs/import-report.json',
  JSON.stringify(
    {
      sourceSha256: createHash('sha256')
        .update(fs.readFileSync('data/legacy-regimens.v1.json'))
        .digest('hex'),
      sourceRegimens: 136,
      sourceDrugEntries: 432,
      approvedPilots: 6,
      totalCatalog: 142,
      summary: report.reduce(
        (a, r) => ((a[r.classification] = (a[r.classification] || 0) + 1), a),
        {},
      ),
      records: report,
    },
    null,
    2,
  ),
);
console.log(
  'Imported 136 original records + 6 distinct approved pilot versions; source entries=432',
);
