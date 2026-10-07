import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const mode = process.argv[2] || 'api';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'bhh-v3-test-'));
// Some hosted execution sandboxes deny interface enumeration. This only affects the CLI test harness.
const shim = path.join(temp, 'loopback.cjs');
fs.writeFileSync(
  shim,
  "const os=require('node:os');const original=os.networkInterfaces;os.networkInterfaces=()=>{try{return original()}catch{return {lo:[{address:'127.0.0.1',family:'IPv4',internal:true}]}}};",
);
const env = {
  ...process.env,
  NODE_OPTIONS: `${process.env.NODE_OPTIONS || ''} --require ${shim}`,
  WRANGLER_SEND_METRICS: 'false',
};
const storage = path.join(temp, 'state');
async function cli(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(
      process.execPath,
      [
        'node_modules/wrangler/bin/wrangler.js',
        ...args,
        '--config',
        'v3/wrangler.jsonc',
        '--env',
        'local',
        '--local',
        '--persist-to',
        storage,
      ],
      { env, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    let out = '';
    p.stdout.on('data', (x) => (out += x));
    p.stderr.on('data', (x) => (out += x));
    p.on('exit', (c) => (c === 0 ? resolve() : reject(Error(out))));
  });
}
await cli(['d1', 'migrations', 'apply', 'DB']);
await cli(['d1', 'execute', 'DB', '--file', 'v3/scripts/local-users.sql']);
const child = spawn(
  process.execPath,
  [
    'node_modules/wrangler/bin/wrangler.js',
    'dev',
    '--local',
    '--env',
    'local',
    '--config',
    'v3/wrangler.jsonc',
    '--port',
    '8787',
    '--ip',
    '127.0.0.1',
    '--persist-to',
    storage,
  ],
  { env, stdio: ['ignore', 'pipe', 'pipe'] },
);
const logs = [];
child.stdout.on('data', (x) => logs.push(String(x)));
child.stderr.on('data', (x) => logs.push(String(x)));
let code = 1;
try {
  let ready = false;
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch('http://127.0.0.1:8787/api/session');
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!ready) throw Error('Worker startup failed\n' + logs.join(''));
  const args =
    mode === 'browser'
      ? [
          'node_modules/@playwright/test/cli.js',
          'test',
          '--config',
          'v3/playwright.config.mjs',
        ]
      : ['v3/tests/api.mjs'];
  code = await new Promise((resolve) => {
    const t = spawn(process.execPath, args, {
      env: { ...process.env, TEST_BASE_URL: 'http://127.0.0.1:8787' },
      stdio: 'inherit',
    });
    t.on('exit', (c) => resolve(c ?? 1));
  });
  fs.mkdirSync('v3/test-results', { recursive: true });
  fs.writeFileSync(`v3/test-results/worker-${mode}.log`, logs.join(''));
} finally {
  child.kill('SIGTERM');
  fs.rmSync(temp, { recursive: true, force: true });
}
process.exit(code);
