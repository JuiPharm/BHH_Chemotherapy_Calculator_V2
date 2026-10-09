let BHH_ACTIVE = [];
let BHH_MASTER = [];
let BHH_ROUNDING_DEFAULTS = [];
let BHH_GUIDELINE_STATUS = [];
let BHH_PEDIATRIC = [];
let catalog = [];
let activeById = {};
let roundingProfiles = {};
let isAdminUnlocked = sessionStorage.getItem('bhh_pharmacist_pin_unlocked') === 'true';

const $ = (s) => {
  const el = document.querySelector(s);
  if (!el) throw new Error(`Missing element ${s}`);
  return el;
};
const clone = (v) => JSON.parse(JSON.stringify(v));
const ROUNDING_KEY = 'bhh-chemo-v230-rounding-override';
let lastCalculation = null;
let selectedItem = null;

const TYPE_ORDER = [
  'Pediatric Oncology','Hematologic Malignancy','Lung / Thoracic','Breast','Colorectal',
  'Upper GI / Pancreatic','Gynecologic','Hepatobiliary','Genitourinary',
  'Head & Neck','Sarcoma','Skin / Melanoma'
];

function cancerTypeFromText(text='') {
  const t=String(text).toLowerCase();
  if (['lymphoma','leukemia','cll','waldenstrom','ต่อมน้ำเหลือง','เม็ดเลือดขาว'].some(k=>t.includes(k))) return 'Hematologic Malignancy';
  if (['lung','nsclc','sclc','mesothelioma','ปอด','เยื่อหุ้มปอด'].some(k=>t.includes(k))) return 'Lung / Thoracic';
  if (['breast','เต้านม'].some(k=>t.includes(k))) return 'Breast';
  if (['colorectal','colon','rectal','ลำไส้ใหญ่'].some(k=>t.includes(k))) return 'Colorectal';
  if (['ovarian','cervical','endometr','uter','รังไข่','ปากมดลูก','มดลูก'].some(k=>t.includes(k))) return 'Gynecologic';
  if (['testicular','bladder','prostate','renal','kidney','urothel','อัณฑะ','กระเพาะปัสสาวะ','ต่อมลูกหมาก','ไต'].some(k=>t.includes(k))) return 'Genitourinary';
  if (['gastric','gastroesophageal','esophageal','stomach','pancrea','กระเพาะอาหาร','หลอดอาหาร','ตับอ่อน'].some(k=>t.includes(k))) return 'Upper GI / Pancreatic';
  if (['biliary','cholangi','hepatocellular','liver','ตับ','ท่อน้ำดี','ถุงน้ำดี'].some(k=>t.includes(k))) return 'Hepatobiliary';
  if (['head and neck','hnscc','โพรงจมูก','คอหูจมูก'].some(k=>t.includes(k))) return 'Head & Neck';
  if (['sarcoma','ซอฟต์ทิชู'].some(k=>t.includes(k))) return 'Sarcoma';
  if (['melanoma','ผิวหนัง'].some(k=>t.includes(k))) return 'Skin / Melanoma';
  return 'Other';
}
const TYPE_LABELS={
'Pediatric Oncology':'Pediatric Oncology / สูตรมะเร็งเด็ก (ThaiPOG 2566)',
'Hematologic Malignancy':'Hematologic / มะเร็งระบบเลือด',
'Lung / Thoracic':'Lung / Thoracic / มะเร็งปอดและทรวงอก',
'Breast':'Breast / มะเร็งเต้านม','Colorectal':'Colorectal / มะเร็งลำไส้ใหญ่',
'Upper GI / Pancreatic':'Upper GI / Pancreatic / มะเร็งทางเดินอาหารส่วนต้นและตับอ่อน',
'Gynecologic':'Gynecologic / มะเร็งนรีเวช','Hepatobiliary':'Hepatobiliary / มะเร็งตับและทางเดินน้ำดี',
'Genitourinary':'Genitourinary / มะเร็งระบบทางเดินปัสสาวะและสืบพันธุ์ชาย',
'Head & Neck':'Head & Neck / มะเร็งศีรษะและคอ','Sarcoma':'Sarcoma / ซาร์โคมา','Skin / Melanoma':'Skin / Melanoma / มะเร็งผิวหนัง'
};
function activeCancerType(r) {
  const g=String(r.cancerGroup||'').toLowerCase();
  if (g.includes('hemat')) return 'Hematologic Malignancy';
  if (g.includes('breast')) return 'Breast';
  if (g.includes('colorectal')) return 'Colorectal';
  if (g.includes('genitourinary')) return 'Genitourinary';
  if (g.includes('gynec')) return 'Gynecologic';
  if (g.includes('lung')||g.includes('thoracic')) return 'Lung / Thoracic';
  return cancerTypeFromText(r.indication||'');
}
function structuredLink(name,indication) {
  if (name==='TCH regimen' && indication.includes('HER2-positive')) return 'BHH-BREAST-TCH-EVIQ53';
  if (name==='R-CHOP regimen' && indication.includes('DLBCL')) return 'BHH-HEME-RCHOP21-EVIQ70';
  if (name==='ABVD regimen' && indication.includes('Hodgkin')) return 'BHH-HODGKIN-ABVD-ADV-EVIQ56';
  if (name==='BEP regimen' && indication.includes('Testicular Cancer') && !indication.includes('Relapse')) return 'BHH-TESTICULAR-BEP-MET-EVIQ320';
  if (name==='Carboplatin-Paclitaxel regimen' && indication.includes('Ovarian Cancer')) return 'BHH-OVARIAN-CARBO-TAXOL-EVIQ252';
  return null;
}
function getGuidelineRecord(catalogId) {
  try {
    const local = JSON.parse(localStorage.getItem('bhh_custom_approvals_v2') || '[]');
    const foundLocal = local.find(r => r.catalog_id === catalogId);
    if (foundLocal) return foundLocal;
  } catch {}
  return BHH_GUIDELINE_STATUS.find(r=>r.catalog_id===catalogId)||null;
}
function displayStatus(item) {
  if (item.isPediatric) return 'APPROVED · PUBLISHED · PEDIATRIC REFERENCE';
  if (item.structuredLink) return 'APPROVED · PILOT';
  if (item.status==='approved_published') return 'APPROVED · PUBLISHED';
  if (item.status==='blocked') return 'BLOCKED · REVIEW';
  if (item.status==='published_review') return 'PUBLISHED · REVIEW';
  return 'CATALOG MASTER';
}
function statusBadge(item) {return item.structuredLink||item.status==='approved_published'?'badge-ok':'badge-neutral';}
function referenceDetails(item) {
  const r=item.guidelineReference;
  if (!r) return '';
  const source=r.reference_url?`<a href="${esc(r.reference_url)}" target="_blank" rel="noopener noreferrer">${esc(r.protocol||r.source||'Guideline source')}</a>`:'รอตรวจสอบเอกสารต้นฉบับ';
  return `<div class="micro">${esc(r.catalog_id)} · ${source}</div><div class="micro">${esc(r.note||'')}</div>`;
}

function parseMasterDrug(drug, index) {
  const text = String(drug['ขนาดยา'] || '').trim();
  const name = String(drug['ชื่อยา'] || '').trim();
  let maxDose = null;
  if (drug.maximum_dose) {
    const m = String(drug.maximum_dose).match(/(\d+(?:\.\d+)?)/);
    if (m) maxDose = parseFloat(m[1]);
  }
  
  let basis = 'bsa';
  let val = 0;
  let unit = 'mg';
  let options = undefined;
  
  if (/AUC\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/i.test(text)) {
    const m = text.match(/AUC\s*(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/i);
    basis = 'auc';
    options = [parseFloat(m[1]), parseFloat(m[2])];
    val = options[0];
  } else if (/AUC\s*(\d+(?:\.\d+)?)/i.test(text)) {
    const m = text.match(/AUC\s*(\d+(?:\.\d+)?)/i);
    basis = 'auc';
    val = parseFloat(m[1]);
  } else if (/(\d+(?:\.\d+)?)\s*mg\/m[²2]/i.test(text)) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*mg\/m[²2]/i);
    basis = 'bsa';
    val = parseFloat(m[1]);
  } else if (/(\d+(?:\.\d+)?)\s*g\/m[²2]/i.test(text)) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*g\/m[²2]/i);
    basis = 'bsa';
    val = parseFloat(m[1]) * 1000;
  } else if (/(\d+(?:\.\d+)?)\s*mg\/kg/i.test(text)) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*mg\/kg/i);
    basis = 'weight';
    val = parseFloat(m[1]);
  } else if (/(\d+(?:\.\d+)?)\s*mg\b/i.test(text)) {
    const m = text.match(/(\d+(?:\.\d+)?)\s*mg\b/i);
    basis = 'fixed';
    val = parseFloat(m[1]);
  } else if (/(\d+(?:,\d+)?)\s*(?:IU|units?)(?:\/m[²2])?/i.test(text)) {
    const m = text.match(/(\d+(?:,\d+)?)\s*(?:IU|units?)(?:\/m[²2])?/i);
    basis = /\/m[²2]/i.test(text) ? 'bsa' : 'fixed';
    val = parseFloat(m[1].replace(/,/g, ''));
    unit = 'IU';
  } else {
    const numVal = parseFloat(text.replace(/[^0-9.]/g, '')) || 100;
    basis = text.includes('/m') ? 'bsa' : (text.includes('/kg') ? 'weight' : 'fixed');
    val = numVal;
  }
  
  const clinicalRules = [];
  if (maxDose) {
    clinicalRules.push({ type: 'hard_max', value: maxDose, unit, reason: 'Protocol maximum cap: ' + maxDose + ' ' + unit });
  }
  
  return {
    id: `order-${index + 1}`,
    drugId: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    drugName: name,
    dose: {
      basis,
      value: val,
      unit,
      options,
      defaultOption: options ? options[0] : undefined,
      displayDenominator: basis === 'bsa' ? 'm²' : (basis === 'auc' ? 'AUC' : (basis === 'weight' ? 'kg' : ''))
    },
    route: 'IV',
    schedule: { days: [1] },
    roundingProfileId: 'BHH_NEAREST_10MG_DEFAULT',
    clinicalRules
  };
}

function buildStructuredFromMaster(m) {
  if (!m || ['BHH-CATALOG-046','BHH-CATALOG-048'].includes(m.catalog_id) || getGuidelineRecord(m.catalog_id)?.status==='blocked') return null;
  const orders = (m.drugs || []).map(parseMasterDrug);
  return {
    id: m.catalog_id || m.regimen_id,
    version: '1.0.0-catalog',
    name: m.name,
    cancerGroup: m.cancer_type,
    indication: m.indication,
    cycleIntervalDays: 21,
    cycleCount: 12,
    status: 'published',
    localApproval: true,
    lastReviewed: new Date().toISOString().split('T')[0],
    references: [],
    phases: [{
      id: 'phase-1',
      name: m.cycle_text || 'Standard Cycle',
      cycleStart: 1,
      cycleEnd: 12,
      orders
    }]
  };
}

function normalizeMaster(raw) {
  return raw.map((r,i)=>{
    const approval=getGuidelineRecord(`BHH-CATALOG-${String(i+1).padStart(3,'0')}`);
    const indication=String(approval?.corrected_indication||r['ชนิดของมะเร็ง']||'');
    const name=String(r['ชื่อสูตรยา']||'');
    const ct=cancerTypeFromText(indication);
    const sid=structuredLink(name,indication);
    return {regimen_id:`BHH-MASTER-${String(i+1).padStart(3,'0')}`,name,cancer_type:ct,cancer_type_label:TYPE_LABELS[ct]||ct,
      indication,cycle_text:String(approval?.corrected_cycle_text||r['รอบการรักษา']||''),drugs:Array.isArray(approval?.corrected_drugs)&&approval.corrected_drugs.length?approval.corrected_drugs:(Array.isArray(r['รายการยา'])?r['รายการยา']:[]),
      clinical_status:sid?'approved':(approval?.status||'clinical_review_required'),structured_regimen_id:sid,catalog_id:`BHH-CATALOG-${String(i+1).padStart(3,'0')}`};
  });
}

function rebuildCatalog() {
  activeById=Object.fromEntries(BHH_ACTIVE.map(r=>[r.id,r]));
  const linked=new Set(BHH_MASTER.map(x=>x.structured_regimen_id).filter(Boolean));
  catalog=BHH_MASTER.map(m=>{
    const a=getGuidelineRecord(m.catalog_id);
    const isPilot = Boolean(m.structured_regimen_id && activeById[m.structured_regimen_id]);
    const structuredObj = isPilot ? activeById[m.structured_regimen_id] : buildStructuredFromMaster(m);
    return {
      key:`master:${m.regimen_id}`,
      master:m,
      structured: structuredObj,
      structuredLink: m.structured_regimen_id,
      cancerType:m.cancer_type,
      cancerTypeLabel:m.cancer_type_label,
      name:m.name,
      indication:m.indication,
      guidelineReference:a,
      status:isPilot ? 'approved' : (a?.status||'approved_published')
    };
  });
  for(const p of BHH_PEDIATRIC) {
    // A source-approved pediatric protocol is NOT a calculator-ready medication order set.
    const m={
      regimen_id:p.catalog_id,catalog_id:p.catalog_id,name:p.name,indication:p.indication,
      cycle_text:'ThaiPOG 2566 · '+p.reference_detail+' · '+p.cancer_group,
      cancer_type:'Pediatric Oncology',cancer_type_label:TYPE_LABELS['Pediatric Oncology'],
      drugs:(p.verified_source_examples||[]).map(d=>({
        'ชื่อยา':d.drug,'ขนาดยา':d.dose,'ความถี่ในการให้':(d.phase||'')+' · Day '+d.day,maximum_dose:null
      }))
    };
    catalog.push({
      key:'pediatric:'+p.catalog_id,master:m,structured:null,structuredLink:null,isPediatric:true,
      pediatricRecord:p,cancerType:'Pediatric Oncology',cancerTypeLabel:TYPE_LABELS['Pediatric Oncology'],
      name:p.name,indication:p.indication,status:p.status,
      guidelineReference:{
        catalog_id:p.catalog_id,protocol:p.protocol_id,source:p.source,
        reference_url:p.reference_url,
        note:p.reference_detail+' · '+p.indication+' · '+p.note
      }
    });
  }
  for (const r of BHH_ACTIVE) if (!linked.has(r.id)) {
    const ct=activeCancerType(r);
    catalog.push({key:`active:${r.id}`,master:null,structured:r,structuredLink:r.id,cancerType:ct,cancerTypeLabel:typeLabel(ct),name:r.name,indication:r.indication,status:'approved'});
  }
}

async function loadJson(url) {
  const response=await fetch(url,{cache:'no-store'});
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}
function typeLabel(type) { return TYPE_LABELS[type] || type; }
function esc(v='') {
  return String(v).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'})[ch]);
}
function fmt(v, dec=2) {
  if (!Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('en-US',{maximumFractionDigits:dec}).format(v);
}
function signed(v) {
  const n=Number(v.toFixed(2));
  return `${n>0?'+':''}${fmt(n)}`;
}
function mosteller(h,w) {
  if (!(h>0) || !(w>0)) throw new Error('Height and weight are required');
  return Math.sqrt((h*w)/3600);
}
function cockcroft(p) {
  if (!(p.ageYears>0) || !(p.weightKg>0) || !(p.serumCreatinineMgDl>0)) {
    throw new Error('Age, weight and serum creatinine are required');
  }
  let v=((140-p.ageYears)*p.weightKg)/(72*p.serumCreatinineMgDl);
  if (p.sex==='female') v*=0.85;
  return Math.max(0,v);
}
function kidneyFunction(p,bsa) {
  if (p.kidneyMethod==='cockcroft_gault_legacy') {
    return {value:cockcroft(p),label:'Cockcroft-Gault CrCl (mL/min)'};
  }
  if (!(p.kidneyValue>0)) throw new Error('Kidney function value is required');
  if (p.kidneyMethod==='measured_gfr') return {value:p.kidneyValue,label:'Measured GFR (mL/min)'};
  if (p.kidneyMethod==='bsa_adjusted_egfr') {
    return {value:p.kidneyValue*(bsa/1.73),label:'BSA-adjusted eGFR (mL/min)'};
  }
  throw new Error('Kidney function method is required');
}
function roundHalfUp(value,inc) {
  return Math.floor(value/inc+0.5+Number.EPSILON*10)*inc;
}
function applyRound(value,unit,profile) {
  if (!profile || profile.method==='none') return {recommended:value,difference:0,differencePct:0};
  if (profile.unit!==unit) return {warning:`Rounding profile uses ${profile.unit}; dose is ${unit}.`};
  const candidate=roundHalfUp(value,profile.increment);
  const diff=candidate-value;
  const pct=value===0?0:(diff/value)*100;
  if (Math.abs(pct)>profile.maxPercentDifference) return {warning:`Rounded candidate differs by ${Math.abs(pct).toFixed(2)}%, exceeding policy.`};
  if (profile.maxAbsoluteDifference!==undefined && Math.abs(diff)>profile.maxAbsoluteDifference) return {warning:`Rounded candidate exceeds absolute rounding limit.`};
  return {recommended:candidate,difference:diff,differencePct:pct};
}
function doseValue(dose,orderId,selections) {
  if (dose.options?.length) {
    const s=selections[orderId] ?? dose.defaultOption;
    if (s===undefined || !dose.options.includes(s)) throw new Error('Clinical dose selection is required');
    return s;
  }
  if (!(dose.value>0)) throw new Error('Dose value is missing');
  return dose.value;
}
function rawDose(order,selections,p,bsa,kidney) {
  const v=doseValue(order.dose,order.id,selections);
  switch(order.dose.basis) {
    case 'fixed': return v;
    case 'bsa': return v*bsa;
    case 'weight': return v*p.weightKg;
    case 'auc': return v*(kidney+25);
    default: throw new Error(`Unsupported dose basis ${order.dose.basis}`);
  }
}
function protocolText(d) {
  const val=d.options?.length ? d.options.join(' or ') : fmt(d.value);
  if (d.basis==='auc') return `AUC ${val}`;
  if (d.basis==='bsa') return `${val} ${d.unit}/m²`;
  if (d.basis==='weight') return `${val} ${d.unit}/kg`;
  return `${val} ${d.unit}`;
}
function scheduleText(s) {
  const ds=s.days.length===1?`day ${s.days[0]}`:`days ${s.days.join(', ')}`;
  const parts=[ds];
  if (s.continuousInfusionHours) parts.push(`continuous infusion ${s.continuousInfusionHours} h`);
  else if (s.infusionMinutes) parts.push(`infusion ${s.infusionMinutes} min`);
  if (s.note) parts.push(s.note);
  return parts.join(' · ');
}

function calculate(context) {
  const {patient,regimen,cycle,selections}=context;
  if (!regimen?.localApproval || regimen.status!=='published') throw new Error('Regimen is not approved for calculation');
  const bsa=mosteller(patient.heightCm,patient.weightKg);
  const k=kidneyFunction(patient,bsa);
  const phase=regimen.phases.find(p=>cycle>=p.cycleStart&&(p.cycleEnd===undefined||cycle<=p.cycleEnd));
  if (!phase) throw new Error(`No phase defined for cycle ${cycle}`);

  // User-chosen Rounding selection from the Radio group
  const userRoundingChoice = document.querySelector('input[name="calc-rounding-choice"]:checked')?.value || 'BHH_NEAREST_10MG_DEFAULT';

  const results=phase.orders.map(order=>{
    let raw=rawDose(order,selections,patient,bsa,k.value);
    let clinical=raw;
    const notes=[],warnings=[];
    for (const rule of order.clinicalRules||[]) {
      if (rule.type==='hard_max' && rule.unit===order.dose.unit && clinical>rule.value) {
        clinical=rule.value; notes.push(`Maximum dose applied: ${fmt(rule.value)} ${rule.unit}`);
      }
      if (rule.type==='warning_threshold' && rule.metric==='kidney_function') {
        const hit=rule.operator==='gt'?k.value>rule.value:rule.operator==='gte'?k.value>=rule.value:rule.operator==='lt'?k.value<rule.value:k.value<=rule.value;
        if (hit) warnings.push(rule.message);
      }
    }

    // Determine rounding profile based on user's radio selection
    let profileId = userRoundingChoice;
    // Special drug safeguards: if Vincristine or low dose, prefer 1mg profile unless NO_ROUND is explicitly chosen
    if (order.roundingProfileId === 'BHH_NEAREST_1MG_DEFAULT' && userRoundingChoice === 'BHH_NEAREST_10MG_DEFAULT') {
      profileId = 'BHH_NEAREST_1MG_DEFAULT';
    }
    const profile = roundingProfiles[profileId] || null;
    const rounded = profile ? applyRound(clinical, order.dose.unit, profile) : {};
    if (rounded.warning) warnings.push(rounded.warning);

    return {
      drugName:order.drugName,protocol:protocolText(order.dose),route:order.route,schedule:scheduleText(order.schedule),
      raw,unit:order.dose.unit,clinical,recommended:rounded.recommended,difference:rounded.difference,differencePct:rounded.differencePct,
      notes,warnings,roundingLabel:profile?.label||''
    };
  });
  return {bsa,kidney:k,results};
}

async function init() {
  try {
    const [active,legacyRoot,rounding,guidelineStatus,pediatricData]=await Promise.all([
      loadJson('./data/regimens.published.json?v=2.3.0'),
      loadJson('./data/legacy-regimens.v1.json?v=2.3.0'),
      loadJson('./data/rounding-profiles.json?v=2.3.0'),
      loadJson('./data/guideline-status.v2.4.json?v=2.4.0'),
      loadJson('./data/pediatric-regimens.thaipog-2566.json?v=2.7.0')
    ]);
    BHH_ACTIVE=active;
    BHH_GUIDELINE_STATUS=guidelineStatus;
    if(!Array.isArray(pediatricData?.regimens)||pediatricData.regimens.length!==pediatricData.record_count) throw Error('Invalid pediatric regimen database');
    BHH_PEDIATRIC=pediatricData.regimens;
    BHH_MASTER=normalizeMaster(Array.isArray(legacyRoot?.['สูตรยาเคมีบำบัด'])?legacyRoot['สูตรยาเคมีบำบัด']:[]);
    BHH_ROUNDING_DEFAULTS=rounding;
    roundingProfiles=loadRounding();
    rebuildCatalog();

    // Purge deprecated default PIN 1234 from storage
    if (localStorage.getItem('bhh_approve_pin') === '1234') {
      localStorage.removeItem('bhh_approve_pin');
    }

    // Check Cloudflare KV for any server-side published regimens
    fetch('/api/regimens').then(r => r.ok ? r.json() : []).then(cfRegimens => {
      if (Array.isArray(cfRegimens) && cfRegimens.length) {
        cfRegimens.forEach(cfR => {
          const match = catalog.find(c => c.master?.catalog_id === cfR.id || c.key === cfR.id);
          if (match) {
            match.status = 'approved_published';
            match.structured = cfR;
          }
        });
        const curType = $('#cancer-type-select')?.value || '';
        populateRegimenOptionsForType(curType);
      }
    }).catch(() => {});

  } catch (error) {
    $('#app-loading').innerHTML=`<div class="alert alert-error">Unable to load regimen data: ${esc(error.message||String(error))}</div>`;
    return;
  }
  bindTabs();
  bindAdminPin();
  populateCancerTypes();
  bindCalculator();
  bindLibrary();
  bindRounding();
  $('#manager-master-count').textContent=BHH_MASTER.length;
  $('#manager-approved-count').textContent=catalog.filter(x=>x.structured).length;
  $('#app-loading').classList.add('hidden');
  $('#app-shell').classList.remove('hidden');
}

function updateAdminUi() {
  const adminTabs = document.querySelectorAll('.admin-tab');
  const btn = $('#admin-pin-toggle-btn');
  if (isAdminUnlocked) {
    adminTabs.forEach(t => t.classList.remove('hidden'));
    if (btn) {
      btn.textContent = '🔓 ออกจากระบบ (Lock)';
      btn.classList.add('unlocked');
      btn.title = 'ล็อคระบบกลับสู่โหมดผู้ใช้ทั่วไป (Calculator Only)';
    }
  } else {
    adminTabs.forEach(t => t.classList.add('hidden'));
    if (btn) {
      btn.textContent = '🔒 เภสัชกร (PIN)';
      btn.classList.remove('unlocked');
      btn.title = 'ใส่รหัส PIN เพื่อเปิดหน้า Regimen Library, Manager และ Rounding Policy';
    }
    const activeTab = document.querySelector('.tabs button.active')?.dataset.tab;
    if (activeTab && activeTab !== 'calculator') {
      showTab('calculator');
    }
  }
}

function bindAdminPin() {
  const btn = $('#admin-pin-toggle-btn');
  const dialog = $('#pin-auth-dialog');
  const form = $('#pin-auth-form');
  const input = $('#pin-auth-input');
  const err = $('#pin-auth-error');
  const closeBtn = $('#pin-auth-close');
  const cancelBtn = $('#pin-auth-cancel');

  if (btn) {
    btn.addEventListener('click', () => {
      if (isAdminUnlocked) {
        isAdminUnlocked = false;
        sessionStorage.removeItem('bhh_pharmacist_pin_unlocked');
        updateAdminUi();
      } else {
        if (input) input.value = '';
        if (err) { err.classList.add('hidden'); err.textContent = ''; }
        if (dialog) dialog.showModal();
        if (input) input.focus();
      }
    });
  }

  const closeDialog = () => { if (dialog?.open) dialog.close(); };
  closeBtn?.addEventListener('click', closeDialog);
  cancelBtn?.addEventListener('click', closeDialog);

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pin = input.value.trim();
    if (!pin) return;

    err.classList.add('hidden');
    err.textContent = '';

    // 1. Explicitly reject deprecated default PIN 1234
    if (pin === '1234') {
      err.textContent = 'รหัส PIN 1234 ถูกยกเลิกแล้ว กรุณาใช้รหัส PIN ใหม่ที่ตั้งค่าไว้ใน Cloudflare (APPROVE_PIN)';
      err.classList.remove('hidden');
      input.select();
      return;
    }

    // 2. Clear any stale 1234 from storage
    if (localStorage.getItem('bhh_approve_pin') === '1234') {
      localStorage.removeItem('bhh_approve_pin');
    }

    let verified = false;
    try {
      // Verify via Cloudflare Serverless Function (/api/verify-pin)
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.valid) {
          verified = true;
        }
      } else if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        err.textContent = data.message || 'รหัส PIN ไม่ถูกต้อง';
        err.classList.remove('hidden');
        input.select();
        return;
      } else if (res.status === 500) {
        const data = await res.json().catch(() => ({}));
        err.textContent = data.message || 'ระบบยังไม่ได้ตั้งค่าตัวแปร APPROVE_PIN ใน Cloudflare';
        err.classList.remove('hidden');
        input.select();
        return;
      }
    } catch (netErr) {
      // Offline / network failure
    }

    // Static host fallback (e.g. GitHub Pages where /api/verify-pin returns 404):
    if (!verified) {
      const localPin = localStorage.getItem('bhh_approve_pin');
      if (localPin) {
        if (pin === localPin) {
          verified = true;
        } else {
          err.textContent = 'รหัส PIN ไม่ถูกต้อง';
          err.classList.remove('hidden');
          input.select();
          return;
        }
      } else {
        // First-time setup on static host: register entered non-1234 PIN
        localStorage.setItem('bhh_approve_pin', pin);
        verified = true;
      }
    }

    if (verified) {
      isAdminUnlocked = true;
      sessionStorage.setItem('bhh_pharmacist_pin_unlocked', 'true');
      sessionStorage.setItem('bhh_pharmacist_pin_token', pin);
      localStorage.setItem('bhh_approve_pin', pin);
      updateAdminUi();
      closeDialog();
    }
  });

  updateAdminUi();
}

function bindTabs() {
  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>showTab(btn.dataset.tab)));
}
function showTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(x=>x.classList.add('hidden'));
  document.querySelectorAll('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
  document.getElementById(`tab-${tab}`)?.classList.remove('hidden');
  if (tab==='library') renderLibrary();
  if (tab==='rounding') renderRounding();
}
function populateCancerTypes() {
  const types=TYPE_ORDER.filter(t=>catalog.some(x=>x.cancerType===t));
  for (const id of ['#cancer-type-select','#library-cancer-type']) {
    const s=$(id);
    for (const t of types) {
      const o=document.createElement('option'); o.value=t; o.textContent=typeLabel(t); s.appendChild(o);
    }
  }
}
function closeSearchDropdown() {
  const dropdown = $('#regimen-search-dropdown');
  if (dropdown) {
    dropdown.classList.add('hidden');
    dropdown.innerHTML = '';
  }
  $('#regimen-search')?.setAttribute('aria-expanded', 'false');
}

function handleSearchInput() {
  const input = $('#regimen-search');
  const dropdown = $('#regimen-search-dropdown');
  if (!input || !dropdown) return;

  const q = input.value.trim().toLowerCase();
  if (!q) {
    closeSearchDropdown();
    return;
  }

  const matches = catalog.filter(x => {
    const cancer = (x.cancerTypeLabel || typeLabel(x.cancerType) || '').toLowerCase();
    const drugs = (x.master?.drugs || []).map(d => `${d['ชื่อยา']} ${d['ขนาดยา']}`).join(' ').toLowerCase()
      || (x.structured?.phases?.[0]?.orders || []).map(o => `${o.drugName} ${protocolText(o.dose)}`).join(' ').toLowerCase();
    const text = `${x.name} ${x.indication} ${cancer} ${drugs}`.toLowerCase();
    return text.includes(q);
  }).sort((a, b) => {
    const aNameStart = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bNameStart = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    if (aNameStart !== bNameStart) return aNameStart - bNameStart;
    const aRank = a.structuredLink ? 0 : a.status === 'approved_published' ? 1 : 2;
    const bRank = b.structuredLink ? 0 : b.status === 'approved_published' ? 1 : 2;
    return aRank - bRank || a.name.localeCompare(b.name);
  });

  if (matches.length > 0) {
    dropdown.innerHTML = matches.slice(0, 15).map(x => {
      const drugSummary = (x.master?.drugs || []).map(d => `${esc(d['ชื่อยา'])} (${esc(d['ขนาดยา'])})`).join(' · ')
        || (x.structured?.phases?.[0]?.orders || []).map(o => `${esc(o.drugName)} (${esc(protocolText(o.dose))})`).join(' · ');
      return `<div class="search-match-item" data-select-key="${esc(x.key)}" role="option">
        <div class="search-match-title">
          <strong>${esc(x.name)}</strong>
          <span class="badge ${x.structured ? 'badge-ok' : 'badge-neutral'}">${esc(x.cancerTypeLabel || typeLabel(x.cancerType))}</span>
        </div>
        <div class="search-match-sub">${esc(x.indication)}</div>
        ${drugSummary ? `<div class="search-match-drugs micro">${drugSummary}</div>` : ''}
      </div>`;
    }).join('');
    dropdown.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  } else {
    dropdown.innerHTML = `<div class="search-empty">ไม่พบสูตรยาที่ตรงกับ "${esc(q)}"</div>`;
    dropdown.classList.remove('hidden');
    input.setAttribute('aria-expanded', 'true');
  }
}

function populateRegimenOptionsForType(type, selectedKey = null) {
  const sel = $('#regimen-select');
  if (!sel) return;
  sel.innerHTML = '<option value="" selected disabled>-- เลือกสูตรยาเคมีบำบัด --</option>';

  let items = [];
  if (type) {
    items = catalog.filter(x => x.cancerType === type);
  } else {
    items = [...catalog];
  }

  items.sort((a,b) => {
    const rank = x => x.structuredLink ? 0 : x.status === 'approved_published' ? 1 : 2;
    return rank(a) - rank(b) || a.name.localeCompare(b.name);
  });

  if (items.length > 0) {
    for (const x of items) {
      const o = document.createElement('option');
      o.value = x.key;
      const typePrefix = !type ? `[${typeLabel(x.cancerType)}] ` : '';
      o.textContent = `${x.structured || x.status === 'approved_published' ? '✓ ' : ''}${typePrefix}${x.name} — ${x.indication}`;
      sel.appendChild(o);
    }
    sel.disabled = false;
    if (selectedKey) {
      sel.value = selectedKey;
    }
  } else {
    sel.disabled = true;
  }
}

function selectRegimenByKey(key) {
  const item = catalog.find(x => x.key === key);
  if (!item) return;

  // 1. Auto-set Cancer Type
  const cancerSelect = $('#cancer-type-select');
  if (cancerSelect) cancerSelect.value = item.cancerType;

  // 2. Populate #regimen-select with all regimens for this cancer type, and select this key
  populateRegimenOptionsForType(item.cancerType, item.key);
  const regSelect = $('#regimen-select');
  if (regSelect) {
    regSelect.value = item.key;
    regSelect.disabled = false;
  }

  // 3. Close & clear search dropdown
  closeSearchDropdown();

  // 4. Update search input
  const searchInput = $('#regimen-search');
  if (searchInput) searchInput.value = item.name;

  // 5. Select regimen, render context & enable calculate button
  onRegimenSelected();
}

function bindCalculator() {
  $('#cancer-type-select').addEventListener('change', () => {
    const type = $('#cancer-type-select').value;
    $('#regimen-search').value = '';
    closeSearchDropdown();
    populateRegimenOptionsForType(type);
    selectedItem = null;
    $('#cycle-input').disabled = true;
    $('#cycle-input').value = '';
    $('#regimen-context').classList.add('hidden');
    $('#dose-selections').innerHTML = '';
    $('#calculate-btn').disabled = true;
  });
  
  $('#regimen-search').addEventListener('input', handleSearchInput);
  $('#regimen-search').addEventListener('focus', () => {
    if ($('#regimen-search').value.trim()) {
      handleSearchInput();
    }
  });

  $('#regimen-search').addEventListener('keydown', e => {
    const dropdown = $('#regimen-search-dropdown');
    if (!dropdown || dropdown.classList.contains('hidden')) return;

    const items = Array.from(dropdown.querySelectorAll('.search-match-item'));
    if (!items.length) return;

    let currentIndex = items.findIndex(el => el.classList.contains('highlighted'));

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex >= 0) items[currentIndex].classList.remove('highlighted');
      currentIndex = (currentIndex + 1) % items.length;
      items[currentIndex].classList.add('highlighted');
      items[currentIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex >= 0) items[currentIndex].classList.remove('highlighted');
      currentIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[currentIndex].classList.add('highlighted');
      items[currentIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = currentIndex >= 0 ? items[currentIndex] : items[0];
      if (target && target.dataset.selectKey) {
        selectRegimenByKey(target.dataset.selectKey);
      }
    } else if (e.key === 'Escape') {
      closeSearchDropdown();
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#regimen-search') && !e.target.closest('#regimen-search-dropdown')) {
      closeSearchDropdown();
    }
  });

  $('#regimen-search-dropdown')?.addEventListener('mousedown', e => {
    const itemEl = e.target.closest('[data-select-key]');
    if (itemEl) {
      e.preventDefault();
      selectRegimenByKey(itemEl.dataset.selectKey);
    }
  });

  $('#regimen-search-dropdown')?.addEventListener('click', e => {
    const itemEl = e.target.closest('[data-select-key]');
    if (itemEl) {
      selectRegimenByKey(itemEl.dataset.selectKey);
    }
  });

  $('#regimen-select').addEventListener('change', () => {
    onRegimenSelected();
    if (selectedItem) {
      $('#regimen-search').value = selectedItem.name;
    }
    closeSearchDropdown();
  });

  $('#kidney-method').addEventListener('change', updateKidneyUi);
  $('#calc-form').addEventListener('submit', e => { e.preventDefault(); runCalculation(); });
  $('#export-calc-btn').addEventListener('click', exportLast);
  $('#print-btn').addEventListener('click', () => window.print());
  
  // Real-time recalculation on changing Rounding Radio Button
  document.querySelectorAll('input[name="calc-rounding-choice"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (lastCalculation && selectedItem?.structured) {
        runCalculation();
      }
    });
  });

  updateKidneyUi();
}

function onRegimenSelected() {
  const sel = $('#regimen-select');
  if (!sel) return;
  selectedItem = catalog.find(x => x.key === sel.value) || null;
  if (!selectedItem) {
    $('#cycle-input').disabled = true;
    $('#cycle-input').value = '';
    $('#regimen-context').classList.add('hidden');
    $('#dose-selections').innerHTML = '';
    $('#calculate-btn').disabled = true;
    return;
  }

  if ($('#cancer-type-select').value !== selectedItem.cancerType) {
    $('#cancer-type-select').value = selectedItem.cancerType;
    populateRegimenOptionsForType(selectedItem.cancerType, selectedItem.key);
  }

  const cycle = $('#cycle-input');
  cycle.value = '1';
  cycle.disabled = false;
  cycle.removeAttribute('max');
  $('#dose-selections').innerHTML = '';

  if (!selectedItem.structured && selectedItem.master && !selectedItem.isPediatric) {
    selectedItem.structured = buildStructuredFromMaster(selectedItem.master);
  }
  if (selectedItem.structured?.cycleCount) {
    cycle.max = String(selectedItem.structured.cycleCount);
  }

  renderSelectedContext();
  $('#calculate-btn').disabled = !selectedItem.structured || selectedItem.isPediatric;
  if (selectedItem.isPediatric) $('#cycle-input').disabled=true;
}

function originalDrugRows(item) {
  let drugs = item.master?.drugs || [];
  if (!drugs.length && item.structured?.phases?.[0]?.orders?.length) {
    drugs = item.structured.phases[0].orders.map(o => ({
      'ชื่อยา': o.drugName,
      'ขนาดยา': protocolText(o.dose),
      'ความถี่ในการให้': scheduleText(o.schedule),
      'maximum_dose': o.clinicalRules?.find(r => r.type === 'hard_max')?.value
        ? `${o.clinicalRules.find(r => r.type === 'hard_max').value} ${o.dose.unit}`
        : '—'
    }));
  }
  if (!drugs.length) return '';
  return `<div class="table-wrap"><table>
    <thead><tr><th>Drug (ชื่อยา)</th><th>Dose (ขนาดยา)</th><th>Frequency (ความถี่)</th><th>Maximum dose (ขนาดยาสูงสุด)</th></tr></thead>
    <tbody>${drugs.map(d => `<tr>
      <td><strong>${esc(d['ชื่อยา'])}</strong></td>
      <td>${esc(d['ขนาดยา'])}</td>
      <td>${esc(d['ความถี่ในการให้'] || 'Day 1')}</td>
      <td>${esc(d.maximum_dose || '—')}</td>
    </tr>`).join('')}</tbody>
  </table></div>`;
}

function renderSelectedContext() {
  if (!selectedItem) return;
  const box = $('#regimen-context');
  box.classList.remove('hidden');

  const r = selectedItem.structured;
  const tableHtml = originalDrugRows(selectedItem);
  if(selectedItem.isPediatric) {
    const x=selectedItem.pediatricRecord;
    const phases=(x.protocol_phases||[]).map(p=>`<li>${esc(p)}</li>`).join('');
    box.innerHTML=`<div class="context-head"><strong>${esc(x.name)}</strong><span class="badge badge-ok">PEDIATRIC · REFERENCE PUBLISHED</span></div>
      <p>${esc(x.indication)}</p><p><b>Protocol:</b> ${esc(x.protocol_id)} · ${esc(x.reference_detail)}</p>
      <div class="alert alert-warning">เผยแพร่ข้อมูลอ้างอิงจาก ThaiPOG/NHSO 2566 แล้ว แต่ไม่ได้เปิดคำนวณยาผู้ป่วยอัตโนมัติ เนื่องจากต้องยืนยัน Treatment Phase, Risk Group, Age-based dose และการดูแลร่วม</div>
      ${phases?`<b>Treatment phases:</b><ul>${phases}</ul>`:''}${referenceDetails(selectedItem)}${tableHtml}`;
    return;
  }

  if (r) {
    box.innerHTML = `<div class="context-head">
      <div>
        <span class="badge ${selectedItem.structuredLink ? 'badge-ok' : 'badge-neutral'}">
          ${selectedItem.structuredLink ? 'APPROVED PILOT' : 'CATALOG MASTER'}
        </span> 
        <strong>${esc(r.name)}</strong>
      </div>
      <span class="micro">${esc(selectedItem.cancerTypeLabel || r.cancerGroup || typeLabel(selectedItem.cancerType))}</span>
    </div>
    <p>${esc(r.indication)}</p>
    <div class="micro">Cycle interval: ${r.cycleIntervalDays || 21} days · Version ${esc(r.version || '1.0.0')}</div>
    ${tableHtml}`;
    updateDoseSelections();
  } else {
    const m = selectedItem.master;
    box.innerHTML = `<div class="context-head">
      <div>
        <span class="badge ${statusBadge(selectedItem)}">${displayStatus(selectedItem)}</span> 
        <strong>${esc(m.name)}</strong>
      </div>
      <span class="micro">${esc(m.cancer_type_label || typeLabel(selectedItem.cancerType))}</span>
    </div>
    <p>${esc(m.indication)}</p>
    <div class="micro">${esc(m.cycle_text)}</div>
    ${referenceDetails(selectedItem)}
    ${tableHtml}`;
  }
}

function updateDoseSelections() {
  if (!selectedItem?.structured) return;
  const r = selectedItem.structured;
  const cycle = Number($('#cycle-input').value) || 1;
  const phase = r.phases.find(p=>cycle>=p.cycleStart&&(p.cycleEnd===undefined||cycle<=p.cycleEnd));
  if (!phase) {$('#dose-selections').innerHTML='';return;}
  const opts = phase.orders.filter(o=>o.dose.options?.length);
  $('#dose-selections').innerHTML = opts.length?`<div class="section-title">Clinical Dose Selection</div>${opts.map(o=>`<label class="field"><span>${esc(o.drugName)} <b>*</b></span><select data-dose-select="${esc(o.id)}" required><option value="" selected disabled></option>${o.dose.options.map(v=>`<option value="${v}">${o.dose.basis==='auc'?'AUC ':''}${v}</option>`).join('')}</select></label>`).join('')}`:'';
}
$('#cycle-input').addEventListener('input',()=>{if(selectedItem?.structured) updateDoseSelections();});
function updateKidneyUi() {
  const method=$('#kidney-method').value;
  const scrWrap=$('#scr-wrap'), kvWrap=$('#kidney-value-wrap');
  const scr=$('#scr-input'), kv=$('#kidney-value');
  if (method==='cockcroft_gault_legacy') {
    scrWrap.classList.remove('hidden'); kvWrap.classList.add('hidden'); scr.required=true; kv.required=false; kv.value='';
  } else {
    scrWrap.classList.add('hidden'); kvWrap.classList.remove('hidden'); scr.required=false; scr.value=''; kv.required=true;
    $('#kidney-value-label').innerHTML=method==='measured_gfr'?'Measured GFR (mL/min) <b>*</b>':'eGFR (mL/min/1.73m²) <b>*</b>';
  }
}
function num(id) {
  const v=Number($(id).value);
  if (!Number.isFinite(v)) throw new Error('Please complete all required numeric data');
  return v;
}
function runCalculation() {
  const form=$('#calc-form');
  if (!form.reportValidity()) return;
  if (!selectedItem?.structured) {
    $('#calc-output').classList.remove('has-result');
    $('#calc-output').innerHTML='<div class="alert alert-warning">Selected regimen is not ready for calculation.</div>'; return;
  }
  try {
    const method=$('#kidney-method').value;
    const patient={ageYears:num('#age-input'),sex:$('#sex-input').value,heightCm:num('#height-input'),weightKg:num('#weight-input'),kidneyMethod:method};
    if (method==='cockcroft_gault_legacy') patient.serumCreatinineMgDl=num('#scr-input'); else patient.kidneyValue=num('#kidney-value');
    const selections={};
    document.querySelectorAll('[data-dose-select]').forEach(s=>selections[s.dataset.doseSelect]=Number(s.value));
    const cycle=num('#cycle-input');
    const result=calculate({patient,regimen:selectedItem.structured,cycle,selections});
    lastCalculation={generatedAt:new Date().toISOString(),regimenId:selectedItem.structured.id,cycle,patient,selections,result};
    renderResult(result,selectedItem.structured,cycle);
  } catch(e) {
    $('#calc-output').classList.remove('has-result');
    $('#calc-output').innerHTML=`<div class="alert alert-error"><strong>Calculation blocked:</strong> ${esc(e.message||String(e))}</div>`;
  }
}
function renderResult(result,r,cycle) {
  $('#calc-output').classList.add('has-result');
  const warnings=result.results.flatMap(x=>x.warnings).map(w=>`<div class="alert alert-warning">${esc(w)}</div>`).join('');
  const rows=result.results.map(x=>`<tr><td><strong>${esc(x.drugName)}</strong><div class="micro">${esc(x.route)} · ${esc(x.schedule)}</div></td>
    <td>${esc(x.protocol)}</td><td><strong>${fmt(x.raw)} ${esc(x.unit)}</strong></td><td><strong>${fmt(x.clinical)} ${esc(x.unit)}</strong>${x.notes.length?`<div class="micro">${x.notes.map(esc).join('<br>')}</div>`:''}</td>
    <td>${x.recommended===undefined?'<span class="muted">Review</span>':`<strong>${fmt(x.recommended)} ${esc(x.unit)}</strong><div class="micro">${esc(x.roundingLabel)}</div>`}</td>
    <td>${x.differencePct===undefined?'—':`${signed(x.difference)} ${esc(x.unit)} (${signed(x.differencePct)}%)`}</td></tr>`).join('');
  $('#calc-output').innerHTML=`<section class="result-header"><div><span class="kpi-label">BSA</span><strong>${result.bsa.toFixed(5)} m²</strong></div>
    <div><span class="kpi-label">Kidney function used</span><strong>${fmt(result.kidney.value)} mL/min</strong><span class="micro">${esc(result.kidney.label)}</span></div>
    <div><span class="kpi-label">Regimen / Cycle</span><strong>${esc(r.name)} · Cycle ${cycle}</strong></div></section>${warnings}
    <div class="table-wrap"><table><thead><tr><th>Drug</th><th>Protocol dose</th><th>Calculated</th><th>Clinical dose</th><th>Recommended</th><th>Difference</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function exportLast() {
  if (!lastCalculation) {alert('Run a calculation first.');return;}
  const blob=new Blob([JSON.stringify(lastCalculation,null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob); const a=document.createElement('a');a.href=u;a.download='bhh-chemo-calculation.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500);
}

function bindLibrary() {
  $('#library-cancer-type').addEventListener('change',renderLibrary);
  $('#library-search').addEventListener('input',renderLibrary);
  renderLibrary();
}

function buildPediatricEvidenceHtml(item) {
  const p=item.pediatricRecord;
  if(!p)return '';
  const pages=(p.source_evidence_pages||[]).filter(x=>x.source_excerpt_lines?.length);
  return '<div class="alert alert-warning">ข้อความถอดจาก PDF สำหรับอ้างอิงเท่านั้น โปรดตรวจตารางต้นฉบับและ protocol phase ก่อนใช้เป็นคำสั่งยา ไม่ใช่ข้อมูลสำหรับคำนวณอัตโนมัติ</div>'+
    pages.map(page=>'<section class="pediatric-evidence-page"><strong>ThaiPOG 2566 · PDF page '+esc(page.page)+'</strong>'+
      '<pre class="pediatric-evidence-text">'+page.source_excerpt_lines.map(esc).join('\n')+'</pre></section>').join('');
}

function filteredCatalog() {
  const type=$('#library-cancer-type').value;
  const q=$('#library-search').value.trim().toLowerCase();
  return catalog.filter(x=>(!type||x.cancerType===type)&&(!q||`${x.name} ${x.indication} ${(x.master?.drugs||[]).map(d=>d['ชื่อยา']).join(' ')}`.toLowerCase().includes(q)));
}
function renderLibrary() {
  const items=filteredCatalog();
  $('#library-summary').innerHTML=`พบ <strong>${items.length}</strong> Regimens · Approved + Published <strong>${items.filter(x=>x.structured||x.status==='approved_published').length}</strong> · Calculator Ready <strong>${items.filter(x=>x.structured).length}</strong> · Review <strong>${items.filter(x=>!x.structured&&x.status!=='approved_published'&&x.status!=='blocked').length}</strong> · Blocked <strong>${items.filter(x=>x.status==='blocked').length}</strong>`;
  const groups=TYPE_ORDER.map(t=>[t,items.filter(x=>x.cancerType===t)]).filter(([,arr])=>arr.length);
  $('#library-list').innerHTML=groups.map(([type,arr])=>`<section class="cancer-group"><h3>${esc(typeLabel(type))} <span class="micro">(${arr.length})</span></h3><div class="registry-grid">${
    arr.map(x=>`<article class="regimen-card"><div><span class="badge ${statusBadge(x)}">${displayStatus(x)}</span></div>
      <h4>${esc(x.name)}</h4><p>${esc(x.indication)}</p><div class="micro">${esc(x.master?.cycle_text||`${x.structured?.cycleIntervalDays||''} days/cycle`)}</div>${referenceDetails(x)}
      ${x.isPediatric?`<details data-pediatric-evidence="${esc(x.key)}"><summary>📄 รายละเอียดจาก PDF · Dose / Days / Phases (${x.pediatricRecord.source_evidence_pages?.length||0} หน้า)</summary><div class="pediatric-evidence-content"></div></details>`:''}
      ${x.master?.drugs?.length?`<details><summary>${x.isPediatric?'ตัวอย่างยาที่ถอดจาก PDF (ยังไม่ครบทุก Phase)':'Drug details'}</summary><div class="drug-list">${x.master.drugs.map(d=>`<div class="drug-row"><strong>${esc(d['ชื่อยา'])}</strong><span>${esc(d['ขนาดยา'])}</span></div>`).join('')}</div></details>`:''}
      <div class="button-row"><button class="secondary" data-use-regimen="${esc(x.key)}">Select Regimen</button>${x.master&&!x.isPediatric?`<button type="button" class="secondary" data-review-regimen="${esc(x.key)}">Review / Publish</button>`:x.isPediatric?`<a href="${esc(x.guidelineReference.reference_url)}" target="_blank" rel="noopener noreferrer">NHSO Source PDF · ${esc(x.pediatricRecord.reference_detail)}</a>`:''}</div></article>`).join('')
  }</div></section>`).join('');
  document.querySelectorAll('[data-pediatric-evidence]').forEach(details=>details.addEventListener('toggle',()=>{
    if(!details.open)return;
    const item=catalog.find(x=>x.key===details.dataset.pediatricEvidence);
    const container=details.querySelector('.pediatric-evidence-content');
    if(item&&container&&!container.dataset.loaded){
      container.innerHTML=buildPediatricEvidenceHtml(item);
      container.dataset.loaded='true';
    }
  }));
  document.querySelectorAll('[data-use-regimen]').forEach(b=>b.addEventListener('click',()=>useFromLibrary(b.dataset.useRegimen)));
  document.querySelectorAll('[data-review-regimen]').forEach(b=>b.addEventListener('click',()=>{
    const item=catalog.find(x=>x.key===b.dataset.reviewRegimen);
    if(item&&window.BHH_PUBLISH)window.BHH_PUBLISH.open(item);
  }));
}
function useFromLibrary(key) {
  selectRegimenByKey(key);
  showTab('calculator');
  window.scrollTo({top:0,behavior:'smooth'});
}

function loadRounding() {
  try {
    const v=JSON.parse(localStorage.getItem(ROUNDING_KEY)||'null');
    if (Array.isArray(v)&&v.length) return Object.fromEntries(v.map(x=>[x.id,x]));
  } catch {}
  return Object.fromEntries(clone(BHH_ROUNDING_DEFAULTS).map(x=>[x.id,x]));
}
function roundingArray() {return Object.values(roundingProfiles);}
function bindRounding() {
  $('#rounding-save').addEventListener('click',saveRounding);
  $('#rounding-reset').addEventListener('click',()=>{localStorage.removeItem(ROUNDING_KEY);roundingProfiles=Object.fromEntries(clone(BHH_ROUNDING_DEFAULTS).map(x=>[x.id,x]));renderRounding();});
  $('#rounding-export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(roundingArray(),null,2)],{type:'application/json'});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download='BHH-rounding-policy.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),500);});
  $('#rounding-import').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const v=JSON.parse(await f.text());if(!Array.isArray(v))throw new Error('Invalid policy');roundingProfiles=Object.fromEntries(v.map(x=>[x.id,x]));localStorage.setItem(ROUNDING_KEY,JSON.stringify(v));renderRounding();}catch(err){$('#rounding-message').innerHTML=`<div class="alert alert-error">${esc(err.message)}</div>`;}e.target.value='';});
}
function renderRounding() {
  const local=Boolean(localStorage.getItem(ROUNDING_KEY));
  $('#rounding-status').innerHTML=`<span class="badge ${local?'badge-warning':'badge-ok'}">${local?'LOCAL TEST OVERRIDE':'GLOBAL DEFAULT'}</span>`;
  $('#rounding-policy-list').innerHTML=roundingArray().map((p,i)=>`<article class="rounding-card" data-rp-card="${esc(p.id)}"><strong>${esc(p.label)}</strong><div class="form-grid compact-grid">
    <label class="field"><span>Increment (${esc(p.unit)})</span><input data-rp="increment" type="number" step="any" min="0.000001" value="${p.increment}" ${p.method==='none'?'disabled':''}></label>
    <label class="field"><span>Max difference (%)</span><input data-rp="maxPercentDifference" type="number" step="0.01" min="0" max="100" value="${p.maxPercentDifference}" ${p.method==='none'?'disabled':''}></label>
    <label class="field"><span>Max absolute difference</span><input data-rp="maxAbsoluteDifference" type="number" step="any" min="0" value="${p.maxAbsoluteDifference??''}" ${p.method==='none'?'disabled':''}></label>
    </div></article>`).join('');
}
function saveRounding() {
  document.querySelectorAll('[data-rp-card]').forEach(card=>{
    const p=roundingProfiles[card.dataset.rpCard]; if(!p||p.method==='none')return;
    card.querySelectorAll('[data-rp]').forEach(input=>{
      const k=input.dataset.rp; const v=input.value.trim();
      if (k==='maxAbsoluteDifference'&&v==='') delete p[k]; else p[k]=Number(v);
    });
  });
  for (const p of roundingArray()) {
    if (!(p.increment>0) || !(p.maxPercentDifference>=0&&p.maxPercentDifference<=100)) {
      $('#rounding-message').innerHTML='<div class="alert alert-error">Invalid rounding policy.</div>'; return;
    }
  }
  localStorage.setItem(ROUNDING_KEY,JSON.stringify(roundingArray()));
  $('#rounding-message').innerHTML='<div class="alert alert-success">Local test override saved.</div>';
  renderRounding();
}

// Global hook for publish-manager.js updates
window.BHH_APP_NOTIFY_UPDATE = function(item) {
  if (!item) return;
  const match = catalog.find(c => c.master?.catalog_id === item.catalog_id || c.key === item.key);
  if (match) {
    match.status = 'approved_published';
    if (match.master) {
      match.structured = buildStructuredFromMaster(match.master);
    }
  }
  const curType = $('#cancer-type-select')?.value || '';
  populateRegimenOptionsForType(curType);
  renderLibrary();
};

init();