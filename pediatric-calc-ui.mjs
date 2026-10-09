import {calculatePediatric} from './pediatric-calc-core.mjs?v=2.8.0';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=x=>Number(x).toLocaleString('en-US',{maximumFractionDigits:3});
const dayNumbers=spec=>Array.isArray(spec)?spec:Array.from({length:Math.max(0,(spec.to-spec.from)+1)},(_,i)=>spec.from+i).filter(n=>(n-spec.from)%(spec.step||1)===0);
let protocol=null;
function textValue(id){return ($(id)?.value||'').trim();}
function n(id){const v=textValue(id);return v===''?null:Number(v);}
function check(id){return Boolean($(id)?.checked);}
function phase() {return protocol?.phases.find(p=>p.id===textValue('ped-phase'));}
function showPhase() {
  const p=phase();if(!p)return;
  $('ped-day').max=p.max_day;
  if(Number($('ped-day').value)>p.max_day||Number($('ped-day').value)<1)$('ped-day').value=1;
  $('ped-cycle-wrap').classList.toggle('hidden',p.id!=='maintenance');
  const unique=[...new Set(p.orders.flatMap(o=>dayNumbers(o.days)))].sort((a,b)=>a-b);
  const dayPreview=unique.length>35?unique.slice(0,20).join(', ')+' …':unique.join(', ');
  $('ped-phase-notes').textContent='PDF p.'+p.pdf_page+' · Scheduled drug days: '+dayPreview+' · '+p.notes;
  $('ped-hdmtx').closest('label').classList.toggle('hidden',p.id!=='interim_maintenance');
  $('ped-tap').closest('label').classList.toggle('hidden',p.id!=='induction');
  $('ped-risk').closest('label').classList.toggle('hidden',p.id==='induction');
}
function requireFields() {
 const labels={'ped-age':'อายุปัจจุบัน','ped-age-dx':'อายุตอนวินิจฉัย','ped-weight':'น้ำหนัก','ped-height':'ส่วนสูง','ped-wbc':'WBC ตอนวินิจฉัย','ped-sex':'เพศ','ped-day':'Treatment Day'};
 for(const [id,label] of Object.entries(labels)){
   if(!textValue(id)){const x=$(id);x.focus();throw Error('กรุณากรอก '+label);}
 }
}
function rowHtml(o) {
 const val=fmt(o.dosePerAdministration)+' '+esc(o.unit);
 const raw=o.capped?' (ก่อนจำกัด '+fmt(o.rawDose)+' '+esc(o.unit)+')':'';
 const freq=o.frequency==='BID'?'BID (ต่อวัน '+fmt(o.perDayTotal)+' '+esc(o.unit)+')':o.frequency;
 const rel=o.timedHours?'ช่วงเวลา '+o.timedHours.map(x=>'H'+x).join(', ')+' จาก '+esc(o.relativeTo):'';
 return '<tr><td><strong>'+esc(o.drug)+'</strong><div class="micro">'+esc(o.route)+'</div></td>'+
  '<td><strong>'+val+'</strong>'+esc(raw)+(o.capped?'<div class="pediatric-guard">ใช้ Maximum Dose</div>':'')+'</td>'+
  '<td>'+esc(freq)+(rel?'<div class="micro">'+rel+'</div>':'')+(o.infusion?'<div class="micro">Infusion: '+esc(o.infusion)+'</div>':'')+'</td>'+
  '<td>p.'+o.pdfPage+'</td></tr>';
}
function displayResult(r) {
 const blocked=r.holds.length>0;
 const top='<div class="pediatric-result-top"><div><div class="micro">BSA · Mosteller</div><strong>'+fmt(r.bsa)+' m²</strong></div>'+
 '<div><div class="micro">Treatment selection</div><strong>'+esc(r.phase)+' · Day '+r.day+'</strong></div>'+
 '<div class="'+(blocked?'pediatric-hold':'pediatric-reference')+'">'+(blocked?'HOLD / CHECK REQUIRED':'REFERENCE CALCULATION')+'</div></div>';
 const guards=r.holds.length?'<div class="pediatric-issues"><h3>ห้ามนำผลคำนวณไปใช้เป็นคำสั่งยา</h3><ul>'+r.holds.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'';
 const warns=r.warnings.length?'<div class="pediatric-warning"><strong>Clinical dose modifications required</strong><ul>'+r.warnings.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>':'';
 const info=r.info.length?'<details open class="pediatric-notes"><summary>Clinical notes / supportive care</summary><ul>'+r.info.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'';
 const table=r.orders.length?'<div class="table-wrap"><table class="pediatric-result-table"><thead><tr><th>Drug / Route</th><th>Calculated protocol dose</th><th>Frequency / Timing</th><th>Source</th></tr></thead><tbody>'+r.orders.map(rowHtml).join('')+'</tbody></table></div>':'<div class="pediatric-warning">ไม่มีรายการยาตามตารางในวันที่เลือก ตรวจ Treatment Day และช่วง Phase อีกครั้ง</div>';
 $('ped-results').innerHTML=top+guards+warns+table+info+
  '<div class="pediatric-legal">Calculated doses are unrounded protocol arithmetic only. <b>Clinical sign-off has not been completed; never administer solely from this tool.</b> Verify original PDF, supportive care, organ function, dose reduction and prescriber orders.</div>';
 $('ped-results').scrollIntoView({behavior:'smooth',block:'start'});
}
function showError(message){
 $('ped-results').innerHTML='<div class="pediatric-issues"><h3>ยังคำนวณไม่ได้</h3><p>'+esc(message)+'</p></div>';
 $('ped-results').scrollIntoView({behavior:'smooth',block:'start'});
}
function calculate(e) {
 e.preventDefault();
 try {
  if(!protocol)throw Error('โหลด ThaiPOG protocol ไม่สำเร็จ โปรดลองเปิดหน้าใหม่');
  requireFields();
  const p={
    ageYears:n('ped-age'),ageAtDiagnosisYears:n('ped-age-dx'),sex:textValue('ped-sex'),
    weightKg:n('ped-weight'),heightCm:n('ped-height'),wbcAtDiagnosis:n('ped-wbc'),
    ancPerUl:n('ped-anc'),plateletsPerUl:n('ped-platelets'),
    precursorBCellConfirmed:check('ped-bcell'),burkittExcluded:check('ped-burkitt'),
    standardRiskConfirmed:check('ped-risk'),severeInfection:check('ped-infection'),
    hdMtxSafetyConfirmed:check('ped-hdmtx')
  };
  const s={phaseId:textValue('ped-phase'),day:n('ped-day'),cycle:phase()?.id==='maintenance'?n('ped-cycle'):1,
    traumaticTap:check('ped-tap'),startingPhase:check('ped-phase-start')};
  displayResult(calculatePediatric(protocol,p,s));
 }catch(e){showError(e.message||String(e));}
}
async function init(){
 const form=$('ped-calc-form');if(!form)return;
 form.addEventListener('submit',calculate);
 try {
  const res=await fetch('./data/pediatric-all-1301.structured.json?v=2.8.0',{cache:'no-store'});
  if(!res.ok)throw Error('ไม่พบฐานข้อมูล Pediatric (HTTP '+res.status+')');
  protocol=await res.json();
  if(protocol?.id!=='ThaiPOG-ALL-1301'||protocol.phases.length!==5)throw Error('Database format invalid');
  $('ped-phase').innerHTML=protocol.phases.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.label)+'</option>').join('');
  $('ped-phase').addEventListener('change',showPhase);
  showPhase();
 }catch(e){showError(e.message||String(e));$('ped-calculate').disabled=true;}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
