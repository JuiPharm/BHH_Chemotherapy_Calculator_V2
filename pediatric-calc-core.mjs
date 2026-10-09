/**
 * ThaiPOG pediatric protocol arithmetic, reference-only.
 * All inputs are patient-specific; the engine does not infer clinical approval.
 * No generic adult cycle interval, dose rounding, or implicit dose conversions.
 */
export function bsaMosteller(weightKg,heightCm) {
  if (!(Number.isFinite(weightKg)&&weightKg>0&&Number.isFinite(heightCm)&&heightCm>0)) throw Error('Invalid weight or height');
  return Math.sqrt((weightKg*heightCm)/3600);
}
function finite(value) { return value!==''&&value!==null&&value!==undefined&&Number.isFinite(Number(value)); }
export function matchDay(spec,day) {
  if(Array.isArray(spec))return spec.includes(day);
  if(spec && Number.isInteger(spec.from)&&Number.isInteger(spec.to))
    return day>=spec.from&&day<=spec.to&&((day-spec.from)%(spec.step||1)===0);
  return false;
}
export function intrathecalMtxMg(ageYears,weightKg) {
  if(!finite(ageYears)||!finite(weightKg))throw Error('Age and weight required for intrathecal dose');
  const a=Number(ageYears),w=Number(weightKg);
  if(a<1 || w<=0) throw Error('ALL-1301 intrathecal dose undefined below age 1 year');
  if(a<2)return 8;
  if(a<3)return 10;
  if(a<9)return 12;
  return w<30?12:15;
}
const r3=n=>Math.round((n+Number.EPSILON)*1000)/1000;
export function calculatePediatric(protocol,patient,selection) {
  if(!protocol||protocol.id!=='ThaiPOG-ALL-1301')throw Error('Unsupported pediatric protocol');
  const p=patient||{},s=selection||{};
  for(const [key,description] of [['ageYears','current age in years'],['ageAtDiagnosisYears','age at diagnosis'],['weightKg','weight (kg)'],['heightCm','height (cm)'],['wbcAtDiagnosis','WBC at diagnosis']]){
    if(!finite(p[key]))throw Error('Please enter '+description);
  }
  const age=Number(p.ageYears),ageDx=Number(p.ageAtDiagnosisYears),w=Number(p.weightKg),h=Number(p.heightCm),wbc=Number(p.wbcAtDiagnosis);
  if(age<=0||age>21||ageDx<=0||ageDx>age||w<1||w>200||h<35||h>235||wbc<0)throw Error('Patient fields out of range; verify age, weight, height, WBC');
  if(!['female','male'].includes(p.sex))throw Error('Select sex used for protocol maintenance duration');
  const phase=protocol.phases.find(x=>x.id===s.phaseId);
  if(!phase)throw Error('Select a valid treatment phase');
  const day=Number(s.day);
  if(!Number.isInteger(day)||day<1||day>phase.max_day)throw Error('Invalid treatment day for selected phase');
  const cycle=Number(s.cycle||1);
  if(!Number.isInteger(cycle)||cycle<1||cycle>100)throw Error('Cycle must be a positive integer');
  if(phase.id!=='maintenance'&&cycle!==1)throw Error('Cycle number applies only to maintenance; select cycle 1 for other phases');
  const holds=[],warnings=[],info=[];
  const pushHold=(msg)=>{if(!holds.includes(msg))holds.push(msg)};
  const pushWarn=(msg)=>{if(!warnings.includes(msg))warnings.push(msg)};
  if(ageDx<1||ageDx>=10)pushHold('Age at diagnosis is outside the 1–9 year eligibility stated in ThaiPOG-ALL-1301 (p.24).');
  if(wbc>=50000)pushHold('Diagnostic WBC is ≥50,000/µL; Standard Risk entry criterion is not met (p.24).');
  if(p.precursorBCellConfirmed!==true)pushHold('Precursor B-cell phenotype must be confirmed (p.24).');
  if(p.burkittExcluded!==true)pushHold('Burkitt leukemia exclusion must be confirmed (p.24).');
  if(p.severeInfection===true)pushHold('Severe infection reported: chemotherapy requires clinical hold and reassessment (p.27).');
  if(phase.id!=='induction' && p.standardRiskConfirmed!==true)
    pushHold('Post-induction Standard Risk reassignment is not confirmed; check marrow/MRD and cytogenetics (pp.24–25).');
  const hasCBC = finite(p.ancPerUl) && finite(p.plateletsPerUl);
  const anc=hasCBC?Number(p.ancPerUl):null,plt=hasCBC?Number(p.plateletsPerUl):null;
  const countGate = phase.id==='consolidation'||phase.id==='interim_maintenance'||
    (phase.id==='delayed_intensification'&&(s.startingPhase===true||day>=29))||
    (phase.id==='maintenance'&&cycle===1&&s.startingPhase===true);
  const isHDMTX=phase.id==='interim_maintenance'&&[1,15,29,43].includes(day);
  if(countGate||isHDMTX){
    if(!hasCBC)pushHold('ANC and platelet count required for this phase/day gate (source pp.26–29).');
    else if(anc<750||plt<75000)pushHold('ANC <750/µL or platelets <75,000/µL: protocol transition/HD-MTX or DI-day-29 criterion is not met.');
  }
  if(hasCBC&&(anc<0||plt<0||anc>1000000||plt>3000000))pushHold('Unplausible CBC inputs; verify units per µL.');
  if(isHDMTX){
    if(p.hdMtxSafetyConfirmed!==true)pushHold('HD-MTX safety plan, hydration, organ function, serum MTX monitoring and timed rescue not confirmed (p.27).');
    info.push('Withhold TMP-SMX at least 72 h before/after HD-MTX and follow local MTX monitoring/rescue policy (p.27).');
  }
  if(phase.id==='delayed_intensification'&&day>=29)info.push('Day 29 DI starts only after ANC ≥750/µL and platelets ≥75,000/µL (p.28).');
  if(phase.id==='maintenance'){
    info.push('Maintenance cycle: 84 days; suggested total duration 20 months female / 32 months male (p.29).');
    pushWarn('Maintenance 6-MP and oral MTX must follow blood-count-guided hold/reduce/escalation rules; baseline arithmetic is not a final individualized dose.');
    if(cycle===1)info.push('No 6-MP/MTX dose escalation in maintenance cycle 1 (p.29).');
  }
  const bsa=bsaMosteller(w,h);
  const orders=[];
  for(const order of phase.orders){
    if(!matchDay(order.days,day))continue;
    if(order.conditional==='traumatic_tap_only'&&s.traumaticTap!==true)continue;
    const raw=order.basis==='age_weight_it'?intrathecalMtxMg(age,w):order.per*bsa;
    const capped=order.max!==null&&order.max!==undefined?Math.min(raw,Number(order.max)):raw;
    const frequency=order.frequency||'once';
    const timed=(order.timed_after_mtx_hours||order.timed_relative_to_cyclophosphamide_hours||null);
    orders.push({
      drug:order.drug,route:order.route,unit:order.unit,basis:order.basis,protocolPer:order.per??null,
      rawDose:r3(raw),dosePerAdministration:r3(capped),maxDose:order.max??null,
      capped:raw>capped,frequency,perDayTotal:frequency==='BID'?r3(capped*2):null,
      timedHours:timed,relativeTo:order.timed_after_mtx_hours?'HD-MTX infusion start':order.timed_relative_to_cyclophosphamide_hours?'Cyclophosphamide':null,
      infusion:order.infusion||null,pdfPage:order.pdf_page,notes:order.notes||null,conditional:order.conditional||null
    });
  }
  if(!orders.length)info.push('No scheduled medications on this day within this phase. Check phase-day calendar and clinical plan.');
  if(s.traumaticTap===true&&phase.id==='induction'&&day===15)info.push('Special Day 15 intrathecal MTX included for traumatic tap only (p.25).');
  return {
    protocolId:protocol.id,phaseId:phase.id,phase:phase.label,phasePdfPage:phase.pdf_page,day,cycle,
    bsa:r3(bsa),ageYears:age,ageAtDiagnosisYears:ageDx,weightKg:w,sex:p.sex,
    holds,warnings,info,orders,
    arithmeticPerformed:true,canReleaseOrder:false,
    reviewState:holds.length?'BLOCKED_CHECK_REQUIRED':'REFERENCE_CALCULATION_REQUIRES_CLINICAL_VERIFICATION',
    source:protocol.guideline,sourceUrl:protocol.reference_url,
    proof:'Reference calculation only; this software has not undergone hospital pediatric oncology clinical UAT or regimen sign-off.'
  };
}
