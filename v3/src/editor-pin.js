// Staging public-calculator mode only. Individual high-entropy PIN grants EDIT-DRAFT rights,
// never Oncology Review, Approve, Publish or Admin. No shared/config hard-coded PIN.
import { sameOrigin } from './preview-origin.js';
const enc=new TextEncoder();
const COOKIE='__Host-bhh_regimen_editor';
const fail=(message,status)=>Object.assign(Error(message),{status});
export const publicCalculator=env=>env.APP_ENV==='staging' &&
  env.AUTH_MODE==='internal' && env.PUBLIC_CALCULATOR==='true' &&
  env.LOCAL_TEST_AUTH!=='true';
const hexb=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
const sha=async t=>hexb(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(t))));
const pepper=env=>{
  if(typeof env.STAGING_PASSWORD_PEPPER!=='string'||env.STAGING_PASSWORD_PEPPER.length<32)
    throw fail('Staging editor security secret required',503);
  return env.STAGING_PASSWORD_PEPPER;
};
export async function pinHash(pin,secret){
  if(!/^\d{10}$/.test(pin)||typeof secret!=='string'||secret.length<32)throw Error('Invalid PIN parameters');
  const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return hexb(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode('bhh-editor-pin-v1:'+pin))));
}
const cookie=(value,maxAge)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const getToken=req=>{
  const value=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  return /^[0-9a-f]{64}$/.test(value||'')?value:null;
};
const reply=(payload,status=200,extra={})=>new Response(JSON.stringify(payload),{
  status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff',...extra}
});
async function limiter(db,key,limit,now){
  await db.prepare(`INSERT INTO staging_auth_limits(key,started,attempts) VALUES(?,?,1)
  ON CONFLICT(key) DO UPDATE SET
  started=CASE WHEN started<=? THEN excluded.started ELSE started END,
  attempts=CASE WHEN started<=? THEN 1 ELSE attempts+1 END`)
   .bind(key,now,now-900,now-900).run();
  const record=await db.prepare('SELECT attempts FROM staging_auth_limits WHERE key=?').bind(key).first();
  return record.attempts<=limit;
}
export async function pinIdentity(request,env){
  if(!publicCalculator(env))return null;
  const token=getToken(request);
  if(!token)return null;
  const row=await env.DB.prepare(`SELECT u.email FROM staging_editor_sessions s
    JOIN staging_editor_pins p ON p.user_id=s.user_id
    JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.active=1 AND u.role_code='regimen_editor'`)
   .bind(await sha(token),Math.floor(Date.now()/1000)).first();
  return row?{email:row.email.toLowerCase(),local:false}:null;
}
export async function confirmEditorPin(request,env){
 if(!publicCalculator(env))throw fail('Not found',404);
 if(request.method!=='POST'||!sameOrigin(request,env)||
    request.headers.get('X-Requested-With')!=='BHH-V3'||
    !request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('Same-origin JSON required',403);
 const secret=pepper(env);
 const raw=await request.text();
 if(raw.length>256)throw fail('Request too large',413);
 let body;try{body=JSON.parse(raw)}catch{throw fail('Invalid JSON',400)}
 if(typeof body?.pin!=='string'||!/^\d{10}$/.test(body.pin))throw fail('Invalid PIN',401);
 const now=Math.floor(Date.now()/1000), db=env.DB;
 const ip=await sha(request.headers.get('CF-Connecting-IP')||'unknown');
 const [allowIp,allowGlobal]=await Promise.all([
    limiter(db,'editor-ip:'+ip,5,now),limiter(db,'editor-global',100,now)
 ]);
 if(!allowIp||!allowGlobal)throw fail('Too many PIN attempts',429);
 const candidate=await pinHash(body.pin,secret);
 const record=await db.prepare(`SELECT u.id,u.email FROM staging_editor_pins p
 JOIN users u ON u.id=p.user_id
 WHERE p.pin_hash=? AND u.active=1 AND u.role_code='regimen_editor'`).bind(candidate).first();
 if(!record)throw fail('Invalid PIN',401);
 const token=hexb(crypto.getRandomValues(new Uint8Array(32)));
 await db.prepare('INSERT INTO staging_editor_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
  .bind(await sha(token),record.id,now,now+3600).run();
 return reply({ok:true,role:'regimen_editor'},200,{'Set-Cookie':cookie(token,3600)});
}
export async function logoutEditorPin(request,env){
 if(!publicCalculator(env))throw fail('Not found',404);
 if(request.method!=='POST'||!sameOrigin(request,env)||
    request.headers.get('X-Requested-With')!=='BHH-V3'||
    !request.headers.get('Content-Type')?.startsWith('application/json'))throw fail('Same-origin JSON required',403);
 const token=getToken(request);
 if(token)await env.DB.prepare('DELETE FROM staging_editor_sessions WHERE token_hash=?').bind(await sha(token)).run();
 return reply({ok:true},200,{'Set-Cookie':cookie('',0)});
}
