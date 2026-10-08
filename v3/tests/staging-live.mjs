import assert from 'node:assert/strict';
import { pbkdf2Sync, createHmac } from 'node:crypto';
const base=process.env.TEST_BASE_URL;
if(!base?.startsWith('http://127.0.0.1:'))throw Error('Staging integration test must run on loopback only');
const fixtures=JSON.parse(process.env.TEST_STAGING_FIXTURES||'[]');
if(fixtures.length!==4)throw Error('Four synthetic-only identities required');
const password=process.env.TEST_STAGING_PASSWORD;
const count={pass:0};
function check(value,label){assert.ok(value,label);count.pass++;console.log('PASS [STAGING-LOCAL]',label);}
const b32=str=>{
 let acc=0,bits=0,out=[]; const abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 for(const c of str.replace(/=+$/,'')){acc=(acc<<5)|abc.indexOf(c);bits+=5;if(bits>=8){out.push((acc>>>(bits-8))&255);bits-=8;}}
 return Buffer.from(out);
};
function totp(secret,step=Math.floor(Date.now()/30000)){
 const buf=Buffer.alloc(8);buf.writeBigUInt64BE(BigInt(step));
 const mac=createHmac('sha1',b32(secret)).update(buf).digest();const o=mac[19]&15;
 const v=(mac.readUInt32BE(o)&0x7fffffff)%1000000;
 return String(v).padStart(6,'0');
}
async function post(path,body,other={}){
 return fetch(base+path,{
  method:'POST',redirect:'manual',
  headers:{Origin:base,'X-Requested-With':'BHH-V3','Content-Type':'application/json',...other},
  body:JSON.stringify(body),
 });
}
async function login(fixture){
 const salt=await post('/api/auth/salt',{email:fixture.email});
 assert.equal(salt.status,200);
 const data=await salt.json();
 check(/^[0-9a-f]{32}$/.test(data.salt)&&data.iterations===600000,'salt and iterations for '+fixture.role);
 const prehash=pbkdf2Sync(password,Buffer.from(data.salt,'hex'),600000,32,'sha256').toString('hex');
 let result=await post('/api/auth/login',{email:fixture.email,prehash,totp:totp(fixture.secret)});
 check(result.status===200,'password + TOTP login for '+fixture.role);
 const rawCookie=result.headers.get('set-cookie')||'';
 check(rawCookie.includes('HttpOnly')&&rawCookie.includes('Secure')&&rawCookie.includes('SameSite=Strict'),'session cookie hardened for '+fixture.role);
 const cookie=rawCookie.split(';')[0];return {cookie,prehash};
}
function get(path,cookie,headers={}){
 return fetch(base+path,{headers:{...(cookie?{Cookie:cookie}:{}),...headers},redirect:'manual'});
}
const r0=await get('/api/session');
check(r0.status===401,'unauthenticated /api/session is 401');
const asset=await get('/app.js');
check(asset.status===401,'unauthenticated app JavaScript protected');
const sw=await get('/sw.js');
check(sw.status===401,'unauthenticated service worker protected');
const home=await get('/',null,{Accept:'text/html'});
check(home.status===303&&home.headers.get('location')===base+'/login','unauthenticated app redirects to /login');
const loginPage=await get('/login');
check(loginPage.status===200&&(await loginPage.text()).includes('Public')===false,'real login document is publicly available');
const fakeSalt=await post('/api/auth/salt',{email:'unknown-fixture@example.org'});
check(fakeSalt.status===200&&/^[a-f0-9]{32}$/.test((await fakeSalt.json()).salt),'unknown account gets indistinguishable salt format');
const invalidOrigin=await post('/api/auth/salt',{email:fixtures[0].email},{Origin:'https://evil.example'});
check(invalidOrigin.status===403,'cross-origin salt request denied');
const results=[];
for (const user of fixtures){
 const session=await login(user);results.push({...user,...session});
 const r=await get('/api/session',session.cookie), data=await r.json();
 check(r.status===200&&data.user.role===user.role&&data.authMode==='internal','role from D1 '+user.role);
}
const calc=results.find(x=>x.role==='calculator_user');
const editor=results.find(x=>x.role==='regimen_editor');
const reviewer=results.find(x=>x.role==='oncology_pharmacist');
const admin=results.find(x=>x.role==='clinical_admin');
const catalog=await get('/api/catalog',calc.cookie);
const data=await catalog.json();
check(catalog.status===200&&data.catalog.length===142&&data.catalog.filter(x=>x.status==='published').length===6,'142 central records with 6 Published');
const denied=await post('/api/drafts',{reason:'test fixture',document:{}},{Cookie:calc.cookie});
check(denied.status===403,'calculator cannot edit');
const deniedAudit=await get('/api/audit',reviewer.cookie);
check(deniedAudit.status===403,'reviewer cannot view admin-only audit');
const adminAudit=await get('/api/audit',admin.cookie);
check(adminAudit.status===200,'admin can view audit');
const protectedAsset=await get('/app.js',calc.cookie);
check(protectedAsset.status===200,'authenticated clinical assets accessible');
const reuse=await post('/api/auth/login',{email:calc.email,prehash:calc.prehash,totp:totp(calc.secret)});
check(reuse.status===401,'replay of consumed TOTP rejected');
const signout=await post('/api/auth/logout',{}, {Cookie:calc.cookie});
check(signout.status===200&&signout.headers.get('set-cookie')?.includes('Max-Age=0'),'logout clears cookie');
check((await get('/api/session',calc.cookie)).status===401,'revoked session is rejected');
console.log('Staging Local API checks passed:',count.pass);
