import { verifyPin, validateRegimen, json, ensureDatabase } from '../../src/server/clinical.js';

// These pilot formulas are shipped in the static clinical baseline. Archiving
// only their D1 override would leave a fallback calculation in the UI.
const STATIC_PILOTS = new Set([
  'BHH-BREAST-TCH-EVIQ53', 'BHH-CRC-MFOLFOX6-EVIQ637',
  'BHH-HEME-RCHOP21-EVIQ70', 'BHH-HODGKIN-ABVD-ADV-EVIQ56',
  'BHH-TESTICULAR-BEP-MET-EVIQ320', 'BHH-OVARIAN-CARBO-TAXOL-EVIQ252'
]);

export async function onRequestPost({ request, env }) {
  try {
    if (request.headers.get('content-type')?.split(';')[0]?.trim() !== 'application/json')
      return json({ success: false, message: 'JSON required' }, 415);
    const body = await request.json();
    const pinError = verifyPin(body?.pin, env);
    if (pinError) return json({ success: false, message: pinError.message }, pinError.status);
    const action = ['draft','publish','archive','restore'].includes(body.action) ? body.action : null;
    if (!action) return json({ success: false, message: 'Invalid action' }, 400);

    const expected = Number(body.expectedRevision ?? 0);
    if (!Number.isSafeInteger(expected) || expected < 0)
      return json({ success: false, message: 'Invalid expected revision' }, 400);

    const supplied = body.regimen;
    const issues = validateRegimen(supplied, action === 'publish');
    if (issues.length) return json({ success: false, message: 'Regimen validation failed', issues }, 422);
    if (action === 'archive' && STATIC_PILOTS.has(supplied.id))
      return json({ success: false, message: 'This regimen is part of the immutable six-pilot baseline. Update the baseline through the governed source release, not the D1 Archive action.' }, 409);

    const db = ensureDatabase(env);
    const existing = await db.prepare('SELECT status, document, revision FROM regimens WHERE id=?').bind(supplied.id).first();
    const stored = existing?.document ? JSON.parse(existing.document) : null;
    const archived = stored?.archived === true;
    if ((existing && Number(existing.revision) !== expected) || (!existing && expected !== 0))
      return json({ success:false, message:'Regimen changed or no longer exists. Reload the current Central D1 revision.', code:'VERSION_CONFLICT' },409);

    if (action === 'archive' || action === 'restore') {
      if (!existing) return json({ success: false, message: 'Only saved central regimens can be archived or restored.' }, 404);
      if (action === 'archive' && archived) return json({ success: false, message: 'Regimen is already archived.' }, 409);
      if (action === 'restore' && !archived) return json({ success: false, message: 'Regimen is not archived.' }, 409);
    } else {
      if (archived) return json({ success: false, message: 'Archived regimen must be explicitly restored as a Draft before editing or publishing.' }, 409);
      if (action === 'draft' && existing?.status === 'published')
        return json({ success: false, message: 'Published regimen cannot be overwritten by a draft. Clone it to a new ID first.' }, 409);
    }

    const now = new Date().toISOString();
    // Archive is a reversible Draft transition; no schema migration required.
    // The original D1 document is authoritative for archive/restore operations.
    const base = (action === 'archive' || action === 'restore') ? stored : supplied;
    const document = {
      ...base,
      status: action === 'publish' ? 'published' : 'draft',
      archived: action === 'archive',
      archivedAt: action === 'archive' ? now : null,
      localApproval: action === 'publish',
      calculator_enabled: action === 'publish',
      revision: expected + 1,
      lastReviewed: action === 'publish' ? now.slice(0,10) : (base.lastReviewed || null),
      updatedAt: now,
      lifecycleEvent: action,
    };
    // Existing audit table permits draft/publish actions. Archive and Restore
    // are audited as Draft transitions, with the precise event in the document.
    const auditAction = action === 'publish' ? 'publish' : 'draft';
    const queries = [
      db.prepare(`INSERT INTO regimens (id,revision,status,document,updated_at)
        VALUES (?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,status=excluded.status,
          document=excluded.document,updated_at=excluded.updated_at
        WHERE regimens.revision=?`)
        .bind(document.id,expected+1,document.status,JSON.stringify(document),now,expected),
      db.prepare(`INSERT INTO regimen_audit (regimen_id,revision,action,happened_at)
        SELECT id,revision,?,? FROM regimens WHERE id=? AND revision=? AND changes()=1`)
        .bind(auditAction,now,document.id,expected+1),
    ];
    const results = await db.batch(queries);
    if (results?.[0]?.meta?.changes !== 1)
      return json({ success:false, message:'Regimen changed on another device. Reload before continuing.',code:'VERSION_CONFLICT' },409);
    return json({ success:true,regimen:document,revision:document.revision });
  } catch (err) {
    return json({
      success:false,
      message:err?.code==='NO_DB'?'Cloudflare D1 binding REGIMENS_DB is missing':'Server could not update the regimen'
    },err?.code==='NO_DB'?503:500);
  }
}
