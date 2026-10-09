(function builderApp(){
  'use strict';
  const $=id=>document.getElementById(id), E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number=v=>String(v??'').trim()===''?null:Number(v);
  const newOrder=()=>({drugName:'',id:'',dose:{value:null,unit:'',basis:''},route:'',schedule:{days:[]},roundingProfileId:'NO_ROUND'});
  const newPhase=()=>({name:'',cycleStart:null,cycleEnd:null,orders:[newOrder()]});
  const empty=()=>({id:'',name:'',indication:'',cancerGroup:'',version:'1.0.0',population:'adult',cycleIntervalDays:null,cycleCount:null,phases:[newPhase()],references:[],revision:0,status:'draft'});
  let model=empty(),loaded=[];
  const message=(v,kind='info')=>{const el=$('builder-message');el.textContent=v;el.className='alert alert-'+kind;};
  const options=(choices,value)=>choices.map(([k,v])=>`<option value="${E(k)}" ${k===value?'selected':''}>${E(v)}</option>`).join('');
  const basics=(id,v,more='')=>`<input id="${id}" value="${E(v??'')}" ${more}>`;
  function renderOrder(o,pi,oi){
    const d=o.dose||{},s=o.schedule||{},max=(o.clinicalRules||[]).find(x=>x.type==='hard_max')?.value;
    return `<section data-order="${pi}:${oi}" style="border-top:1px solid #d8e3ef;padding:12px 0">
      <div class="section-heading"><strong>Drug ${oi+1}</strong><button type="button" class="secondary" data-del-order="${pi}:${oi}">Remove</button></div>
      <div class="form-grid">
        <label class="field"><span>Drug name *</span><input data-o="name" value="${E(o.drugName)}" placeholder="Generic name"></label>
        <label class="field"><span>Dose basis *</span><select data-o="basis">${options([['','เลือก'],['fixed','Fixed'],['bsa','BSA (per m²)'],['weight','Weight (per kg)'],['auc','Carboplatin AUC']],d.basis)}</select></label>
        <label class="field"><span>Dose value *</span><input type="number" data-o="value" min="0" step="any" value="${E(d.value??d.defaultOption??'')}"></label>
        <label class="field"><span>Dose Options (Optional, comma separated)</span><input data-o="options" value="${E((d.options||[]).join(','))}" placeholder="เช่น 5,6"></label>
        <label class="field"><span>Default option</span><input type="number" step="any" data-o="defaultOption" value="${E(d.defaultOption??'')}"></label>
        <label class="field"><span>Unit *</span><select data-o="unit">${options([['','เลือก'],['mg','mg'],['mcg','mcg'],['g','g'],['IU','IU']],d.unit)}</select></label>
        <label class="field"><span>Route *</span><input data-o="route" value="${E(o.route)}" placeholder="IV, PO, SC ..."></label>
        <label class="field"><span>Days *</span><input data-o="days" value="${E((s.days||[]).join(','))}" placeholder="1 or 1,8,15"></label>
        <label class="field"><span>Administrations/day</span><input type="number" min="1" max="24" data-o="times" value="${E(s.administrationsPerDay??1)}"></label>
        <label class="field"><span>Continuous infusion (hours)</span><input type="number" step="any" min="0" data-o="hours" value="${E(s.continuousInfusionHours??'')}"></label>
        <label class="field"><span>Hard maximum dose (Optional)</span><input type="number" step="any" min="0" data-o="max" value="${E(max??'')}"></label>
        <label class="field"><span>Rounding</span><select data-o="round">${options([['NO_ROUND','No rounding'],['BHH_NEAREST_1MG_DEFAULT','Nearest 1mg'],['BHH_NEAREST_10MG_DEFAULT','Nearest 10mg']],o.roundingProfileId||'NO_ROUND')}</select></label>
      </div></section>`;
  }
  function renderPhase(p,i){
    return `<section data-phase="${i}" class="card" style="margin:12px 0;padding:16px">
      <div class="section-heading"><h3>Phase ${i+1}</h3><button type="button" class="secondary" data-del-phase="${i}">Remove phase</button></div>
      <div class="form-grid">
        <label class="field"><span>Name *</span><input data-p="name" value="${E(p.name)}"></label>
        <label class="field"><span>Start cycle *</span><input type="number" min="1" data-p="from" value="${E(p.cycleStart??'')}"></label>
        <label class="field"><span>End cycle *</span><input type="number" min="1" data-p="to" value="${E(p.cycleEnd??'')}"></label>
      </div>${(p.orders||[]).map((o,j)=>renderOrder(o,i,j)).join('')}
      <button type="button" class="secondary" data-add-order="${i}">+ Add Drug</button></section>`;
  }
  function render(){
    const ref=model.references?.[0]||{};
    $('builder-content').innerHTML=`
      <div class="form-grid">
        <label class="field"><span>Regimen ID *</span>${basics('be-id',model.id)}</label>
        <label class="field"><span>Version</span>${basics('be-version',model.version||'1.0.0')}</label>
        <label class="field"><span>Name *</span>${basics('be-name',model.name)}</label>
        <label class="field"><span>Indication *</span>${basics('be-indication',model.indication)}</label>
        <label class="field"><span>Cancer Group</span>${basics('be-cancer',model.cancerGroup)}</label>
        <label class="field"><span>Cycle interval (days) *</span>${basics('be-days',model.cycleIntervalDays??'','type="number" min="1" max="365"')}</label>
        <label class="field"><span>Cycle count *</span>${basics('be-count',model.cycleCount??'','type="number" min="1" max="200"')}</label>
        <label class="field"><span>แหล่งอ้างอิง (Optional)</span><select id="be-source">${options([['','ไม่ระบุ'],['NCCN','NCCN'],['NCI Thailand','NCI Thailand'],['ASCO','ASCO'],['BC Cancer','BC Cancer'],['eviQ','eviQ'],['BHH Internal','เอกสารภายในโรงพยาบาล'],['Other','อื่น ๆ']],ref.source||'')}</select></label>
        <label class="field"><span>ลิงก์/ชื่อเอกสาร (Optional)</span>${basics('be-reference',ref.url||ref.label||'','placeholder="เว้นว่างได้ หรือ BHH Oncology Protocol 2569"')}</label>
      </div>
      <div id="builder-phase-list">${(model.phases||[]).map(renderPhase).join('')}</div>
      <button type="button" class="secondary" data-add-phase="1">+ Add Phase</button>
      <div class="note-box">โปรดกำหนด Dose, Route, Day และ Cycle ตาม Protocol ด้วยตนเอง ข้อมูล Legacy ไม่มีสิทธิ์สร้างขนาดยาอัตโนมัติ</div>`;
    $('builder-content').onclick=event=>{
      const btn=event.target.closest('button');if(!btn)return;
      collect();
      if(btn.dataset.addPhase!==undefined)model.phases.push(newPhase());
      else if(btn.dataset.delPhase!==undefined)model.phases.splice(Number(btn.dataset.delPhase),1);
      else if(btn.dataset.addOrder!==undefined)model.phases[Number(btn.dataset.addOrder)].orders.push(newOrder());
      else if(btn.dataset.delOrder!==undefined){const [i,j]=btn.dataset.delOrder.split(':').map(Number);model.phases[i].orders.splice(j,1);}
      render();
    };
  }
  function collect(){
    const val=id=>$(id)?.value??'';
    model.id=val('be-id').trim();model.name=val('be-name').trim();model.indication=val('be-indication').trim();model.version=val('be-version').trim()||'1.0.0';model.cancerGroup=val('be-cancer').trim();
    model.cycleIntervalDays=number(val('be-days'));model.cycleCount=number(val('be-count'));
    const raw=val('be-reference').trim(),src=val('be-source');
    let url='';try{const u=new URL(raw);if(['https:','http:'].includes(u.protocol))url=u.href;}catch{}
    model.references=(raw||src)?[{label:raw||src,url,source:src}]:[];
    model.phases=[...document.querySelectorAll('#builder-phase-list [data-phase]')].map((el,pi)=>{
      const p=k=>el.querySelector('[data-p="'+k+'"]')?.value??'';
      return {id:'phase-'+(pi+1),name:p('name')||'Phase',cycleStart:number(p('from')),cycleEnd:number(p('to')),
        orders:[...el.querySelectorAll('[data-order]')].map((row,oi)=>{
          const g=k=>row.querySelector('[data-o="'+k+'"]')?.value??'';
          const value=number(g('value')),unit=g('unit'),hard=number(g('max')),times=number(g('times')),hours=number(g('hours'));
          const optionsText=g('options').trim(),doseOptions=optionsText?optionsText.split(/[,\s]+/).filter(Boolean).map(Number):[];
          const defaultOption=number(g('defaultOption'));
          return {id:'phase-'+(pi+1)+'-order-'+(oi+1),drugName:g('name').trim(),
            dose:{basis:g('basis'),value,unit,...(doseOptions.length?{options:doseOptions,defaultOption:defaultOption??doseOptions[0]}:{})},route:g('route').trim(),roundingProfileId:g('round'),
            schedule:{days:g('days').split(/[,\s]+/).filter(Boolean).map(Number),...(times?{administrationsPerDay:times}:{}),...(hours?{continuousInfusionHours:hours}:{})},
            clinicalRules:hard>0?[{type:'hard_max',value:hard,unit,reason:'Approved protocol max'}]:[]};
        })};
    });
  }
  function hasDraftContent() {
    return Boolean(model.id || model.name || model.indication || model.cancerGroup ||
      model.cycleIntervalDays || model.cycleCount || model.revision ||
      (model.phases||[]).some(p=>p.cycleStart || p.cycleEnd ||
        (p.name && p.name!=='Phase') || (p.orders||[]).some(o=>
          o.drugName || o.dose?.value || o.dose?.basis || o.route || o.schedule?.days?.length)));
  }
  function clearForm() {
    collect();
    if (hasDraftContent() && !window.confirm('ล้างข้อมูลในฟอร์มนี้ทั้งหมด? ข้อมูลที่บันทึกไว้ใน Central D1 จะไม่ถูกลบ')) return;
    model=empty();
    $('builder-pin').value='';
    $('builder-attest').checked=false;
    render();
    message('ล้างข้อมูลในฟอร์มเรียบร้อยแล้ว · Central D1 ไม่ถูกเปลี่ยน','success');
    $('be-id')?.focus();
  }
  function cloneAsDraft() {
    collect();model.id=(model.id||'BHH-REGIMEN')+'-DRAFT-'+Date.now().toString().slice(-6);
    model.revision=0;model.status='draft';model.localApproval=false;
    render();message('Clone เป็น Draft ใหม่แล้ว · กรุณาทบทวนก่อนบันทึก');
  }
  function open(item,fields){
    const original=item?.structured;
    model=original?JSON.parse(JSON.stringify(original)):empty();
    if(item?.master&&!original){
      model.id=item.master.catalog_id;model.name=item.master.name;model.indication=item.master.indication;model.cancerGroup=item.master.cancer_type;
      model.phases=[{...newPhase(),orders:item.master.drugs.map((d,i)=>({...newOrder(),id:'order-'+(i+1),drugName:d['ชื่อยา']||''}))}];
    }
    if(fields?.corrected_indication)model.indication=fields.corrected_indication;
    if(fields?.source||fields?.reference_url)model.references=[{label:fields.reference_url||fields.source,source:fields.source||'',url:fields.reference_url||''}];
    render();
    document.querySelector('[data-tab="builder"]')?.click();
    message('Structured Editor: กรุณายืนยันข้อมูลขนาดยาและ Schedule ก่อน Publish');
  }
  async function send(action){
    collect();
    if(model.archived){message('สูตรนี้ถูก Archive แล้ว กรุณา Restore as Draft จากรายการก่อนแก้ไขหรือ Publish','error');return;}
    if(!model.id||!model.name||!model.indication){message('กรุณาระบุ ID, ชื่อสูตรยา และ Indication','error');return;}
    if(action==='publish'&&!$('builder-attest').checked){message('โปรดยืนยัน Clinical Review ก่อน Publish','error');return;}
    const pin=$('builder-pin').value.trim();if(!pin){message('กรุณากรอก Pharmacist PIN','error');return;}
    $('builder-save').disabled=true;$('builder-publish').disabled=true;
    try{
      const response=await fetch('/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,action,regimen:model,expectedRevision:model.revision||0})});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.success)throw Error((data.issues||[]).map(x=>x.field+': '+x.reason).join(' • ')||data.message||'Cannot save');
      model=data.regimen;
      if(action==='publish')window.BHH_APPLY_PUBLISHED?.(model);
      message((action==='publish'?'Published':'Saved Draft')+' in Central D1 · revision '+model.revision,'success');
    }catch(e){message('Server rejected: '+e.message,'error');}
    finally{$('builder-pin').value='';$('builder-save').disabled=false;$('builder-publish').disabled=false;}
  }
  function download(){
    collect();const u=URL.createObjectURL(new Blob([JSON.stringify(model,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=u;a.download=(model.id||'regimen-draft')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500);
  }
  function renderLoaded() {
    $('builder-drafts').innerHTML=loaded.map((x,i)=>`
      <article class="builder-draft-card">
        <strong>${E(x.name||x.id)}</strong>
        <small>${E(x.id)} · ${x.archived?'ARCHIVED':E(x.status)} · revision ${E(x.revision)}</small>
        <div class="builder-draft-actions">
          <button type="button" class="secondary" data-loaded="${i}">Open</button>
          <button type="button" class="${x.archived?'secondary':'builder-danger'}" data-lifecycle="${i}">${x.archived?'Restore as Draft':'Archive'}</button>
        </div>
      </article>`).join('')||'<p class="micro">ยังไม่มี Regimen ที่บันทึกใน Central D1</p>';
  }
  async function changeLifecycle(index) {
    const item=loaded[index];
    if(!item)return;
    const archive=!item.archived;
    const pin=$('builder-pin').value.trim();
    if(!pin){message('กรอก Pharmacist PIN เพื่อดำเนินการกับ Regimen นี้','error');$('builder-pin').focus();return;}
    if(archive) {
      const typed=window.prompt('ยืนยัน Archive: พิมพ์ Regimen ID ให้ตรงทุกตัว เพื่อถอนออกจากการใช้งาน\\n'+item.id,'');
      if(typed!==item.id){message('ยกเลิกการ Archive (Regimen ID ไม่ตรง)','info');return;}
    } else if(!window.confirm('Restore '+item.id+' เป็น Draft? ต้องทบทวน Clinical Review ใหม่ก่อน Publish'))return;
    const buttons=[...$('builder-drafts').querySelectorAll('button')];
    buttons.forEach(b=>b.disabled=true);
    try {
      const res=await fetch('/api/publish',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({pin,action:archive?'archive':'restore',regimen:item,expectedRevision:item.revision})
      });
      const data=await res.json().catch(()=>({}));
      if(!res.ok||!data.success)throw Error(data.message||'Unable to update regimen');
      loaded[index]=data.regimen;
      if(model.id===data.regimen.id){model=JSON.parse(JSON.stringify(data.regimen));render();}
      renderLoaded();
      message(archive
        ?'Archive สำเร็จ · ถอนออกจากรายการ Published กลางแล้ว ข้อมูลต้นฉบับยังอยู่ใน D1'
        :'Restore เป็น Draft สำเร็จ · ต้องตรวจสอบและ Publish ใหม่','success');
      await window.BHH_REFRESH_REGIMENS?.();
    } catch(error){
      message('Central D1 ไม่ได้รับการเปลี่ยนแปลง: '+error.message,'error');
    } finally{
      $('builder-pin').value='';
      buttons.forEach(b=>b.disabled=false);
    }
  }
  async function load(){
    const pin=$('builder-pin').value.trim();if(!pin){message('กรอก PIN เพื่อโหลด Regimen จาก Central D1','error');return;}
    try{const res=await fetch('/api/regimens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin})});
      const data=await res.json();if(!res.ok)throw Error(data.message||'Unable to load');
      loaded=data.regimens||[];
      renderLoaded();
      $('builder-drafts').onclick=e=>{
        const b=e.target.closest('button');if(!b)return;
        if(b.dataset.loaded!==undefined){
          model=JSON.parse(JSON.stringify(loaded[Number(b.dataset.loaded)]));
          render();
          $('builder-attest').checked=false;
          message('Loaded: '+model.name+(model.archived?' (Archived — Restore before editing)':''));
          document.getElementById('builder-content')?.scrollIntoView({block:'start',behavior:'smooth'});
        } else if(b.dataset.lifecycle!==undefined)changeLifecycle(Number(b.dataset.lifecycle));
      };
      message('Loaded '+loaded.length+' records from Central D1','success');
    }catch(e){message(e.message,'error');}
    finally{$('builder-pin').value='';}
  }

  function init(){
    if(!$('builder-content'))return;
    $('builder-save').onclick=()=>send('draft');
    $('builder-publish').onclick=()=>send('publish');
    $('builder-export').onclick=download;
    $('builder-load').onclick=load;
    $('builder-new').onclick=clearForm;
    $('builder-clear').onclick=clearForm;
    $('builder-clone').onclick=cloneAsDraft;
    render();
  }
  window.BHH_BUILDER={open,init};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
