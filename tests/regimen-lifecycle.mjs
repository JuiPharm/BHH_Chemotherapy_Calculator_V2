import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestPost as change } from '../functions/api/publish.js';
import { onRequestGet as listPublished, onRequestPost as listAll } from '../functions/api/regimens.js';

const fixture=JSON.parse(readFileSync(new URL('../data/regimens.published.json',import.meta.url),'utf8'))[0];
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const browser=readFileSync(new URL('../app.bundle.js',import.meta.url),'utf8');
const builder=readFileSync(new URL('../regimen-builder.js',import.meta.url),'utf8');
const styles=readFileSync(new URL('../styles.css',import.meta.url),'utf8');
const rows=new Map();
const db={
  prepare(sql){
    return {
      bind(...args) {
        return {
          sql,args,
          async first() {
            const r=rows.get(args[0]);
            return r?{status:r.status,document:r.document,revision:r.revision}:null;
          }
        };
      },
      async all() {
        let values=[...rows.values()];
        if(sql.includes("status='published'"))values=values.filter(x=>x.status==='published');
        return {results:values.map(x=>({document:x.document}))};
      }
    };
  },
  async batch(queries){
    const [op]=queries, [id,revision,status,document,updated,expected]=op.args;
    const existing=rows.get(id);
    const accepted=existing ? existing.revision===expected : expected===0;
    if(accepted) rows.set(id,{revision,status,document,updated});
    return [{meta:{changes:accepted?1:0}},{meta:{changes:accepted?1:0}}];
  }
};
const env={APPROVE_PIN:'safe-test-pin',REGIMENS_DB:db};
function request(action,regimen,expectedRevision=0,pin='safe-test-pin'){
  return new Request('https://test/api/publish',{method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action,regimen,expectedRevision,pin})});
}
async function run(action,regimen,expectedRevision=0,pin='safe-test-pin'){
  const res=await change({request:request(action,regimen,expectedRevision,pin),env});
  return {status:res.status,data:await res.json()};
}
async function getPublished(){
  const res=await listPublished({env});assert.equal(res.status,200);return (await res.json()).regimens;
}
async function getAll(){
  const res=await listAll({request:new Request('https://test/api/regimens',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({pin:'safe-test-pin'})}),env});
  return (await res.json()).regimens;
}

// Browser PIN: no local secret; readable modal on all devices.
assert(html.includes('id="pin-auth-visibility"'));
assert(html.includes('id="pin-auth-submit"'));
assert(styles.includes('.pin-auth-input-wrap'));
assert(!browser.includes("localStorage.setItem('bhh_approve_pin'"));
assert(!browser.includes("sessionStorage.setItem('bhh_pharmacist_pin_token'"));
assert(browser.includes('rebuildCatalog();'));

// Clear does not delete central data; life-cycle actions require ID/PIN.
assert(html.includes('id="builder-clear"'));
assert(builder.includes("$('builder-clear').onclick=clearForm"));
assert(builder.includes("model=empty()"));
assert(builder.includes("action:archive?'archive':'restore'"));
assert(builder.includes("typed!==item.id"));

let regimen={...structuredClone(fixture),id:'BHH-LIFECYCLE-TEST-01',revision:0};
let r=await run('draft',regimen);assert.equal(r.status,200);regimen=r.data.regimen;
assert.equal((await getPublished()).length,0);

r=await run('publish',regimen,regimen.revision);assert.equal(r.status,200);regimen=r.data.regimen;
assert.equal((await getPublished()).length,1);

r=await run('archive',regimen,regimen.revision,'wrong-pin');assert.equal(r.status,401);
assert.equal((await getPublished()).length,1);

const oldRevision=regimen.revision;
r=await run('archive',regimen,regimen.revision);assert.equal(r.status,200);regimen=r.data.regimen;
assert.equal(regimen.archived,true);
assert.equal(regimen.calculator_enabled,false);
assert.equal((await getPublished()).length,0);
assert.equal((await getAll()).find(x=>x.id===regimen.id)?.archived,true);

r=await run('archive',regimen,oldRevision);assert.equal(r.status,409);
r=await run('publish',regimen,regimen.revision);assert.equal(r.status,409);

r=await run('restore',regimen,regimen.revision);assert.equal(r.status,200);regimen=r.data.regimen;
assert.equal(regimen.archived,false);assert.equal(regimen.status,'draft');
assert.equal((await getPublished()).length,0);

r=await run('publish',regimen,regimen.revision);assert.equal(r.status,200);regimen=r.data.regimen;
assert.equal((await getPublished()).length,1);

// Never let Archive silently expose an older static clinical pilot version.
r=await run('archive',{...fixture,revision:1},1);
assert.equal(r.status,409);
console.log('REGIMEN_LIFECYCLE_PASS: secure PIN, clear UI, draft, publish, archive, conflict, restore and baseline guard');
