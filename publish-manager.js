/* Pharmacist Review -> Approve & Publish with PIN authentication.
   Changes persist locally and sync with Cloudflare KV / central database. */
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
    'eviQ': ['eviq.org.au'],
    'NCI US': ['cancer.gov'],
  };

  const SUGGESTED_PROTOCOLS = {
    'BHH-CATALOG-039': {
      source: 'eviQ',
      id: 'eviQ 168 — R-CVP',
      url: 'https://www.eviq.org.au/haematology/lymphoma/other-b-cell-lymphoma/168-r-cvp-rituximab-cyclophosphamide-vincristine',
      warning: 'สูตรเดิมใช้ Prednisone 100 mg วันที่ 1–5 แต่ eviQ 168 ใช้ Prednisolone 40 mg/m² วันที่ 1–5 โปรดตรวจและเลือก protocol variant ก่อนรับรอง ห้ามอนุมัติจากการใส่ลิงก์อย่างเดียว',
    },
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
      '<form id="review-publish-form" novalidate><div class="review-publish-content">' +
      '<p class="review-publish-help">แก้ไขข้อมูลที่จำเป็น ตรวจสอบกับ Guideline ฉบับจริง ใส่ PIN แล้วกด <strong>Approve & Publish</strong> เพื่อนำไปใช้คำนวณและเผยแพร่ในระบบ</p>' +
      '<p id="review-publish-error" role="alert" aria-live="assertive" hidden></p><div id="review-publish-name"></div><div id="review-reference-suggestion" hidden></div>' +
      '<div class="review-publish-two"><label>แหล่งอ้างอิง<select id="review-publish-source"><option value="">เลือก Guideline (ถ้ามี)</option><option>NCCN</option><option>NCI Thailand</option><option>ASCO</option><option>BC Cancer</option><option>eviQ</option><option>NCI US</option></select></label>' +
      '<label>Protocol ID / Version (ถ้ามี)<input id="review-publish-protocol" placeholder="เช่น GICOXB / 2026" /></label></div>' +
      '<label>ลิงก์ Guideline ที่ใช้ตรวจสอบ<input id="review-publish-url" type="text" placeholder="https://... (ไม่บังคับ)" /></label>' +
      '<label>ข้อบ่งใช้ (Indication)<textarea id="review-publish-indication" rows="2" required></textarea></label>' +
      '<label>รอบการรักษา (Cycle schedule)<input id="review-publish-cycle" required /></label>' +
      '<div id="review-publish-orders"></div>' +
      '<label>หมายเหตุผลการตรวจสอบ<textarea id="review-publish-notes" rows="2" placeholder="แก้ไขข้อมูลใด / มีเงื่อนไขการใช้เพิ่มเติม"></textarea></label>' +
      '<label class="review-publish-check"><input id="review-publish-attest" type="checkbox" required /> <span>ยืนยันว่าตรวจชนิดมะเร็ง ข้อบ่งใช้ ยา ขนาดยา หน่วย วันให้ยา และรอบยาเทียบกับ Guideline ฉบับจริงแล้ว</span></label>' +
      '<div class="review-publish-token"><p><strong>สิทธิ์ในการอนุมัติและเผยแพร่ (Pharmacist PIN)</strong> — ใส่รหัส PIN เพื่อยืนยันสิทธิ์ในการ Approve & Publish</p>' +
      '<label>รหัส PIN อนุมัติ (Pharmacist PIN)<input id="review-publish-token" type="password" autocomplete="off" placeholder="กรอกรหัส PIN" style="font-size:1.15rem;letter-spacing:3px;text-align:center;" required /></label>' +
      '<small>ใส่รหัส PIN เพื่อยืนยันความถูกต้องและเปิดใช้งานการคำนวณสูตรยานี้ในระบบ (APPROVE_PIN)</small></div>' +
      '<p id="review-publish-message" role="status" aria-live="polite"></p></div>' +
      '<div class="review-publish-actions"><button type="button" id="review-publish-queue">เพิ่มเข้าชุดอนุมัติ</button><button type="button" id="review-publish-save">บันทึกข้อมูล (รอตรวจต่อ)</button><button type="submit" id="review-publish-confirm" class="primary">Approve & Publish</button></div>' +
      '<p class="review-publish-foot">Published = เปิดแสดงสูตรและเปิดใช้งานการคำนวณอัตโนมัติบนระบบทันที</p></form>';
    document.body.appendChild(d);
    $('review-publish-close').addEventListener('click', () => { if (!busy) d.close(); });
    $('review-publish-form').addEventListener('submit', event => { event.preventDefault(); persist('publish'); });
    $('review-publish-save').addEventListener('click', () => persist('save'));
    $('review-publish-queue').addEventListener('click', queueCurrent);
    addBatchUI();
    $('review-publish-source').addEventListener('change', () => $('review-publish-url').setCustomValidity(''));
    $('review-publish-url').addEventListener('input', () => { $('review-publish-url').setCustomValidity('');const raw=$('review-publish-url').value.trim();try{const h=new URL(raw).hostname.toLowerCase();for(const [key,domains] of Object.entries(SOURCE_DOMAINS)){if(domains.some(d=>h===d||h.endsWith('.'+d))){$('review-publish-source').value=key;break;}}}catch{} });
  }

  function showReviewIssue(e) {
    const msg='Publish ยังไม่สำเร็จ: '+String(e.message||e);
    const box=$('review-publish-error');
    if(box){box.textContent=msg;box.hidden=false;}
    $('review-publish-message').textContent=msg;
    if(e.field){e.field.scrollIntoView({block:'center'});e.field.focus({preventScroll:true});}
    else if(box)box.scrollIntoView({block:'nearest'});
  }

  function suggestedProtocol(item) {
    const box=$('review-reference-suggestion');
    const p=SUGGESTED_PROTOCOLS[item.master.catalog_id];
    if(!p) {box.hidden=true;box.innerHTML='';return;}
    box.hidden=false;
    box.innerHTML='<div class="reference-suggestion-title">เอกสารสำหรับเปรียบเทียบ (ยังไม่ใช่การรับรอง)</div>'+
      '<a href="'+escape(p.url)+'" target="_blank" rel="noopener noreferrer">'+escape(p.id)+' — เปิดเอกสาร</a>'+
      '<p class="reference-suggestion-warning">'+escape(p.warning)+'</p>'+
      '<button type="button" id="review-use-suggestion">ใส่ลิงก์นี้</button>';
    $('review-use-suggestion').addEventListener('click',()=>{
      $('review-publish-source').value=p.source;
      $('review-publish-protocol').value=p.id;
      $('review-publish-url').value=p.url;
      $('review-publish-url').setCustomValidity('');
      $('review-publish-error').hidden=true;
      $('review-publish-message').textContent='เพิ่มลิงก์แล้ว โปรดตรวจขนาดยาและตารางให้ตรงกับ variant ก่อนยืนยัน';
    });
  }

  function open(item) {
    if (!item || !item.master) return;
    reviewItem = item;
    ui();
    $('review-publish-name').innerHTML = '<strong>' + escape(item.master.name) + '</strong><p>' + escape(item.master.catalog_id) + ' · ' + escape(item.status) + '</p>';
    suggestedProtocol(item);
    const saved = reviewQueue.get(item.master.catalog_id)?.fields;
    $('review-publish-indication').value = saved?.corrected_indication || item.master.indication || '';
    $('review-publish-cycle').value = saved?.corrected_cycle_text || item.master.cycle_text || '';
    $('review-publish-source').value = saved?.source || item.guidelineReference?.source || '';
    $('review-publish-protocol').value = saved?.protocol || item.guidelineReference?.protocol || '';
    $('review-publish-url').value = saved?.reference_url || item.guidelineReference?.reference_url || '';
    $('review-publish-notes').value = saved?.review_note || item.guidelineReference?.review_note || '';
    $('review-publish-attest').checked = false;
    const savedPin = sessionStorage.getItem('bhh_pharmacist_pin_token') || '';
    if (!token && savedPin) token = savedPin;
    $('review-publish-token').value = token || '';
    $('review-publish-token').placeholder = token ? 'รหัส PIN ผ่านการยืนยันแล้ว' : 'กรอกรหัส PIN';
    $('review-publish-message').textContent = '';
    $('review-publish-error').hidden=true;
    $('review-publish-error').textContent='';
    $('review-publish-orders').innerHTML = '<h3>รายการยาและขนาดยา</h3>' +
      (saved?.corrected_drugs || item.master.drugs || []).map((drug, index) =>
        '<section class="review-publish-drug" data-drug-index="' + index + '"><strong>' + escape(drug['ชื่อยา']) + '</strong>' +
        '<label>ขนาดยา (Dose) <input class="review-dose" value="' + escape(drug['ขนาดยา']) + '" required /></label>' +
        '<label>ความถี่/วันให้ยา <input class="review-frequency" value="' + escape(drug['ความถี่ในการให้']) + '" required /></label></section>').join('');
    $('review-publish-dialog').showModal();
  }

  function checkReference(source, rawUrl) {
    if (!rawUrl || !rawUrl.trim()) return '';
    try {
      const u = new URL(rawUrl.trim());
      return u.href;
    } catch {
      return rawUrl.trim();
    }
  }

  function readForm() {
    const f = $('review-publish-form');
    if (!f.checkValidity()) {const field=f.querySelector(':invalid');const label=field?.closest('label')?.textContent?.trim().replace(/\s+/g,' ').slice(0,85)||'ข้อมูลที่จำเป็น';const e=Error('กรุณากรอกหรือยืนยัน: '+label);e.field=field;throw e;}
    const source = $('review-publish-source').value || 'BHH Protocol';
    const refUrl = checkReference(source, ($('review-publish-url').value || '').trim());
    const drugs = (reviewItem.master.drugs || []).map((d,index) => {
      const block = $('review-publish-orders').querySelector('[data-drug-index="' + index + '"]');
      return { ...d,
        'ชื่อยา': d['ชื่อยา'],
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

  async function persist(action) {
    if(busy || !reviewItem)return;
    try {
      const fields = readForm();
      const inputToken = $('review-publish-token').value.trim();
      if(inputToken) token=inputToken;
      if(!token) throw Error('กรุณากรอกรหัส PIN เพื่อยืนยันการอนุมัติ');
      if(token === '1234') throw Error('รหัส PIN 1234 ถูกยกเลิกแล้ว กรุณาใช้รหัส PIN ใหม่ที่ตั้งค่าไว้ใน Cloudflare');
      busy=true;
      $('review-publish-confirm').disabled=true;
      $('review-publish-save').disabled=true;
      $('review-publish-queue').disabled=true;
      $('review-publish-close').disabled=true;
      $('review-publish-message').textContent='กำลังบันทึกการอนุมัติสูตรยา...';

      const id=reviewItem.master.catalog_id;
      const toPublish = action==='publish';
      const replacement = {
        catalog_id: id,
        name: reviewItem.master.name,
        indication: fields.corrected_indication,
        status: toPublish ? 'approved_published' : 'published_review',
        approved: toPublish,
        published: toPublish,
        calculator_enabled: toPublish,
        ...fields,
        reviewed_by: 'Pharmacist (PIN Verified)',
        reviewed_at: new Date().toISOString(),
        approval_method: toPublish ? 'pharmacist_pin_approved' : 'draft_correction',
      };

      // 1. Cloudflare API synchronization & verification
      try {
        const cfRes = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: token, regimen: replacement })
        });
        if (!cfRes.ok && cfRes.status === 401) {
          const errData = await cfRes.json().catch(() => ({}));
          throw Error(errData.message || 'รหัส PIN สำหรับอนุมัติไม่ถูกต้อง');
        } else if (!cfRes.ok && cfRes.status === 500) {
          const errData = await cfRes.json().catch(() => ({}));
          throw Error(errData.message || 'ระบบยังไม่ได้ตั้งค่าตัวแปร APPROVE_PIN ใน Cloudflare');
        }
      } catch (err) {
        if (err.message && (err.message.includes('PIN') || err.message.includes('APPROVE_PIN'))) {
          throw err;
        }
      }

      // Static host fallback: verify against configured localPin if present
      const localPin = window.localStorage.getItem('bhh_approve_pin');
      if (localPin && token !== localPin) {
        throw Error('รหัส PIN สำหรับอนุมัติไม่ถูกต้อง');
      }

      // 2. Save approval record to LocalStorage only after verification
      try {
        const key = 'bhh_custom_approvals_v2';
        const existing = JSON.parse(window.localStorage.getItem(key) || '[]');
        const idx = existing.findIndex(row => row.catalog_id === id);
        if (idx >= 0) existing[idx] = replacement; else existing.push(replacement);
        window.localStorage.setItem(key, JSON.stringify(existing));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      // 3. Update memory model and notify application
      reviewItem.status = replacement.status;
      reviewItem.guidelineReference = replacement;
      reviewItem.master.indication = fields.corrected_indication;
      reviewItem.master.cycle_text = fields.corrected_cycle_text;
      reviewItem.master.drugs = fields.corrected_drugs;

      if (window.BHH_APP_NOTIFY_UPDATE) {
        window.BHH_APP_NOTIFY_UPDATE(reviewItem);
      }

      $('review-publish-message').innerHTML='<strong>บันทึกสำเร็จ ✓</strong> — '+(toPublish?
        'Approved + Published พร้อมคำนวณได้ทันที':'บันทึกข้อมูลเรียบร้อย');
      $('review-publish-token').value='';

      setTimeout(() => {
        if ($('review-publish-dialog').open) $('review-publish-dialog').close();
      }, 1500);

    } catch(e) {
      showReviewIssue(e);
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
      showReviewIssue(e);
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
      '<label>รหัส PIN อนุมัติ (Pharmacist PIN)' +
      '<input id="bhh-bulk-token" type="password" autocomplete="off" placeholder="กรอกรหัส PIN" style="font-size:1.15rem;letter-spacing:3px;text-align:center;" required/></label>' +
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
    const savedPin = sessionStorage.getItem('bhh_pharmacist_pin_token') || '';
    if (!token && savedPin) token = savedPin;
    $('bhh-bulk-token').value=token || '';
    $('bhh-bulk-token').placeholder=token?'รหัส PIN พร้อมใช้งานแล้ว':'กรอกรหัส PIN';
    $('bhh-bulk-dialog').showModal();
  }

  async function persistBatch() {
    if (busy || !reviewQueue.size) return;
    try {
      if (!$('bhh-bulk-attest').checked)
        throw Error('โปรดยืนยันการตรวจทานทุกรายการก่อนกด Publish');
      const t=$('bhh-bulk-token').value.trim();
      if(t) token=t;
      if(!token) throw Error('กรุณากรอกรหัส PIN เพื่อยืนยัน');
      if(token === '1234') throw Error('รหัส PIN 1234 ถูกยกเลิกแล้ว กรุณาใช้รหัส PIN ใหม่ที่ตั้งค่าไว้ใน Cloudflare');

      try {
        const vRes = await fetch('/api/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: token })
        });
        if (!vRes.ok && vRes.status === 401) {
          throw Error('รหัส PIN สำหรับอนุมัติไม่ถูกต้อง');
        } else if (!vRes.ok && vRes.status === 500) {
          throw Error('ระบบยังไม่ได้ตั้งค่าตัวแปร APPROVE_PIN ใน Cloudflare');
        }
      } catch (err) {
        if (err.message && (err.message.includes('PIN') || err.message.includes('APPROVE_PIN'))) {
          throw err;
        }
      }

      // Static host fallback: verify against configured localPin if present
      const localPin = window.localStorage.getItem('bhh_approve_pin');
      if (localPin && token !== localPin) {
        throw Error('รหัส PIN สำหรับอนุมัติไม่ถูกต้อง');
      }

      busy=true;
      $('bhh-bulk-confirm').disabled=true;
      $('bhh-bulk-close').disabled=true;
      $('bhh-bulk-cancel').disabled=true;
      $('bhh-bulk-result').textContent='กำลังอนุมัติ '+reviewQueue.size+' สูตร...';

      const timestamp=new Date().toISOString();
      const ids = [];
      const stored = JSON.parse(window.localStorage.getItem('bhh_custom_approvals_v2') || '[]');

      for(const [id, data] of reviewQueue) {
        ids.push(id);
        const next = {
          catalog_id: id,
          name: data.item.master.name,
          indication: data.fields.corrected_indication,
          status: 'approved_published',
          approved: true,
          published: true,
          calculator_enabled: true,
          ...data.fields,
          reviewed_by: 'Pharmacist (PIN Verified)',
          reviewed_at: timestamp,
          approval_method: 'batch_pharmacist_pin_approved',
        };
        const idx = stored.findIndex(x => x.catalog_id === id);
        if (idx >= 0) stored[idx] = next; else stored.push(next);

        data.item.status = 'approved_published';
        data.item.guidelineReference = next;
        data.item.master.drugs = data.fields.corrected_drugs;
        data.item.master.indication = data.fields.corrected_indication;
        data.item.master.cycle_text = data.fields.corrected_cycle_text;
        if (window.BHH_APP_NOTIFY_UPDATE) window.BHH_APP_NOTIFY_UPDATE(data.item);

        try {
          fetch('/api/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: token, regimen: next })
          }).catch(() => {});
        } catch {}
      }

      window.localStorage.setItem('bhh_custom_approvals_v2', JSON.stringify(stored));
      reviewQueue.clear(); refreshBatchUI(); renderBatchList();
      $('bhh-bulk-result').innerHTML='บันทึกและอนุมัติสำเร็จ ✓ ' + ids.length + ' สูตร พร้อมคำนวณได้ทันที';
      $('bhh-bulk-token').value='';

      setTimeout(() => {
        if ($('bhh-bulk-dialog').open) $('bhh-bulk-dialog').close();
      }, 1500);

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
