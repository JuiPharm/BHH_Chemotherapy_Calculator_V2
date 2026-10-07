import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const guard = fileURLToPath(new URL('../scripts/check-deploy.mjs', import.meta.url));
const stageId = '11111111-1111-4111-8111-111111111111';
const prodId = '22222222-2222-4222-8222-222222222222';
const accessVars = (APP_ENV, ACCESS_AUD) => ({ APP_ENV, ACCESS_TEAM_DOMAIN: 'bhh-staging.cloudflareaccess.com', ACCESS_AUD });
function config() {
  return {
    name: 'bhh-chemotherapy-v3',
    workers_dev: false,
    assets: { directory: './public', binding: 'ASSETS', run_worker_first: true },
    vars: accessVars('production', 'production-aud'),
    d1_databases: [{ binding: 'DB', database_id: prodId }],
    routes: [{ pattern: 'chemo.hospital.example', custom_domain: true }],
    env: {
      staging: {
        name: 'bhh-chemotherapy-v3-staging',
        workers_dev: true,
        vars: accessVars('staging', 'staging-aud'),
        d1_databases: [{ binding: 'DB', database_id: stageId }],
      },
    },
  };
}
function run(c, env = 'staging') {
  const temp = mkdtempSync(join(tmpdir(), 'bhh-deploy-guard-'));
  try {
    mkdirSync(join(temp, 'v3'));
    writeFileSync(join(temp, 'v3/wrangler.jsonc'), JSON.stringify(c));
    const p = spawnSync(process.execPath, [guard, env], { cwd: temp, encoding: 'utf8' });
    return { ok: p.status === 0, output: p.stdout + p.stderr };
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
test('staging permits workers.dev only with complete JWT/D1 config', () => {
  assert.equal(run(config()).ok, true);
  const c = config(); c.env.staging.vars.ACCESS_AUD = 'REPLACE_STAGING_AUD';
  assert.equal(run(c).ok, false);
});
test('custom-domain staging mode is allowed and misconfigured routes are blocked', () => {
  const c = config();
  c.env.staging.workers_dev = false;
  c.env.staging.routes = [{ pattern: 'staging.hospital.example', custom_domain: true }];
  assert.equal(run(c).ok, true);
  c.env.staging.routes[0].pattern = 'REPLACE.example';
  assert.equal(run(c).ok, false);
});
test('production stays custom-domain only and D1 must be segregated', () => {
  assert.equal(run(config(), 'production').ok, true);
  const publicProd = config(); publicProd.workers_dev = true;
  assert.equal(run(publicProd, 'production').ok, false);
  const sameDb = config(); sameDb.env.staging.d1_databases[0].database_id = prodId;
  assert.equal(run(sameDb).ok, false);
});
test('deployed local test authentication is always rejected', () => {
  const c = config(); c.env.staging.vars.LOCAL_TEST_AUTH = 'true';
  assert.equal(run(c).ok, false);
});
