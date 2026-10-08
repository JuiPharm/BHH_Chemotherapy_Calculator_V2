import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker from '../src/worker.js';
import {pinHash,verifySubmitPin} from '../src/editor-pin.js';
const base='https://bhh-chemotherapy-v3-staging.example.workers.dev';
const pepper='test-only-very-long-32-characters-pepper!';
const pin='8342719056'; // synthetic only
function fixture(){
 const sql=new DatabaseSync(':memory:');
 for(const path of ['v3/migrations/0001_schema.sql','v3/migrations/0004_staging_internal_auth.sql','v3/migrations/0005_editor_pin.sql'])
   sql.exec(readFileSync(path,'utf8'));
 const DB={prepare(q){return {async all(){return {results:sql.prepare(q).all()}},bind(...a){const s=sql.prepare(q);return {
   async first(){return s.get(...a)||null},async all(){return {results:s.all(...a)}},
   async run(){const x=s.run(...a);return {meta:{changes:x.changes}}}
 }}}}};
 return {sql,env:{APP_ENV:'staging',AUTH_MODE:'internal',PUBLIC_CALCULATOR:'true',
   STAGING_PASSWORD_PEPPER:pepper,DB,ASSETS:{async fetch(req){
     return new Response('PUBLIC TEST ASSET',{headers:{'Content-Type':'text/html'}});
   }}}};
}
function request(path,body,headers={}){
 return new Request(base+path,{method:'POST',headers:{
  Origin:base,'Content-Type':'application/json','X-Requested-With':'BHH-V3',
  'CF-Connecting-IP':'198.51.100.3',...headers,
 },body:JSON.stringify(body)});
}
test('staging public mode serves only calculator APIs without session',async()=>{
 const {env}=fixture();
 const sess=await worker.fetch(new Request(base+'/api/session'),env);
 assert.equal(sess.status,200);const user=(await sess.json());
 assert.equal(user.authMode,'public');assert.equal(user.user.role,'calculator_user');
 const catalog=await worker.fetch(new Request(base+'/api/catalog'),env);
 assert.equal(catalog.status,200);assert.deepEqual((await catalog.json()).catalog,[]);
 const asset=await worker.fetch(new Request(base+'/app.js'),env);
 assert.equal(asset.status,200);
 const registry=await worker.fetch(new Request(base+'/api/registry'),env);
 assert.equal(registry.status,403);
 const audit=await worker.fetch(new Request(base+'/api/audit'),env);
 assert.equal(audit.status,403);
 const write=await worker.fetch(request('/api/drafts',{reason:'Attempt public write'}),env);
 assert.notEqual(write.status,200);
});
test('personal editor PIN opens only editor session; no audit; expiry and logout',async()=>{
 const {sql,env}=fixture();
 sql.prepare("INSERT INTO users VALUES('editor1','editor@staging.test','regimen_editor',1,'now','fixture','now','fixture')").run();
 const hash=await pinHash(pin,pepper);
 sql.prepare("INSERT INTO staging_editor_pins VALUES('editor1',?,'now','fixture')").run(hash);
 const wrong=await worker.fetch(request('/api/auth/editor-pin',{pin:'0000000000'}),env);
 assert.equal(wrong.status,401);
 const cross=await worker.fetch(request('/api/auth/editor-pin',{pin},{Origin:'https://evil.test'}),env);
 assert.equal(cross.status,403);
 const good=await worker.fetch(request('/api/auth/editor-pin',{pin}),env);
 assert.equal(good.status,200);
 assert.match(good.headers.get('Set-Cookie'),/HttpOnly; Secure; SameSite=Strict/);
 const cookie=good.headers.get('Set-Cookie').split(';')[0];
 const session=await worker.fetch(new Request(base+'/api/session',{headers:{Cookie:cookie}}),env);
 assert.equal(session.status,200);
 assert.equal((await session.json()).authMode,'editor');
 assert.equal((await worker.fetch(new Request(base+'/api/audit',{headers:{Cookie:cookie}}),env)).status,403);
 const out=await worker.fetch(request('/api/auth/editor-logout',{}, {Cookie:cookie}),env);
 assert.equal(out.status,200);assert.match(out.headers.get('Set-Cookie'),/Max-Age=0/);
 const publicAgain=await worker.fetch(new Request(base+'/api/session',{headers:{Cookie:cookie}}),env);
 assert.equal((await publicAgain.json()).authMode,'public');
});
test('rate-limit bad PINs and fail closed when pepper not configured',async()=>{
 const {env}=fixture();
 delete env.STAGING_PASSWORD_PEPPER;
 const fail=await worker.fetch(request('/api/auth/editor-pin',{pin}),env);
 assert.equal(fail.status,503);
 env.STAGING_PASSWORD_PEPPER=pepper;
 for(let i=0;i<6;i++){
   const v=await worker.fetch(request('/api/auth/editor-pin',{pin:'9999999999'}),env);
   assert.equal(v.status,i>=5?429:401);
 }
});
test('guest access strictly staging opt-in, never production or V2 local',async()=>{
 const {env}=fixture();
 for(const altered of [{PUBLIC_CALCULATOR:'false'}, {APP_ENV:'production'}, {LOCAL_TEST_AUTH:'true'}]){
   const res=await worker.fetch(new Request(base+'/api/session'),{...env,...altered});
   assert.notEqual(res.status,200);
 }
});

test('fresh personal PIN is mandatory before Submit Review even with active editor session',async()=>{
 const {sql,env}=fixture();
 sql.prepare("INSERT INTO users VALUES('ed','named@staging.test','regimen_editor',1,'now','fixture','now','fixture')").run();
 sql.prepare("INSERT INTO staging_editor_pins VALUES('ed',?,'now','fixture')").run(await pinHash(pin,pepper));
 const req=request('/api/versions/any/submit',{});
 await assert.rejects(()=>verifySubmitPin(env,'named@staging.test',undefined,req),{status:403});
 await assert.rejects(()=>verifySubmitPin(env,'named@staging.test','0000000000',req),{status:403});
 assert.equal(await verifySubmitPin(env,'named@staging.test',pin,req),true);
 await assert.rejects(()=>verifySubmitPin(env,'outsider@staging.test',pin,req),{status:403});
});
test('guest source-only legacy detail never returns mutable unpublished draft fields',async()=>{
 const {sql,env}=fixture();
 const source={
  'ชื่อสูตรยา':'Unverified source protocol',
  'ชนิดของมะเร็ง':'Lung',
  'รอบการรักษา':'Multiple cycles',
  'รายการยา':[{'ชื่อยา':'TestDrug','ขนาดยา':'AUC 5-6 IV day 1','ความถี่ในการให้':'21 days'}],
 };
 sql.prepare("INSERT INTO regimens VALUES(?,?,?,?,?,?,?,?,?,?)").run(
  'BHH-CATALOG-001','Modified confidential draft','Lung','Lung','[]',JSON.stringify(source),'now','fixture','now','fixture');
 sql.prepare("INSERT INTO regimen_versions(id,regimen_id,version,status,document,created_at,created_by,updated_at,updated_by) VALUES(?,?,?,?,?,?,?,?,?)")
  .run('BHH-CATALOG-001:1','BHH-CATALOG-001','1','draft',
       JSON.stringify({id:'BHH-CATALOG-001',name:'PRIVATE UNSUBMITTED EDIT',phases:[],references:[]}),
       'now','fixture','now','fixture');
 const catalog=await worker.fetch(new Request(base+'/api/catalog'),env);
 const list=(await catalog.json()).catalog;
 assert.equal(list.length,1);assert.equal(list[0].status,'reference_only');
 assert.equal(list[0].name,'Unverified source protocol');
 const detail=await worker.fetch(new Request(base+'/api/versions/BHH-CATALOG-001%3A1'),env);
 assert.equal(detail.status,200);
 const v=(await detail.json()).version;
 assert.equal(v.status,'reference_only');
 assert.deepEqual(v.document.phases,[]);
 assert.equal(v.document.sourceRecord['รายการยา'][0]['ขนาดยา'],'AUC 5-6 IV day 1');
 assert.equal(JSON.stringify(v).includes('PRIVATE UNSUBMITTED EDIT'),false);
 const denied=await worker.fetch(new Request(base+'/api/versions/random-private-id'),env);
 assert.notEqual(denied.status,200);
});

test('different oncology reviewer PIN grants review role; it does not grant admin audit',async()=>{
 const {sql,env}=fixture();
 const other='5739026418';
 sql.prepare("INSERT INTO users VALUES('r1','reviewer.named@staging.test','oncology_pharmacist',1,'now','fixture','now','fixture')").run();
 sql.prepare("INSERT INTO staging_editor_pins VALUES('r1',?,'now','fixture')").run(await pinHash(other,pepper));
 const login=await worker.fetch(request('/api/auth/editor-pin',{pin:other}),env);
 assert.equal(login.status,200);
 assert.equal((await login.json()).role,'oncology_pharmacist');
 const cookie=login.headers.get('Set-Cookie').split(';')[0];
 const sess=await worker.fetch(new Request(base+'/api/session',{headers:{Cookie:cookie}}),env);
 assert.equal(sess.status,200);
 const data=await sess.json();
 assert.equal(data.authMode,'reviewer_pin');
 assert.equal(data.user.role,'oncology_pharmacist');
 assert.equal((await worker.fetch(new Request(base+'/api/registry',{headers:{Cookie:cookie}}),env)).status,200);
 assert.equal((await worker.fetch(new Request(base+'/api/audit',{headers:{Cookie:cookie}}),env)).status,403);
});
