import fs from 'node:fs';
import { applyRounding, calculateRegimen, roundHalfUp } from '../dist/engine.js';
import { validateRegimen } from '../dist/validators.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function close(actual, expected, eps = 1e-9, label = '') {
  assert(Number.isFinite(actual) && Math.abs(actual - expected) <= eps, `${label}: expected ${expected}, got ${actual}`);
}

const regimens = JSON.parse(fs.readFileSync(new URL('../data/regimens.published.json', import.meta.url), 'utf8'));
const rounding = JSON.parse(fs.readFileSync(new URL('../data/rounding-profiles.json', import.meta.url), 'utf8'));
const legacyRoot = JSON.parse(fs.readFileSync(new URL('../data/legacy-regimens.v1.json', import.meta.url), 'utf8'));
const legacyRegimens = legacyRoot['สูตรยาเคมีบำบัด'] ?? [];
const profiles = Object.fromEntries(rounding.map(p => [p.id, p]));

assert(regimens.length === 6, 'Expected exactly 6 approved pilot regimens in v2.3.0');
assert(legacyRegimens.length === 136, `Expected 136 preserved V1 regimens, got ${legacyRegimens.length}`);
assert(regimens.every(r => r.localApproval === true), 'All six pilot regimens must have localApproval=true');
let schemaErrors = 0;
for (const regimen of regimens) schemaErrors += validateRegimen(regimen).filter(x => x.severity === 'error').length;
assert(schemaErrors === 0, `Regimen registry has ${schemaErrors} schema errors`);

close(roundHalfUp(688, 10), 690, 1e-9, '688 -> 690');
close(roundHalfUp(682, 10), 680, 1e-9, '682 -> 680');
close(roundHalfUp(685, 10), 690, 1e-9, '685 -> 690 half-up');
const r10 = profiles.BHH_NEAREST_10MG_DEFAULT;
assert(r10, 'Missing nearest-10-mg profile');
close(applyRounding(688, 'mg', r10).recommended, 690, 1e-9, 'profile 688 -> 690');
assert(applyRounding(44, 'mg', r10).recommended === undefined, 'Safety threshold must block 44 -> 40 candidate');

const ovarian = regimens.find(r => r.id === 'BHH-OVARIAN-CARBO-TAXOL-EVIQ252');
assert(ovarian, 'Missing ovarian carboplatin/paclitaxel fixture');
const auc6 = calculateRegimen({
  patient: { ageYears: 55, sex: 'female', heightCm: 165, weightKg: 60, kidneyMethod: 'measured_gfr', kidneyValue: 130 },
  regimen: ovarian,
  cycle: 1,
  selections: { 'ov-carboplatin': 6 },
  roundingProfiles: profiles,
});
const carboplatin = auc6.results.find(x => x.orderId === 'ov-carboplatin');
close(carboplatin?.rawCalculatedDose, 930, 1e-9, 'Calvert AUC6 with GFR130 must not silently cap at 125');

const rchop = regimens.find(r => r.id === 'BHH-HEME-RCHOP21-EVIQ70');
assert(rchop, 'Missing R-CHOP fixture');
const rchopCalc = calculateRegimen({
  patient: { ageYears: 60, sex: 'male', heightCm: 180, weightKg: 80 },
  regimen: rchop,
  cycle: 1,
  selections: {},
  roundingProfiles: profiles,
});
const vcr = rchopCalc.results.find(x => x.orderId === 'rchop-vincristine');
close(vcr?.clinicalDose, 2, 1e-9, 'Vincristine hard maximum must apply before rounding');

const abvd = regimens.find(r => r.id === 'BHH-HODGKIN-ABVD-ADV-EVIQ56');
assert(abvd, 'Missing ABVD fixture');
const abvdCalc = calculateRegimen({
  patient: { ageYears: 40, sex: 'male', heightCm: 170, weightKg: 62.6 },
  regimen: abvd,
  cycle: 1,
  selections: {},
  roundingProfiles: profiles,
});
const bleo = abvdCalc.results.find(x => x.orderId === 'abvd-bleomycin');
assert(bleo?.rawUnit === 'IU', 'Bleomycin must remain IU');

console.log(`PRODUCTION_SMOKE_PASS active=${regimens.length} master=${legacyRegimens.length} schemaErrors=${schemaErrors}`);
