import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { validateRegimen, verifyPin } from '../src/server/clinical.js';
import { onRequestPost as save } from '../functions/api/publish.js';
import { onRequestGet as list } from '../functions/api/regimens.js';

const load=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const published=JSON.parse(load('../data/regimens.published.json'));
const legacy=JSON.parse(load('../data/legacy-regimens.v1.json'))['สูตรยาเคมีบำบัด'];
const app=load('../app.bundle.js');
const manager=load('../publish-manager.js');
const builder=load('../regimen-builder.js');
const html=load('../index.html');
const clone=x=>JSON.parse(JSON.stringify(x));
const cases=[];
const check=(name,fn)=>cases.push([name,fn]);

check('01: all six structured fixtures validate without optional reference',()=>{
 assert.equal(published.length,6);
 for(const r of published){const v=clone(r);v.references=[];assert.deepEqual(validateRegimen(v,true),[],r.name);}
});
check('02: 136 legacy regimens preserved and not auto-approved',()=>{
 assert.equal(legacy.length,136);
 assert(app.includes('const structuredObj = isPilot ? activeById[m.structured_regimen_id] : null'));
 assert(app.includes("status:isPilot ? 'approved' : (a?.status||'clinical_review_required')"));
 assert(!/selectedItem.structured\s*=\s*buildStructuredFromMaster\(/.test(app));
});
check('03: invalid day and incorrect unit blocked on server',()=>{
 const r=clone(published[2]);r.phases[0].orders[0].schedule.days=[0,99];
 assert(validateRegimen(r,true).length>0);
 r.phases[0].orders[0].schedule.days=[1];r.phases[0].orders[0].dose.unit='unknown';
 assert(validateRegimen(r,true).length>0);
});
check('04: draft may be incomplete but cannot be published',()=>{
 const d={id:'BHH-DRAFT-1',name:'Draft',indication:'Study',phases:[],cycleCount:null,cycleIntervalDays:null};
 assert.deepEqual(validateRegimen(d,false),[]);
 assert(validateRegimen(d,true).length>0);
});
check('05: legacy PIN and missing secrets are rejected',()=>{
 assert.equal(verifyPin('1234',{APPROVE_PIN:'1234'}).status,503);
 assert.equal(verifyPin('other',{APPROVE_PIN:'xxxx'}).status,401);
 assert.equal(verifyPin('new-pin',{APPROVE_PIN:'new-pin'}),null);
 assert.equal(verifyPin('new-pin',{}).status,503);
});
check('06: browser never creates or persists a local pharmacist PIN',()=>{
 assert(!app.includes("localStorage.setItem('bhh_approve_pin'"));
 assert(!app.includes("sessionStorage.setItem('bhh_pharmacist_pin_token'"));
 assert(!manager.includes('localStorage.setItem('));
});
check('07: source and guideline text optional, internal source preserved safely',()=>{
 const sandbox={window:{},URL};vm.runInNewContext(manager,sandbox);
 const checkRef=sandbox.window.BHH_PUBLISH.checkReference;
 assert.equal(checkRef('',''),'');
 assert.equal(checkRef('BHH','  '),'');
 assert.equal(checkRef('',' BHH Oncology Protocol 2569 '),'BHH Oncology Protocol 2569');
 assert.equal(checkRef('','javascript:alert(1)'),'javascript:alert(1)');
 assert.equal(checkRef('','https://eviq.org.au/'),'https://eviq.org.au/');
 assert(!html.includes('id="review-publish-url" type="url"'));
});
check('08: prototype features retained/restored',()=>{
 for(const x of ['data-tab="calculator"','data-tab="library"','data-tab="manager"','data-tab="builder"','data-tab="legacy"','data-tab="rounding"','data-tab="about"'])
 assert(html.includes(x),x);
 for(const id of ['builder-save','builder-publish','builder-export','builder-load','legacy-export','legacy-file'])
 assert(html.includes('id="'+id+'"'),id);
 assert(builder.includes('BHH_BUILDER'));
});
check('09: stale calculator data invalidated and published central source polled',()=>{
 assert(app.includes('function invalidateCalculation()'));
 assert(app.includes('setInterval(syncCentralRegimens, 10000)'));
 assert(app.includes('lastCalculation=null;'));
 assert(app.includes('window.BHH_APPLY_PUBLISHED'));
});
check('10: API must not report success without D1 binding',async()=>{
 const r=await save({request:new Request('https://test/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'abcdef',action:'publish',regimen:published[0]})}),env:{APPROVE_PIN:'abcdef'}});
 assert.equal(r.status,503);
 const data=await r.json();assert.equal(data.success,false);
});
check('11: API wrong PIN blocked before D1 access',async()=>{
 const r=await save({request:new Request('https://test/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'bad',action:'publish',regimen:published[0]})}),env:{APPROVE_PIN:'abcdef'}});
 assert.equal(r.status,401);
});
check('12: successful publication and optimistic conflict',async()=>{
 const saved=new Map();
 const db={
  prepare(sql){
   return {bind(...args){
    return {sql,args,async first(){const r=saved.get(args[0]);return r?{status:r.status}:null;},
     async all(){return {results:[...saved.values()].filter(r=>r.status==='published').map(r=>({document:r.document}))}}};
   }};
  },
  async batch(ops){
   const [op]=ops;const [id,rev,status,document,updated,expected]=op.args;
   const existing=saved.get(id);
   if(existing&&existing.revision!==expected)return [{meta:{changes:0}},{meta:{changes:0}}];
   if(!existing&&expected!==0)return [{meta:{changes:0}},{meta:{changes:0}}];
   saved.set(id,{revision:rev,status,document,updated});
   return [{meta:{changes:1}},{meta:{changes:1}}];
  },
 };
 const request=(rev)=>new Request('https://test/api/publish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin:'abcdef',action:'publish',regimen:published[0],expectedRevision:rev})});
 const first=await save({request:request(0),env:{APPROVE_PIN:'abcdef',REGIMENS_DB:db}});
 assert.equal(first.status,200);
 const dup=await save({request:request(0),env:{APPROVE_PIN:'abcdef',REGIMENS_DB:db}});
 assert.equal(dup.status,409);
 const rows=await list({env:{REGIMENS_DB:db}});
 assert.equal((await rows.json()).regimens.length,1);
});

let pass=0;
for(const [name,fn] of cases){await fn();pass++;console.log('PASS',name);}
console.log('PRODUCTION_SAFETY_PASS checks='+pass);
