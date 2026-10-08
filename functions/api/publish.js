import { verifyPin, validateRegimen, json, ensureDatabase } from '../../src/server/clinical.js';

export async function onRequestPost({ request, env }) {
  try {
    if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json') return json({ error: 'JSON required' }, 415);
    const body = await request.json();
    const pinError = verifyPin(body?.pin, env);
    if (pinError) return json({ success: false, message: pinError.message }, pinError.status);
    const db = ensureDatabase(env);
    const action = body.action === 'draft' ? 'draft' : body.action === 'publish' ? 'publish' : null;
    if (!action) return json({ success: false, message: 'Invalid action' }, 400);
    const supplied = body.regimen;
    const issues = validateRegimen(supplied, action === 'publish');
    if (issues.length) return json({ success: false, message: 'Regimen validation failed', issues }, 422);
    const expected = Number(body.expectedRevision ?? 0);
    if (!Number.isSafeInteger(expected) || expected < 0) return json({ success: false, message: 'Invalid expected revision' }, 400);
    const now = new Date().toISOString();
    const document = {
      ...supplied, status: action === 'publish' ? 'published' : 'draft',
      localApproval: action === 'publish', calculator_enabled: action === 'publish',
      revision: expected + 1, lastReviewed: action === 'publish' ? now.slice(0, 10) : supplied.lastReviewed || null,
      updatedAt: now,
    };
    // The conditional UPSERT and audit record are committed atomically by D1 batch.
    const queries = [
      db.prepare(`INSERT INTO regimens (id, revision, status, document, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET revision=excluded.revision, status=excluded.status,
          document=excluded.document, updated_at=excluded.updated_at
        WHERE regimens.revision=?`)
        .bind(document.id, expected + 1, document.status, JSON.stringify(document), now, expected),
      db.prepare(`INSERT INTO regimen_audit (regimen_id, revision, action, happened_at)
        SELECT id, revision, ?, ? FROM regimens WHERE id=? AND revision=?`)
        .bind(action, now, document.id, expected + 1),
    ];
    const results = await db.batch(queries);
    if (results?.[0]?.meta?.changes !== 1) return json({ success: false, message: 'Regimen changed on another device. Reload before publishing.', code: 'VERSION_CONFLICT' }, 409);
    return json({ success: true, regimen: document, revision: document.revision });
  } catch (err) {
    return json({ success: false, message: err?.code === 'NO_DB' ? 'Cloudflare D1 binding REGIMENS_DB is missing' : 'Server could not save the regimen' }, err?.code === 'NO_DB' ? 503 : 500);
  }
}
