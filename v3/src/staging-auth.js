import { sameOrigin } from './preview-origin.js';
// Staging-only authentication. Production continues to use Cloudflare Access JWTs.
// No self-registration, shared PIN, browser-stored bearer tokens or patient records.
const enc = new TextEncoder();
const COOKIE = '__Host-bhh_staging_session';
const SESSION_SECONDS = 6 * 60 * 60;
const PASSWORD_ROUNDS = 600000;
const EMAIL_LIMIT = 5;
const IP_LIMIT = 30;
const WINDOW = 15 * 60;
const fail = (message, status) => Object.assign(Error(message), { status });
const hex = (bytes) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const unhex = (value) => Uint8Array.from(value.match(/.{2}/g).map(c => parseInt(c, 16)));
const getCookie = (request) => {
  const item = (request.headers.get('Cookie') || '').split(';').map(x => x.trim())
    .find(x => x.startsWith(COOKIE + '='));
  const value = item?.slice(COOKIE.length + 1) || '';
  return /^[0-9a-f]{64}$/.test(value) ? value : null;
};
const cookie = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const timingEqual = (a, b) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
};
export const isInternalStaging = env =>
  env.APP_ENV === 'staging' && env.AUTH_MODE === 'internal' && env.LOCAL_TEST_AUTH !== 'true';

async function digest(value) {
  return hex(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
}
export async function passwordDigest(password, saltHex, rounds = PASSWORD_ROUNDS) {
  if (!/^[a-f0-9]{32,128}$/i.test(saltHex) || rounds !== PASSWORD_ROUNDS)
    throw Error('Invalid password hash parameters');
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({
    name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: rounds,
  }, key, 256)));
}
// Split password stretching: PBKDF2 is performed by the user's browser, NOT by
// the 10ms-CPU Workers Free request. A secret server-side HMAC pepper protects
// stored verifiers from an offline D1-only compromise. A submitted prehash is
// password-equivalent, so TLS and TOTP are mandatory. STAGING ONLY.
export async function credentialDigest(prehashHex, pepper) {
  if (!/^[a-f0-9]{64}$/i.test(prehashHex) ||
      typeof pepper !== 'string' || pepper.length < 32)
    throw Error('Staging credential pepper/configuration required');
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(pepper), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(new Uint8Array(await crypto.subtle.sign(
    'HMAC', key, unhex(prehashHex))));
}
function requirePepper(env) {
  if (typeof env.STAGING_PASSWORD_PEPPER !== 'string' || env.STAGING_PASSWORD_PEPPER.length < 32)
    throw fail('Staging credential secret required', 503);
  return env.STAGING_PASSWORD_PEPPER;
}
export async function stagingSalt(request, env) {
  if (!isInternalStaging(env)) throw fail('Not found', 404);
  requirePost(request, env);
  const pepper = requirePepper(env);
  const raw = await request.text();
  if (raw.length > 1024) throw fail('Request too large', 413);
  let input;
  try { input = JSON.parse(raw); } catch { throw fail('Invalid JSON', 400); }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  if (!/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(email)) throw fail('Email required', 400);
  const db = env.DB;
  const now = Math.floor(Date.now()/1000);
  const ipFingerprint = await digest(request.headers.get('CF-Connecting-IP') || 'unknown-ip');
  if (!await rate(db, 'salt-ip:'+ipFingerprint, 80, now)) throw fail('Too many requests', 429);
  const record = await db.prepare(
    'SELECT c.salt FROM staging_auth_credentials c JOIN users u ON u.id=c.user_id WHERE u.email=? AND u.active=1'
  ).bind(email).first();
  const fake = await digest('staging-unknown:'+pepper+':'+email);
  return json({ salt: record?.salt || fake.slice(0,32), iterations: PASSWORD_ROUNDS });
}
function base32decode(str) {
  const clean = str.toUpperCase().replace(/=+$/, '');
  if (!/^[A-Z2-7]{32,}$/.test(clean)) throw Error('Invalid authenticator secret');
  let buffer = 0, bits = 0;
  const bytes = [];
  for (const char of clean) {
    buffer = (buffer << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char);
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(bytes);
}
export async function totpAt(secret, step) {
  const key = await crypto.subtle.importKey('raw', base32decode(secret), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
  const bytes = new Uint8Array(8);
  new DataView(bytes.buffer).setBigUint64(0, BigInt(step));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes));
  const offset = sig[sig.length - 1] & 15;
  const value = (((sig[offset] & 127) << 24) | (sig[offset+1] << 16) |
    (sig[offset+2] << 8) | sig[offset+3]) % 1000000;
  return String(value).padStart(6, '0');
}
const json = (payload, status = 200, extra = {}) => new Response(JSON.stringify(payload), {
  status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
    ...extra,
  },
});
function requirePost(request, env) {
  if (request.method !== 'POST' ||
      !sameOrigin(request, env) ||
      request.headers.get('X-Requested-With') !== 'BHH-V3' ||
      !request.headers.get('Content-Type')?.startsWith('application/json'))
    throw fail('Same-origin JSON request required', 403);
}
async function rate(db, key, limit, now) {
  // UPSERT is atomic on D1: even concurrent attempts increment the same counter.
  await db.prepare(`INSERT INTO staging_auth_limits(key,started,attempts)
    VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET
    started=CASE WHEN started<=? THEN excluded.started ELSE started END,
    attempts=CASE WHEN started<=? THEN 1 ELSE attempts+1 END`)
    .bind(key, now, now - WINDOW, now - WINDOW).run();
  const item = await db.prepare('SELECT attempts FROM staging_auth_limits WHERE key=?').bind(key).first();
  return item.attempts <= limit;
}
async function event(db, userId, fingerprint, action, now) {
  await db.prepare('INSERT INTO staging_auth_events(id,user_id,fingerprint,action,at) VALUES(?,?,?,?,?)')
    .bind(crypto.randomUUID(), userId || null, fingerprint, action, now).run();
}
export async function stagingIdentity(request, env) {
  if (!isInternalStaging(env)) throw fail('Staging authentication unavailable', 503);
  const token = getCookie(request);
  if (!token) throw fail('Sign in required', 401);
  const record = await env.DB.prepare(`SELECT u.email FROM staging_auth_sessions s
    JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`)
    .bind(await digest(token), Math.floor(Date.now()/1000)).first();
  if (!record) throw fail('Invalid or expired session', 401);
  return { email: record.email.toLowerCase(), local: false };
}
export async function stagingLogin(request, env) {
  if (!isInternalStaging(env)) throw fail('Not found', 404);
  requirePost(request, env);
  const raw = await request.text();
  if (raw.length > 4096) throw fail('Request too large', 413);
  let input;
  try { input = JSON.parse(raw); } catch { throw fail('Invalid JSON', 400); }
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const prehash = input.prehash, code = input.totp;
  if (!/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(email) ||
      typeof prehash !== 'string' || !/^[a-f0-9]{64}$/i.test(prehash) ||
      typeof code !== 'string' || !/^\d{6}$/.test(code))
    throw fail('Invalid credentials or authenticator code', 401);
  const pepper = requirePepper(env);
  const now = Math.floor(Date.now()/1000);
  const fingerprint = await digest(email);
  const ipFingerprint = await digest(request.headers.get('CF-Connecting-IP') || 'unknown-ip');
  const [allowEmail, allowIp] = await Promise.all([
    rate(env.DB, 'e:'+fingerprint, EMAIL_LIMIT, now),
    rate(env.DB, 'i:'+ipFingerprint, IP_LIMIT, now),
  ]);
  if (!allowEmail || !allowIp) {
    await event(env.DB, null, fingerprint, 'rate_limited', now);
    throw fail('Too many sign-in attempts. Try again later.', 429);
  }
  const account = await env.DB.prepare(`SELECT u.id,u.email,c.salt,c.password_hash,c.totp_secret,c.last_totp_step
    FROM users u JOIN staging_auth_credentials c ON c.user_id=u.id
    WHERE u.email=? AND u.active=1`).bind(email).first();
  // Fixed-cost HMAC verification on Worker Free; password stretch happens on client.
  // Always compute for unknown users too, without revealing account existence.
  const calculated = await credentialDigest(prehash, pepper);
  const digestMatches = account && timingEqual(unhex(calculated), unhex(account.password_hash));
  let acceptedStep = null;
  if (digestMatches) {
    const step = Math.floor(now / 30);
    for (const trial of [step, step-1, step+1]) {
      if (trial > (account.last_totp_step ?? -1) &&
          timingEqual(enc.encode(await totpAt(account.totp_secret, trial)), enc.encode(code))) {
        acceptedStep = trial;
        break;
      }
    }
  }
  if (acceptedStep === null) {
    await event(env.DB, account?.id, fingerprint, 'denied', now);
    throw fail('Invalid credentials or authenticator code', 401);
  }
  const change = await env.DB.prepare(`UPDATE staging_auth_credentials
    SET last_totp_step=? WHERE user_id=?
    AND (last_totp_step IS NULL OR last_totp_step<?)`)
    .bind(acceptedStep, account.id, acceptedStep).run();
  if (change.meta?.changes !== 1) throw fail('Authenticator code already used', 401);
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO staging_auth_sessions(token_hash,user_id,created_at,expires_at) VALUES(?,?,?,?)')
    .bind(await digest(token), account.id, now, now + SESSION_SECONDS).run();
  await event(env.DB, account.id, fingerprint, 'login', now);
  return json({ ok: true }, 200, { 'Set-Cookie': cookie(token, SESSION_SECONDS) });
}
export async function stagingLogout(request, env) {
  if (!isInternalStaging(env)) throw fail('Not found', 404);
  requirePost(request, env);
  const token = getCookie(request);
  if (token) await env.DB.prepare('DELETE FROM staging_auth_sessions WHERE token_hash=?')
    .bind(await digest(token)).run();
  return json({ ok: true }, 200, { 'Set-Cookie': cookie('', 0) });
}
