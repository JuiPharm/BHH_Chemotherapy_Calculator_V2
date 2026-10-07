import { calculateRegimen, formatNumber } from './engine.js';
import { loadDrafts, saveDraft, deleteDraft, loadRoundingOverrides, saveRoundingOverrides, clearRoundingOverrides } from './storage.js';
import { auditLegacyRegimens, validateRegimen } from './validators.js';
const $ = (selector) => {
const element = document.querySelector(selector);
if (!element)
throw new Error(`Missing element ${selector}`);
return element;
};
let publishedRegimens = [];
let defaultProfileList = [];
let profileList = [];
let profiles = {};
let roundingOverrideActive = false;
let lastCalculation = null;
let builderOrders = [];
let legacyFindings = [];
let legacyRegimens = [];
const cloneData = (value) => JSON.parse(JSON.stringify(value));
const newId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
async function loadJson(url) {
const response = await fetch(url, { cache: 'no-store' });
if (!response.ok)
throw new Error(`Failed to load ${url}: ${response.status}`);
return response.json();
}
async function loadJsonOptional(url, fallback) {
try { return await loadJson(url); } catch { return fallback; }
}
async function init() {
try {
[publishedRegimens, defaultProfileList, legacyRegimens] = await Promise.all([
loadJson('./data/regimens.published.json'),
loadJson('./data/rounding-profiles.json'),
loadJsonOptional('./data/legacy-regimens.v1.json', { "สูตรยาเคมีบำบัด": [] }),
]);
legacyRegimens = Array.isArray(legacyRegimens?.["สูตรยาเคมีบำบัด"]) ? legacyRegimens["สูตรยาเคมีบำบัด"] : [];
const storedProfiles = loadRoundingOverrides();
profileList = storedProfiles && isCompatibleRoundingOverride(storedProfiles, defaultProfileList)
? storedProfiles
: cloneData(defaultProfileList);
roundingOverrideActive = Boolean(storedProfiles && isCompatibleRoundingOverride(storedProfiles, defaultProfileList));
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
bindNavigation();
populateRegimenSelect();
bindCalculator();
bindRegistry();
bindLibrary();
bindBuilder();
bindRoundingPolicy();
bindLegacyValidator();
renderRegistry();
resetBuilder();
updateCalculatorContext();
$('#app-loading').classList.add('hidden');
$('#app-shell').classList.remove('hidden');
}
catch (error) {
$('#app-loading').innerHTML = `<div class="fatal">Unable to start application: ${escapeHtml(errorMessage(error))}</div>`;
}
}
function bindNavigation() {
document.querySelectorAll('[data-tab]').forEach((button) => {
button.addEventListener('click', () => showTab(button.dataset.tab ?? 'calculator'));
});
}
function showTab(tab) {
document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.add('hidden'));
document.querySelectorAll('[data-tab]').forEach((button) => button.classList.toggle('active', button.dataset.tab === tab));
const panel = document.getElementById(`tab-${tab}`);
panel?.classList.remove('hidden');
if (tab === 'registry')
renderRegistry();
if (tab === 'library')
renderLibrary();
if (tab === 'builder')
renderBuilderOrders();
if (tab === 'rounding')
renderRoundingPolicy();
}
function populateRegimenSelect() {
const select = $('#regimen-select');
select.innerHTML = publishedRegimens
.map((r) => `<option value="${escapeAttr(r.id)}">${escapeHtml(r.name)} — ${escapeHtml(r.indication)}</option>`)
.join('');
}
function selectedRegimen() {
const id = $('#regimen-select').value;
const regimen = publishedRegimens.find((r) => r.id === id);
if (!regimen)
throw new Error('Select a regimen');
return regimen;
}
function bindCalculator() {
$('#regimen-select').addEventListener('change', updateCalculatorContext);
$('#cycle-input').addEventListener('input', updateCalculatorContext);
$('#kidney-method').addEventListener('change', updateKidneyUi);
$('#calc-form').addEventListener('submit', (event) => {
event.preventDefault();
runCalculation();
});
$('#print-btn').addEventListener('click', () => window.print());
$('#export-calc-btn').addEventListener('click', exportLastCalculation);
updateKidneyUi();
}
function updateKidneyUi() {
const method = $('#kidney-method').value;
const label = $('#kidney-value-label');
const valueInput = $('#kidney-value');
const scrWrap = $('#scr-wrap');
if (method === 'bsa_adjusted_egfr') {
label.textContent = 'eGFR (mL/min/1.73m²)';
valueInput.disabled = false;
scrWrap.classList.add('hidden');
}
else if (method === 'measured_gfr') {
label.textContent = 'Measured GFR (mL/min)';
valueInput.disabled = false;
scrWrap.classList.add('hidden');
}
else {
label.textContent = 'Kidney value (computed from SCr)';
valueInput.disabled = true;
scrWrap.classList.remove('hidden');
}
}
function updateCalculatorContext() {
const regimen = selectedRegimen();
const cycleInput = $('#cycle-input');
cycleInput.max = String(regimen.cycleCount ?? 99);
let cycle = Math.max(1, Number(cycleInput.value) || 1);
if (regimen.cycleCount && cycle > regimen.cycleCount) {
cycle = regimen.cycleCount;
cycleInput.value = String(cycle);
}
const phase = regimen.phases.find((p) => cycle >= p.cycleStart && (p.cycleEnd === undefined || cycle <= p.cycleEnd));
$('#regimen-context').innerHTML = `
<div><strong>${escapeHtml(regimen.name)}</strong> · ${escapeHtml(regimen.indication)}</div>
<div>Cycle ${cycle} · ${phase ? escapeHtml(phase.name) : '<span class="danger">No phase defined</span>'}</div>
<div class="micro">Version ${escapeHtml(regimen.version)} · Reviewed ${escapeHtml(regimen.lastReviewed)} · Local approval: <strong class="${regimen.localApproval ? 'success-text' : 'danger'}">${regimen.localApproval ? 'APPROVED' : 'NOT RECORDED'}</strong></div>`;
const aucBox = $('#dose-selections');
if (!phase) {
aucBox.innerHTML = '';
return;
}
const optionOrders = phase.orders.filter((o) => o.dose.options?.length);
aucBox.innerHTML = optionOrders.length
? `<h3>Clinical dose selection</h3>${optionOrders.map((order) => `
<label class="field">
<span>${escapeHtml(order.drugName)} — ${escapeHtml(order.dose.basis.toUpperCase())}</span>
<select data-dose-select="${escapeAttr(order.id)}">
${order.dose.options.map((v) => `<option value="${v}" ${v === order.dose.defaultOption ? 'selected' : ''}>${order.dose.basis === 'auc' ? 'AUC ' : ''}${v}</option>`).join('')}
</select>
</label>`).join('')}`
: '';
}
function runCalculation() {
try {
const regimen = selectedRegimen();
const selections = {};
document.querySelectorAll('[data-dose-select]').forEach((el) => {
if (el.dataset.doseSelect)
selections[el.dataset.doseSelect] = Number(el.value);
});
const method = $('#kidney-method').value;
const patient = {
ageYears: numberValue('#age-input'),
sex: $('#sex-input').value,
heightCm: numberValue('#height-input'),
weightKg: numberValue('#weight-input'),
kidneyMethod: method,
...(method === 'cockcroft_gault_legacy'
? { serumCreatinineMgDl: numberValue('#scr-input') }
: { kidneyValue: numberValue('#kidney-value') }),
};
const cycle = numberValue('#cycle-input');
const summary = calculateRegimen({ patient, regimen, cycle, selections, roundingProfiles: profiles });
lastCalculation = { generatedAt: new Date().toISOString(), regimenId: regimen.id, regimenVersion: regimen.version, cycle, patient, selections, summary };
renderCalculation(summary, regimen, cycle);
}
catch (error) {
$('#calc-output').innerHTML = `<div class="alert alert-error"><strong>Calculation blocked:</strong> ${escapeHtml(errorMessage(error))}</div>`;
lastCalculation = null;
}
}
function renderCalculation(summary, regimen, cycle) {
const warningHtml = [...summary.warnings, ...summary.results.flatMap((r) => r.warnings)]
.map((w) => `<div class="alert alert-warning">${escapeHtml(w)}</div>`)
.join('');
const rows = summary.results.map((result) => {
const recommended = result.recommendedDose === undefined
? '<span class="muted">Review / no rounding rule</span>'
: `<strong>${formatNumber(result.recommendedDose)} ${escapeHtml(result.recommendedUnit ?? result.clinicalUnit)}</strong>`;
const diff = result.differencePct === undefined
? '—'
: `${signed(result.difference ?? 0)} ${escapeHtml(result.clinicalUnit)} (${signed(result.differencePct)}%)`;
const ruleNotes = result.clinicalRuleNotes.length ? `<div class="micro rule-note">${result.clinicalRuleNotes.map(escapeHtml).join('<br>')}</div>` : '';
const blocked = result.blocked ? '<span class="badge badge-danger">BLOCKED</span>' : '';
return `<tr>
<td><strong>${escapeHtml(result.drugName)}</strong><div class="micro">${escapeHtml(result.route)} · ${escapeHtml(result.scheduleText)}</div>${blocked}</td>
<td>${escapeHtml(result.protocolDoseText)}</td>
<td><strong>${formatNumber(result.rawCalculatedDose)} ${escapeHtml(result.rawUnit)}</strong></td>
<td><strong>${formatNumber(result.clinicalDose)} ${escapeHtml(result.clinicalUnit)}</strong>${ruleNotes}</td>
<td>${recommended}<div class="micro">${escapeHtml(result.roundingProfileLabel ?? '')}</div></td>
<td>${diff}</td>
<td>${result.administrationsThisCycle > 1 ? `${formatNumber(result.cycleTotalClinicalDose)} ${escapeHtml(result.clinicalUnit)}<div class="micro">${result.administrationsThisCycle} administrations</div>` : '—'}</td>
</tr>`;
}).join('');
$('#calc-output').innerHTML = `
<section class="result-header">
<div><span class="kpi-label">BSA (full precision used)</span><strong>${summary.bsaM2.toFixed(5)} m²</strong></div>
<div><span class="kpi-label">Kidney function used</span><strong>${summary.kidneyFunctionMlMin !== undefined ? `${formatNumber(summary.kidneyFunctionMlMin)} mL/min` : 'Not required / unavailable'}</strong><span class="micro">${escapeHtml(summary.kidneyMethodLabel ?? '')}</span></div>
<div><span class="kpi-label">Regimen / cycle</span><strong>${escapeHtml(regimen.name)} · ${cycle}</strong></div>
</section>
${warningHtml}
<div class="table-wrap"><table>
<thead><tr><th>Drug</th><th>Protocol dose</th><th>Raw calculated</th><th>Clinical dose</th><th>Recommended</th><th>Difference</th><th>Cycle total*</th></tr></thead>
<tbody>${rows}</tbody>
</table></div>
<p class="micro">*Cycle total is arithmetic dose × structured administration count only; it is not a prescribing recommendation. Continuous infusions are counted as one administration.</p>`;
}
function bindLibrary() {
$('#library-search').addEventListener('input', renderLibrary);
renderLibrary();
}
function renderLibrary() {
const q = $('#library-search').value.trim().toLowerCase();
const filtered = legacyRegimens.filter((r) => {
const name = String(r['ชื่อสูตรยา'] ?? '');
const cancer = String(r['ชนิดของมะเร็ง'] ?? '');
const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
const drugText = drugs.map((d) => String(d?.['ชื่อยา'] ?? '')).join(' ');
return `${name} ${cancer} ${drugText}`.toLowerCase().includes(q);
});
$('#library-summary').innerHTML = `<strong>${legacyRegimens.length}</strong> legacy regimen records preserved from V1 · <strong>${publishedRegimens.length}</strong> structured approved pilots active in Calculator · remaining legacy records require structured clinical migration before activation.`;
$('#library-list').innerHTML = filtered.map((r) => {
const name = String(r['ชื่อสูตรยา'] ?? 'Unnamed regimen');
const cancer = String(r['ชนิดของมะเร็ง'] ?? '');
const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
return `<article class="registry-card">
<div class="registry-top"><div><span class="badge badge-warning">LEGACY REVIEW</span></div><span class="micro">${drugs.length} drug item(s)</span></div>
<h3>${escapeHtml(name)}</h3>
<p>${escapeHtml(cancer)}</p>
<details><summary>Original V1 drug/dose data</summary>
<div class="legacy-drug-list">${drugs.map((d) => `<div><strong>${escapeHtml(String(d?.['ชื่อยา'] ?? 'Unknown drug'))}</strong><span>${escapeHtml(String(d?.['ขนาดยา'] ?? ''))}</span></div>`).join('')}</div>
</details>
<p class="micro">Preserved for migration/reference. This record is not fed directly into the production calculation engine.</p>
</article>`;
}).join('') || '<p class="muted">No matching legacy regimens.</p>';
}
function bindRegistry() {
$('#registry-search').addEventListener('input', renderRegistry);
}
function renderRegistry() {
const q = $('#registry-search').value.trim().toLowerCase();
const drafts = loadDrafts();
const all = [...publishedRegimens, ...drafts];
const filtered = all.filter((r) => `${r.name} ${r.indication} ${r.cancerGroup}`.toLowerCase().includes(q));
$('#registry-list').innerHTML = filtered.map((r) => {
const issues = validateRegimen(r);
const errors = issues.filter((i) => i.severity === 'error').length;
const warnings = issues.filter((i) => i.severity === 'warning').length;
const source = r.references[0];
const draft = r.status === 'draft';
return `<article class="registry-card">
<div class="registry-top"><div><span class="badge ${draft ? 'badge-neutral' : 'badge-ok'}">${escapeHtml(r.status.toUpperCase())}</span> <span class="badge ${r.localApproval ? 'badge-ok' : 'badge-warning'}">${r.localApproval ? 'LOCAL APPROVED' : 'LOCAL APPROVAL PENDING'}</span></div><span class="micro">${escapeHtml(r.id)} · v${escapeHtml(r.version)}</span></div>
<h3>${escapeHtml(r.name)}</h3>
<p>${escapeHtml(r.indication)}</p>
<div class="meta-grid"><span>${escapeHtml(r.cancerGroup)}</span><span>${r.cycleIntervalDays} days/cycle</span><span>${r.cycleCount ?? 'variable'} cycles</span><span>${escapeHtml(r.population)}</span></div>
<div class="micro">Validation: ${errors} error(s), ${warnings} warning(s)</div>
${source ? `<a href="${escapeAttr(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>` : ''}
${r.clinicalNotes?.length ? `<details><summary>Clinical notes</summary><ul>${r.clinicalNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join('')}</ul></details>` : ''}
<div class="button-row"><button class="secondary" data-clone="${escapeAttr(r.id)}">Clone to Builder</button>${draft ? `<button class="danger-button" data-delete-draft="${escapeAttr(r.id)}">Delete draft</button>` : ''}</div>
</article>`;
}).join('') || '<p class="muted">No matching regimens.</p>';
document.querySelectorAll('[data-clone]').forEach((button) => button.addEventListener('click', () => cloneToBuilder(button.dataset.clone ?? '')));
document.querySelectorAll('[data-delete-draft]').forEach((button) => button.addEventListener('click', () => {
if (button.dataset.deleteDraft)
deleteDraft(button.dataset.deleteDraft);
renderRegistry();
}));
}
function bindBuilder() {
$('#builder-add-order').addEventListener('click', () => {
builderOrders.push(blankBuilderOrder());
renderBuilderOrders();
});
$('#builder-reset').addEventListener('click', resetBuilder);
$('#builder-form').addEventListener('submit', (event) => {
event.preventDefault();
saveBuilderDraft();
});
$('#builder-export').addEventListener('click', exportBuilderJson);
}
function blankBuilderOrder() {
return {
id: newId(), drugName: '', basis: 'bsa', value: '', unit: 'mg', route: 'IV', days: '1', roundingProfileId: 'BHH_NEAREST_10MG_DEFAULT',
};
}
function resetBuilder() {
$('#builder-id').value = `BHH-DRAFT-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${Math.floor(Math.random() * 900 + 100)}`;
$('#builder-name').value = '';
$('#builder-cancer').value = '';
$('#builder-indication').value = '';
$('#builder-setting').value = '';
$('#builder-intent').value = '';
$('#builder-cycle-days').value = '21';
$('#builder-cycles').value = '6';
$('#builder-source').value = '';
builderOrders = [blankBuilderOrder()];
renderBuilderOrders();
$('#builder-validation').innerHTML = '';
}
function cloneToBuilder(id) {
const source = [...publishedRegimens, ...loadDrafts()].find((r) => r.id === id);
if (!source)
return;
$('#builder-id').value = `${source.id}-DRAFT-${Date.now().toString().slice(-6)}`;
$('#builder-name').value = `${source.name} — clone`;
$('#builder-cancer').value = source.cancerGroup;
$('#builder-indication').value = source.indication;
$('#builder-setting').value = source.setting;
$('#builder-intent').value = source.intent;
$('#builder-cycle-days').value = String(source.cycleIntervalDays);
$('#builder-cycles').value = String(source.cycleCount ?? 1);
$('#builder-source').value = source.references[0]?.url ?? '';
const firstPhase = source.phases[0];
builderOrders = (firstPhase?.orders ?? []).map((o) => ({
id: newId(),
drugName: o.drugName,
basis: o.dose.basis,
value: String(o.dose.value ?? o.dose.defaultOption ?? ''),
unit: o.dose.unit,
route: o.route,
days: o.schedule.days.join(','),
roundingProfileId: o.roundingProfileId ?? '',
}));
if (!builderOrders.length)
builderOrders = [blankBuilderOrder()];
renderBuilderOrders();
showTab('builder');
$('#builder-validation').innerHTML = '<div class="alert alert-warning">Clone created as DRAFT. Complex multi-phase details are intentionally not auto-flattened; verify against the source protocol before approval.</div>';
}
function renderBuilderOrders() {
$('#builder-orders').innerHTML = builderOrders.map((order, index) => `
<div class="builder-order" data-builder-index="${index}">
<div class="field"><span>Drug</span><input data-bo="drugName" value="${escapeAttr(order.drugName)}" placeholder="Generic name"></div>
<div class="field"><span>Dose basis</span><select data-bo="basis">${optionList(['fixed', 'bsa', 'weight', 'auc'], order.basis)}</select></div>
<div class="field"><span>Dose / AUC</span><input data-bo="value" type="number" step="any" min="0" value="${escapeAttr(order.value)}"></div>
<div class="field"><span>Unit</span><select data-bo="unit">${optionList(['mcg', 'mg', 'g', 'IU'], order.unit)}</select></div>
<div class="field"><span>Route</span><select data-bo="route">${optionList(['IV', 'PO', 'SC', 'IM', 'IM/IV'], order.route)}</select></div>
<div class="field"><span>Days</span><input data-bo="days" value="${escapeAttr(order.days)}" placeholder="1 or 1,8,15"></div>
<div class="field"><span>Rounding</span><select data-bo="roundingProfileId"><option value="">None</option>${profileList.map((p) => `<option value="${escapeAttr(p.id)}" ${p.id === order.roundingProfileId ? 'selected' : ''}>${escapeHtml(p.label)}</option>`).join('')}</select></div>
<button type="button" class="danger-button compact" data-remove-order="${index}">Remove</button>
</div>`).join('');
document.querySelectorAll('.builder-order').forEach((row) => {
const index = Number(row.dataset.builderIndex);
row.querySelectorAll('[data-bo]').forEach((input) => input.addEventListener('input', () => {
const key = input.dataset.bo;
const item = builderOrders[index];
if (!key || !item)
return;
item[key] = input.value;
}));
});
document.querySelectorAll('[data-remove-order]').forEach((button) => button.addEventListener('click', () => {
builderOrders.splice(Number(button.dataset.removeOrder), 1);
if (!builderOrders.length)
builderOrders.push(blankBuilderOrder());
renderBuilderOrders();
}));
}
function buildDraftFromForm() {
const now = new Date().toISOString().slice(0, 10);
const cycles = numberValue('#builder-cycles');
const sourceUrl = $('#builder-source').value.trim();
const orders = builderOrders.map((o, i) => {
const days = o.days.split(',').map((d) => Number(d.trim())).filter((d) => Number.isInteger(d) && d > 0);
const order = {
id: o.id || `order-${i + 1}`,
drugId: slugify(o.drugName || `drug-${i + 1}`),
drugName: o.drugName.trim(),
dose: { basis: o.basis, value: Number(o.value), unit: o.unit },
route: o.route,
schedule: { days },
};
if (o.roundingProfileId)
order.roundingProfileId = o.roundingProfileId;
return order;
});
return {
id: $('#builder-id').value.trim(),
version: '0.1.0-draft',
name: $('#builder-name').value.trim(),
cancerGroup: $('#builder-cancer').value.trim(),
indication: $('#builder-indication').value.trim(),
setting: $('#builder-setting').value.trim(),
intent: $('#builder-intent').value.trim(),
population: 'adult',
cycleIntervalDays: numberValue('#builder-cycle-days'),
cycleCount: cycles,
status: 'draft',
localApproval: false,
effectiveDate: now,
lastReviewed: now,
references: sourceUrl ? [{ label: 'Draft source', url: sourceUrl, accessedDate: now }] : [],
phases: [{ id: `${slugify($('#builder-id').value)}-phase1`, name: `Cycles 1–${cycles}`, cycleStart: 1, cycleEnd: cycles, orders }],
clinicalNotes: ['Created in V2 Regimen Builder. Draft only; requires independent oncology pharmacist review and approval before publication.'],
};
}
function saveBuilderDraft() {
const draft = buildDraftFromForm();
const issues = validateRegimen(draft);
renderValidationIssues(issues, '#builder-validation');
if (issues.some((i) => i.severity === 'error'))
return;
saveDraft(draft);
$('#builder-validation').insertAdjacentHTML('afterbegin', '<div class="alert alert-success">Draft saved locally. It is NOT published and cannot be used by the calculator.</div>');
}
function exportBuilderJson() {
const draft = buildDraftFromForm();
renderValidationIssues(validateRegimen(draft), '#builder-validation');
downloadJson(`${slugify(draft.id || 'regimen-draft')}.json`, draft);
}
function renderValidationIssues(issues, target) {
$(target).innerHTML = issues.length
? issues.map((i) => `<div class="alert ${i.severity === 'error' ? 'alert-error' : i.severity === 'warning' ? 'alert-warning' : 'alert-info'}"><strong>${escapeHtml(i.severity.toUpperCase())}</strong> · ${escapeHtml(i.path)} — ${escapeHtml(i.message)}</div>`).join('')
: '<div class="alert alert-success">No schema validation issues detected. Clinical review is still required.</div>';
}
function bindRoundingPolicy() {
$('#rounding-save').addEventListener('click', saveRoundingPolicyFromUi);
$('#rounding-reset').addEventListener('click', resetRoundingPolicy);
$('#rounding-export').addEventListener('click', () => downloadJson('BHH-rounding-policy.json', profileList));
$('#rounding-import').addEventListener('change', importRoundingPolicy);
renderRoundingPolicy();
}
function isCompatibleRoundingOverride(candidate, defaults) {
if (!Array.isArray(candidate) || candidate.length !== defaults.length)
return false;
const defaultIds = new Set(defaults.map((p) => p.id));
return candidate.every((p) => defaultIds.has(p.id)
&& (p.method === 'nearest_half_up' || p.method === 'none')
&& Number.isFinite(p.increment) && p.increment > 0
&& Number.isFinite(p.maxPercentDifference) && p.maxPercentDifference >= 0
&& p.maxPercentDifference <= 100
&& (p.maxAbsoluteDifference === undefined || (Number.isFinite(p.maxAbsoluteDifference) && p.maxAbsoluteDifference >= 0)));
}
function renderRoundingPolicy() {
const status = roundingOverrideActive
? '<span class="badge badge-warning">BROWSER OVERRIDE ACTIVE</span>'
: '<span class="badge badge-ok">PUBLISHED DEFAULT</span>';
$('#rounding-status').innerHTML = `${status}<span class="micro">Changes here affect calculations on this browser only until exported and centrally published.</span>`;
$('#rounding-policy-list').innerHTML = profileList.map((p, index) => {
const locked = p.method === 'none';
return `<article class="rounding-card" data-rounding-index="${index}">
<div class="registry-top"><div><strong>${escapeHtml(p.label)}</strong></div><span class="micro">${escapeHtml(p.id)}</span></div>
<div class="form-grid compact-grid">
<label class="field field-wide"><span>Label</span><input data-rp="label" value="${escapeAttr(p.label)}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Increment (${escapeHtml(p.unit)})</span><input data-rp="increment" type="number" min="0.000001" step="any" value="${p.increment}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Max difference (%)</span><input data-rp="maxPercentDifference" type="number" min="0" max="100" step="0.01" value="${p.maxPercentDifference}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Max absolute difference (${escapeHtml(p.unit)})</span><input data-rp="maxAbsoluteDifference" type="number" min="0" step="any" value="${p.maxAbsoluteDifference ?? ''}" ${locked ? 'disabled' : ''}></label>
<label class="field"><span>Method</span><input value="${escapeAttr(p.method)}" disabled></label>
</div>
<p class="micro">${escapeHtml(p.notes ?? '')}</p>
</article>`;
}).join('');
document.querySelectorAll('[data-rounding-index]').forEach((card) => {
const index = Number(card.dataset.roundingIndex);
card.querySelectorAll('[data-rp]').forEach((input) => input.addEventListener('input', () => {
const p = profileList[index];
if (!p || p.method === 'none')
return;
const key = input.dataset.rp;
if (key === 'label')
p.label = input.value;
if (key === 'increment')
p.increment = Number(input.value);
if (key === 'maxPercentDifference')
p.maxPercentDifference = Number(input.value);
if (key === 'maxAbsoluteDifference') {
const v = input.value.trim();
if (v === '')
delete p.maxAbsoluteDifference;
else
p.maxAbsoluteDifference = Number(v);
}
}));
});
}
function validateRoundingPolicy(candidate) {
const errors = [];
for (const p of candidate) {
if (!p.label.trim())
errors.push(`${p.id}: label is required.`);
if (!(Number.isFinite(p.increment) && p.increment > 0))
errors.push(`${p.id}: increment must be > 0.`);
if (!(Number.isFinite(p.maxPercentDifference) && p.maxPercentDifference >= 0 && p.maxPercentDifference <= 100))
errors.push(`${p.id}: max % difference must be between 0 and 100.`);
if (p.maxAbsoluteDifference !== undefined && !(Number.isFinite(p.maxAbsoluteDifference) && p.maxAbsoluteDifference >= 0))
errors.push(`${p.id}: max absolute difference must be >= 0.`);
}
return errors;
}
function saveRoundingPolicyFromUi() {
const errors = validateRoundingPolicy(profileList);
if (errors.length) {
$('#rounding-message').innerHTML = errors.map((e) => `<div class="alert alert-error">${escapeHtml(e)}</div>`).join('');
return;
}
saveRoundingOverrides(profileList);
roundingOverrideActive = true;
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
$('#rounding-message').innerHTML = '<div class="alert alert-success">Rounding policy saved as a browser-local override and is active for calculations on this device.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
function resetRoundingPolicy() {
clearRoundingOverrides();
profileList = cloneData(defaultProfileList);
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
roundingOverrideActive = false;
$('#rounding-message').innerHTML = '<div class="alert alert-success">Reset to published rounding defaults.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
async function importRoundingPolicy(event) {
const input = event.currentTarget;
const file = input.files?.[0];
if (!file)
return;
try {
const candidate = JSON.parse(await file.text());
if (!isCompatibleRoundingOverride(candidate, defaultProfileList))
throw new Error('Imported policy is incompatible with the published profile IDs or contains invalid values.');
const errors = validateRoundingPolicy(candidate);
if (errors.length)
throw new Error(errors.join(' '));
profileList = candidate;
profiles = Object.fromEntries(profileList.map((p) => [p.id, p]));
saveRoundingOverrides(profileList);
roundingOverrideActive = true;
$('#rounding-message').innerHTML = '<div class="alert alert-success">Imported rounding policy is now active as a browser-local override.</div>';
renderRoundingPolicy();
renderBuilderOrders();
}
catch (error) {
$('#rounding-message').innerHTML = `<div class="alert alert-error">${escapeHtml(errorMessage(error))}</div>`;
}
finally {
input.value = '';
}
}
function bindLegacyValidator() {
$('#legacy-file').addEventListener('change', async (event) => {
const file = event.currentTarget.files?.[0];
if (!file)
return;
try {
const json = JSON.parse(await file.text());
legacyFindings = auditLegacyRegimens(json);
renderLegacyFindings();
}
catch (error) {
$('#legacy-results').innerHTML = `<div class="alert alert-error">${escapeHtml(errorMessage(error))}</div>`;
}
});
$('#legacy-export').addEventListener('click', exportLegacyCsv);
}
function renderLegacyFindings() {
const blocked = legacyFindings.filter((f) => f.status === 'blocked').length;
const draftable = legacyFindings.length - blocked;
$('#legacy-results').innerHTML = `
<section class="result-header"><div><span class="kpi-label">Drug entries</span><strong>${legacyFindings.length}</strong></div><div><span class="kpi-label">Blocked</span><strong class="danger">${blocked}</strong></div><div><span class="kpi-label">Draft-migratable*</span><strong>${draftable}</strong></div></section>
<p class="micro">*Draft-migratable means only that a simple expression was recognized; it still requires structured conversion and pharmacist review before publication.</p>
<div class="table-wrap"><table><thead><tr><th>Status</th><th>Regimen</th><th>Drug</th><th>Legacy dose</th><th>Reason</th></tr></thead><tbody>
${legacyFindings.slice(0, 500).map((f) => `<tr><td><span class="badge ${f.status === 'blocked' ? 'badge-danger' : 'badge-neutral'}">${f.status === 'blocked' ? 'BLOCK' : 'DRAFT'}</span></td><td>${escapeHtml(f.regimenName)}<div class="micro">${escapeHtml(f.indication)}</div></td><td>${escapeHtml(f.drugName)}</td><td>${escapeHtml(f.doseText)}</td><td>${escapeHtml(f.reason)}</td></tr>`).join('')}
</tbody></table></div>`;
}
function exportLegacyCsv() {
if (!legacyFindings.length)
return;
const headers = ['status', 'regimen', 'indication', 'drug', 'legacy_dose', 'reason'];
const rows = legacyFindings.map((f) => [f.status, f.regimenName, f.indication, f.drugName, f.doseText, f.reason]);
const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
downloadBlob('legacy-regimen-migration-report.csv', csv, 'text/csv;charset=utf-8');
}
function exportLastCalculation() {
if (!lastCalculation) {
alert('Run a calculation first.');
return;
}
downloadJson(`bhh-chemo-calculation-${new Date().toISOString().slice(0, 10)}.json`, lastCalculation);
}
function downloadJson(filename, value) {
downloadBlob(filename, JSON.stringify(value, null, 2), 'application/json');
}
function downloadBlob(filename, content, type) {
const blob = new Blob([content], { type });
const url = URL.createObjectURL(blob);
const anchor = document.createElement('a');
anchor.href = url;
anchor.download = filename;
anchor.click();
setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function csvCell(value) {
return `"${value.replaceAll('"', '""')}"`;
}
function optionList(values, selected) {
return values.map((v) => `<option value="${escapeAttr(v)}" ${v === selected ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
}
function numberValue(selector) {
const value = Number($(selector).value);
if (!Number.isFinite(value))
throw new Error(`Invalid numeric input: ${selector}`);
return value;
}
function signed(value) {
const rounded = Number(value.toFixed(2));
return `${rounded > 0 ? '+' : ''}${formatNumber(rounded)}`;
}
function slugify(value) {
return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}
function errorMessage(error) {
return error instanceof Error ? error.message : String(error);
}
function escapeHtml(value) {
return value.replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' })[ch] ?? ch);
}
function escapeAttr(value) { return escapeHtml(value); }
init;