import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { identity } from '../src/auth.js';
import { stagingIdentity, stagingLogin, stagingLogout, stagingSalt, passwordDigest, credentialDigest, totpAt } from '../src/staging-auth.js';
import worker from '../src/worker.js';

const host = 'https://bhh-staging.example.workers.dev';
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'; // RFC 6238 test-only seed
const password = 'A-long-private-staging-password';
const pepper = 'unit-test-only-pepper-not-a-real-secret-32-chars';
const fixedNow = 1760000000000;
function fixture() {
  const d = new DatabaseSync(':memory:');
  d.exec(readFileSync('v3/migrations/0001_schema.sql','utf8'));
  d.exec(readFileSync('v3/migrations/0004_staging_internal_auth.sql','utf8'));
  const DB = {
    prepare(sql) {
      return { bind(...args) {
        const s = d.prepare(sql);
        return {
          async first() { return s.get(...args) || null; },
          async run() { const result=s.run(...args); return {meta:{changes:result.changes}}; },
          async all() { return {results:s.all(...args)}; },
        };
      }};
    },
  };
  return { d, env: { APP_ENV:'staging', AUTH_MODE:'internal', STAGING_PASSWORD_PEPPER:pepper, DB,
    ASSETS: { async fetch(req) {
      return new Response(req.url.includes('login') ? 'Public login' : 'PRIVATE ASSET', {
        headers:{'Content-Type':req.url.endsWith('.js')?'text/javascript':'text/html'},
      });
    } } } };
}
function post(endpoint, body, extra = {}) {
  return new Request(host + endpoint, {
    method:'POST',
    headers:{Origin:host, 'Content-Type':'application/json','X-Requested-With':'BHH-V3',
      'CF-Connecting-IP':'192.0.2.50',...extra},
    body:JSON.stringify(body),
  });
}
async function register(d) {
  const prehash=await passwordDigest(password,'aabbccddeeff00112233445566778899');
  const hash=await credentialDigest(prehash,pepper);
  d.prepare("INSERT INTO users VALUES('user1','tester@example.org','calculator_user',1,'now','test','now','test')").run();
  d.prepare("INSERT INTO staging_auth_credentials(user_id,salt,password_hash,totp_secret,created_at) VALUES(?,?,?,?,?)")
    .run('user1','aabbccddeeff00112233445566778899',hash,secret,'now');
}
test('RFC 6238 6-digit TOTP and PBKDF2 parameters', async () => {
  assert.equal(await totpAt(secret,1), '287082');
  assert.equal((await passwordDigest('password','00000000000000000000000000000000')).length,64);
  await assert.rejects(()=>passwordDigest('password','0'.repeat(32),1000),/parameters/);
});
test('staging authentication rejects unauthenticated clinical API and app assets', async () => {
  const { env }=fixture();
  const asset=await worker.fetch(new Request(host+'/app.js'),env);
  assert.equal(asset.status,401);
  const api=await worker.fetch(new Request(host+'/api/catalog'),env);
  assert.equal(api.status,401);
  const nav=await worker.fetch(new Request(host+'/',{headers:{Accept:'text/html'}}),env);
  assert.equal(nav.status,303);
  assert.equal(nav.headers.get('location'),host+'/login');
  const login=await worker.fetch(new Request(host+'/login'),env);
  assert.equal(login.status,200);
  assert.match(await login.text(),/Public login/);
  assert.equal(login.headers.get('Cache-Control'),'no-store');
});
test('password plus non-replayable TOTP grant a revocable HttpOnly staging session', async () => {
  const old=Date.now;
  Date.now=()=>fixedNow;
  try {
    const { d,env }=fixture();
    await register(d);
    const code=await totpAt(secret,Math.floor(fixedNow/30000));
    const saltResult=await stagingSalt(post('/api/auth/salt',{email:'tester@example.org'}),env);
    assert.equal((await saltResult.json()).salt,'aabbccddeeff00112233445566778899');
    const prehash=await passwordDigest(password,'aabbccddeeff00112233445566778899');
    const incorrect=await passwordDigest('incorrect-password','aabbccddeeff00112233445566778899');
    await assert.rejects(()=>stagingLogin(post('/api/auth/login',{email:'tester@example.org',prehash,totp:'000000'}, {Origin:'https://evil.example'}),env),/Same-origin/);
    await assert.rejects(()=>stagingLogin(post('/api/auth/login',{email:'tester@example.org',prehash:incorrect,totp:code}),env),/Invalid credentials/);
    const response=await stagingLogin(post('/api/auth/login',{email:'TESTER@example.org',prehash,totp:code}),env);
    assert.equal(response.status,200);
    const setCookie=response.headers.get('set-cookie');
    assert.match(setCookie,/HttpOnly; Secure; SameSite=Strict/);
    const pair=setCookie.split(';')[0];
    assert.equal((await stagingIdentity(new Request(host+'/api/session',{headers:{Cookie:pair}}),env)).email,'tester@example.org');
    assert.equal((await identity(new Request(host+'/api/session',{headers:{Cookie:pair}}),env)).local,false);
    const authorized = await worker.fetch(new Request(host+'/api/session',{headers:{Cookie:pair}}),env);
    assert.equal(authorized.status,200);
    assert.equal((await authorized.json()).authMode,'internal');
    const app = await worker.fetch(new Request(host+'/app.js',{headers:{Cookie:pair}}),env);
    assert.equal(app.status,200);
    assert.match(await app.text(),/PRIVATE ASSET/);
    await assert.rejects(()=>stagingLogin(post('/api/auth/login',{email:'tester@example.org',prehash,totp:code}),env),/Invalid credentials/);
    const signedOut=await stagingLogout(post('/api/auth/logout',{}, {Cookie:pair}),env);
    assert.equal(signedOut.status,200);
    assert.match(signedOut.headers.get('set-cookie'),/Max-Age=0/);
    await assert.rejects(()=>stagingIdentity(new Request(host+'/api/session',{headers:{Cookie:pair}}),env),/Invalid or expired/);
    d.prepare('UPDATE users SET active=0 WHERE id=?').run('user1');
    await assert.rejects(()=>stagingIdentity(new Request(host+'/api/session',{headers:{Cookie:pair}}),env),/Invalid or expired/);
  } finally {Date.now=old;}
});
test('repeated invalid sign-ins are rate-limited in D1; no self-registration', async () => {
  const {d,env}=fixture();
  await register(d);
  let attempts=0;
  for (let i=0;i<7;i++) {
    try { await stagingLogin(post('/api/auth/login',{email:'tester@example.org',prehash:'0'.repeat(64),totp:'000000'}),env); }
    catch(err){ attempts++; if(i>=5)assert.equal(err.status,429); }
  }
  assert.equal(attempts,7);
  assert.equal(d.prepare('SELECT count(*) AS n FROM staging_auth_sessions').get().n,0);
});
test('production never accepts staging session or staging login', async () => {
  const {env}=fixture();
  const production={...env,APP_ENV:'production',ACCESS_TEAM_DOMAIN:'REPLACE.cloudflareaccess.com',ACCESS_AUD:'REPLACE'};
  await assert.rejects(()=>stagingIdentity(new Request(host),production),/unavailable/);
  await assert.rejects(()=>identity(new Request(host,{headers:{'X-Local-User':'admin@local.test'}}),production),/Access configuration required/);
  const r=await worker.fetch(post('/api/auth/login',{email:'a@b.com',prehash:'0'.repeat(64),totp:'000000'}),production);
  assert.notEqual(r.status,200);
});

test('Staging fails closed when HMAC secret is missing', async () => {
  const {env}=fixture();
  delete env.STAGING_PASSWORD_PEPPER;
  await assert.rejects(()=>stagingSalt(post('/api/auth/salt',{email:'tester@example.org'}),env),/credential secret required/);
  await assert.rejects(()=>stagingLogin(post('/api/auth/login',{email:'tester@example.org',prehash:'0'.repeat(64),totp:'123456'}),env),/credential secret required/);
});

test('CPU-sensitive password stretching happens in browser, not Worker login route', () => {
  const frontend=readFileSync('v3/public/login.js','utf8');
  const server=readFileSync('v3/src/staging-auth.js','utf8');
  const login=server.split('export async function stagingLogin(request, env) {')[1]
    .split('export async function stagingLogout')[0];
  assert.match(frontend,/PBKDF2/);
  assert.match(frontend,/600000/);
  assert.match(frontend,/prehash/);
  assert.ok(!frontend.includes('password: String(fields.get'));
  assert.ok(!login.includes('await passwordDigest('));
  assert.ok(login.includes('await credentialDigest(prehash, pepper)'));
});
test('Salt endpoint protects account existence and enforces same-origin requests', async () => {
  const {env}=fixture();
  const known=await stagingSalt(post('/api/auth/salt',{email:'unknown@example.org'}),env);
  const payload=await known.json();
  assert.match(payload.salt,/^[a-f0-9]{32}$/);
  assert.equal(payload.iterations,600000);
  await assert.rejects(()=>stagingSalt(post('/api/auth/salt',{email:'tester@example.org'},{Origin:'https://evil.example'}),env),/Same-origin/);
});
