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
assert(index.includes('app.bundle.js?v=2.3.0'), 'Index is not using v2.3.0 runtime');
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
