import fs from 'node:fs';
import assert from 'node:assert/strict';
import {calculatePediatric,bsaMosteller} from '../pediatric-calc-core.mjs';

const hr=JSON.parse(fs.readFileSync(new URL('../data/pediatric-all-1302.structured.json',import.meta.url),'utf8'));
const sr=JSON.parse(fs.readFileSync(new URL('../data/pediatric-all-1301.structured.json',import.meta.url),'utf8'));
const base={
  ageYears:12,ageAtDiagnosisYears:12,weightKg:29,heightCm:140,sex:'male',wbcAtDiagnosis:85000,
  precursorBCellConfirmed:true,tCellConfirmed:false,burkittExcluded:true,highRiskConfirmed:true,
  ancPerUl:1800,plateletsPerUl:180000,hdMtxSafetyConfirmed:true,severeInfection:false
};
const s=(phaseId,day,over={})=>({phaseId,day,cycle:1,startingPhase:true,...over});
const dose=(r,x)=>r.orders.find(o=>o.drug.startsWith(x));
const eq=(a,b,epsilon=.002)=>assert.ok(Math.abs(a-b)<=epsilon,a+' != '+b);
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name)};
test('HR protocol independent of SR ID',()=>{assert.equal(hr.id,'ThaiPOG-ALL-1302');assert.equal(sr.id,'ThaiPOG-ALL-1301');});
test('HR five phases have 31–37 PDF references',()=>{
 assert.equal(hr.phases.length,5);assert.deepEqual(hr.pdf_pages,[31,32,33,34,35,36,37]);
 for(const p of hr.phases)for(const o of p.orders)assert.ok(o.pdf_page>=32&&o.pdf_page<=36);
});
test('HR induction day1 has doxorubicin',()=>{
 const r=calculatePediatric(hr,base,s('induction',1));assert.ok(dose(r,'Doxorubicin'));eq(dose(r,'Doxorubicin').dosePerAdministration,25*bsaMosteller(29,140));assert.equal(r.holds.length,0);
});
test('HR induction day15 CNS3 IT conditional',()=>{
 const a=calculatePediatric(hr,base,s('induction',15));
 const b=calculatePediatric(hr,base,s('induction',15,{cns3:true}));
 assert.equal(dose(a,'Methotrexate (intrathecal)'),undefined);
 assert.ok(dose(b,'Methotrexate (intrathecal)'));
});
test('HR induction day22 traumatic tap IT conditional',()=>{
 assert.ok(dose(calculatePediatric(hr,base,s('induction',22,{traumaticTap:true})),'Methotrexate (intrathecal)'));
});
test('HR standard IT age >=9 weight under30 returns12mg',()=>{
 const r=calculatePediatric(hr,base,s('induction',1));assert.equal(dose(r,'Methotrexate (intrathecal)').dosePerAdministration,12);
});
test('HR age>=9 weight30 returns15mg',()=>{
 const r=calculatePediatric(hr,{...base,weightKg:30},s('induction',1));assert.equal(dose(r,'Methotrexate (intrathecal)').dosePerAdministration,15);
});
test('HR consolidation day1 has Mesna 3 doses and Cyclophosphamide',()=>{
 const r=calculatePediatric(hr,base,s('consolidation',1));
 assert.ok(dose(r,'Cyclophosphamide'));
 assert.deepEqual(dose(r,'Mesna').timedHours,[0,4,8]);
});
test('HR consolidation day29 has second cyclophosphamide day',()=>{
 const r=calculatePediatric(hr,base,s('consolidation',29));
 assert.ok(dose(r,'Cyclophosphamide'));
});
test('HR consolidation day50 vincristine and asparaginase',()=>{
 const r=calculatePediatric(hr,base,s('consolidation',50));
 assert.ok(dose(r,'Vincristine'));
 assert.ok(dose(r,'L-Asparaginase'));
});
test('HR Interim HDMTX 5g/m2, SR Interim HDMTX 2.5g/m2',()=>{
 const r=calculatePediatric(hr,base,s('interim_maintenance',1));
 const p=calculatePediatric(sr,{...base,ageAtDiagnosisYears:5,standardRiskConfirmed:true,wbcAtDiagnosis:14000},s('interim_maintenance',1));
 eq(dose(r,'Methotrexate (high dose)').dosePerAdministration,5*bsaMosteller(29,140));
 eq(dose(p,'Methotrexate (high dose)').dosePerAdministration,2.5*bsaMosteller(29,140));
});
test('HR Interim leucovorin rescue H42..72',()=>{
 const r=calculatePediatric(hr,base,s('interim_maintenance',1));
 assert.deepEqual(dose(r,'Leucovorin').timedHours,[42,48,54,60,66,72]);
});
test('HR Interim day29 IT with 6-MP',()=>{
 const r=calculatePediatric(hr,base,s('interim_maintenance',29));
 assert.ok(dose(r,'Methotrexate (intrathecal)'));
 assert.ok(dose(r,'Mercaptopurine'));
});
test('HR Interim day15 has no IT',()=>{
 const r=calculatePediatric(hr,base,s('interim_maintenance',15));
 assert.equal(dose(r,'Methotrexate (intrathecal)'),undefined);
});
test('HR HDMTX missing safety confirmation is blocked',()=>{
 const r=calculatePediatric(hr,{...base,hdMtxSafetyConfirmed:false},s('interim_maintenance',1));
 assert.ok(r.holds.some(x=>x.includes('HD-MTX')));
});
test('HR DI day43 VCR ASP unlike SR',()=>{
 const a=calculatePediatric(hr,base,s('delayed_intensification',43));
 assert.ok(dose(a,'Vincristine')&&dose(a,'L-Asparaginase'));
});
test('HR DI day36 IT',()=>assert.ok(dose(calculatePediatric(hr,base,s('delayed_intensification',36)),'Methotrexate (intrathecal)')));
test('HR DI day29 count gate',()=>{
 const r=calculatePediatric(hr,{...base,ancPerUl:700},s('delayed_intensification',29));
 assert.ok(r.holds.length>0);
});
test('HR Maintenance cycle4 day29 IT',()=>{
 const r=calculatePediatric(hr,base,s('maintenance',29,{cycle:4}));
 assert.ok(dose(r,'Methotrexate (intrathecal)'));
});
test('HR Maintenance cycle5 day29 no IT',()=>{
 const r=calculatePediatric(hr,base,s('maintenance',29,{cycle:5}));
 assert.equal(dose(r,'Methotrexate (intrathecal)'),undefined);
});
test('HR T-cell phenotype supported with physician risk confirmation',()=>{
 const r=calculatePediatric(hr,{...base,precursorBCellConfirmed:false,tCellConfirmed:true},s('induction',1));
 assert.equal(r.holds.length,0);
});
test('HR double phenotype must block',()=>{
 const r=calculatePediatric(hr,{...base,precursorBCellConfirmed:true,tCellConfirmed:true},s('induction',1));
 assert.ok(r.holds.some(x=>x.includes('exactly one immunophenotype')));
});
test('HR missing risk approval hard-blocks',()=>{
 const r=calculatePediatric(hr,{...base,highRiskConfirmed:false},s('induction',1));
 assert.ok(r.holds.some(x=>x.includes('High Risk')));
});
test('HR non-B non-T phenotype hard-blocks',()=>{
 const r=calculatePediatric(hr,{...base,precursorBCellConfirmed:false,tCellConfirmed:false},s('induction',1));
 assert.ok(r.holds.some(x=>x.includes('immunophenotype')));
});
test('HR 100k diagnostic WBC is not automatically SR-rejected',()=>{
 const r=calculatePediatric(hr,{...base,wbcAtDiagnosis:100000},s('induction',1));
 assert.ok(!r.holds.some(x=>x.includes('Standard Risk entry criterion')));
});
test('HR labels state not released clinically',()=>{
 const r=calculatePediatric(hr,base,s('induction',1));
 assert.equal(r.canReleaseOrder,false);
});
console.log('PEDIATRIC_HR_TESTS_PASSED='+count);
