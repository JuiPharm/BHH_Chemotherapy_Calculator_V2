(function publishManager() {
  'use strict';
  const $=id=>document.getElementById(id);
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const SOURCE_DOMAINS={'NCCN':['nccn.org'],'NCI Thailand':['nci.go.th'],'ASCO':['asco.org','ascopubs.org','jco.org'],'BC Cancer':['bccancer.bc.ca'],'eviQ':['eviq.org.au'],'NCI US':['cancer.gov']};
  const SUGGESTED_PROTOCOLS={'BHH-CATALOG-039':{id:'eviQ 168 R-CVP',source:'eviQ',url:'https://www.eviq.org.au/haematology/lymphoma/other-b-cell-lymphoma/168-r-cvp-rituximab-cyclophosphamide-vincristine',warning:'ตรวจ Prednisolone/Prednisone และ schedule ให้ตรง protocol variant ก่อน Publish'}};
  const reviewQueue=new Map(),BULK_LIMIT=25;
  let reviewItem=null,busy=false;
  // Explicitly optional: raw text and internal hospital references are accepted as plain text.
  function checkReference(source,rawUrl){
    const text=String(rawUrl??'').trim();
    if(!text)return '';
    try{const u=new URL(text);return ['http:','https:'].includes(u.protocol)?u.href:text;}catch{return text;}
  }
  function renderDialogs() {
    if($('review-publish-dialog'))return;
    const d=document.createElement('dialog');
    d.id='review-publish-dialog';
    d.innerHTML=`
      <div class="review-publish-head"><h2>Review → Approve & Publish</h2><button id="review-publish-close" type="button">✕</button></div>
      <form id="review-publish-form" novalidate><div class="review-publish-content">
        <div id="review-publish-name"></div><div id="review-reference-suggestion" hidden></div>
        <p id="review-publish-error" class="alert alert-error" role="alert" hidden></p>
        <div class="review-publish-two">
          <label>แหล่งอ้างอิง (Optional)
            <select id="review-publish-source"><option value="">ไม่ระบุ</option><option>NCCN</option><option>NCI Thailand</option><option>ASCO</option><option>BC Cancer</option><option>eviQ</option><option>NCI US</option><option>BHH Internal</option><option>Other</option></select>
          </label>
          <label>Protocol ID / Version (Optional)<input id="review-publish-protocol" placeholder="เช่น GICOXB / 2026"></label>
        </div>
        <label>ลิงก์ Guideline / ชื่อเอกสารภายใน (Optional)<input type="text" id="review-publish-url" placeholder="BHH Oncology Protocol 2569 หรือ https://..."></label>
        <label>ข้อบ่งใช้ (Indication) *<textarea id="review-publish-indication" rows="2" required></textarea></label>
        <label>รอบการรักษา (Cycle schedule) *<input id="review-publish-cycle" required></label>
        <div id="review-publish-orders"></div>
        <label>หมายเหตุผลการตรวจสอบ<textarea id="review-publish-notes" rows="2"></textarea></label>
        <label class="review-publish-check"><input id="review-publish-attest" type="checkbox" required> ยืนยันว่าทบทวนยา ขนาดยา หน่วย วันให้ยา และรอบการรักษากับเอกสารทางคลินิกแล้ว</label>
        <label>Pharmacist PIN (เฉพาะ Publish)<input id="review-publish-token" type="password" autocomplete="off" placeholder="PIN"></label>
        <p id="review-publish-message" role="status"></p>
      </div><div class="review-publish-actions">
        <button type="button" id="review-publish-queue">เพิ่มเข้าชุดอนุมัติ</button>
        <button type="button" id="review-publish-save">Save Structured Draft</button>
        <button type="submit" class="primary" id="review-publish-confirm">Approve & Publish</button>
      </div></form>`;
    document.body.appendChild(d);
    $('review-publish-close').onclick=()=>{if(!busy)d.close();};
    $('review-publish-form').onsubmit=e=>{e.preventDefault();persist('publish');};
    $('review-publish-save').onclick=()=>persist('save');
    $('review-publish-queue').onclick=queueCurrent;
    $('review-publish-url').oninput=()=>{
      const raw=$('review-publish-url').value.trim();
      try{const host=new URL(raw).hostname.toLowerCase();
        for(const [source,domains] of Object.entries(SOURCE_DOMAINS))if(domains.some(x=>host===x||host.endsWith('.'+x))){$('review-publish-source').value=source;break;}
      }catch{}
    };
    batchUI();
  }
  function open(item){
    if(!item?.master)return;
    renderDialogs();reviewItem=item;
    const m=item.master,r=item.guidelineReference||{};
    $('review-publish-name').innerHTML='<h3>'+E(m.name)+'</h3><p class="micro">'+E(m.catalog_id)+' · '+E(item.status)+'</p>';
    $('review-publish-source').value=r.source||'';
    $('review-publish-protocol').value=r.protocol||'';
    $('review-publish-url').value=r.reference_url||'';
    $('review-publish-indication').value=r.corrected_indication||m.indication||'';
    $('review-publish-cycle').value=r.corrected_cycle_text||m.cycle_text||'';
    $('review-publish-notes').value=r.review_note||'';
    $('review-publish-attest').checked=false;$('review-publish-token').value='';
    $('review-publish-error').hidden=true;$('review-publish-message').textContent='';
    $('review-publish-orders').innerHTML='<h3>รายการยาต้นฉบับ</h3>'+(m.drugs||[]).map((drug,i)=>`
      <section class="review-publish-drug" data-drug-index="${i}">
        <strong>${E(drug['ชื่อยา'])}</strong>
        <label>Dose text<input class="review-dose" value="${E(drug['ขนาดยา'])}" required></label>
        <label>Schedule text<input class="review-frequency" value="${E(drug['ความถี่ในการให้'])}" required></label>
      </section>`).join('');
    const suggestion=SUGGESTED_PROTOCOLS[m.catalog_id],box=$('review-reference-suggestion');
    if(suggestion){
      box.hidden=false;
      box.innerHTML='<p>'+E(suggestion.warning)+'</p><button id="review-suggestion" type="button" class="secondary">ใช้ลิงก์ eviQ สำหรับเปรียบเทียบ</button>';
      $('review-suggestion').onclick=()=>{$('review-publish-source').value=suggestion.source;$('review-publish-url').value=suggestion.url;};
    }else box.hidden=true;
    $('review-publish-dialog').showModal();
  }
  function readForm(){
    const form=$('review-publish-form');
    if(!form.checkValidity())throw Error('กรุณากรอกข้อบ่งใช้ Schedule และยืนยัน Clinical Review ก่อน');
    const corrected_drugs=(reviewItem.master.drugs||[]).map((d,i)=>{
      const block=$('review-publish-orders').querySelector('[data-drug-index="'+i+'"]');
      return {...d,'ขนาดยา':block.querySelector('.review-dose').value.trim(),'ความถี่ในการให้':block.querySelector('.review-frequency').value.trim()};
    });
    return {source:$('review-publish-source').value,protocol:$('review-publish-protocol').value.trim(),
      reference_url:checkReference($('review-publish-source').value,$('review-publish-url').value),
      corrected_indication:$('review-publish-indication').value.trim(),
      corrected_cycle_text:$('review-publish-cycle').value.trim(),corrected_drugs,
      review_note:$('review-publish-notes').value.trim()};
  }
  const failure=e=>{const box=$('review-publish-error');box.textContent=e.message;box.hidden=false;$('review-publish-message').textContent=e.message;};
  function copyStructured(item,fields) {
    if(!item.structured)throw Error('ยังไม่มี Structured Regimen: เปิด Builder เพื่อกำหนด Dose/Route/Days ก่อน');
    if(JSON.stringify(fields.corrected_drugs)!==JSON.stringify(item.master.drugs)||fields.corrected_cycle_text!==item.master.cycle_text)
      throw Error('ข้อมูล Dose/Cycle ที่แก้ไขต้องยืนยันใน Regimen Builder ก่อน');
    const result=JSON.parse(JSON.stringify(item.structured));
    result.indication=fields.corrected_indication;
    const input=fields.reference_url,source=fields.source;
    let url='';try{const u=new URL(input);if(['http:','https:'].includes(u.protocol))url=u.href;}catch{}
    result.references=(input||source)?[{label:input||source,url,source}]:[];
    result.review_note=fields.review_note;
    return result;
  }
  async function publish(item,fields,pin) {
    const regimen=copyStructured(item,fields);
    if(!pin||pin==='1234')throw Error('กรุณากรอก Pharmacist PIN ที่ตั้งไว้บน Cloudflare');
    const res=await fetch('/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({pin,action:'publish',regimen,expectedRevision:regimen.revision||0})});
    const data=await res.json().catch(()=>({}));
    if(!res.ok||data.success!==true)throw Error((data.issues||[]).map(x=>x.field+': '+x.reason).join(' • ')||data.message||'Server rejected publication');
    item.status='approved_published';item.structured=data.regimen;
    window.BHH_APPLY_PUBLISHED?.(data.regimen);
    return data.regimen;
  }
  async function persist(action){
    if(busy||!reviewItem)return;
    try {
      const fields=readForm();
      if(action==='save'||!reviewItem.structured){
        $('review-publish-dialog').close();
        window.BHH_BUILDER?.open(reviewItem,fields);
        return;
      }
      busy=true;$('review-publish-confirm').disabled=true;
      const result=await publish(reviewItem,fields,$('review-publish-token').value.trim());
      $('review-publish-message').textContent='Published ในฐานข้อมูลกลางสำเร็จ Revision '+result.revision;
      $('review-publish-token').value='';
      setTimeout(()=>{if($('review-publish-dialog').open)$('review-publish-dialog').close();},900);
    }catch(e){
      if(!reviewItem?.structured){
        $('review-publish-dialog').close();window.BHH_BUILDER?.open(reviewItem,readForm());return;
      }
      failure(e);
    }finally{busy=false;$('review-publish-confirm').disabled=false;}
  }
  function batchUI(){
    if($('bhh-bulk-publish'))return;
    const toolbar=document.createElement('div');toolbar.id='bhh-bulk-publish';
    toolbar.innerHTML='<span id="bhh-bulk-count">ยังไม่ได้เลือกสูตร</span> <button type="button" id="bhh-bulk-open" disabled>Approve & Publish หลายสูตร</button>';
    $('library-summary')?.insertAdjacentElement('afterend',toolbar);
    const d=document.createElement('dialog');d.id='bhh-bulk-dialog';
    d.innerHTML='<div class="review-publish-head"><h2>Approve & Publish เป็นชุด</h2><button type="button" id="bhh-bulk-close">✕</button></div>'+
      '<div class="review-publish-content"><div id="bhh-bulk-list"></div><label>Pharmacist PIN <input type="password" id="bhh-bulk-token" autocomplete="off"></label>'+
      '<label><input type="checkbox" id="bhh-bulk-attest"> ยืนยัน Clinical Review ทุกสูตรในชุดแล้ว</label>'+
      '<p id="bhh-bulk-result" role="status"></p></div><div class="review-publish-actions"><button type="button" id="bhh-bulk-cancel">กลับ</button><button type="button" class="primary" id="bhh-bulk-confirm">Approve & Publish ชุดนี้</button></div>';
    document.body.appendChild(d);
    $('bhh-bulk-open').onclick=()=>{renderBatchList();$('bhh-bulk-attest').checked=false;$('bhh-bulk-token').value='';d.showModal();};
    $('bhh-bulk-close').onclick=()=>{if(!busy)d.close();};$('bhh-bulk-cancel').onclick=()=>{if(!busy)d.close();};
    $('bhh-bulk-confirm').onclick=persistBatch;
    $('bhh-bulk-list').onclick=e=>{const btn=e.target.closest('[data-bulk-remove]');if(!btn||busy)return;reviewQueue.delete(btn.dataset.bulkRemove);refreshBatchUI();renderBatchList();};
    refreshBatchUI();
  }
  function refreshBatchUI() {
    if(!$('bhh-bulk-open'))return;
    $('bhh-bulk-open').disabled=!reviewQueue.size;
    $('bhh-bulk-count').textContent='พร้อมตรวจและอนุมัติ '+reviewQueue.size+' สูตร · สูงสุด '+BULK_LIMIT;
  }
  function queueCurrent(){
    try {
      const fields=readForm(),id=reviewItem.master.catalog_id;
      if(!reviewItem.structured)throw Error('ต้องสร้าง Structured Regimen ใน Builder ก่อนเพิ่มเข้าชุด');
      if(reviewQueue.size>=BULK_LIMIT&&!reviewQueue.has(id))throw Error('ได้สูงสุด '+BULK_LIMIT+' สูตร');
      copyStructured(reviewItem,fields); // Reject free-text schedule/dose edits not yet structured.
      reviewQueue.set(id,{item:reviewItem,fields});refreshBatchUI();
      $('review-publish-dialog').close();
    }catch(e){failure(e);}
  }
  function renderBatchList(){
    $('bhh-bulk-list').innerHTML=[...reviewQueue].map(([id,x])=>'<p><strong>'+E(x.item.master.name)+'</strong> <button class="secondary" type="button" data-bulk-remove="'+E(id)+'">Remove</button></p>').join('')||'No selected regimens';
  }
  async function persistBatch(){
    if(busy)return;
    const result=$('bhh-bulk-result');
    try {
      if(!$('bhh-bulk-attest').checked)throw Error('กรุณายืนยันการทบทวนทุกสูตร');
      const pin=$('bhh-bulk-token').value.trim();if(!pin)throw Error('กรุณากรอก Pharmacist PIN');
      busy=true;$('bhh-bulk-confirm').disabled=true;
      const success=[],errors=[];
      for(const [id,data] of reviewQueue){
        result.textContent='กำลัง Publish '+(success.length+errors.length+1)+'/'+reviewQueue.size;
        try{await publish(data.item,data.fields,pin);success.push(id);}
        catch(e){errors.push(id+': '+e.message);}
      }
      success.forEach(id=>reviewQueue.delete(id));refreshBatchUI();renderBatchList();
      result.textContent='Published สำเร็จ '+success.length+' · ล้มเหลว '+errors.length+(errors.length?' — '+errors.join(' | '):'');
      if(!errors.length)setTimeout(()=>{if($('bhh-bulk-dialog').open)$('bhh-bulk-dialog').close();},1200);
    }catch(e){result.textContent=e.message;}
    finally{busy=false;$('bhh-bulk-token').value='';$('bhh-bulk-confirm').disabled=reviewQueue.size===0;}
  }
  window.BHH_PUBLISH={open,checkReference};
})();
