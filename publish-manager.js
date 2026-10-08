/* Production GitHub Pages: pharmacist Review -> Approve & Publish.
   Repository changes require a GitHub fine-grained token with Contents: Read and write,
   restricted to JuiPharm/BHH_Chemotherapy_Calculator_V2. Token exists in memory only. */
(() => {
  'use strict';
  const OWNER = 'JuiPharm';
  const REPO = 'BHH_Chemotherapy_Calculator_V2';
  const PATH = 'data/guideline-status.v2.4.json';
  const API = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + PATH;
  const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
  const SOURCE_DOMAINS = {
    'NCCN': ['nccn.org'],
    'NCI Thailand': ['nci.go.th'],
    'ASCO': ['asco.org', 'ascopubs.org', 'jco.org'],
    'BC Cancer': ['bccancer.bc.ca'],
  };
  let token = '';
  let reviewItem = null;
  let busy = false;
  const reviewQueue = new Map();
  const BULK_LIMIT = 25;
  const escape = value => String(value ?? '').replace(/[&<>"']/g,
    char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const $ = (id) => document.getElementById(id);

  function ui() {
    if ($('review-publish-dialog')) return;
    const d = document.createElement('dialog');
    d.id = 'review-publish-dialog';
    d.setAttribute('aria-labelledby', 'review-publish-heading');
    d.innerHTML = '<div class="review-publish-head"><h2 id="review-publish-heading">Review → Approve & Publish</h2><button id="review-publish-close" type="button" aria-label="Close">✕</button></div>' +
      '<form id="review-publish-form"><div class="review-publish-content">' +
      '<p class="review-publish-help">แก้ไขข้อมูลที่จำเป็น ตรวจสอบกับ Guideline ฉบับจริง แล้วกด <strong>Approve & Publish</strong> เพื่อบันทึกลง GitHub Production</p>' +
      '<div id="review-publish-name"></div>' +
      '<label>ข้อบ่งใช้ (Indication)<textarea id="review-publish-indication" rows="2" required></textarea></label>' +
      '<label>รอบการรักษา (Cycle schedule)<input id="review-publish-cycle" required /></label>' +
      '<div id="review-publish-orders"></div>' +
      '<div class="review-publish-two"><label>แหล่งอ้างอิง<select id="review-publish-source" required><option value="">เลือก Guideline</option><option>NCCN</option><option>NCI Thailand</option><option>ASCO</option><option>BC Cancer</option></select></label>' +
      '<label>Protocol ID / Version (ถ้ามี)<input id="review-publish-protocol" placeholder="เช่น GICOXB / 2026" /></label></div>' +
      '<label>ลิงก์ Guideline ที่ใช้ตรวจสอบ<input id="review-publish-url" type="url" placeholder="https://..." required /></label>' +
      '<label>หมายเหตุผลการตรวจสอบ<textarea id="review-publish-notes" rows="2" placeholder="แก้ไขข้อมูลใด / มีเงื่อนไขการใช้เพิ่มเติม"></textarea></label>' +
      '<label class="review-publish-check"><input id="review-publish-attest" type="checkbox" required /> <span>ยืนยันว่าตรวจชนิดมะเร็ง ข้อบ่งใช้ ยา ขนาดยา หน่วย วันให้ยา และรอบยาเทียบกับ Guideline ฉบับจริงแล้ว</span></label>' +
      '<div class="review-publish-token"><p><strong>เชื่อม GitHub เพื่อบันทึกลง Production</strong> (เฉพาะครั้งแรกในหน้าที่เปิดอยู่)</p>' +
      '<label>GitHub fine-grained token<input id="review-publish-token" type="password" autocomplete="off" placeholder="Token แบบ Contents: Read and write" /></label>' +
      '<small>เลือก Repository นี้เพียงแห่งเดียวและให้สิทธิ์ Contents: Read and write เท่านั้น ไม่เก็บ token ในไฟล์หรือ localStorage · <a id="review-publish-token-guide" target="_blank" rel="noopener noreferrer" href="' + TOKEN_URL + '">สร้าง Token ที่ GitHub</a></small></div>' +
      '<p id="review-publish-message" role="status" aria-live="polite"></p></div>' +
      '<div class="review-publish-actions"><button type="button" id="review-publish-queue">เพิ่มเข้าชุดอนุมัติ</button><button type="button" id="review-publish-save">บันทึกข้อมูล (รอตรวจต่อ)</button><button type="submit" id="review-publish-confirm" class="primary">Approve & Publish</button></div>' +
      '<p class="review-publish-foot">Published = เปิดแสดงสูตรบน Production; การคำนวณอัตโนมัติจะยังไม่เปิดจนกว่า Structured Calculation ผ่านการทดสอบ ไม่เปลี่ยน 6 สูตร Pilot เดิม</p></form>';
    document.body.appendChild(d);
    $('review-publish-close').addEventListener('click', () => { if (!busy) d.close(); });
    $('review-publish-form').addEventListener('submit', event => { event.preventDefault(); persist('publish'); });
    $('review-publish-save').addEventListener('click', () => persist('save'));
    $('review-publish-queue').addEventListener('click', queueCurrent);
    addBatchUI();
    $('review-publish-source').addEventListener('change', () => $('review-publish-url').setCustomValidity(''));
    $('review-publish-url').addEventListener('input', () => $('review-publish-url').setCustomValidity(''));
  }

  function open(item) {
    if (!item || !item.master || item.structured) return;
    reviewItem = item;
    ui();
    $('review-publish-name').innerHTML = '<strong>' + escape(item.master.name) + '</strong><p>' + escape(item.master.catalog_id) + ' · ' + escape(item.status) + '</p>';
    const saved = reviewQueue.get(item.master.catalog_id)?.fields;
    $('review-publish-indication').value = saved?.corrected_indication || item.master.indication || '';
    $('review-publish-cycle').value = saved?.corrected_cycle_text || item.master.cycle_text || '';
    $('review-publish-source').value = saved?.source || item.guidelineReference?.source || '';
    $('review-publish-protocol').value = saved?.protocol || item.guidelineReference?.protocol || '';
    $('review-publish-url').value = saved?.reference_url || item.guidelineReference?.reference_url || '';
    $('review-publish-notes').value = saved?.review_note || item.guidelineReference?.review_note || '';
    $('review-publish-attest').checked = false;
    $('review-publish-token').value = '';
    $('review-publish-token').placeholder = token ? 'เชื่อมต่อแล้วสำหรับหน้าที่เปิดอยู่นี้' : 'Token แบบ Contents: Read and write';
    $('review-publish-message').textContent = '';
    $('review-publish-orders').innerHTML = '<h3>รายการยาและขนาดยา</h3>' +
      (saved?.corrected_drugs || item.master.drugs || []).map((drug, index) =>
        '<section class="review-publish-drug" data-drug-index="' + index + '"><strong>' + escape(drug['ชื่อยา']) + '</strong>' +
        '<label>ขนาดยา (Dose) <input class="review-dose" value="' + escape(drug['ขนาดยา']) + '" required /></label>' +
        '<label>ความถี่/วันให้ยา <input class="review-frequency" value="' + escape(drug['ความถี่ในการให้']) + '" required /></label></section>').join('');
    $('review-publish-dialog').showModal();
  }

  function checkReference(source, rawUrl) {
    let u;
    try { u = new URL(rawUrl); } catch { throw Error('กรุณาใส่ URL ของ Guideline ที่ถูกต้อง'); }
    if (u.protocol !== 'https:' || u.username || u.password) throw Error('URL ต้องเป็น https:// เท่านั้น');
    const allowed = SOURCE_DOMAINS[source] || [];
    if (!allowed.some(domain => u.hostname === domain || u.hostname.endsWith('.' + domain)))
      throw Error('เว็บไซต์อ้างอิงไม่ตรงกับ ' + source + ' กรุณาตรวจ URL');
    return u.href;
  }

  function readForm() {
    const f = $('review-publish-form');
    if (!f.reportValidity()) throw Error('กรุณากรอกข้อมูลและยืนยันการตรวจทานให้ครบ');
    const source = $('review-publish-source').value;
    const refUrl = checkReference(source, $('review-publish-url').value.trim());
    const drugs = (reviewItem.master.drugs || []).map((d,index) => {
      const block = $('review-publish-orders').querySelector('[data-drug-index="' + index + '"]');
      return { ...d,
        'ขนาดยา': block.querySelector('.review-dose').value.trim(),
        'ความถี่ในการให้': block.querySelector('.review-frequency').value.trim(),
      };
    });
    if (drugs.some(x => !x['ขนาดยา'] || !x['ความถี่ในการให้'])) throw Error('ข้อมูลยาไม่ครบ');
    return {
      source, reference_url: refUrl, protocol: $('review-publish-protocol').value.trim(),
      corrected_indication: $('review-publish-indication').value.trim(),
      corrected_cycle_text: $('review-publish-cycle').value.trim(), corrected_drugs: drugs,
      review_note: $('review-publish-notes').value.trim(),
    };
  }

  function fromBase64(base64) {
    const binary = atob(base64.replace(/\s/g,''));
    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)));
  }
  function toBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  }
  async function github(url,options={}) {
    const r=await fetch(url,{...options,headers:{
      Accept:'application/vnd.github+json',
      Authorization:'Bearer '+token,
      'X-GitHub-Api-Version':'2022-11-28',
      ...(options.body?{'Content-Type':'application/json'}:{}),
    },cache:'no-store'});
    if(!r.ok){
      let m;try{m=(await r.json()).message}catch{}
      if(r.status===401) throw Error('GitHub token ไม่ถูกต้องหรือหมดอายุ');
      if(r.status===403) throw Error('ไม่มีสิทธิ์แก้ Repo: ต้องเลือก Contents: Read and write');
      if(r.status===409) throw Error('ฐานข้อมูลมีการเปลี่ยนแปลงพร้อมกัน กรุณา Refresh แล้วลองอีกครั้ง');
      throw Error('GitHub ('+r.status+'): '+(m||'บันทึกไม่สำเร็จ'));
    }
    return r.json();
  }

  async function persist(action) {
    if(busy || !reviewItem)return;
    try {
      const fields = readForm();
      const inputToken = $('review-publish-token').value.trim();
      if(inputToken) token=inputToken;
      if(!token) throw Error('กรุณาใส่ GitHub token สำหรับบันทึกครั้งแรก');
      busy=true;
      $('review-publish-confirm').disabled=true;
      $('review-publish-save').disabled=true;
      $('review-publish-queue').disabled=true;
      $('review-publish-close').disabled=true;
      $('review-publish-message').textContent='กำลังบันทึกการตรวจทานลง GitHub...';
      const [who, latest] = await Promise.all([
        github('https://api.github.com/user'),
        github(API+'?ref=main'),
      ]);
      if (!who.login) throw Error('ไม่สามารถยืนยันบัญชี GitHub ได้');
      const records = JSON.parse(fromBase64(latest.content));
      if (!Array.isArray(records)) throw Error('ฐานข้อมูลสถานะไม่ถูกต้อง');
      const id=reviewItem.master.catalog_id;
      const i=records.findIndex(row=>row.catalog_id===id);
      const old = i>=0 ? records[i] : {};
      const originalStatus = old.status || reviewItem.status || 'clinical_review_required';
      const toPublish = action==='publish';
      const replacement = {
        ...old,
        catalog_id:id,
        name:reviewItem.master.name,
        indication:fields.corrected_indication,
        status:toPublish?'approved_published':(originalStatus==='blocked'?'blocked':'published_review'),
        approved:toPublish,
        published:toPublish,
        calculator_enabled:false,
        ...fields,
        reviewed_by:who.login,
        reviewed_at:new Date().toISOString(),
        approval_method:toPublish?'pharmacist_user_review':'draft_correction',
      };
      if(i>=0)records[i]=replacement;else records.push(replacement);
      const payload={message:(toPublish?'Approve and publish ':'Save clinical review for ')+id+
        ' by @'+who.login,
        content:toBase64(JSON.stringify(records,null,2)+'\n'),
        sha:latest.sha,branch:'main'};
      const committed=await github(API,{method:'PUT',body:JSON.stringify(payload)});
      if (!committed?.commit?.sha) throw Error('GitHub ไม่ส่งเลข Commit กลับมา กรุณาตรวจ Repository');
      $('review-publish-message').innerHTML='<strong>บันทึกสำเร็จ ✓</strong> — '+(toPublish?
        'Approved + Published':'บันทึกไว้รอตรวจต่อ')+
        '. GitHub Pages จะปรับข้อมูลบน Production หลัง Deploy (ปกติประมาณ 1–3 นาที) '+
        '<a href="https://github.com/'+OWNER+'/'+REPO+'/actions" target="_blank" rel="noopener noreferrer">ดูสถานะ Deploy</a>';
      $('review-publish-token').value='';
      // Changes stay in central repository. Do not promise immediate live status before Pages deploy.
    } catch(e) {
      $('review-publish-message').textContent='ไม่สำเร็จ: '+String(e.message||e);
    } finally {
      busy=false;
      $('review-publish-confirm').disabled=false;
      $('review-publish-save').disabled=false;
      $('review-publish-queue').disabled=false;
      $('review-publish-close').disabled=false;
    }
  }

  function queueCurrent() {
    try {
      if (!reviewItem) return;
      const fields = readForm();
      const id = reviewItem.master.catalog_id;
      if (reviewQueue.size >= BULK_LIMIT && !reviewQueue.has(id))
        throw Error('จำกัดครั้งละ ' + BULK_LIMIT + ' สูตร กรุณา Publish ชุดนี้ก่อน');
      reviewQueue.set(id, {item: reviewItem, fields});
      refreshBatchUI();
      $('review-publish-dialog').close();
    } catch (e) {
      $('review-publish-message').textContent = 'ยังเพิ่มเข้าชุดไม่ได้: ' + String(e.message || e);
    }
  }

  function addBatchUI() {
    if ($('bhh-bulk-publish')) return;
    const wrap = document.createElement('div');
    wrap.id = 'bhh-bulk-publish';
    wrap.innerHTML =
      '<span id="bhh-bulk-count">ยังไม่ได้เลือกสูตรสำหรับอนุมัติ</span>' +
      '<button type="button" id="bhh-bulk-open" disabled>Approve & Publish หลายสูตร</button>';
    const summary = $('library-summary');
    if (summary) summary.insertAdjacentElement('afterend', wrap);
    else document.body.appendChild(wrap);
    $('bhh-bulk-open').addEventListener('click', openBatch);

    const d=document.createElement('dialog');
    d.id='bhh-bulk-dialog';
    d.setAttribute('aria-labelledby','bhh-bulk-title');
    d.innerHTML = '<div class="review-publish-head"><h2 id="bhh-bulk-title">Approve & Publish เป็นชุด</h2>' +
      '<button type="button" id="bhh-bulk-close">✕</button></div>' +
      '<div class="review-publish-content">' +
      '<p>อนุมัติเฉพาะสูตรที่คุณเปิด Review ตรวจครบ และกด “เพิ่มเข้าชุดอนุมัติ” แล้ว</p>' +
      '<div id="bhh-bulk-list"></div>' +
      '<label>GitHub token (ใส่หนึ่งครั้งต่อชุด และใช้ซ้ำได้ในหน้าเว็บที่เปิดอยู่นี้)' +
      '<input id="bhh-bulk-token" type="password" autocomplete="off" placeholder="Contents: Read and write"/></label>' +
      '<label class="review-publish-check"><input type="checkbox" id="bhh-bulk-attest"/>' +
      '<span>ยืนยันว่าตรวจทุกสูตรในรายการนี้เทียบกับ Guideline แล้ว และอนุมัติการเผยแพร่พร้อมกัน</span></label>' +
      '<p id="bhh-bulk-result" role="status" aria-live="polite"></p></div>' +
      '<div class="review-publish-actions"><button type="button" id="bhh-bulk-cancel">กลับไปตรวจเพิ่ม</button>' +
      '<button type="button" id="bhh-bulk-confirm" class="primary">Approve & Publish ชุดนี้</button></div>';
    document.body.appendChild(d);
    $('bhh-bulk-close').addEventListener('click',()=>{if(!busy)d.close()});
    $('bhh-bulk-cancel').addEventListener('click',()=>{if(!busy)d.close()});
    $('bhh-bulk-confirm').addEventListener('click',persistBatch);
    $('bhh-bulk-list').addEventListener('click', e => {
      if (busy) return;
      const btn=e.target.closest('[data-bulk-remove]');
      if (!btn) return;
      reviewQueue.delete(btn.dataset.bulkRemove);
      refreshBatchUI(); renderBatchList();
    });
    refreshBatchUI();
  }

  function refreshBatchUI() {
    if (!$('bhh-bulk-open')) return;
    $('bhh-bulk-open').disabled = reviewQueue.size===0;
    $('bhh-bulk-count').textContent = 'ตรวจครบแล้ว ' + reviewQueue.size + ' สูตร · พร้อมอนุมัติพร้อมกัน (สูงสุด ' + BULK_LIMIT + ')';
  }

  function renderBatchList() {
    $('bhh-bulk-list').innerHTML = Array.from(reviewQueue, ([id, data]) =>
      '<div class="bhh-bulk-item"><div><strong>'+escape(id)+'</strong> · '+escape(data.item.master.name)+
      '<small>'+escape(data.fields.source)+' · '+escape(data.fields.reference_url)+'</small></div>'+
      '<button type="button" data-bulk-remove="'+escape(id)+'">นำออก</button></div>').join('')
      || '<p>ยังไม่มีสูตรในชุดอนุมัติ</p>';
    $('bhh-bulk-confirm').disabled=reviewQueue.size===0;
  }

  function openBatch() {
    if (!reviewQueue.size) return;
    addBatchUI(); renderBatchList();
    $('bhh-bulk-attest').checked=false;
    $('bhh-bulk-result').textContent='';
    $('bhh-bulk-token').value='';
    $('bhh-bulk-token').placeholder=token?'เชื่อมต่อแล้วในหน้าเว็บนี้':'GitHub token สำหรับบันทึกชุดนี้';
    $('bhh-bulk-dialog').showModal();
  }

  async function persistBatch() {
    if (busy || !reviewQueue.size) return;
    try {
      if (!$('bhh-bulk-attest').checked)
        throw Error('โปรดยืนยันการตรวจทานทุกรายการก่อนกด Publish');
      const t=$('bhh-bulk-token').value.trim();
      if(t) token=t;
      if(!token) throw Error('ต้องยืนยันสิทธิ์ GitHub สำหรับการบันทึกครั้งแรก');
      busy=true;
      $('bhh-bulk-confirm').disabled=true;
      $('bhh-bulk-close').disabled=true;
      $('bhh-bulk-cancel').disabled=true;
      $('bhh-bulk-result').textContent='กำลังส่ง '+reviewQueue.size+' สูตรใน Commit เดียว...';
      const [who, latest] = await Promise.all([
        github('https://api.github.com/user'),
        github(API+'?ref=main'),
      ]);
      if(!who.login) throw Error('ยืนยันบัญชี GitHub ไม่สำเร็จ');
      const records=JSON.parse(fromBase64(latest.content));
      if(!Array.isArray(records))throw Error('โครงสร้างข้อมูลไม่ถูกต้อง');
      const stored=new Map(records.map((r,i)=>[r.catalog_id,i]));
      const timestamp=new Date().toISOString();
      // Batch fails in full if a reviewed regimen has changed centrally since it was reviewed.
      for(const [id, data] of reviewQueue) {
        const idx=stored.get(id);
        const original=idx===undefined?{}:records[idx];
        const baseline=data.item.guidelineReference;
        if((original.reviewed_at||null)!==(baseline?.reviewed_at||null))
          throw Error('Regimen '+id+' มีการแก้ไขใหม่ กรุณา Refresh แล้ว Review อีกครั้ง');
        const next={
          ...original,
          catalog_id:id,
          name:data.item.master.name,
          indication:data.fields.corrected_indication,
          status:'approved_published',
          approved:true,published:true,calculator_enabled:false,
          ...data.fields,
          reviewed_by:who.login,reviewed_at:timestamp,
          approval_method:'batch_pharmacist_user_review',
        };
        if(idx===undefined){stored.set(id,records.length);records.push(next);}
        else records[idx]=next;
      }
      const ids=Array.from(reviewQueue.keys());
      const result=await github(API,{method:'PUT',body:JSON.stringify({
        message:'Bulk clinical review and publication: '+ids.join(', ')+' by @'+who.login,
        content:toBase64(JSON.stringify(records,null,2)+'\n'),
        sha:latest.sha,branch:'main',
      })});
      if(!result?.commit?.sha) throw Error('ไม่มีการยืนยัน Commit จาก GitHub');
      for(const entry of reviewQueue.values()) entry.item.status='approved_published';
      reviewQueue.clear(); refreshBatchUI(); renderBatchList();
      $('bhh-bulk-result').innerHTML='บันทึกสำเร็จ ✓ ' + ids.length +
        ' สูตร ใน Commit เดียว · <a href="https://github.com/'+OWNER+'/'+REPO+
        '/actions" target="_blank" rel="noopener noreferrer">ตรวจผล Deploy</a>';
      $('bhh-bulk-token').value='';
    } catch (e) {
      $('bhh-bulk-result').textContent='ไม่สำเร็จ: '+String(e.message||e);
    } finally {
      busy=false;
      $('bhh-bulk-confirm').disabled=reviewQueue.size===0;
      $('bhh-bulk-close').disabled=false;
      $('bhh-bulk-cancel').disabled=false;
    }
  }

  window.BHH_PUBLISH={open};
})();
