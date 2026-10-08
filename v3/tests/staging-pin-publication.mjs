// Synthetic loopback-only end-to-end QA. NEVER sends test credentials to the Internet.
// Run after .devcontainer/start-preview.sh, against the isolated temporary local D1.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8792';
if(!/^http:\/\/127\.0\.0\.1:8792$/.test(base))throw Error('Only isolated loopback QA is allowed');
const report=readFileSync('v3/.staging-secrets/CODESPACES_LOGIN.txt','utf8');
const extract=label=>{
 const value=report.split('\n').find(x=>x.startsWith(label+': '))?.slice(label.length+2).trim();
 if(!value||!(/^[0-9]{10}$/).test(value))throw Error('Missing synthetic PIN '+label);
 return value;
};
const editorPin=extract('EDITOR Confirm PIN (synthetic test only)');
const reviewerPin=extract('REVIEWER Confirm PIN (synthetic test only)');
assert.notEqual(editorPin,reviewerPin);
const call=async(path,method='GET',body,cookie)=>{
 const res=await fetch(base+'/api'+path,{method,headers:{
  ...(method!=='GET'?{Origin:base,'Content-Type':'application/json','X-Requested-With':'BHH-V3',
   'CF-Connecting-IP':'198.51.100.80'}:{}), // synthetic per-IP fixture, local loopback only
  ...(cookie?{Cookie:cookie}:{}),
 },body:body===undefined?undefined:JSON.stringify(body)});
 let data={};try{data=await res.json()}catch{}
 return {res,data};
};
const login=async pin=>{
 const x=await call('/auth/editor-pin','POST',{pin});
 assert.equal(x.res.status,200,JSON.stringify(x.data));
 return {cookie:x.res.headers.get('set-cookie')?.split(';')[0],role:x.data.role};
};
const editor=await login(editorPin);assert.equal(editor.role,'regimen_editor');
const reviewer=await login(reviewerPin);assert.equal(reviewer.role,'oncology_pharmacist');
const pilot=(await call('/catalog')).data.catalog.find(x=>x.status==='published'&&x.name==='TCH');
assert.ok(pilot);
const name='Synthetic reviewed and published '+Date.now();
const made=await call('/drafts','POST',{sourceVersionId:pilot.versionId,name,reason:'Synthetic independent PIN publication integration check'},editor.cookie);
assert.equal(made.res.status,201,JSON.stringify(made.data));
let v=made.data.version;
const send=async(action,cookie,params={})=>{
 const x=await call('/versions/'+encodeURIComponent(v.id)+'/'+action,'POST',{
  expectedRevision:v.revision,reason:'Synthetic independent pharmacist clinical review workflow test',...params
 },cookie);
 if(x.res.ok)v=x.data.version;
 return x;
};
assert.equal((await send('submit',editor.cookie)).res.status,403);
assert.equal((await send('submit',editor.cookie,{confirmPin:editorPin})).res.status,200);
assert.equal(v.status,'submitted');
assert.equal((await send('approve',editor.cookie)).res.status,403);
assert.equal((await send('publish',reviewer.cookie)).res.status,409);
assert.equal((await send('start-review',reviewer.cookie)).res.status,200);
assert.equal((await send('approve',reviewer.cookie)).res.status,200);
assert.equal(v.status,'approved');
const pub=await send('publish',reviewer.cookie);
assert.equal(pub.res.status,200,JSON.stringify(pub.data));
assert.equal(v.status,'published');
assert.equal(pub.data.postPublishCheck?.singleActiveVersion,true);
assert.equal(pub.data.postPublishCheck?.approvalAudit,true);
const guest=await call('/catalog');
assert.ok(guest.data.catalog.some(x=>x.versionId===v.id&&x.status==='published'));
assert.equal((await call('/versions/'+encodeURIComponent(v.id))).res.status,200);
assert.equal((await call('/registry')).res.status,403);
console.log('SYNTHETIC REVIEWER PIN PUBLICATION E2E PASS (not clinical certification)');
