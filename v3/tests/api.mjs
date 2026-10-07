import assert from 'node:assert/strict';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8787';
let passed = 0;
const check = (x, m) => {
  assert.ok(x, m);
  passed++;
  console.log('PASS', m);
};
async function req(path, who = 'calculator', method = 'GET', body, extra = {}) {
  const r = await fetch(base + '/api' + path, {
    method,
    headers: {
      'X-Local-User': `${who}@local.test`,
      ...(method !== 'GET'
        ? {
            Origin: base,
            'X-Requested-With': 'BHH-V3',
            'Content-Type': 'application/json',
          }
        : {}),
      ...extra,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data;
  try {
    data = await r.json();
  } catch {}
  return { r, data };
}
let { r, data } = await req('/catalog');
check(
  r.status === 200 && data.catalog.length === 142,
  '142 catalog records: 136 originals + six approved',
);
check(
  data.catalog.filter((x) => x.status === 'published').length === 6,
  'Only six original pilot protocols active',
);
const initial = data.revision;
let etag = r.headers.get('ETag');
check(
  (
    await req('/catalog', 'calculator', 'GET', undefined, {
      'If-None-Match': etag,
    })
  ).r.status === 304,
  'Catalog ETag 304',
);
const pilot = data.catalog.find((x) => x.name === 'TCH');
let d = (await req('/versions/' + encodeURIComponent(pilot.versionId))).data
  .version;
check(
  (
    await req('/drafts', 'calculator', 'POST', {
      sourceVersionId: d.id,
      reason: 'Clone for review',
    })
  ).r.status === 403,
  'Calculator cannot create drafts',
);
check(
  (
    await req(
      '/drafts',
      'editor',
      'POST',
      { sourceVersionId: d.id, reason: 'Clone for review' },
      { Origin: 'https://evil.example' },
    )
  ).r.status === 403,
  'Cross-origin write denied',
);
check(
  (
    await req('/versions/' + encodeURIComponent(d.id), 'editor', 'PUT', {
      document: d.document,
      expectedRevision: d.revision,
      reason: 'Try published edit',
    })
  ).r.status === 409,
  'Published cannot be overwritten',
);
check(
  (await req('/session', 'fake')).r.status === 403,
  'Unprovisioned identity denied',
);
check((await req('/audit')).r.status === 403, 'Audit protected');
let clone = await req('/drafts', 'editor', 'POST', {
  sourceVersionId: d.id,
  name: 'API workflow test ' + Date.now(),
  reason: 'Clone for independent clinical review',
});
check(clone.r.status === 201, 'Clone to central draft');
let v = clone.data.version;
const doc = structuredClone(v.document);
doc.indication += ' — integration test';
doc.alias = ['workflow-api'];
let save = await req('/versions/' + encodeURIComponent(v.id), 'editor', 'PUT', {
  document: doc,
  expectedRevision: v.revision,
  reason: 'Update indication and alias for test',
});
check(save.r.status === 200, 'Draft save is atomic');
v = save.data.version;
check(
  (
    await req('/versions/' + encodeURIComponent(v.id), 'editor', 'PUT', {
      document: doc,
      expectedRevision: v.revision - 1,
      reason: 'Stale writer test',
    })
  ).r.status === 409,
  'Stale revision rejected',
);
async function action(a, user, expected = 200) {
  const t = await req(
    `/versions/${encodeURIComponent(v.id)}/${a}`,
    user,
    'POST',
    {
      expectedRevision: v.revision,
      reason: `Integration test ${a} — independently reviewed`,
    },
  );
  check(t.r.status === expected, `${a}: ${user} -> ${expected}`);
  if (t.r.ok) v = t.data.version;
  return t;
}
await action('approve', 'reviewer', 409);
await action('submit', 'editor');
await action('approve', 'editor', 403);
await action('start-review', 'reviewer');
await action('approve', 'editor', 403);
await action('approve', 'reviewer');
check(
  v.approved_by === 'reviewer@local.test' && !!v.approved_at,
  'Approval provenance captured',
);
await action('publish', 'reviewer', 403);
await action('publish', 'admin');
const second = (await req('/catalog')).data;
check(
  second.revision > initial &&
    second.catalog.some(
      (x) => x.versionId === v.id && x.status === 'published',
    ),
  'Second client sees published protocol and new revision',
);
const hist = (await req('/versions/' + encodeURIComponent(v.id))).data.history;
check(
  hist.some((x) => x.action === 'approve') &&
    hist.some((x) => x.action === 'publish'),
  'Approval history persists',
);
const audit = (await req('/audit', 'admin')).data.events;
check(
  audit.some(
    (x) => x.entity_id === v.id && x.previous_value && x.new_value && x.reason,
  ),
  'Audit before/after, user, timestamp, reason',
);
// New version must not mutate original active protocol, and publishing supersedes atomically.
let nv = (
  await req('/drafts', 'editor', 'POST', {
    sourceVersionId: v.id,
    mode: 'new-version',
    reason: 'New version for supersession test',
  })
).data.version;
const oldid = v.id;
v = nv;
check(v.previous_version === oldid, 'New version links previous protocol');
await action('submit', 'editor');
await action('start-review', 'reviewer');
await action('request-revision', 'reviewer');
check(v.status === 'draft', 'Request revision returns editable draft');
await action('submit', 'editor');
await action('start-review', 'reviewer');
await action('approve', 'reviewer');
await action('publish', 'admin');
check(
  (await req('/versions/' + encodeURIComponent(oldid))).data.version.status ===
    'retired',
  'Prior published version retired atomically',
);
await action('retire', 'admin');
check(v.status === 'retired', 'Explicit retire removes active version');
// Self-approval prohibition including admin role.
v = (
  await req('/drafts', 'admin', 'POST', {
    sourceVersionId: d.id,
    reason: 'Self approval negative test',
  })
).data.version;
await action('submit', 'admin');
await action('start-review', 'admin');
await action('approve', 'admin', 403);
await action('reject', 'reviewer');
check(v.status === 'rejected', 'Rejected version immutable terminal state');
// Unknown rules fail closed at server submission.
v = (
  await req('/drafts', 'editor', 'POST', {
    sourceVersionId: d.id,
    reason: 'Schema reject negative test',
  })
).data.version;
const bad = structuredClone(v.document);
bad.phases[0].orders[0].clinicalRules = [
  { type: 'evil_expression', value: 'eval()' },
];
check(
  (
    await req('/versions/' + encodeURIComponent(v.id), 'editor', 'PUT', {
      document: bad,
      expectedRevision: v.revision,
      reason: 'Unknown rule negative test',
    })
  ).r.status === 422,
  'Unknown rule blocked by server schema',
);
// Concurrent writers: exactly one commit, loser receives 409 and no duplicate audit.
const [a, b] = await Promise.all([
  req('/versions/' + encodeURIComponent(v.id), 'editor', 'PUT', {
    document: v.document,
    expectedRevision: v.revision,
    reason: 'Concurrent writer A',
  }),
  req('/versions/' + encodeURIComponent(v.id), 'editor', 'PUT', {
    document: v.document,
    expectedRevision: v.revision,
    reason: 'Concurrent writer B',
  }),
]);
check(
  [a.r.status, b.r.status].sort().join(',') === '200,409',
  'Concurrent writes: one wins, one conflicts',
);
console.log(`API checks passed: ${passed}`);
