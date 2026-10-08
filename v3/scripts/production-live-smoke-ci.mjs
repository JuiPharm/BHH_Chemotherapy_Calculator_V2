// Live smoke of isolated Production Worker after migration, provisioning and deployment.
// Never prints secret values or patient data. Uses named test roles, no clinical publications.
const base='https://bhh-chemotherapy-v3-production.juipharm.workers.dev';
const e=process.env;
const get=async path=>{const r=await fetch(base+path,{headers:{'Cache-Control':'no-store'}});return r;};
const session=await get('/api/session');
if(!session.ok || (await session.json()).authMode!=='public')
 throw Error('Production public calculator session failed');
const catalog=await get('/api/catalog');
if(!catalog.ok)throw Error('Production catalog not available');
const rows=(await catalog.json()).catalog;
if(rows.filter(x=>x.status==='published').length<6||rows.some(x=>!['published','reference_only'].includes(x.status)))
 throw Error('Production catalog unexpected Published/Reference-only state');
const registry=await get('/api/registry');
if(registry.status!==403)throw Error('Anonymous Registry must remain forbidden');
const revisions=await get('/api/revision');
if(!revisions.ok)throw Error('Production global D1 revision API unavailable');
const home=await get('/');
if(!home.ok)throw Error('Production UI not available');
for(const [p,role] of [[e.PRODUCTION_EDITOR_PIN,'regimen_editor'],[e.PRODUCTION_REVIEWER_PIN,'oncology_pharmacist']]){
 const r=await fetch(base+'/api/auth/editor-pin',{method:'POST',headers:{
   Origin:base,'Content-Type':'application/json','X-Requested-With':'BHH-V3'
 },body:JSON.stringify({pin:p})});
 if(!r.ok||(await r.json()).role!==role)throw Error('Named Production PIN verification failed: '+role);
 const cookie=r.headers.get('set-cookie')?.split(';')[0];
 if(!cookie)throw Error('Production HttpOnly PIN session cookie absent');
 const s=await fetch(base+'/api/session',{headers:{Cookie:cookie}});
 if(!s.ok||(await s.json()).user.role!==role)throw Error('Production role session invalid: '+role);
}
console.log('LIVE PRODUCTION PASS: central D1, open Calculator, Published-only, Registry permission denied, distinct named Editor and Reviewer PIN roles. NO clinical dose signoff implied.');
