import {
  calculate,
  allowedPolicies,
  policies,
  validateDefinition,
} from './shared/clinical.js';
import { cacheGet, cachePut, clearCache } from './cache.js';
const $ = (s) => document.querySelector(s),
  esc = (x) =>
    String(x ?? '').replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    );
const fmt = (x) =>
  Number.isFinite(x)
    ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 }).format(x)
    : '—';
const state = {
  catalog: [],
  registry: [],
  details: new Map(),
  revision: 0,
  online: false,
  user: null,
  local: false,
  selected: null,
  draft: null,
  checked: 0,
  loading: false,
  authMode: '',
};
const statusLabel = (s) =>
  ({
    draft: 'Draft',
    submitted: 'Submitted',
    clinical_review_required: 'Clinical Review Required',
    approved: 'Approved',
    published: 'Published',
    retired: 'Retired',
    rejected: 'Rejected',
  })[s] || s;
const badge = (s) =>
  `<span class="badge ${esc(s)}">${esc(statusLabel(s))}</span>`;
const canEdit = () =>
  state.online &&
  ['regimen_editor', 'oncology_pharmacist', 'clinical_admin'].includes(
    state.user?.role,
  );
const canReview = () =>
  state.online &&
  ['oncology_pharmacist', 'clinical_admin'].includes(state.user?.role);
const canPublish = () => state.online && state.user?.role === 'clinical_admin';
function note(message, error = true) {
  $('#notice').textContent = message;
  $('#notice').hidden = false;
  $('#notice').className = error ? 'blocked' : 'warning';
}
function clearNote() {
  $('#notice').hidden = true;
}
function failure(e) {
  note(e.message);
}
function renderAccount(session) {
  state.authMode=session.authMode;
  state.user=session.user;
  state.local=session.local;
  const editor=['regimen_editor','oncology_pharmacist','clinical_admin'].includes(session.user?.role);
  $('#registry-tab').hidden=!editor;
  $('#builder-tab').hidden=!editor;
  $('#manage-pin').hidden=!['public','editor'].includes(session.authMode);
  $('#audit-tab').hidden=session.user?.role!=='clinical_admin';
  const label=session.authMode==='public'?'Public calculator':
    esc(session.user.email)+'<small>'+esc(session.user.role)+'</small>';
  const end=session.authMode==='editor'
    ? '<button type="button" id="editor-logout">Exit editor</button>'
    : session.authMode==='internal'
    ? '<button type="button" id="staging-logout">Sign out</button>'
    : session.authMode==='public'
    ? '<a href="/login">Reviewer / Admin sign in</a>'
    : '';
  const selector=session.local?'<label>LOCAL TEST identity<select id="local-user"><option value="calculator@local.test">Calculator user</option><option value="editor@local.test">Regimen editor</option><option value="reviewer@local.test">Oncology pharmacist</option><option value="admin@local.test">Clinical admin</option></select></label>':'';
  $('#account').innerHTML=label+end+selector;
  if($('#staging-logout'))$('#staging-logout').onclick=stagingSignOut;
  if($('#editor-logout'))$('#editor-logout').onclick=async()=>{
    try{
      await api('/auth/editor-logout',{method:'POST',body:'{}'});
      await clearPrivateClientState();
      window.location.replace('/');
    }catch(e){failure(e)}
  };
  if($('#local-user'))$('#local-user').onchange=async()=>{
    state.details.clear();state.selected=null;state.draft=null;
    state.catalog=[];await sync();
    if(!$('#registry').hidden)await registry();
    renderLibrary();
  };
}
function connection() {
  const v = state.selected?.version;
  $('#connection').className = state.online ? '' : 'offline';
  $('#connection').textContent = state.online
    ? `Central protocols · revision ${state.revision} · checked ${new Date(state.checked).toLocaleTimeString()}`
    : `OFFLINE / CACHED PUBLISHED PROTOCOL · ${v ? `${v.document.name} · version ${v.version} · published ${v.published_at}` : 'เลือกสูตรที่เคยโหลดแล้ว'} · ไม่สามารถแก้ไขหรืออนุมัติได้`;
  $('#new-draft').disabled = !canEdit();
  $('#calculate').disabled =
    !state.selected || state.selected.version.status !== 'published';
}
async function api(path, options = {}) {
  const h = {
    'X-Requested-With': 'BHH-V3',
    ...(options.method ? { 'Content-Type': 'application/json' } : {}),
  };
  if (state.local)
    h['X-Local-User'] = $('#local-user')?.value || 'calculator@local.test';
  let r;
  try {
    r = await fetch(`/api${path}`, {
      ...options,
      headers: { ...h, ...options.headers },
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    e.transport = true;
    throw e;
  }
  if (!r.ok) {
    let value;
    try {
      value = await r.json();
    } catch {
      value = { error: 'Service unavailable' };
    }
    const e = Error(value.error || `API error ${r.status}`);
    e.status = r.status;
    if (r.status === 401 && r.headers.get('X-BHH-Auth') === 'internal' && state.authMode!=='public') {
      await clearPrivateClientState();
      window.location.replace('/login');
    }
    if (r.status >= 500) e.transport = true;
    throw e;
  }
  return r.json();
}
async function clearPrivateClientState() {
  await clearCache();
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('bhh-v3-shell-'))
      .map(key => caches.delete(key)));
  }
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(registration => registration.unregister()));
  }
}
async function stagingSignOut() {
  try {
    await api('/auth/logout', { method: 'POST', body: '{}' });
    await clearPrivateClientState();
    window.location.replace('/login');
  } catch (error) {
    note('ไม่สามารถออกจากระบบบน Server ได้ กรุณาตรวจสอบการเชื่อมต่อ: ' + error.message);
  }
}
async function offline() {
  state.online = false;
  state.draft = null;
  $('#result').innerHTML = '';
  $('#review-detail').innerHTML = '';
  $('#builder-content').textContent = 'Offline: การแก้ไขและอนุมัติถูกปิด';
  const c = await cacheGet('catalog');
  if (c) {
    state.catalog = c.catalog;
    state.revision = c.revision;
    renderCatalog();
  }
  connection();
}
async function sync() {
  if (state.loading) return;
  state.loading = true;
  try {
    const reconnect = !state.online;
    const session = await api('/session');
    const previousRole=state.user?.role, previousMode=state.authMode;
    if(previousRole!==session.user?.role || previousMode!==session.authMode) {
      state.catalog=[];state.details.clear();state.draft=null;
      renderAccount(session);
    } else {state.user=session.user;state.local=session.local;}
    state.online = true;
    const r = await api('/revision');
    if (reconnect || r.revision !== state.revision || !state.catalog.length) {
      $('#result').innerHTML = '';
      state.details.clear();
      const c = await api('/catalog');
      state.catalog = c.catalog;
      state.revision = c.revision;
      await cachePut('catalog', {
        revision: c.revision,
        catalog: c.catalog.filter((x) => x.status === 'published'),
        savedAt: new Date().toISOString(),
      });
      renderCatalog();
      if (state.selected) {
        const active = c.catalog.find(
          (x) =>
            x.id === state.selected.version.regimen_id &&
            x.status === 'published',
        );
        if (active) {
          await selectVersion(active.versionId);
        } else {
          state.selected = null;
          $('#selected').innerHTML =
            '<div class="blocked">สูตรนี้ไม่มีรุ่นที่ Published กรุณาเลือกสูตรใหม่</div>';
        }
      }
    }
    state.checked = Date.now();
    connection();
  } catch (e) {
    if (e.transport) await offline();
    else {
      state.online = false;
      state.selected = null;
      state.catalog = [];
      $('#result').innerHTML = '';
      await clearCache();
      connection();
      failure(e);
    }
  } finally {
    state.loading = false;
  }
}
function renderCatalog() {
  const cancers = [...new Set(state.catalog.map((x) => x.cancerType))].sort();
  for (const selector of ['#cancer', '#library-cancer']) {
    const value = $(selector).value;
    $(selector).innerHTML =
      `<option value="">${selector === '#cancer' ? 'เลือกชนิดมะเร็ง' : 'ทั้งหมด'}</option>` +
      cancers
        .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
        .join('');
    $(selector).value = value;
  }
  $('#library-count').textContent =
    `${state.catalog.length} records${state.authMode==='public'?' · Published only':' · Central regimen library'}${state.online ? '' : ' · cached published records only'}`;
  renderLibrary();
}
const matches = (r, q) =>
  [r.name, r.indication, r.cancerType, ...r.keywords]
    .join(' ')
    .toLowerCase()
    .includes(q.toLowerCase());
function search() {
  const q = $('#regimen-search').value.trim(),
    cancer = $('#cancer').value;
  const found = state.catalog.filter(
    (r) => (!cancer || r.cancerType === cancer) && matches(r, q),
  );
  const box = $('#matches');
  box.hidden = !q;
  $('#regimen-search').setAttribute('aria-expanded', String(!!q));
  box.innerHTML =
    found
      .slice(0, 20)
      .map(
        (r) =>
          `<button type="button" role="option" data-select="${esc(r.versionId)}"><strong>${esc(r.name)}</strong><small>${esc(r.cancerType)} · ${esc(statusLabel(r.status))} · v${esc(r.version)}</small></button>`,
      )
      .join('') || '<div class="empty">ไม่พบสูตรยา</div>';
}
function renderLibrary() {
  const q = $('#library-search').value,
    c = $('#library-cancer').value,
    s = $('#library-status').value;
  const rows = state.catalog.filter(
    (r) =>
      (!c || r.cancerType === c) && (!s || r.status === s) && matches(r, q),
  );
  $('#library-list').innerHTML = table(
    ['Regimen / Indication', 'Cancer Type', 'Status / Version', 'Actions'],
    rows.map(
      (r) =>
        `<tr><td><strong>${esc(r.name)}</strong><small>${esc(r.indication)}</small></td><td>${esc(r.cancerType)}</td><td>${badge(r.status)}<small>v${esc(r.version)}</small></td><td><button data-view="${esc(r.versionId)}">View regimen</button>${canEdit() ? `<button data-clone="${esc(r.versionId)}">Clone to Builder</button>` : ''}</td></tr>`,
    ),
  );
}
function table(head, rows) {
  return `<div class="table-wrap"><table><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.join('') || `<tr><td colspan="${head.length}" class="empty">No records</td></tr>`}</tbody></table></div>`;
}
async function getDetail(id) {
  if (state.details.has(id)) return state.details.get(id);
  if (!state.online) {
    const cached = await cacheGet(`version:${id}`);
    if (!cached || cached.version.status !== 'published')
      throw Error('สูตรนี้ไม่มี Published snapshot ในเครื่อง');
    state.details.set(id, cached);
    return cached;
  }
  const d = await api(`/versions/${encodeURIComponent(id)}`);
  state.details.set(id, d);
  if (d.version.status === 'published')
    await cachePut(`version:${id}`, {
      ...d,
      cachedAt: new Date().toISOString(),
    });
  return d;
}
function referenceHtml(r) {
  return `<div class="references">${(r.references || []).map((x) => (/^https:\/\//.test(x.url) ? `<p><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.label)}</a> · ${esc(x.accessedDate)}</p>` : '')).join('')}</div>`;
}
function doseText(d) {
  const v = d.options?.join(' or ') || d.value;
  return d.basis === 'auc'
    ? `AUC ${v}`
    : `${v} ${d.unit}${d.basis === 'bsa' ? '/m²' : d.basis === 'weight' ? '/kg' : ''}`;
}
function clinicalRuleText(x) {
  if (x.type === 'hard_max')
    return `Hard maximum: ${x.value} ${x.unit}. ${x.reason}`;
  if (x.type === 'hard_min')
    return `Hard minimum: ${x.value} ${x.unit}. ${x.reason}`;
  if (x.type === 'multiply')
    return `Protocol multiplier: ×${x.factor}. ${x.reason}`;
  return `${x.metric} ${x.operator} ${x.value}: ${x.message}`;
}
function protocolHtml(d) {
  const v = d.version,
    r = v.document;
  return `<h3>${esc(r.name)} ${badge(v.status)}</h3><p>${esc(r.indication)} · v${esc(v.version)}</p><p>Population: ${esc(r.population || 'Not defined')} · Cycle interval: ${esc(r.cycleIntervalDays || '—')} days · Cycles: ${esc(r.cycleCount || '—')}</p><small>Approved: ${esc(v.approved_by === 'v2-approved-import' ? 'Prior local approval (import)' : v.approved_by || '—')} · ${esc(v.approved_at || '—')}<br>Published: ${esc(v.published_at || '—')}</small>${r.phases
    .map(
      (p) =>
        `<div class="phase"><strong>${esc(p.name)} · cycles ${p.cycleStart}–${p.cycleEnd}</strong>${table(
          [
            'Drug',
            'Protocol dose',
            'Route / Schedule',
            'Clinical rules / Rounding',
          ],
          p.orders.map(
            (o) =>
              `<tr><td>${esc(o.drugName)}</td><td>${esc(doseText(o.dose))}</td><td>${esc(o.route)} · days ${esc(o.schedule.days.join(', '))}<small>${esc(o.schedule.administrationsPerDay || 1)} administration(s)/day · ${o.schedule.continuousInfusionHours ? `${o.schedule.continuousInfusionHours} h continuous infusion` : o.schedule.infusionMinutes ? `${o.schedule.infusionMinutes} min` : ''} ${esc(o.schedule.note || '')}</small></td><td>${esc((o.clinicalRules || []).map(clinicalRuleText).join('; '))}<small>Default: ${esc(policies[o.roundingProfileId]?.label || 'Not defined')}<br>Allowed: ${esc((o.allowedRoundingPolicies || []).map((k) => policies[k]?.label || k).join(', '))}</small></td></tr>`,
          ),
        )}</div>`,
    )
    .join(
      '',
    )}${r.sourceRecord ? `<details><summary>Original regimen details</summary><pre class="source">${esc(JSON.stringify(r.sourceRecord, null, 2))}</pre></details>` : ''}${(r.clinicalNotes || []).map((x) => `<p>${esc(x)}</p>`).join('')}${referenceHtml(r)}`;
}
async function selectVersion(id) {
  clearNote();
  $('#result').innerHTML = '';
  const d = await getDetail(id);
  state.selected = d;
  const r = d.version.document;
  $('#regimen-search').value = r.name;
  $('#cancer').value = r.cancerGroup;
  $('#matches').hidden = true;
  $('#regimen-search').setAttribute('aria-expanded', 'false');
  $('#selected').innerHTML =
    `<h3>${esc(r.name)} ${badge(d.version.status)}</h3><p>${esc(r.indication)} · v${esc(d.version.version)}</p><small>Published: ${esc(d.version.published_at || '—')}</small><details><summary>Protocol doses / schedule / references</summary>${protocolHtml(d)}</details>`;
  if (d.version.status !== 'published')
    $('#selected').insertAdjacentHTML(
      'beforeend',
      '<div class="blocked">สูตรนี้ยังไม่ผ่านการเผยแพร่ จึงไม่สามารถคำนวณขนาดยาได้</div>',
    );
  updateClinicalInputs();
  connection();
}
function updateClinicalInputs() {
  const r = state.selected?.version.document,
    cycle = Number($('#patient-form [name=cycle]').value);
  const phase = r?.phases.find(
    (x) => cycle >= x.cycleStart && cycle <= x.cycleEnd,
  );
  const kidney = phase?.orders.some(
    (o) =>
      o.dose.basis === 'auc' ||
      o.clinicalRules?.some((x) => x.metric === 'kidney_function'),
  );
  const cg = $('#kidney-method').value === 'cockcroft_gault';
  $('#scr-label').hidden = !(kidney && cg);
  $('#kidney-label').hidden = !(kidney && !cg);
  $('#scr-label input').required = !!(kidney && cg);
  $('#kidney-label input').required = !!(kidney && !cg);
  const opts = r ? allowedPolicies(r, cycle) : ['drug-specific'];
  const old = $('#rounding').value;
  $('#rounding').innerHTML = opts
    .map(
      (x) =>
        `<option value="${x}">${x === 'drug-specific' ? 'Drug-specific' : esc(policies[x].label)}</option>`,
    )
    .join('');
  if (opts.includes(old)) $('#rounding').value = old;
  $('#auc-options').innerHTML = (
    phase?.orders.filter((o) => o.dose.options) || []
  )
    .map(
      (o) =>
        `<label>${esc(o.drugName)} · ${esc(o.dose.basis.toUpperCase())}<select data-dose-option="${esc(o.id)}" required><option value="">เลือกขนาดยาที่อนุมัติ</option>${o.dose.options.map((v) => `<option value="${v}">${v}</option>`).join('')}</select></label>`,
    )
    .join('');
}
function go(page) {
  if(['registry','builder','audit'].includes(page) && !canEdit()){
    note('Manage Regimen: Confirm PIN required');
    return;
  }
  document
    .querySelectorAll('main>section')
    .forEach((s) => (s.hidden = s.id !== page));
  document
    .querySelectorAll('nav button')
    .forEach((b) => b.classList.toggle('active', b.dataset.page === page));
  if (page === 'registry') registry().catch(failure);
  if (page === 'library') renderLibrary();
  if (page === 'audit') audit().catch(failure);
}
async function registry() {
  if (!state.online) {
    $('#registry-list').innerHTML =
      '<div class="warning">Offline: registry unavailable</div>';
    return;
  }
  const r = await api('/registry');
  state.registry = r.versions;
  $('#registry-list').innerHTML = table(
    [
      'Regimen',
      'Cancer Type',
      'Status / Active',
      'Version / Updated',
      'Reviewer / Approval',
      'Source',
      'Actions',
    ],
    r.versions.map(
      (v) =>
        `<tr><td>${esc(v.name)}<small>${esc(v.indication)}</small></td><td>${esc(v.cancerType)}</td><td>${badge(v.status)}<small>${v.active ? 'Active published' : 'Not active'}</small></td><td>v${esc(v.version)}<small>${esc(v.updatedAt)}</small></td><td>${esc(v.reviewer || '—')}<small>${esc(v.approvedAt || '—')}</small></td><td>${esc(v.source.map((x) => x.label).join('; ') || 'Awaiting source review')}</td><td><button data-review="${esc(v.versionId)}">View</button>${canEdit() ? `<button data-clone="${esc(v.versionId)}">Clone</button>${v.status === 'draft' ? `<button data-edit="${esc(v.versionId)}">Edit Draft</button>` : `<button data-new-version="${esc(v.versionId)}">New Version</button>`}` : ''}</td></tr>`,
    ),
  );
}
async function review(id) {
  const d = await getDetail(id);
  state.reviewing = d;
  const v = d.version;
  const actions = [];
  if (canEdit() && v.status === 'draft')
    actions.push(['submit', 'Submit Review']);
  if (canReview() && v.status === 'submitted')
    actions.push(['start-review', 'Start Clinical Review']);
  if (canReview() && v.status === 'clinical_review_required')
    actions.push(
      ['approve', 'Approve'],
      ['request-revision', 'Request Revision'],
      ['reject', 'Reject'],
    );
  if (canPublish() && v.status === 'approved')
    actions.push(['publish', 'Publish']);
  if (canPublish() && v.status === 'published')
    actions.push(['retire', 'Retire']);
  const previous = v.previous_version
    ? await getDetail(v.previous_version)
    : null;
  $('#review-detail').innerHTML =
    `<div class="panel">${protocolHtml(d)}${previous ? `<details><summary>Previous version ${esc(previous.version.version)} — compare before approval</summary>${protocolHtml(previous)}</details>` : ''}<h3>Review history</h3>${table(
      ['Action', 'User', 'Date', 'Comment'],
      d.history.map(
        (x) =>
          `<tr><td>${esc(x.action)}</td><td>${esc(x.created_by)}</td><td>${esc(x.created_at)}</td><td>${esc(x.comment)}</td></tr>`,
      ),
    )}${actions.length ? `<label>Review / change comment<textarea id="review-comment" required placeholder="ระบุเหตุผลและผลการทบทวน"></textarea></label><div class="actions">${actions.map(([a, label]) => `<button data-transition="${a}" class="${a === 'approve' || a === 'publish' ? 'primary' : ''}">${label}</button>`).join('')}</div>` : ''}</div>`;
  $('#review-detail').scrollIntoView({ behavior: 'smooth' });
}
async function transition(action) {
  if (!state.online) throw Error('Offline writes are disabled');
  const v = state.reviewing.version,
    reason = $('#review-comment').value;
  await api(`/versions/${encodeURIComponent(v.id)}/${action}`, {
    method: 'POST',
    body: JSON.stringify({ expectedRevision: v.revision, reason }),
  });
  state.details.clear();
  await sync();
  await registry();
  await review(v.id);
  note(
    `${statusLabel(action === 'request-revision' ? 'draft' : action === 'start-review' ? 'clinical_review_required' : action)} saved`,
    false,
  );
}
function input(label, key, value, type = 'text', extra = '') {
  return `<label>${esc(label)}<input data-field="${key}" type="${type}" value="${esc(value)}" ${extra}></label>`;
}
function select(label, key, value, options) {
  return `<label>${esc(label)}<select data-field="${key}">${options.map((x) => `<option value="${esc(x)}" ${x === value ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>`;
}
function newOrder() {
  return {
    id: crypto.randomUUID(),
    drugId: '',
    drugName: '',
    dose: { basis: 'bsa', unit: 'mg', value: 1 },
    route: 'IV',
    schedule: { days: [1] },
    roundingProfileId: 'NO_ROUND',
    allowedRoundingPolicies: ['NO_ROUND'],
    clinicalRules: [],
  };
}
function renderBuilder() {
  if (!state.draft) return;
  const r = state.draft.document;
  $('#builder-content').innerHTML =
    `<form id="builder-form"><h3>${esc(r.name)} · v${esc(state.draft.version)} · Draft</h3><div class="fields">${input('Regimen name', 'name', r.name)}${input('Cancer Type', 'cancerGroup', r.cancerGroup)}${input('Indication', 'indication', r.indication)}${select('Population', 'population', r.population || 'adult', ['adult', 'pediatric'])}${input('Cycle interval (days)', 'cycleIntervalDays', r.cycleIntervalDays || '', 'number', 'min="1"')}${input('Number of cycles', 'cycleCount', r.cycleCount || '', 'number', 'min="1"')}${input('Aliases (comma separated)', 'alias', (r.alias || []).join(', '))}</div>
 ${r.phases
   .map(
     (
       p,
       i,
     ) => `<div class="phase" data-phase="${i}"><div class="fields">${input('Phase name', 'name', p.name)}${input('Start cycle', 'cycleStart', p.cycleStart, 'number')}${input('End cycle', 'cycleEnd', p.cycleEnd, 'number')}</div><div class="actions"><button type="button" data-remove-phase="${i}">Remove phase</button><button type="button" data-add-order="${i}">Add drug</button></div>
 ${p.orders
   .map(
     (o, j) =>
       `<div class="order" data-order="${j}"><div class="fields">${input('Drug name', 'drugName', o.drugName)}${input('Drug ID', 'drugId', o.drugId)}${select('Dose basis', 'basis', o.dose.basis, ['fixed', 'bsa', 'weight', 'auc'])}${input('Dose value', 'value', o.dose.value ?? '', 'number', 'step="any"')}${select('Unit', 'unit', o.dose.unit, ['mg', 'g', 'IU'])}${input('Approved dose options (comma separated)', 'options', o.dose.options?.join(', ') || '')}${input('Route', 'route', o.route)}${input('Administration days', 'days', o.schedule.days.join(', '))}${input('Administrations/day', 'administrationsPerDay', o.schedule.administrationsPerDay || 1, 'number')}${input('Infusion (minutes)', 'infusionMinutes', o.schedule.infusionMinutes || '', 'number', 'step="any"')}${input('Continuous infusion (hours)', 'continuousInfusionHours', o.schedule.continuousInfusionHours || '', 'number', 'step="any"')}${select('Default rounding', 'roundingProfileId', o.roundingProfileId || 'NO_ROUND', Object.keys(policies))}${input('Allowed rounding policy IDs', 'allowedRoundingPolicies', o.allowedRoundingPolicies.join(', '))}${input('Hard maximum (same unit)', 'hardMax', (o.clinicalRules || []).find((x) => x.type === 'hard_max')?.value ?? '', 'number', 'step="any"')}${input('Hard minimum (same unit)', 'hardMin', (o.clinicalRules || []).find((x) => x.type === 'hard_min')?.value ?? '', 'number', 'step="any"')}${input('Schedule note', 'note', o.schedule.note || '')}</div><label>Other approved clinical rules (structured JSON)<textarea data-field="otherRules">${esc(
         JSON.stringify(
           (o.clinicalRules || []).filter(
             (x) => !['hard_max', 'hard_min'].includes(x.type),
           ),
           null,
           2,
         ),
       )}</textarea></label><button type="button" data-remove-order="${i}:${j}">Remove drug</button></div>`,
   )
   .join('')}</div>`,
   )
   .join('')}
 <button type="button" id="add-phase">Add phase</button><h3>Clinical references</h3><label>Reference label<input id="reference-label" value="${esc(r.references?.[0]?.label || '')}"></label><label>Reference URL<input id="reference-url" type="url" value="${esc(r.references?.[0]?.url || '')}"></label><small>Additional existing references are preserved.</small><label>Clinical notes<textarea id="clinical-notes">${esc((r.clinicalNotes || []).join('\n'))}</textarea></label>${r.sourceRecord ? `<details><summary>Original regimen details — use for clinical review</summary><pre class="source">${esc(JSON.stringify(r.sourceRecord, null, 2))}</pre></details>` : ''}<label>Reason for change<textarea id="draft-reason" required></textarea></label><div class="actions"><button class="primary" type="submit">Save Draft</button><button type="button" id="draft-submit">Submit Review</button></div></form>`;
  $('#builder-form').onsubmit = (e) => {
    e.preventDefault();
    saveDraft().catch(failure);
  };
}
function readBuilder() {
  const r = state.draft.document;
  const root = $('#builder-form');
  const val = (node, key) =>
    node.querySelector(`[data-field="${key}"]`)?.value || '';
  for (const k of ['name', 'cancerGroup', 'indication', 'population'])
    r[k] = val(root, k);
  for (const k of ['cycleIntervalDays', 'cycleCount'])
    r[k] = Number(val(root, k));
  r.alias = val(root, 'alias')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
  document.querySelectorAll('[data-phase]').forEach((pn) => {
    const p = r.phases[Number(pn.dataset.phase)];
    p.name = val(pn, 'name');
    p.cycleStart = Number(val(pn, 'cycleStart'));
    p.cycleEnd = Number(val(pn, 'cycleEnd'));
    pn.querySelectorAll('[data-order]').forEach((on) => {
      const o = p.orders[Number(on.dataset.order)];
      for (const k of ['drugName', 'drugId', 'route', 'roundingProfileId'])
        o[k] = val(on, k);
      o.dose = { basis: val(on, 'basis'), unit: val(on, 'unit') };
      const options = val(on, 'options')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean)
        .map(Number);
      if (options.length) o.dose.options = options;
      else o.dose.value = Number(val(on, 'value'));
      o.schedule = {
        days: val(on, 'days')
          .split(',')
          .map((x) => Number(x.trim())),
        administrationsPerDay: Number(val(on, 'administrationsPerDay')),
      };
      for (const k of ['infusionMinutes', 'continuousInfusionHours'])
        if (val(on, k)) o.schedule[k] = Number(val(on, k));
      if (val(on, 'note')) o.schedule.note = val(on, 'note');
      o.allowedRoundingPolicies = val(on, 'allowedRoundingPolicies')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      o.clinicalRules = JSON.parse(val(on, 'otherRules') || '[]');
      for (const [field, type] of [
        ['hardMax', 'hard_max'],
        ['hardMin', 'hard_min'],
      ])
        if (val(on, field))
          o.clinicalRules.push({
            type,
            value: Number(val(on, field)),
            unit: o.dose.unit,
            reason: `Protocol ${type === 'hard_max' ? 'maximum' : 'minimum'} — clinical review required`,
          });
    });
  });
  const refs = [...(r.references || [])];
  const label = $('#reference-label').value.trim(),
    url = $('#reference-url').value.trim();
  if (label || url)
    refs[0] = {
      label,
      url,
      accessedDate: new Date().toISOString().slice(0, 10),
    };
  r.references = refs;
  r.clinicalNotes = $('#clinical-notes').value.split('\n').filter(Boolean);
  return r;
}
async function clone(id, same = false) {
  if (!canEdit()) throw Error('Editing is unavailable');
  const v = await api('/drafts', {
    method: 'POST',
    body: JSON.stringify({
      sourceVersionId: id,
      mode: same ? 'new-version' : 'clone',
      reason: same
        ? 'Create a new version for clinical review'
        : 'Clone protocol for clinical review',
    }),
  });
  state.draft = v.version;
  go('builder');
  renderBuilder();
  await sync();
}
async function edit(id) {
  const d = await getDetail(id);
  if (d.version.status !== 'draft') throw Error('Only draft can be edited');
  state.draft = structuredClone(d.version);
  go('builder');
  renderBuilder();
}
async function saveDraft() {
  if (!canEdit()) throw Error('Offline / permission: saving is unavailable');
  const doc = readBuilder();
  const reason = $('#draft-reason').value;
  const r = await api(`/versions/${encodeURIComponent(state.draft.id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      document: doc,
      expectedRevision: state.draft.revision,
      reason,
    }),
  });
  state.draft = r.version;
  state.details.clear();
  await sync();
  renderBuilder();
  note('Draft saved to central registry', false);
}
async function audit() {
  const r = await api('/audit');
  $('#audit-list').innerHTML = table(
    ['Action', 'Entity / Version', 'User / Timestamp', 'Reason', 'Values'],
    r.events.map(
      (x) =>
        `<tr><td>${esc(x.action)}</td><td>${esc(x.entity_id)}<small>v${esc(x.version)}</small></td><td>${esc(x.user_id)}<small>${esc(x.timestamp)}</small></td><td>${esc(x.reason)}</td><td><details><summary>Before / After</summary><pre class="source">${esc(x.previous_value)}\n→\n${esc(x.new_value)}</pre></details></td></tr>`,
    ),
  );
}
$('#patient-form').onsubmit = (e) => {
  e.preventDefault();
  try {
    clearNote();
    $('#result').innerHTML = '';
    if (!state.selected) throw Error('เลือกสูตรยาก่อนคำนวณ');
    if (state.online && Date.now() - state.checked > 35000)
      throw Error('Protocol revision check expired. Please wait for refresh.');
    const p = Object.fromEntries(new FormData(e.target));
    for (const k of [
      'ageYears',
      'heightCm',
      'weightKg',
      'serumCreatinineMgDl',
      'kidneyValue',
    ])
      p[k] = Number(p[k]);
    const selections = {};
    document
      .querySelectorAll('[data-dose-option]')
      .forEach((x) => (selections[x.dataset.doseOption] = Number(x.value)));
    const r = calculate(
      state.selected.version.document,
      p,
      Number(p.cycle),
      $('#rounding').value,
      selections,
    );
    const v = state.selected.version;
    $('#result').innerHTML =
      `<div class="panel"><h3>Calculation result · ${esc(v.document.name)} · v${esc(v.version)}</h3>${!state.online ? '<div class="warning">OFFLINE / CACHED PUBLISHED PROTOCOL — verify current protocol before administration.</div>' : ''}<small>Published ${esc(v.published_at)} · revision ${state.revision} · ${esc(r.phase)}</small><div class="metrics"><span>BSA ${fmt(r.bsa)} m²</span>${r.kidney !== undefined ? `<span>${esc($('#kidney-method option:checked').textContent)}: ${fmt(r.kidney)} mL/min</span>` : ''}</div>${table(
        [
          'Drug / Schedule',
          'Calculated Dose',
          'Clinical Dose',
          'Recommended Dose',
          'Difference',
          'Clinical notes',
        ],
        r.rows.map(
          (x) =>
            `<tr><td><strong>${esc(x.drug)}</strong><small>${esc(x.route)} · days ${x.schedule.days.join(', ')}${x.schedule.continuousInfusionHours ? ` · ${x.schedule.continuousInfusionHours} h infusion` : ''}<br>Per administration · ${x.administrations} administration(s)/cycle</small></td><td class="calc">${fmt(x.base)} ${x.unit}</td><td class="clinical">${fmt(x.clinical)} ${x.unit}</td><td class="recommended">${fmt(x.recommended)} ${x.unit}</td><td class="diff">${fmt(x.difference)} ${x.unit}<small>${fmt(x.differencePct)}%</small></td><td>${x.notes.map((n) => `<small>${esc(n)}</small>`).join('')}${x.warnings.map((w) => `<div class="warning">${esc(w)}</div>`).join('')}</td></tr>`,
        ),
      )}<p>เภสัชกรต้องตรวจสอบขนาดยา ตารางให้ยา และความเหมาะสมทางคลินิกก่อนบริหารยา</p><label><input type="checkbox" id="verification" class="verification"> Pharmacist verification completed (this calculation only)</label></div>`;
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) {
    $('#result').innerHTML =
      `<div class="blocked">BLOCKED: ${esc(e.message)}</div>`;
  }
};
$('#regimen-search').oninput = () => {
  state.selected = null;
  $('#result').innerHTML = '';
  $('#selected').textContent = 'เลือกสูตรจากผลการค้นหา';
  connection();
  search();
};
$('#regimen-search').onkeydown = (e) => {
  if (e.key === 'Escape') {
    $('#matches').hidden = true;
    $('#regimen-search').setAttribute('aria-expanded', 'false');
  }
  if (e.key === 'ArrowDown') {
    $('#matches button')?.focus();
    e.preventDefault();
  }
};
$('#matches').onkeydown = (e) => {
  const buttons = [...$('#matches').querySelectorAll('button')],
    i = buttons.indexOf(document.activeElement);
  if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
    buttons[
      (i + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    ]?.focus();
    e.preventDefault();
  }
};
$('#cancer').onchange = () => {
  state.selected = null;
  $('#regimen-search').value = '';
  $('#selected').textContent = 'ยังไม่ได้เลือกสูตรยา';
  $('#result').innerHTML = '';
  $('#matches').hidden = true;
  connection();
};
$('#patient-form').oninput = (e) => {
  if (e.target.name === 'cycle' || e.target.name === 'kidneyMethod')
    updateClinicalInputs();
  $('#result').innerHTML = '';
};
$('#rounding').onchange = () => ($('#result').innerHTML = '');
$('#clear-patient').onclick = () => {
  $('#patient-form').reset();
  state.selected = null;
  $('#selected').textContent = 'ยังไม่ได้เลือกสูตรยา';
  $('#result').innerHTML = '';
  updateClinicalInputs();
  connection();
};
for (const id of ['library-search', 'library-cancer', 'library-status'])
  $('#' + id).oninput = renderLibrary;
$('#registry-refresh').onclick = () => registry().catch(failure);
$('#clear-offline').onclick = () =>
  clearCache()
    .then(() => note('Cached protocols cleared', false))
    .catch(failure);
$('#new-draft').onclick = async () => {
  try {
    const doc = {
      id: 'new',
      name: 'New regimen',
      cancerGroup: '',
      indication: '',
      population: 'adult',
      cycleIntervalDays: 21,
      cycleCount: 1,
      phases: [],
      references: [],
      clinicalNotes: [],
    };
    const r = await api('/drafts', {
      method: 'POST',
      body: JSON.stringify({
        document: doc,
        name: 'New regimen',
        reason: 'Create a new clinical draft',
      }),
    });
    state.draft = r.version;
    renderBuilder();
  } catch (e) {
    failure(e);
  }
};
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  try {
    if (b.dataset.page) {
      go(b.dataset.page);
      return;
    }
    if (b.dataset.select) {
      await selectVersion(b.dataset.select);
      return;
    }
    if (b.dataset.view) {
      go('calculator');
      await selectVersion(b.dataset.view);
      return;
    }
    if (b.dataset.review) {
      await review(b.dataset.review);
      return;
    }
    if (b.dataset.clone) {
      await clone(b.dataset.clone);
      return;
    }
    if (b.dataset.newVersion) {
      await clone(b.dataset.newVersion, true);
      return;
    }
    if (b.dataset.edit) {
      await edit(b.dataset.edit);
      return;
    }
    if (b.dataset.transition) {
      b.disabled = true;
      try {
        await transition(b.dataset.transition);
      } finally {
        b.disabled = false;
      }
      return;
    }
    if (b.id === 'draft-submit') {
      await saveDraft();
      state.reviewing = { version: state.draft };
      const v = state.draft;
      await api(`/versions/${encodeURIComponent(v.id)}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          expectedRevision: v.revision,
          reason:
            'Submitted structured protocol for independent clinical review',
        }),
      });
      state.details.clear();
      state.draft = null;
      go('registry');
      await sync();
      await registry();
      await review(v.id);
      return;
    }
    if (b.id === 'add-phase') {
      readBuilder();
      state.draft.document.phases.push({
        id: crypto.randomUUID(),
        name: 'New phase',
        cycleStart: 1,
        cycleEnd: 1,
        orders: [newOrder()],
      });
      renderBuilder();
      return;
    }
    if (b.dataset.addOrder !== undefined) {
      readBuilder();
      state.draft.document.phases[Number(b.dataset.addOrder)].orders.push(
        newOrder(),
      );
      renderBuilder();
      return;
    }
    if (b.dataset.removePhase !== undefined) {
      readBuilder();
      state.draft.document.phases.splice(Number(b.dataset.removePhase), 1);
      renderBuilder();
      return;
    }
    if (b.dataset.removeOrder) {
      readBuilder();
      const [i, j] = b.dataset.removeOrder.split(':').map(Number);
      state.draft.document.phases[i].orders.splice(j, 1);
      renderBuilder();
    }
  } catch (e) {
    failure(e);
  }
});
async function boot() {
  try {
    const s = await api('/session');
    renderAccount(s);
    await sync();
  } catch (e) {
    if (e.transport) await offline();
    else {
      await clearCache();
      failure(e);
    }
  }
  if ('serviceWorker' in navigator)
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() =>
        note('Offline application shell could not be installed', false),
      );
  setInterval(() => sync(), 15000);
  window.addEventListener('online', () => sync());
  window.addEventListener('offline', () => offline());
}
boot();
