import assert from 'node:assert/strict';
import '../renal-equations.js';
import { mostellerBsa, resolveKidneyFunction, calculateRegimen } from '../dist/engine.js';
import fs from 'node:fs';

function close(actual, expected, label, tolerance=1e-7) {
  assert(Number.isFinite(actual) && Math.abs(actual-expected)<tolerance, label+': expected '+expected+', got '+actual);
}
const renal=globalThis.BHH_RENAL;
assert(renal, 'Shared CKD-EPI module not loaded');

// Fixed values from NKF 2021 creatinine equation, four branches around the sex-specific kappa.
for (const [ageYears,sex,serumCreatinineMgDl,expected] of [
  [45,'female',0.7,108.623430734],
  [65,'female',1.2,50.234665676],
  [55,'male',0.9,100.863242821],
  [55,'male',1.2,71.417795922]
]) close(renal.ckdEpi2021Indexed({ageYears,sex,serumCreatinineMgDl}),expected,'NKF '+sex+' age '+ageYears+' SCr '+serumCreatinineMgDl);
console.log('RENAL_PASS 01: female/male, low/high creatinine branches match NKF 2021 coefficients');

const patient={ageYears:65,sex:'female',serumCreatinineMgDl:1.2,kidneyMethod:'ckd_epi_2021_cr',heightCm:160,weightKg:60};
const bsa=mostellerBsa(patient.heightCm,patient.weightKg);
const result=resolveKidneyFunction(patient,bsa);
close(result.indexedEgfr,50.234665676,'Indexed eGFR');
close(result.deindexedEgfr,50.234665676*bsa/1.73,'BSA-deindexed eGFR');
close(result.value,result.deindexedEgfr,'Calvert-compatible mL/min');
assert(result.label.includes('2021') && result.warning.includes('2009'));
console.log('RENAL_PASS 02: indexed and BSA de-indexed eGFR returned with correct units and warning');

const lab=resolveKidneyFunction({...patient,kidneyMethod:'bsa_adjusted_egfr',kidneyValue:57},bsa);
close(lab.indexedEgfr,57,'Lab indexed preserved');
close(lab.deindexedEgfr,57*bsa/1.73,'Lab deindexation');
const mgfr=resolveKidneyFunction({...patient,kidneyMethod:'measured_gfr',kidneyValue:92},bsa);
close(mgfr.value,92,'Measured GFR unchanged');
assert.equal(mgfr.indexedEgfr,undefined);
const cg=resolveKidneyFunction({...patient,kidneyMethod:'cockcroft_gault_legacy'},bsa);
close(cg.value,((140-65)*60)/(72*1.2)*0.85,'Cockcroft-Gault unchanged');
console.log('RENAL_PASS 03: lab-indexed, measured GFR and Cockcroft-Gault methods unchanged');

for(const [p,message] of [
  [{...patient,ageYears:17},'adult'],
  [{...patient,sex:'unknown'},'sex'],
  [{...patient,serumCreatinineMgDl:0},'positive'],
  [{...patient,serumCreatinineMgDl:NaN},'positive']
])assert.throws(()=>renal.ckdEpi2021Indexed(p),new RegExp(message,'i'));
assert.throws(()=>renal.deindexEgfr(50,0),/positive/);
console.log('RENAL_PASS 04: invalid patient and lab inputs rejected');

const fixtures=JSON.parse(fs.readFileSync(new URL('../data/regimens.published.json',import.meta.url),'utf8'));
const profiles=Object.fromEntries(JSON.parse(fs.readFileSync(new URL('../data/rounding-profiles.json',import.meta.url),'utf8')).map(p=>[p.id,p]));
const ovarian=fixtures.find(r=>r.id==='BHH-OVARIAN-CARBO-TAXOL-EVIQ252');
const calculation=calculateRegimen({
 patient,regimen:ovarian,cycle:1,selections:{'ov-carboplatin':6},roundingProfiles:profiles
});
const carbo=calculation.results.find(o=>o.orderId==='ov-carboplatin');
close(carbo.rawCalculatedDose,6*(result.deindexedEgfr+25),'CKD-EPI 2021 uses deindexed kidney function for Calvert');
assert(calculation.warnings.some(w=>w.includes('2009')));
console.log('RENAL_PASS 05: Calvert uses mL/min (deindexed), not mL/min/1.73m²');
console.log('CKD_EPI_2021_PASS');
