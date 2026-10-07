import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  calculate,
  halfUp,
  mosteller,
  validateDefinition,
  allowedPolicies,
} from '../shared/clinical.js';
const pilots = JSON.parse(fs.readFileSync('data/regimens.published.json'));
for (const r of pilots)
  for (const p of r.phases)
    for (const o of p.orders) {
      o.roundingProfileId ||= 'NO_ROUND';
      o.allowedRoundingPolicies =
        o.dose.unit === 'mg'
          ? [...new Set(['NO_ROUND', o.roundingProfileId])]
          : ['NO_ROUND'];
    }
const patient = {
  ageYears: 50,
  sex: 'male',
  heightCm: 180,
  weightKg: 90,
  kidneyMethod: 'measured_gfr',
  kidneyValue: 90,
};
const proto = () => structuredClone(pilots[0]);
for (const [a, b] of [
  [688, 690],
  [682, 680],
  [685, 690],
])
  test(`half-up ${a} -> ${b}`, () => assert.equal(halfUp(a, 10), b));
test('All six approved pilot definitions validate', () =>
  pilots.forEach(validateDefinition));
test('Calvert AUC6 + GFR90 = 690 mg', () => {
  const c = calculate(proto(), patient, 1);
  assert.equal(c.rows.find((x) => x.drug === 'Carboplatin').recommended, 690);
});
test('No universal 125 mL/min cap', () => {
  const c = calculate(proto(), { ...patient, kidneyValue: 160 }, 1);
  assert.equal(c.rows.find((x) => x.drug === 'Carboplatin').clinical, 1110);
});
test('Vincristine capped at 2 mg before rounding', () => {
  const c = calculate(pilots[2], patient, 1);
  const v = c.rows.find((x) => x.drug === 'Vincristine');
  assert.ok(v.base > 2);
  assert.equal(v.clinical, 2);
  assert.equal(v.recommended, 2);
});
test('Bleomycin remains IU for ABVD and BEP', () => {
  for (const r of [pilots[3], pilots[4]]) {
    const x = calculate(r, patient, 1).rows.find((x) => x.drug === 'Bleomycin');
    assert.equal(x.unit, 'IU');
    assert.equal(x.recommended, x.clinical);
  }
});
test('Mosteller retains full internal precision', () =>
  assert.equal(mosteller(171, 67), Math.sqrt((171 * 67) / 3600)));
test('Adult regimen pediatric guard', () =>
  assert.throws(
    () => calculate(proto(), { ...patient, ageYears: 12 }, 1),
    /pediatric/,
  ));
test('Unknown expression is blocked', () => {
  const r = proto();
  r.phases[0].orders[0].dose.basis = 'eval';
  assert.throws(() => calculate(r, patient, 1), /Unknown dose expression/);
});
test('Unknown rule is blocked', () => {
  const r = proto();
  r.phases[0].orders[0].clinicalRules = [{ type: 'unknown' }];
  assert.throws(() => calculate(r, patient, 1), /Unknown clinical rule/);
});
test('Unit mismatch hard maximum is blocked', () => {
  const r = proto();
  r.phases[0].orders[0].clinicalRules = [
    { type: 'hard_max', value: 2, unit: 'g', reason: 'x' },
  ];
  assert.throws(() => calculate(r, patient, 1), /Invalid hard limit/);
});
test('Rounding never crosses hard cap', () => {
  const r = proto();
  const o = r.phases[0].orders[0];
  o.dose = { basis: 'fixed', value: 685, unit: 'mg' };
  o.clinicalRules = [
    { type: 'hard_max', value: 685, unit: 'mg', reason: 'Local cap' },
  ];
  assert.equal(calculate(r, patient, 1).rows[0].recommended, 685);
});
test('Protocol modification precedes hard max regardless of rule input order', () => {
  const r = proto();
  const o = r.phases[0].orders[0];
  o.dose = { basis: 'fixed', value: 100, unit: 'mg' };
  o.clinicalRules = [
    { type: 'hard_max', value: 110, unit: 'mg', reason: 'max' },
    { type: 'multiply', factor: 2, reason: 'approved adjustment' },
  ];
  const x = calculate(r, patient, 1).rows[0];
  assert.equal(x.base, 100);
  assert.equal(x.clinical, 110);
});
test('g/m² and IU/m² use distinct units', () => {
  const r = proto();
  r.phases[0].orders[0].dose = { basis: 'bsa', unit: 'g', value: 2 };
  r.phases[0].orders[0].allowedRoundingPolicies = ['NO_ROUND'];
  r.phases[0].orders[0].roundingProfileId = 'NO_ROUND';
  const x = calculate(r, patient, 1).rows[0];
  assert.equal(x.unit, 'g');
  assert.equal(x.base, 2 * mosteller(180, 90));
});
test('All 5 policies supported when permitted', () => {
  const r = proto();
  for (const p of r.phases)
    for (const o of p.orders)
      o.allowedRoundingPolicies = [
        'NO_ROUND',
        'BHH_NEAREST_1MG_DEFAULT',
        'BHH_NEAREST_5MG_DEFAULT',
        'BHH_NEAREST_10MG_DEFAULT',
      ];
  assert.equal(allowedPolicies(r, 1).length, 5);
  assert.equal(
    calculate(r, patient, 1, 'BHH_NEAREST_5MG_DEFAULT').rows[1].recommended,
    690,
  );
});
test('Disallowed rounding policy blocked', () =>
  assert.throws(
    () => calculate(pilots[3], patient, 1, 'BHH_NEAREST_10MG_DEFAULT'),
    /not approved/,
  ));
test('Fractional cycle, NaN and infinity blocked', () => {
  assert.throws(() => calculate(proto(), patient, 1.5));
  assert.throws(() =>
    calculate(proto(), { ...patient, heightCm: Infinity }, 1),
  );
  const r = proto();
  r.phases[0].orders[0].dose.value = NaN;
  assert.throws(() => calculate(r, patient, 1));
});
test('Cycle phase loading and maintenance', () => {
  const c1 = calculate(proto(), patient, 1),
    c2 = calculate(proto(), patient, 2),
    c7 = calculate(proto(), patient, 7);
  assert.equal(c1.rows[2].base, 720);
  assert.equal(c2.rows[2].base, 540);
  assert.equal(c7.rows.length, 1);
  assert.throws(() => calculate(proto(), patient, 18));
});
test('Cockcroft-Gault and sex factor explicit; no cap', () => {
  const p = {
    ...patient,
    kidneyMethod: 'cockcroft_gault',
    serumCreatinineMgDl: 1,
  };
  assert.equal(calculate(proto(), p, 1).kidney, 112.5);
  assert.equal(calculate(proto(), { ...p, sex: 'female' }, 1).kidney, 95.625);
  assert.throws(() => calculate(proto(), { ...p, serumCreatinineMgDl: 0 }, 1));
});
test('BSA adjusted eGFR uses absolute mL/min', () =>
  assert.equal(
    calculate(proto(), { ...patient, kidneyMethod: 'bsa_adjusted_egfr' }, 1)
      .kidney,
    (90 * mosteller(180, 90)) / 1.73,
  ));
test('Unapproved/draft versions cannot calculate', () => {
  const r = proto();
  r.status = 'draft';
  assert.throws(() => calculate(r, patient, 1), /published/);
  r.status = 'published';
  r.localApproval = false;
  assert.throws(() => calculate(r, patient, 1));
});
test('AUC option selection and invalid option', () => {
  const r = pilots[5];
  assert.equal(
    calculate(r, patient, 1, 'drug-specific', { 'ov-carboplatin': 6 }).rows[1]
      .clinical,
    690,
  );
  assert.throws(() =>
    calculate(r, patient, 1, 'drug-specific', { 'ov-carboplatin': 7 }),
  );
});
test('Unknown fields and overlapping phases blocked', () => {
  const r = proto();
  r.phases[0].orders[0].dose.expression = 'patient.weight*100';
  assert.throws(() => calculate(r, patient, 1), /unsupported field/);
  delete r.phases[0].orders[0].dose.expression;
  r.phases[1].cycleStart = 1;
  assert.throws(() => calculate(r, patient, 1), /Overlapping/);
});
