(function legacyTool(){
  'use strict';
  const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let findings=[];
  function reason(raw){
    const t=String(raw||'');
    if(!t.trim())return 'Dose missing';
    if(/\bthen\b/i.test(t))return 'Multiphase loading/maintenance';
    if(/\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?/i.test(t))return 'Dose range requires manual selection';
    if(/\b(?:BID|TID|QID|q\d+h)\b/i.test(t))return 'Multiple administrations per day';
    if(/days?\s*\d+\s*[-–,]|continuous|\/day/i.test(t))return 'Complex day/infusion schedule';
    if(/(?:IU|units)\b/i.test(t))return 'International unit mapping';
    if(!/AUC\s*\d+|(?:\d+(?:\.\d+)?)\s*(?:mg|g|mcg)(?:\/m[²2]|\/kg)?\b/i.test(t))return 'Unknown dose semantics';
    return '';
  }
  function render(){
    const blocked=findings.filter(x=>x.status==='BLOCK').length;
    $('legacy-summary').textContent='รายการยา '+findings.length+' · ต้อง Review แบบ Structured '+blocked+' · Candidate Draft '+(findings.length-blocked);
    $('legacy-results').innerHTML='<table><thead><tr><th>Status</th><th>Regimen</th><th>Drug</th><th>Legacy dose</th><th>Why</th></tr></thead><tbody>'+
      findings.map(x=>'<tr><td>'+esc(x.status)+'</td><td>'+esc(x.regimen)+'</td><td>'+esc(x.drug)+'</td><td>'+esc(x.dose)+'</td><td>'+esc(x.reason||'Draft only; independent review required')+'</td></tr>').join('')+'</tbody></table>';
  }
  function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
  function exportCSV(){
    if(!findings.length)return;
    const csv=['status,regimen,drug,dose,reason',...findings.map(x=>[x.status,x.regimen,x.drug,x.dose,x.reason].map(csvCell).join(','))].join('\n');
    const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='legacy-regimen-migration-report.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),300);
  }
  function init(){
    if(!$('legacy-file'))return;
    $('legacy-file').addEventListener('change',async e=>{
      const file=e.target.files?.[0];if(!file)return;
      try{const data=JSON.parse(await file.text());const records=Array.isArray(data)?data:data['สูตรยาเคมีบำบัด'];
        if(!Array.isArray(records))throw Error('Expected V1 Regimen JSON array');
        findings=records.flatMap(r=>(r['รายการยา']||[]).map(d=>{
          const why=reason(d['ขนาดยา']);return {status:why?'BLOCK':'DRAFT',regimen:r['ชื่อสูตรยา'],drug:d['ชื่อยา'],dose:d['ขนาดยา'],reason:why};
        }));
        render();
      }catch(error){$('legacy-summary').textContent='ไม่สามารถอ่าน Legacy JSON: '+error.message;}
    });
    $('legacy-export').onclick=exportCSV;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
