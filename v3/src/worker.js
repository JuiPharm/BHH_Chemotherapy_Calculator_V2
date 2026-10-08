import { sameOrigin } from './preview-origin.js';
import { identity } from './auth.js';
import { publicCalculator, confirmEditorPin, logoutEditorPin, verifySubmitPin } from './editor-pin.js';
import { isInternalStaging, stagingLogin, stagingLogout, stagingSalt } from './staging-auth.js';
import { validateDefinition, policies } from '../shared/clinical.js';
import { projections } from '../shared/projections.js';
const headers = {
  'Cache-Control': 'private, no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
};
const response = (value, status = 200, extra = {}) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { ...headers, ...extra },
  });
const error = (m, s = 400) => {
  throw Object.assign(Error(m), { status: s });
};
const uuid = () => crypto.randomUUID();
const roles = {
  edit: ['regimen_editor', 'oncology_pharmacist', 'clinical_admin'],
  review: ['oncology_pharmacist', 'clinical_admin'],
  publish: ['clinical_admin'],
  audit: ['clinical_admin'],
};
function permit(user, action) {
  if (!roles[action]?.includes(user.role_code)) error('Permission denied', 403);
}
const parse = (row) => {
  const document = JSON.parse(row.document);
  return {
    ...row,
    document: {
      ...document,
      status: row.status,
      version: row.version,
      localApproval: ['approved', 'published', 'retired'].includes(row.status),
    },
  };
};
const dbQuery = (db, sql, ...args) => db.prepare(sql).bind(...args);
async function version(db, id) {
  const v = await dbQuery(
    db,
    'SELECT * FROM regimen_versions WHERE id=?',
    id,
  ).first();
  if (!v) error('Version not found', 404);
  return parse(v);
}
function audit(db, user, v, action, previous, next, reason, now) {
  return dbQuery(
    db,
    'INSERT INTO audit_logs VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    uuid(),
    'regimen_version',
    v.id,
    v.version,
    action,
    previous === null ? null : JSON.stringify(previous),
    JSON.stringify(next),
    user.id,
    now,
    reason,
    now,
    user.id,
    now,
    user.id,
  );
}
function guard(db, v, expected) {
  if (!Number.isInteger(expected) || expected !== v.revision)
    error('Version changed. Reload before writing.', 409);
  return dbQuery(
    db,
    'INSERT INTO operation_guards VALUES(?,CASE WHEN EXISTS(SELECT 1 FROM regimen_versions WHERE id=? AND revision=? AND status=?) THEN 1 ELSE 0 END)',
    uuid(),
    v.id,
    expected,
    v.status,
  );
}
function clearProjection(db, id) {
  return [
    'drug_rounding_policies',
    'regimen_rules',
    'regimen_drugs',
    'regimen_phases',
    'regimen_references',
  ].map((t) => dbQuery(db, `DELETE FROM ${t} WHERE version_id=?`, id));
}
// Original 136 legacy catalog entries are PUBLIC REFERENCE, not clinically published.
// Never expose mutable draft documents or approval metadata to anonymous visitors.
function referenceCompact(v) {
  const original = JSON.parse(v.source_record);
  const drugs = original['รายการยา'] || [];
  return {
    id: v.regimen_id, versionId: v.id,
    name: original['ชื่อสูตรยา'], cancerType: original['ชนิดของมะเร็ง'],
    indication: original['ชนิดของมะเร็ง'],
    keywords: [original['ชื่อสูตรยา'], original['ชนิดของมะเร็ง'], ...drugs.map(d=>d['ชื่อยา'])],
    status: 'reference_only', version: '1', reviewer:null, approvedAt:null,
    publishedAt:null, updatedAt:null, source:[], revision:0, active:false,
    reviewRequired:true,
  };
}
function compact(v) {
  return {
    id: v.regimen_id,
    versionId: v.id,
    name: JSON.parse(v.document).name,
    cancerType: JSON.parse(v.document).cancerGroup,
    indication: JSON.parse(v.document).indication,
    keywords: JSON.parse(v.keywords),
    status: v.status,
    version: v.version,
    reviewer: v.approved_by,
    approvedAt: v.approved_at,
    publishedAt: v.published_at,
    updatedAt: v.updated_at,
    source: JSON.parse(v.document).references || [],
    revision: v.revision,
    active: v.status === 'published',
  };
}
async function dispatch(request, env) {
  const url = new URL(request.url),
    path = url.pathname,
    db = env.DB;
  if (isInternalStaging(env)) {
    if (path === '/api/auth/salt') return stagingSalt(request, env);
    if (path === '/api/auth/login') return stagingLogin(request, env);
    if (path === '/api/auth/logout') return stagingLogout(request, env);
    if (path === '/api/auth/editor-pin') return confirmEditorPin(request, env);
    if (path === '/api/auth/editor-logout') return logoutEditorPin(request, env);
    const publicAsset = {
      '/login': '/login',
      '/login.html': '/login',
      '/login.js': '/login.js',
      '/login.css': '/login.css',
      '/logo.png': '/logo.png',
      '/fonts/thai-400.woff2': '/fonts/thai-400.woff2',
    }[path];
    if (publicAsset && request.method === 'GET') {
      const a = await env.ASSETS.fetch(new Request(new URL(publicAsset, url), request));
      const h = new Headers(a.headers);
      h.set('Cache-Control', 'no-store');
      h.set('X-Content-Type-Options', 'nosniff');
      h.set('Referrer-Policy', 'no-referrer');
      h.set('X-Frame-Options', 'DENY');
      h.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
      return new Response(a.body, { status: a.status, headers: h });
    }
  }
  // Anonymous callers can only read Published clinical protocols in explicit STAGING mode.
  // Every write, draft, registry, approval, and audit still requires an individual identity.
  let who;
  try { who = await identity(request, env); }
  catch(e) {
    if (publicCalculator(env) && e.status === 401 && request.method === 'GET')
      who = { email:'anonymous-viewer@public.invalid',local:false,guest:true };
    else throw e;
  }
  const user = who.guest ?
    {id:'anonymous-calculator',email:who.email,role_code:'calculator_user'} :
    await dbQuery(db,'SELECT * FROM users WHERE email=? AND active=1',who.email).first();
  if (!user)
    error('Account is not provisioned. Contact clinical administrator.', 403);
  if (!path.startsWith('/api/')) {
    const asset = await env.ASSETS.fetch(request);
    const h = new Headers(asset.headers);
    for (const [k, v] of Object.entries(headers))
      if (k !== 'Content-Type') h.set(k, v);
    return new Response(asset.body, { status: asset.status, headers: h });
  }
  if (who.guest && !(['/api/session','/api/revision','/api/catalog'].includes(path) ||
      /^\/api\/versions\/[^/]+$/.test(path))) error('Editor access required', 403);
  if (!['GET', 'POST', 'PUT'].includes(request.method))
    error('Method not allowed', 405);
  if (request.method !== 'GET') {
    if (
      !sameOrigin(request, env) ||
      request.headers.get('X-Requested-With') !== 'BHH-V3'
    )
      error('Same-origin application request required', 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json'))
      error('JSON required', 415);
  }
  const revision = await dbQuery(
    db,
    'SELECT revision,updated_at FROM system_revision WHERE id=1',
  ).first();
  if (path === '/api/session' && request.method === 'GET')
    return response({
      user: { id: user.id, email: user.email, role: user.role_code },
      local: who.local,
      revision: revision.revision,
      authMode: who.guest ? 'public' : who.pin ? (who.pinRole==='oncology_pharmacist'?'reviewer_pin':'editor') : isInternalStaging(env) ? 'internal' : 'access',
    });
  if (path === '/api/revision' && request.method === 'GET')
    return response(revision);
  if (path === '/api/catalog' && request.method === 'GET') {
    const tag = `"catalog-${revision.revision}-${who.guest ? "public" : "private"}"`;
    if (request.headers.get('If-None-Match') === tag)
      return new Response(null, {
        status: 304,
        headers: { ...headers, ETag: tag },
      });
    const catalogSql = who.guest
      ? "SELECT v.*,r.name,r.cancer_type,r.indication,r.keywords,r.source_record FROM regimen_versions v JOIN regimens r ON r.id=v.regimen_id WHERE v.status='published' OR (v.status='draft' AND v.id LIKE 'BHH-CATALOG-%:1' AND r.source_record IS NOT NULL) ORDER BY r.name"
      : "SELECT v.*,r.name,r.cancer_type,r.indication,r.keywords FROM regimen_versions v JOIN regimens r ON r.id=v.regimen_id WHERE v.status='published' OR (v.status<>'published' AND NOT EXISTS(SELECT 1 FROM regimen_versions p WHERE p.regimen_id=v.regimen_id AND p.status='published') AND v.rowid=(SELECT MAX(x.rowid) FROM regimen_versions x WHERE x.regimen_id=v.regimen_id)) ORDER BY r.name";
    const { results } = await db.prepare(catalogSql).all();
    return response(
      { revision: revision.revision, policies, catalog: results.map(v=>who.guest && v.status==='draft' ? referenceCompact(v) : compact(v)) },
      200,
      { ETag: tag, 'Cache-Control': 'private, max-age=0, must-revalidate' },
    );
  }
  if (path === '/api/registry' && request.method === 'GET') {
    const { results } = await db
      .prepare(
        'SELECT v.*,r.name,r.cancer_type,r.indication,r.keywords FROM regimen_versions v JOIN regimens r ON r.id=v.regimen_id ORDER BY v.updated_at DESC,v.rowid DESC',
      )
      .all();
    return response({
      revision: revision.revision,
      versions: results.map(compact),
    });
  }
  if (path === '/api/audit' && request.method === 'GET') {
    permit(user, 'audit');
    const { results } = await db
      .prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 200')
      .all();
    return response({ events: results });
  }
  const detail = path.match(/^\/api\/versions\/([^/]+)$/);
  if (detail && request.method === 'GET') {
    const v = await version(db, decodeURIComponent(detail[1]));
    if (who.guest && v.status !== 'published') {
      // Whitelist ONLY immutable original sourceRecord, never modified draft data.
      if (v.status!=='draft' || !/^BHH-CATALOG-[0-9]{3}:1$/.test(v.id))
        error('Editor access required',403);
      const r=await dbQuery(db,'SELECT source_record FROM regimens WHERE id=?',v.regimen_id).first();
      if(!r?.source_record)error('Editor access required',403);
      const original=JSON.parse(r.source_record);
      return response({version:{
        id:v.id,regimen_id:v.regimen_id,version:'1',status:'reference_only',
        revision:0,published_at:null,approved_by:null,approved_at:null,
        document:{id:v.regimen_id,version:'1',status:'reference_only',localApproval:false,
          name:original['ชื่อสูตรยา'],cancerGroup:original['ชนิดของมะเร็ง'],
          indication:original['ชนิดของมะเร็ง'],phases:[],references:[],
          clinicalNotes:['Original source data only: not validated for patient dosing'],
          sourceRecord:original},
      },history:[],systemRevision:revision.revision});
    }
    const tag = `"${v.id}-${v.revision}-${revision.revision}"`;
    if (request.headers.get('If-None-Match') === tag)
      return new Response(null, {
        status: 304,
        headers: { ...headers, ETag: tag },
      });
    const history = who.guest ? {results:[]} : await dbQuery(
      db,
      'SELECT * FROM approval_history WHERE version_id=? ORDER BY rowid',
      v.id,
    ).all();
    return response(
      {
        version: v,
        history: history.results,
        systemRevision: revision.revision,
      },
      200,
      { ETag: tag },
    );
  }
  if (request.method === 'GET') error('Not found', 404);
  const raw = await request.text();
  if (raw.length > 300000) error('Document too large', 413);
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    error('Invalid JSON');
  }
  const now = new Date().toISOString(),
    actor = user.id,
    meta = [now, actor, now, actor];
  async function batch(statements) {
    try {
      await db.batch([
        ...statements,
        dbQuery(
          db,
          'UPDATE system_revision SET revision=revision+1,updated_at=?,updated_by=? WHERE id=1',
          now,
          actor,
        ),
        db.prepare('DELETE FROM operation_guards'),
      ]);
    } catch (e) {
      if (
        /CHECK constraint|UNIQUE constraint|Immutable|Invalid workflow/.test(
          String(e),
        )
      )
        error('Concurrent change or invalid transition; reload', 409);
      throw e;
    }
  }
  function reason() {
    if (
      typeof body.reason !== 'string' ||
      body.reason.trim().length < 3 ||
      body.reason.length > 5000
    )
      error('Meaningful review/change comment required');
    return body.reason.trim();
  }
  if (path === '/api/drafts' && request.method === 'POST') {
    permit(user, 'edit');
    const comment = reason();
    const source = body.sourceVersionId
      ? await version(db, body.sourceVersionId)
      : null;
    const same = body.mode === 'new-version';
    if (same && !source) error('Source version required');
    const rid = same ? source.regimen_id : uuid();
    const vid = uuid();
    const latest = same
      ? await dbQuery(
          db,
          'SELECT COALESCE(MAX(CAST(version AS INTEGER)),0) AS n FROM regimen_versions WHERE regimen_id=?',
          rid,
        ).first()
      : { n: 0 };
    const ver = String(latest.n + 1);
    const doc = source ? structuredClone(source.document) : body.document;
    if (
      !doc ||
      typeof doc.name !== 'string' ||
      !doc.name.trim() ||
      typeof doc.cancerGroup !== 'string' ||
      typeof doc.indication !== 'string' ||
      !Array.isArray(doc.phases)
    )
      error('Draft name, cancer type, indication and phases required');
    doc.id = rid;
    doc.version = ver;
    doc.status = 'draft';
    doc.localApproval = false;
    delete doc.lastReviewed;
    if (!same) doc.name = body.name?.trim() || `${doc.name} (copy)`;
    const statements = [];
    if (!same)
      statements.push(
        dbQuery(
          db,
          'INSERT INTO regimens VALUES(?,?,?,?,?,?,?,?,?,?)',
          rid,
          doc.name,
          doc.cancerGroup,
          doc.indication,
          JSON.stringify([
            doc.name,
            doc.cancerGroup,
            doc.indication,
            ...(doc.alias || []),
            ...doc.phases.flatMap((p) => p.orders.map((o) => o.drugName)),
            ...(doc.sourceRecord?.['รายการยา'] || []).map((o) => o['ชื่อยา']),
          ]),
          doc.sourceRecord ? JSON.stringify(doc.sourceRecord) : null,
          ...meta,
        ),
      );
    statements.push(
      dbQuery(
        db,
        'INSERT INTO regimen_versions(id,regimen_id,version,status,document,previous_version,created_at,created_by,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?,?)',
        vid,
        rid,
        ver,
        'draft',
        JSON.stringify(doc),
        source?.id || null,
        ...meta,
      ),
    );
    statements.push(
      audit(
        db,
        user,
        { id: vid, version: ver },
        same ? 'new_version' : 'clone',
        source?.document || null,
        doc,
        comment,
        now,
      ),
    );
    // Unstructured source copies are retained in canonical JSON; projection building starts after a valid structured save.
    await batch(statements);
    return response({ version: await version(db, vid) }, 201);
  }
  if (detail && request.method === 'PUT') {
    permit(user, 'edit');
    const v = await version(db, decodeURIComponent(detail[1]));
    if (v.status !== 'draft')
      error('Only drafts can be edited. Create a new version.', 409);
    const comment = reason();
    const doc = body.document;
    if (
      !doc ||
      typeof doc.name !== 'string' ||
      !doc.name.trim() ||
      typeof doc.cancerGroup !== 'string' ||
      !doc.cancerGroup.trim() ||
      typeof doc.indication !== 'string' ||
      !doc.indication.trim() ||
      !Array.isArray(doc.phases)
    )
      error('Draft metadata required');
    doc.id = v.regimen_id;
    doc.version = v.version;
    doc.status = 'draft';
    doc.localApproval = false;
    // Permit incomplete drafts, but reject fields that are executable or excessively large.
    if (doc.phases.length) {
      try {
        validateDefinition(doc);
      } catch (e) {
        error(`Structured draft validation: ${e.message}`, 422);
      }
    }
    const statements = [
      guard(db, v, body.expectedRevision),
      dbQuery(
        db,
        'INSERT INTO cancer_types VALUES(?,?,?,?,?,?) ON CONFLICT(name) DO NOTHING',
        doc.cancerGroup,
        doc.cancerGroup,
        ...meta,
      ),
      ...clearProjection(db, v.id),
      dbQuery(
        db,
        'UPDATE regimen_versions SET document=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=?',
        JSON.stringify(doc),
        now,
        actor,
        v.id,
      ),
      dbQuery(
        db,
        'UPDATE regimens SET name=?,cancer_type=?,indication=?,keywords=?,updated_at=?,updated_by=? WHERE id=?',
        doc.name,
        doc.cancerGroup,
        doc.indication,
        JSON.stringify([
          doc.name,
          doc.indication,
          doc.cancerGroup,
          ...(doc.alias || []),
          ...doc.phases.flatMap((p) => p.orders.map((o) => o.drugName)),
          ...(doc.sourceRecord?.['รายการยา'] || []).map((o) => o['ชื่อยา']),
        ]),
        now,
        actor,
        v.regimen_id,
      ),
    ];
    // Shared metadata of a published protocol cannot be changed by draft work.
    if (
      await dbQuery(
        db,
        "SELECT id FROM regimen_versions WHERE regimen_id=? AND status='published'",
        v.regimen_id,
      ).first()
    )
      statements.splice(statements.length - 1, 1);
    if (doc.phases.length)
      statements.push(
        ...projections(v.id, doc, actor, now).map((x) =>
          dbQuery(db, x.sql, ...x.args),
        ),
      );
    statements.push(
      audit(db, user, v, 'save_draft', v.document, doc, comment, now),
    );
    await batch(statements);
    return response({ version: await version(db, v.id) });
  }
  const action = path.match(
    /^\/api\/versions\/([^/]+)\/(submit|start-review|approve|request-revision|reject|publish|retire)$/,
  );
  if (action && request.method === 'POST') {
    const v = await version(db, decodeURIComponent(action[1])),
      act = action[2],
      comment = reason();
    const rules = {
      submit: ['draft', 'submitted', 'edit'],
      'start-review': ['submitted', 'clinical_review_required', 'review'],
      approve: ['clinical_review_required', 'approved', 'review'],
      'request-revision': ['clinical_review_required', 'draft', 'review'],
      reject: ['clinical_review_required', 'rejected', 'review'],
      publish: ['approved', 'published', 'publish'],
      retire: ['published', 'retired', 'publish'],
    };
    const [from, to, permission] = rules[act];
    // Independent named reviewer PIN can publish an already Approved version
    // on STAGING ONLY; this does not provide clinical_admin or audit privileges.
    const reviewerPinPublish = act==='publish' && publicCalculator(env) &&
      who.pin && who.pinRole==='oncology_pharmacist' &&
      user.role_code==='oncology_pharmacist';
    if (!reviewerPinPublish) permit(user, permission);
    if (v.status !== from) error('Invalid workflow transition', 409);
    if (act==='publish' && (v.created_by===actor || !v.approved_by ||
        (v.approved_by===v.created_by)))
      error('Independent approval by a different pharmacist is required before publication',403);
    // Every submitted PIN-session Draft requires fresh personal confirmation.
    if (act==='submit' && who.pin)
      await verifySubmitPin(env, who.email, body.confirmPin, request);
    if (['submit', 'approve', 'publish'].includes(act)) {
      try {
        validateDefinition(v.document);
      } catch (e) {
        error(`Clinical definition blocked: ${e.message}`, 422);
      }
    }
    const lastRequest = await dbQuery(
      db,
      'SELECT * FROM approval_requests WHERE version_id=? ORDER BY rowid DESC LIMIT 1',
      v.id,
    ).first();
    if (
      act === 'approve' &&
      (!lastRequest ||
        lastRequest.created_by === actor ||
        v.created_by === actor)
    )
      error(
        'Independent reviewer required; author/submitter cannot approve own work',
        403,
      );
    const statements = [guard(db, v, body.expectedRevision)];
    if (act === 'publish') {
      const previous = await dbQuery(
        db,
        "SELECT * FROM regimen_versions WHERE regimen_id=? AND status='published'",
        v.regimen_id,
      ).first();
      if (previous) {
        statements.push(
          dbQuery(
            db,
            "UPDATE regimen_versions SET status='retired',revision=revision+1,updated_at=?,updated_by=? WHERE id=?",
            now,
            actor,
            previous.id,
          ),
          audit(
            db,
            user,
            previous,
            'superseded',
            parse(previous),
            { status: 'retired' },
            comment,
            now,
          ),
        );
      }
      statements.push(
        dbQuery(
          db,
          'UPDATE regimens SET name=?,cancer_type=?,indication=?,keywords=?,updated_at=?,updated_by=? WHERE id=?',
          v.document.name,
          v.document.cancerGroup,
          v.document.indication,
          JSON.stringify([
            v.document.name,
            v.document.cancerGroup,
            v.document.indication,
            ...(v.document.alias || []),
            ...v.document.phases.flatMap((p) =>
              p.orders.map((o) => o.drugName),
            ),
          ]),
          now,
          actor,
          v.regimen_id,
        ),
      );
    }
    let q =
      'UPDATE regimen_versions SET status=?,revision=revision+1,updated_at=?,updated_by=?';
    const params = [to, now, actor];
    if (act === 'approve') {
      q += ',approved_by=?,approved_at=?,approval_comment=?';
      params.push(actor, now, comment);
    }
    if (act === 'publish') {
      q += ',published_at=?,published_by=?';
      params.push(now, actor);
    }
    if (act === 'request-revision') {
      q += ',approved_by=NULL,approved_at=NULL,approval_comment=NULL';
    }
    q += ' WHERE id=?';
    params.push(v.id);
    statements.push(dbQuery(db, q, ...params));
    if (act === 'submit')
      statements.push(
        dbQuery(
          db,
          'INSERT INTO approval_requests VALUES(?,?,?,?,?,?,?)',
          uuid(),
          v.id,
          to,
          ...meta,
        ),
      );
    else if (lastRequest)
      statements.push(
        dbQuery(
          db,
          'UPDATE approval_requests SET status=?,updated_at=?,updated_by=? WHERE id=?',
          to,
          now,
          actor,
          lastRequest.id,
        ),
      );
    statements.push(
      dbQuery(
        db,
        'INSERT INTO approval_history VALUES(?,?,?,?,?,?,?,?,?,?)',
        uuid(),
        v.id,
        act,
        v.previous_version,
        JSON.stringify(v.document.references || []),
        comment,
        ...meta,
      ),
      audit(
        db,
        user,
        v,
        act,
        { status: v.status, document: v.document },
        { status: to, document: v.document },
        comment,
        now,
      ),
    );
    await batch(statements);
    const persisted=await version(db,v.id);
    if(act==='publish'){
      // Independent read-after-write integrity check, NOT a clinical dose-signoff.
      validateDefinition(persisted.document);
      const active=await dbQuery(db,
        "SELECT COUNT(*) AS count FROM regimen_versions WHERE regimen_id=? AND status='published'",
        persisted.regimen_id).first();
      const auditTrail=await dbQuery(db,
        "SELECT COUNT(*) AS count FROM approval_history WHERE version_id=? AND action='publish'",
        persisted.id).first();
      if(persisted.status!=='published' || !persisted.published_at ||
         !persisted.approved_by || !persisted.approved_at ||
         Number(active?.count)!==1 || Number(auditTrail?.count)!==1)
        error('Post-Publish integrity verification FAILED; block clinical use and contact Pharmacy Admin',503);
      return response({version:persisted,postPublishCheck:{
        structuralValidation:'passed',singleActiveVersion:true,approvalAudit:true,
        clinicalContentVerification:'requires independent pharmacist review',
      }});
    }
    return response({version:persisted});
  }
  error('Not found', 404);
}
export default {
  async fetch(request, env) {
    try {
      return await dispatch(request, env);
    } catch (e) {
      if (!e.status) console.error('V3 request failed', e.message);
      if (isInternalStaging(env) && e.status === 401 &&
          request.method === 'GET' &&
          request.headers.get('Accept')?.includes('text/html') &&
          !new URL(request.url).pathname.startsWith('/api/'))
        return env.CODESPACES_PREVIEW === 'true' &&
          /^https:\/\/[a-z0-9-]+-8792\.app\.github\.dev$/.test(env.CODESPACES_PREVIEW_ORIGIN || '')
          ? new Response(null, { status: 303, headers: { Location: '/login', 'Cache-Control': 'no-store' } })
          : Response.redirect(new URL('/login', request.url).toString(), 303);
      const r = response(
        {
          error: e.status
            ? e.message
            : 'Service unavailable. Reload to verify the operation status before retrying.',
        },
        e.status || 503,
      );
      if (!isInternalStaging(env) || e.status !== 401) return r;
      const h = new Headers(r.headers);
      h.set('X-BHH-Auth', 'internal');
      return new Response(r.body, { status: r.status, headers: h });
    }
  },
};
