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
assert(index.includes('app.bundle.js?v=2.5.0'), 'Index is not using v2.5.0 runtime');
assert(index.includes('publish-manager.js?v=2.6.3'), 'Review/Publish UI script must load');
assert(index.includes('publish-manager.css?v=2.6.3'), 'Review/Publish styling missing');
assert(index.includes('https://api.github.com'), 'GitHub publication API not permitted by CSP');
assert(bundle.includes('data-review-regimen'), 'Regimen cards must offer Review/Publish');
assert(bundle.includes('approval?.corrected_drugs'), 'Reviewed clinical corrections must render in calculator library');
const publisher = fs.readFileSync(new URL('../publish-manager.js', import.meta.url), 'utf8');
assert(publisher.includes('sha:latest.sha'), 'GitHub publication writes require optimistic concurrency SHA');
assert(publisher.includes('calculator_enabled:false'), 'Reference publication must not enable unvalidated dose calculations');
assert(publisher.includes('reviewQueue.set(id, {item: reviewItem, fields})'), 'Review queue must require a completed per-regimen review');
assert(publisher.includes('id="review-publish-form" novalidate'), 'Invalid forms must reach JavaScript for a visible error');
assert(publisher.includes("f.querySelector(':invalid')"), 'Publish must identify incomplete review fields');
assert(publisher.includes('showReviewIssue(e)'), 'Publish must display the reason for failure');
assert(publisher.includes("$('review-publish-source').value=key"), 'Pasted official guideline URLs must select their source automatically');
assert(publisher.includes("'eviQ': ['eviq.org.au']"), 'eviQ guideline links must be supported');
assert(publisher.includes('SUGGESTED_PROTOCOLS'), 'Official protocol comparison suggestions must be available');
assert(publisher.includes('BHH-CATALOG-039'), 'R-CVP review should surface eviQ 168 for comparison');
assert(publisher.indexOf("'<label>ลิงก์ Guideline") < publisher.indexOf("'<label>ข้อบ่งใช้"), 'Mobile review must show the Guideline link before lengthy dosing');
assert(publisher.includes('ห้ามอนุมัติจากการใส่ลิงก์อย่างเดียว'), 'Protocol-mismatch warning must remain visible');
assert(publisher.includes('sha:latest.sha,branch:'), 'Multi-regimen publication must use an atomic GitHub commit with optimistic concurrency');
assert(publisher.includes('original.reviewed_at||null'), 'Bulk publication must reject concurrent review updates');
assert(publisher.includes('if(!result?.commit?.sha)'), 'Batch publisher must require confirmed GitHub commit');
assert(!publisher.includes('localStorage.setItem(') && !publisher.includes('sessionStorage.setItem('), 'GitHub token must not be stored in browser storage');
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
