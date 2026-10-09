import fs from 'node:fs';
import assert from 'node:assert/strict';
import {calculatePediatric,bsaMosteller,intrathecalMtxMg,matchDay} from '../pediatric-calc-core.mjs';

const protocol=JSON.parse(fs.readFileSync(new URL('../data/pediatric-all-1301.structured.json',import.meta.url),'utf8'));
const pdf=[24,25,26,27,28,29,30];
assert.equal(protocol.id,'ThaiPOG-ALL-1301');
assert.equal(protocol.phases.length,5);
assert.deepEqual(protocol.pdf_pages,pdf);
for(const p of protocol.phases)for(const o of p.orders){
 assert.ok(o.drug&&o.route&&o.unit&&o.pdf_page,'Every order must have route, unit and PDF page');
 assert.ok(o.basis==='bsa'||o.basis==='age_weight_it');
 assert.ok(o.days,'Drug missing schedule: '+o.drug);
}
const patient={
 ageYears:5,ageAtDiagnosisYears:5,weightKg:20,heightCm:110,sex:'female',wbcAtDiagnosis:10000,
 precursorBCellConfirmed:true,burkittExcluded:true,standardRiskConfirmed:true,
 ancPerUl:1750,plateletsPerUl:180000,hdMtxSafetyConfirmed:true,severeInfection:false
};
const select=(phaseId,day,extra={})=>({phaseId,day,cycle:1,startingPhase:true,...extra});
const dose=(r,name)=>r.orders.find(o=>o.drug.startsWith(name));
const approx=(actual,expected,delta=0.002)=>assert.ok(Math.abs(actual-expected)<=delta,'Expected '+expected+' got '+actual);
let tests=0;
const run=(name,fn)=>{fn();tests++;process.stdout.write('PASS '+name+'\n');};
run('Mosteller BSA',()=>approx(bsaMosteller(20,110),Math.sqrt(2200/3600),0.0000001));
run('IT-age 1.99',()=>assert.equal(intrathecalMtxMg(1.99,11),8));
run('IT-age 2.00',()=>assert.equal(intrathecalMtxMg(2,12),10));
run('IT-age 2.99',()=>assert.equal(intrathecalMtxMg(2.99,12),10));
run('IT-age 3.00',()=>assert.equal(intrathecalMtxMg(3,13),12));
run('IT-age 8.99',()=>assert.equal(intrathecalMtxMg(8.99,29),12));
run('IT-age 9 weight29.9',()=>assert.equal(intrathecalMtxMg(9,29.9),12));
run('IT-age 9 weight30',()=>assert.equal(intrathecalMtxMg(9,30),15));
run('IT-age 10 weight29',()=>assert.equal(intrathecalMtxMg(10,29),12));
run('IT-age 10 weight30',()=>assert.equal(intrathecalMtxMg(10,30),15));
run('IT-age below 1 rejected',()=>assert.throws(()=>intrathecalMtxMg(.99,9)));
run('Induction day1 vincristine, pred BID, IT',()=>{
 const r=calculatePediatric(protocol,patient,select('induction',1));
 assert.equal(r.orders.length,3);
 approx(dose(r,'Vincristine').dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*1.5);
 approx(dose(r,'Prednisolone').dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*30);
 assert.equal(dose(r,'Prednisolone').frequency,'BID');
 assert.equal(dose(r,'Methotrexate (intrathecal)').dosePerAdministration,12);
 assert.equal(r.canReleaseOrder,false);
});
run('Induction day4 only asparaginase and prednisone',()=>{
 const r=calculatePediatric(protocol,patient,select('induction',4));
 assert.equal(r.orders.length,2);approx(dose(r,'L-Asparaginase').dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*10000,0.004);
});
run('Day15 IT only traumatic tap',()=>{
 const no=calculatePediatric(protocol,patient,select('induction',15));
 const yes=calculatePediatric(protocol,patient,select('induction',15,{traumaticTap:true}));
 assert.equal(dose(no,'Methotrexate (intrathecal)'),undefined);
 assert.ok(dose(yes,'Methotrexate (intrathecal)'));
});
run('Vincristine maximum 2 mg',()=>{
 const pp={...patient,weightKg:60,heightCm:180};
 const r=calculatePediatric(protocol,pp,select('induction',1));
 assert.ok(dose(r,'Vincristine').capped);
 assert.equal(dose(r,'Vincristine').dosePerAdministration,2);
});
run('Consolidation day1 VCR/6MP/IT',()=>{
 const r=calculatePediatric(protocol,patient,select('consolidation',1));
 assert.equal(r.orders.length,3);
 approx(dose(r,'Mercaptopurine').dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*75);
});
run('Consolidation day15 IT schedule',()=>assert.ok(dose(calculatePediatric(protocol,patient,select('consolidation',15)),'Methotrexate (intrathecal)')));
run('Consolidation day28 mercaptopurine only',()=>{
 const r=calculatePediatric(protocol,patient,select('consolidation',28));
 assert.equal(r.orders.length,1);assert.ok(dose(r,'Mercaptopurine'));
});
run('Interim HD-MTX and six-dose rescue H42..H72',()=>{
 const r=calculatePediatric(protocol,patient,select('interim_maintenance',1));
 approx(dose(r,'Methotrexate (high dose)').dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*2.5);
 const rescue=dose(r,'Leucovorin');assert.deepEqual(rescue.timedHours,[42,48,54,60,66,72]);
 assert.equal(rescue.frequency,'six doses');
 assert.equal(r.holds.length,0);
});
run('Interim day2 no chemotherapy',()=>{
 const r=calculatePediatric(protocol,patient,select('interim_maintenance',2));assert.equal(r.orders.length,0);
});
run('Interim HD MTX missing clearance blocked',()=>{
 const r=calculatePediatric(protocol,{...patient,hdMtxSafetyConfirmed:false},select('interim_maintenance',1));
 assert.equal(r.reviewState,'BLOCKED_CHECK_REQUIRED');
 assert.ok(r.holds.some(x=>x.includes('HD-MTX safety')));
});
run('Interim HD MTX with ANC <750 blocked',()=>{
 const r=calculatePediatric(protocol,{...patient,ancPerUl:749},select('interim_maintenance',1));
 assert.ok(r.holds.some(x=>x.includes('ANC')));
});
run('Interim HD MTX with PLT 74999 blocked',()=>{
 const r=calculatePediatric(protocol,{...patient,plateletsPerUl:74999},select('interim_maintenance',1));
 assert.ok(r.holds.some(x=>x.includes('platelets')));
});
run('CBC at threshold accepted',()=>{
 const r=calculatePediatric(protocol,{...patient,ancPerUl:750,plateletsPerUl:75000},select('interim_maintenance',1));
 assert.equal(r.holds.length,0);
});
run('CBC missing does not grant readiness',()=>{
 const r=calculatePediatric(protocol,{...patient,ancPerUl:null,plateletsPerUl:null},select('consolidation',1));
 assert.ok(r.holds.some(x=>x.includes('required')));
});
run('Delayed intensification day29 mesna three timed doses',()=>{
 const r=calculatePediatric(protocol,patient,select('delayed_intensification',29));
 const mesna=dose(r,'Mesna');
 assert.ok(mesna);assert.deepEqual(mesna.timedHours,[0,4,8]);approx(mesna.dosePerAdministration,bsaMosteller(patient.weightKg,patient.heightCm)*250);
});
run('Delayed intensification day29 blood count block',()=>{
 const r=calculatePediatric(protocol,{...patient,ancPerUl:700},select('delayed_intensification',29));
 assert.equal(r.reviewState,'BLOCKED_CHECK_REQUIRED');
});
run('Delayed intensification day1 no cyclophosphamide',()=>{
 const r=calculatePediatric(protocol,patient,select('delayed_intensification',1));
 assert.ok(dose(r,'Dexamethasone'));assert.equal(dose(r,'Cyclophosphamide'),undefined);
});
run('Maintenance day1 includes oral weekly MTX and IT',()=>{
 const r=calculatePediatric(protocol,patient,select('maintenance',1,{cycle:2}));
 assert.ok(dose(r,'Methotrexate (oral weekly)'));assert.ok(dose(r,'Methotrexate (intrathecal)'));
 assert.ok(r.warnings.some(x=>x.includes('6-MP')));
});
run('Maintenance day8 oral MTX but not IT',()=>{
 const r=calculatePediatric(protocol,patient,select('maintenance',8,{cycle:2}));
 assert.ok(dose(r,'Methotrexate (oral weekly)'));assert.equal(dose(r,'Methotrexate (intrathecal)'),undefined);
});
run('Maintenance day84 oral 6MP',()=>{
 const r=calculatePediatric(protocol,patient,select('maintenance',84,{cycle:2}));
 assert.equal(r.orders.length,1);assert.ok(dose(r,'Mercaptopurine'));
});
run('Maintenance female/male duration',()=>{
 const a=calculatePediatric(protocol,patient,select('maintenance',1,{cycle:1}));
 const b=calculatePediatric(protocol,{...patient,sex:'male'},select('maintenance',1,{cycle:1}));
 assert.ok(a.info.some(x=>x.includes('20 months female / 32 months male')));
 assert.ok(b.info.some(x=>x.includes('20 months female / 32 months male')));
});
run('Post-induction reassignment not confirmed blocks',()=>{
 const r=calculatePediatric(protocol,{...patient,standardRiskConfirmed:false},select('maintenance',1,{cycle:2}));
 assert.ok(r.holds.some(x=>x.includes('Post-induction')));
});
run('Suspected severe infection blocks',()=>{
 const r=calculatePediatric(protocol,{...patient,severeInfection:true},select('induction',1));
 assert.ok(r.holds.some(x=>x.includes('infection')));
});
run('Diagnostic WBC 50000 outside SR',()=>{
 const r=calculatePediatric(protocol,{...patient,wbcAtDiagnosis:50000},select('induction',1));
 assert.ok(r.holds.some(x=>x.includes('WBC')));
});
run('Age at diagnosis under 1 outside SR',()=>{
 const r=calculatePediatric(protocol,{...patient,ageAtDiagnosisYears:.99},select('induction',1));
 assert.ok(r.holds.some(x=>x.includes('Age at diagnosis')));
});
run('Missing B-cell / Burkitt exclusions block',()=>{
 const r=calculatePediatric(protocol,{...patient,precursorBCellConfirmed:false,burkittExcluded:false},select('induction',1));
 assert.ok(r.holds.some(x=>x.includes('B-cell'))&&r.holds.some(x=>x.includes('Burkitt')));
});
run('Invalid day0 rejected',()=>assert.throws(()=>calculatePediatric(protocol,patient,select('induction',0))));
run('Invalid day37 rejected',()=>assert.throws(()=>calculatePediatric(protocol,patient,select('induction',37))));
run('Non-maintenance cycle2 rejected',()=>assert.throws(()=>calculatePediatric(protocol,patient,select('induction',1,{cycle:2}))));
run('Invalid negative weight rejected',()=>assert.throws(()=>calculatePediatric(protocol,{...patient,weightKg:-5},select('induction',1))));
run('Protocol mismatch rejected',()=>assert.throws(()=>calculatePediatric({...protocol,id:'other'},patient,select('induction',1))));
run('Week schedule conversion',()=>{
 assert.equal(matchDay({from:1,to:28},28),true);
 assert.equal(matchDay({from:1,to:28},29),false);
 assert.equal(matchDay([1,8,15],7),false);
});
run('All phases days are source-bounded',()=>{
 for(const phase of protocol.phases){
  for(const order of phase.orders){
   const days=Array.isArray(order.days)?order.days:[order.days.from,order.days.to];
   for(const d of days)assert.ok(d>=1&&d<=phase.max_day,phase.id+' day '+d);
  }
 }
});
run('All protocol orders carry source pages',()=>{
 for(const phase of protocol.phases)for(const order of phase.orders)assert.equal(order.pdf_page,phase.pdf_page);
});
console.log('PEDIATRIC_TESTS_PASSED='+tests);
