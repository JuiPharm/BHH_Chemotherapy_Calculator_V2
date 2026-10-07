import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';
import { identity } from '../src/auth.js';
test('Local test identities only on loopback local environment', async () => {
  assert.equal(
    (
      await identity(new Request('http://localhost/api/session'), {
        APP_ENV: 'local',
        LOCAL_TEST_AUTH: 'true',
      })
    ).email,
    'calculator@local.test',
  );
  await assert.rejects(
    () =>
      identity(
        new Request('https://hospital.example/api/session', {
          headers: { 'X-Local-User': 'admin@local.test' },
        }),
        { APP_ENV: 'production', LOCAL_TEST_AUTH: 'true' },
      ),
    /cannot run/,
  );
});
test('Signed Access JWT: valid, bad signature, audience, issuer, expiry and missing JWT', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = await exportJWK(publicKey);
  jwk.kid = 'test';
  const issuer = 'https://bhh-unit.cloudflareaccess.com',
    aud = 'bhh-unit-aud';
  const env = {
    APP_ENV: 'production',
    ACCESS_TEAM_DOMAIN: 'bhh-unit.cloudflareaccess.com',
    ACCESS_AUD: aud,
  };
  const original = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ keys: [jwk] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  try {
    const token = async (over = {}) =>
      new SignJWT({ email: 'TEST@EXAMPLE.ORG', type: 'app', ...over })
        .setProtectedHeader({ alg: 'RS256', kid: 'test' })
        .setSubject('testsub')
        .setIssuedAt()
        .setIssuer(over.iss || issuer)
        .setAudience(over.aud || aud)
        .setExpirationTime(over.exp || '5m')
        .sign(privateKey);
    const req = (t) =>
      new Request('https://hospital.example/api/session', {
        headers: { 'Cf-Access-Jwt-Assertion': t },
      });
    assert.equal(
      (await identity(req(await token()), env)).email,
      'test@example.org',
    );
    await assert.rejects(() => identity(req('bad.jwt.token'), env), /Invalid/);
    await assert.rejects(
      async () => identity(req(await token({ aud: 'wrong' })), env),
      /Invalid/,
    );
    await assert.rejects(
      async () =>
        identity(req(await token({ iss: 'https://evil.example' })), env),
      /Invalid/,
    );
    await assert.rejects(
      async () => identity(req(await token({ exp: 1 })), env),
      /Invalid/,
    );
    await assert.rejects(
      () => identity(new Request('https://hospital.example'), env),
      /Sign in/,
    );
  } finally {
    globalThis.fetch = original;
  }
});
