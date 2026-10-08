// Named PIN verification with distinct Staging and Production secrets. A second
// independent pharmacist is required to Approve/Publish clinical definitions.
import { sameOrigin } from './preview-origin.js';
const enc=new TextEncoder();
const COOKIE='__Host-bhh_regimen_editor';
const fail=(message,status)=>Object.assign(Error(message),{status});
export const publicCalculator=env=>
  ['staging','production'].includes(env.APP_ENV) &&
  env.AUTH_MODE==='internal' && env.PUBLIC_CALCULATOR==='true' &&
  (env.APP_ENV!=='production'||env.PRODUCTION_PUBLIC_PIN==='true') &&
  env.LOCAL_TEST_AUTH!=='true';
const hexb=a=>Array.from(a,x=>x.toString(16).padStart(2,'0')).join('');
const sha=async t=>hexb(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(t))));
const pepper=env=>{
  const value=env.APP_ENV==='production'?env.PRODUCTION_PASSWORD_PEPPER:env.STAGING_PASSWORD_PEPPER;
  if(typeof value!=='string'||value.length<32)
    throw fail('Individual PIN verification secret required',503);
  return value;
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
  const row=await env.DB.prepare(`SELECT u.email,u.role_code FROM staging_editor_sessions s
    JOIN staging_editor_pins p ON p.user_id=s.user_id
    JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>? AND u.active=1 AND u.role_code IN ('regimen_editor','oncology_pharmacist')`)
   .bind(await sha(token),Math.floor(Date.now()/1000)).first();
  return row?{email:row.email.toLowerCase(),local:false,pin:true,pinRole:row.role_code}:null;
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
 const record=await db.prepare(`SELECT u.id,u.email,u.role_code FROM staging_editor_pins p
 JOIN users u ON u.id=p.user_id
 WHERE p.pin_hash=? AND u.active=1 AND u.role_code IN ('regimen_editor','oncology_pharmacist')`).bind(candidate).first();
 if(!record){
  await db.prepare('INSERT INTO staging_auth_events(id,user_id,fingerprint,action,at) VALUES(?,?,?,?,?)')
    .bind(crypto.randomUUID(),null,ip,'denied',now).run();
  throw fail('Invalid PIN',401);
 }
 await db.prepare('INSERT INTO staging_auth_events(id,user_id,fingerprint,action,at) VALUES(?,?,?,?,?)')
  .bind(crypto.randomUUID(),record.id,ip,'login',now).run();
 const token=hexb(crypto.getRandomValues(new Uint8Array(32)));
 await db.prepare('INSERT INTO staging_editor_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
  .bind(await sha(token),record.id,now,now+3600).run();
 return reply({ok:true,role:record.role_code},200,{'Set-Cookie':cookie(token,3600)});
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

// A PIN-editing session is insufficient to submit: re-confirm the person's PIN
// immediately before clinical review transition. This NEVER grants Publish.
export async function verifySubmitPin(env,email,pin,request){
 if(!publicCalculator(env))throw fail('Not found',404);
 if(typeof pin!=='string'||!(/^[0-9]{10}$/).test(pin))throw fail('Confirm PIN required before Submit',403);
 const now=Math.floor(Date.now()/1000),db=env.DB;
 const fingerprint=await sha(request.headers.get('CF-Connecting-IP')||'unknown');
 const allowed=await limiter(db,'submit-pin-ip:'+fingerprint,5,now);
 if(!allowed)throw fail('Too many PIN attempts',429);
 const row=await db.prepare(`SELECT p.pin_hash FROM staging_editor_pins p
   JOIN users u ON u.id=p.user_id WHERE u.email=? AND u.active=1
   AND u.role_code='regimen_editor'`).bind(email).first();
 const correct=await pinHash(pin,pepper(env));
 if(!row||row.pin_hash!==correct)throw fail('Incorrect Confirm PIN',403);
 return true;
}
