// Isolated staging-auth integration harness. ALWAYS local D1 / local Worker.
// Never run migrations, seed users or deploy to the real Cloudflare account.
import { spawn } from 'node:child_process';
import { randomBytes, pbkdf2Sync, createHmac, randomUUID } from 'node:crypto';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const temp=mkdtempSync(join(tmpdir(),'bhh-v3-staging-test-'));
const storage=join(temp,'isolated-d1');
const shim=join(temp,'loopback.cjs');
writeFileSync(shim,"const os=require('node:os');const o=os.networkInterfaces;os.networkInterfaces=()=>{try{return o()}catch{return {lo:[{address:'127.0.0.1',family:'IPv4',internal:true}]}}};");
const pepper='LOCAL-TEST-ONLY-DO-NOT-USE-AS-SECRET-ABC123456789';
const pass='Local-Staging-Only-Long-Password!2026';
const env={...process.env,NODE_OPTIONS:`${process.env.NODE_OPTIONS||''} --require ${shim}`,WRANGLER_SEND_METRICS:'false'};
const roles=['calculator_user','regimen_editor','oncology_pharmacist','clinical_admin'];
const editorPin='8342719056'; // SYNTHETIC TEST ONLY; never real staff credential
const q=x=>"'"+String(x).replaceAll("'","''")+"'";
const b32=a=>{
  const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits=0,acc=0,out='';
  for(const b of a){acc=(acc<<8)|b;bits+=8;while(bits>=5){out+=alpha[(acc>>>(bits-5))&31];bits-=5;}}
  if(bits)out+=alpha[(acc<<(5-bits))&31];
  return out;
};
const fixtures=[...roles,...roles].map((role,i)=>{
  const email=(i>=4?'ui-':'')+['calculator','editor','reviewer','admin'][i%4]+'@staging-fixture.test';
  const salt=randomBytes(16), secret=b32(randomBytes(20));
  const hash=createHmac('sha256',pepper).update(pbkdf2Sync(pass,salt,600000,32,'sha256')).digest('hex');
  return {id:randomUUID(),email,role,salt:salt.toString('hex'),hash,secret};
});
const sql=fixtures.flatMap(f=>[
  `INSERT INTO users VALUES(${q(f.id)},${q(f.email)},${q(f.role)},1,datetime('now'),'staging-fixture',datetime('now'),'staging-fixture');`,
  `INSERT INTO staging_auth_credentials(user_id,salt,password_hash,totp_secret,created_at) VALUES(${q(f.id)},${q(f.salt)},${q(f.hash)},${q(f.secret)},datetime('now'));`
]).join('\n');
const pinHash=createHmac('sha256',pepper).update('bhh-editor-pin-v1:'+editorPin).digest('hex');
const editor=fixtures.find(f=>f.role==='regimen_editor');
const editorSql=`INSERT INTO staging_editor_pins(user_id,pin_hash,created_at,created_by) VALUES(${q(editor.id)},${q(pinHash)},datetime('now'),'staging-fixture');`;
const seed=join(temp,'staging-test-users.sql');
writeFileSync(seed,sql+'\n'+editorSql+'\n',{mode:0o600});
const PORT=8792,base=`http://127.0.0.1:${PORT}`;
function execute(args,options={}){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{env,stdio:['ignore','pipe','pipe'],...options});
    let output='';
    child.stdout.on('data',x=>output+=x);
    child.stderr.on('data',x=>output+=x);
    child.once('error',reject);
    child.once('exit',c=>c===0?resolve(output):reject(Error(`local Wrangler command failed (${c}): ${output.slice(-3000)}`)));
  });
}
const common=['--config','v3/wrangler.jsonc','--env','staging','--local','--persist-to',storage];
let worker,code=1;
try{
  await execute(['d1','migrations','apply','DB',...common]);
  await execute(['d1','execute','DB','--file',seed,...common]);
  const codespace = process.argv.includes('--serve') &&
    /^[a-z0-9-]{3,100}$/i.test(process.env.CODESPACE_NAME || '');
  const forwardOrigin = codespace ?
    `https://${process.env.CODESPACE_NAME}-8792.app.github.dev` : null;
  const extra = codespace ? [
    '--var','CODESPACES_PREVIEW:true',
    '--var',`CODESPACES_PREVIEW_ORIGIN:${forwardOrigin}`,
  ] : [];
  const publicVar=process.argv.includes('--serve')?'true':'false';
  worker=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev',...common,
    '--port',String(PORT),'--ip',codespace?'0.0.0.0':'127.0.0.1',
    '--var',`STAGING_PASSWORD_PEPPER:${pepper}`,'--var',`PUBLIC_CALCULATOR:${publicVar}`,...extra],{env,stdio:['ignore','pipe','pipe']});
  let output='';
  worker.stdout.on('data',x=>output+=x);
  worker.stderr.on('data',x=>output+=x);
  worker.on('error',e=>output+=String(e));
  let ready=false;
  for(let i=0;i<160;i++){
    try{const res=await fetch(base+'/api/session',{redirect:'manual'});if(res.status===(process.argv.includes('--serve')?200:401)){ready=true;break;}}catch{}
    if(worker.exitCode!==null)break;
    await new Promise(r=>setTimeout(r,200));
  }
  if(!ready)throw Error('Local staging Worker not ready: '+output.slice(-4000));
  if (process.argv.includes('--serve')) {
    console.log('\nBHH STAGING LOCAL PREVIEW (synthetic identities only)\n');
    console.log('Open PUBLIC Calculator: '+(forwardOrigin || base)+'/');
    console.log('LOCAL-TEST PASSWORD (not for real accounts): '+pass);
    console.log('EDITOR Confirm PIN (synthetic test only): '+editorPin);
    console.log('Add each user to an Authenticator app with the listed test-only TOTP seed:');
    for(const f of fixtures.slice(0,4))
      console.log(f.role+' | '+f.email+' | TOTP secret: '+f.secret);
    console.log('Local D1 is temporary. Press Ctrl+C to stop and delete test data.');
    await new Promise(resolve=>{
      process.once('SIGINT',resolve);
      process.once('SIGTERM',resolve);
      worker.once('exit',resolve);
    });
    code=0;
  } else {
  const childEnv={...process.env,TEST_BASE_URL:base,
    TEST_STAGING_PASSWORD:pass,TEST_STAGING_FIXTURES:JSON.stringify(fixtures.map(({email,role,secret})=>({email,role,secret})))};
  const step=mode=>new Promise(resolve=>{
    const args=mode==='api'?['v3/tests/staging-live.mjs']:
      ['node_modules/@playwright/test/cli.js','test','--config','v3/playwright.staging.config.mjs'];
    const p=spawn(process.execPath,args,{env:childEnv,stdio:'inherit'});
    p.once('exit',c=>resolve(c??1));
  });
  const api=await step('api');
  const browser=api===0?await step('browser'):1;
  code=api||browser;
  mkdirSync('v3/test-results',{recursive:true});
  writeFileSync('v3/test-results/staging-local-worker.log',output,{mode:0o600});
  }
}finally{
  if(worker&&!worker.killed)worker.kill('SIGTERM');
  rmSync(temp,{recursive:true,force:true});
}
process.exitCode=code;
