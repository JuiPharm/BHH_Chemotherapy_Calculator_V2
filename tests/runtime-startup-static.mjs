import fs from 'node:fs';

const bundle = fs.readFileSync(new URL('../app.bundle.js', import.meta.url), 'utf8');
const index = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(bundle.includes('init();'), 'Runtime does not invoke init()');
assert(!/\\binit;\\s*$/.test(bundle), 'Runtime ends with init; instead of init()');
assert(bundle.includes("loadJson('./data/regimens.published.json?v=2.3.0')"), 'Runtime must load central published regimen data');
assert(bundle.includes("loadJson('./data/legacy-regimens.v1.json?v=2.3.0')"), 'Runtime must load the central 136-regimen master');
assert(bundle.includes("loadJson('./data/rounding-profiles.json?v=2.3.0')"), 'Runtime must load central rounding defaults');
assert(index.includes('app.bundle.js?v=2.7.2'), 'Index is not using v2.7.2 runtime');
// Pediatric Dosing Calculator is being moved to a separate project.
assert(!index.includes('data-tab="pediatric"'), 'Pediatric tab must not appear in adult Production');
assert(!index.includes('id="tab-pediatric"'), 'Pediatric form must not ship on adult Production');
assert(!index.includes('pediatric-calc-ui.mjs'), 'Adult Production must not load pediatric calculator module');
assert(!index.includes('pediatric-calc.css'), 'Adult Production must not load pediatric calculator styling');
assert(index.includes('data-tab="calculator"'), 'Adult calculator tab must remain available');
assert(index.includes('id="tab-calculator"'), 'Adult calculator content must remain available');
assert(index.includes('publish-manager.js?v=2.6.4'), 'Review/Publish UI script must load');
assert(index.includes('publish-manager.css?v=2.6.3'), 'Review/Publish styling missing');
assert(index.includes('https://api.github.com'), 'GitHub publication API not permitted by CSP');
assert(bundle.includes('data-review-regimen'), 'Regimen cards must offer Review/Publish');
assert(bundle.includes('approval?.corrected_drugs'), 'Reviewed clinical corrections must render in calculator library');
const publisher = fs.readFileSync(new URL('../publish-manager.js', import.meta.url), 'utf8');
assert(publisher.includes('review-publish-token'), 'Publish requires PIN token authentication');
assert(publisher.includes('calculator_enabled'), 'Publication manages calculation readiness');
assert(publisher.includes('reviewQueue.set(id, {item: reviewItem, fields})'), 'Review queue must require a completed per-regimen review');
assert(publisher.includes('id="review-publish-form" novalidate'), 'Invalid forms must reach JavaScript for a visible error');
assert(publisher.includes("f.querySelector(':invalid')"), 'Publish must identify incomplete review fields');
assert(publisher.includes('showReviewIssue(e)'), 'Publish must display the reason for failure');
assert(publisher.includes("$('review-publish-source').value=key"), 'Pasted official guideline URLs must select their source automatically');
assert(publisher.includes("'eviQ': ['eviq.org.au']"), 'eviQ guideline links must be supported');
assert(publisher.includes("'NHSO Pediatric 2566': ['nhso.go.th']"), 'NHSO Pediatric guideline must be selectable');

const pediatric=JSON.parse(fs.readFileSync(new URL('../data/pediatric-regimens.thaipog-2566.json',import.meta.url),'utf8'));
assert(pediatric.regimens.length===62 && pediatric.record_count===62,'Archive must retain all 62 ThaiPOG protocol records');
assert(pediatric.database_status==='ARCHIVED_OUT_OF_PRODUCTION_UI','All reference-only pediatric records must be archived');
assert(pediatric.regimens.every(x=>x.population==='pediatric' && x.status==='archived_not_calculator_ready' && x.approved===false && x.published===false && x.production_visible===false),'Pediatric unvalidated regimens must not be published');
assert(pediatric.regimens.every(x=>x.calculator_enabled===false && x.clinical_dose_calculator_approval===false),'Pediatric calculators must remain disabled');
assert(pediatric.regimens.every(x=>x.source_evidence_pages?.length>0),'Retain document extracts for safe future implementation');
assert(pediatric.source_evidence_pages===303,'Retain 303 source PDF pages indexed across pediatric protocols');
assert(new Set(pediatric.regimens.map(x=>x.catalog_id)).size===62,'No duplicate pediatric catalog IDs');
assert(!bundle.includes("loadJson('./data/pediatric-regimens.thaipog-2566.json"),'Production frontend must not load pediatric archive into the working catalog');
assert(bundle.includes('BHH_PEDIATRIC=[]; // Reference-only pediatric catalog not displayed'),'Pediatric archive must remain hidden');
assert(!bundle.includes("catalog.push({\n      key:'pediatric:'"),'Do not render reference-only pediatric regimens as active library items');
assert(bundle.includes("['BHH-CATALOG-046','BHH-CATALOG-048']"),'Unsafe legacy Burkitt automated calculation must stay blocked');
const legacyApproval=JSON.parse(fs.readFileSync(new URL('../data/guideline-status.v2.4.json',import.meta.url),'utf8'));
for(const id of ['BHH-CATALOG-046','BHH-CATALOG-048']){
 const row=legacyApproval.find(x=>x.catalog_id===id);
 assert(row && row.status==='blocked' && row.calculator_enabled===false, 'Unsafe legacy pediatric Burkitt protocol must be blocked: '+id);
}

const nhso=JSON.parse(fs.readFileSync(new URL('../data/nhso-pediatric-oncology-2566-source.json', import.meta.url), 'utf8'));
assert(nhso.ingestion_status==='PRIMARY_PDF_PROVIDED_PROTOCOL_INDEX_EXTRACTED', 'PDF source provenance must be updated after receiving document');
assert(nhso.default_published===false && nhso.default_calculator_enabled===false,'Archive not advertised as clinician-approved production calculator');
assert(nhso.source_pdf_pages===412, 'Original guideline pagination must be traceable');
assert(nhso.default_calculator_enabled===false, 'NHSO source registration must not enable pediatric calculations');
assert(publisher.includes('SUGGESTED_PROTOCOLS'), 'Official protocol comparison suggestions must be available');
assert(publisher.includes('BHH-CATALOG-039'), 'R-CVP review should surface eviQ 168 for comparison');
assert(publisher.indexOf("'<label>ลิงก์ Guideline") < publisher.indexOf("'<label>ข้อบ่งใช้"), 'Mobile review must show the Guideline link before lengthy dosing');
assert(publisher.includes('ห้ามอนุมัติจากการใส่ลิงก์อย่างเดียว'), 'Protocol-mismatch warning must remain visible');
assert(index.includes('calc-rounding-choice'), 'Rounding policy radio options must be present');
assert(index.includes('admin-pin-toggle-btn'), 'Pharmacist PIN toggle must be present');

const pinCss=fs.readFileSync(new URL('../pin-auth.css', import.meta.url),'utf8');
assert(index.includes('pin-auth.css?v=2.9.1'),'Production must load isolated Pharmacist PIN dialog stylesheet');
assert(index.includes('id="pin-auth-dialog"') && index.includes('aria-labelledby="pin-auth-heading"'),'Accessible PIN dialog must exist');
assert(index.includes('class="bhh-pin-header"') && index.includes('class="bhh-pin-body"'),'PIN interface must have branded header and responsive content');
assert(index.includes('id="pin-auth-visibility"') && index.includes('id="pin-auth-input"'),'PIN must have a show/hide input control');
assert(index.includes('id="pin-auth-form"') && index.includes('id="pin-auth-error"'),'Existing PIN authentication selectors must remain intact');
assert(!index.includes('id="pin-auth-form" style='),'PIN dialog layout must not rely on inline form styles');
assert(pinCss.includes('width: min(520px, calc(100vw - 32px))'),'PIN modal must fit desktop and mobile viewport');
assert(pinCss.includes('@media (max-width: 520px)'),'PIN dialog must have narrow viewport styles');
assert(bundle.includes("const revealBtn = $('#pin-auth-visibility')"),'PIN show/hide must be connected to login runtime');
assert(bundle.includes("submitButton.textContent = 'กำลังตรวจสอบ…'"),'Login must display progress while verifying PIN');
assert(bundle.includes("fetch('/api/verify-pin'"),'Existing PIN verification logic must be preserved');

assert(bundle.includes("loadJson('./data/guideline-status.v2.4.json?v=2.4.0')"), 'Runtime must load guideline approval and review statuses');
const guideline=JSON.parse(fs.readFileSync(new URL('../data/guideline-status.v2.4.json',import.meta.url),'utf8'));
assert(guideline.length>=33,'Baseline 33 guideline-status records must be preserved');
assert(guideline.filter(x=>x.approved&&x.published).length>=3,'Original three exact BC Cancer approvals must be preserved');
assert(new Set(guideline.map(x=>x.catalog_id)).size===guideline.length,'Duplicate reviewed catalog IDs are not permitted');
assert(guideline.every(x=>!x.calculator_enabled),'Source review status must not bypass structured-calculator approval');
assert(guideline.every(x=>x.status!=='approved_published'||(x.approved===true&&x.published===true)),'Published approval flags must agree');
assert(!index.includes('Safety principles'), 'Safety principles panel must not be rendered');
assert(!index.includes('Structured regimen engine · fail-closed calculation · zero-code regimen drafts'), 'Technical subtitle must not be rendered');
assert(!/id="age-input"[^>]*value=/.test(index), 'Age must not have a default value');
assert(!/id="height-input"[^>]*value=/.test(index), 'Height must not have a default value');
assert(!/id="weight-input"[^>]*value=/.test(index), 'Weight must not have a default value');
assert(index.includes('<option value="cockcroft_gault_legacy" selected>Cockcroft-Gault CrCl</option>'), 'Cockcroft-Gault must be the initial kidney method');

const requiredIds = ['cancer-type-select','regimen-select','cycle-input','age-input','sex-input','height-input','weight-input','kidney-method','scr-input'];
for (const id of requiredIds) {
  const tag = index.match(new RegExp('<(?:input|select)[^>]*id="' + id + '"[^>]*>'))?.[0] || '';
  assert(tag.includes('required'), id + ' must be required');
}

assert(index.includes('Regimen Library'), 'Regimen Library must be present');
assert(index.includes('Regimen Manager'), 'Regimen Manager must be present');
assert(index.includes('data:image/png;base64,'), 'Library-derived Bangkok Hospital Hatyai logo is not embedded');
assert(!index.includes('Preserved for migration/reference. This record is not fed directly into the production calculation engine.'), 'Migration sentence must not appear');

console.log('FRONTEND_CONTRACT_PASS');
