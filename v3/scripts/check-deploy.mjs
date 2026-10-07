import fs from 'node:fs';
const stage = process.argv[2] || 'staging';
const c = JSON.parse(fs.readFileSync('v3/wrangler.jsonc'));
const e = stage === 'production' ? c : c.env[stage];
if (!e) throw Error('Unknown environment');
if (e.vars.APP_ENV !== stage || e.vars.LOCAL_TEST_AUTH)
  throw Error('Invalid production authentication configuration');
const id = e.d1_databases?.[0]?.database_id;
if (
  !/^[a-f0-9-]{36}$/i.test(id || '') ||
  id === '00000000-0000-0000-0000-000000000003'
)
  throw Error('A real dedicated D1 database ID is required');
if (c.d1_databases[0].database_id === c.env.staging.d1_databases[0].database_id)
  throw Error('Staging and production must use separate D1 databases');
if (
  !e.vars.ACCESS_TEAM_DOMAIN.endsWith('.cloudflareaccess.com') ||
  e.vars.ACCESS_TEAM_DOMAIN.startsWith('REPLACE') ||
  !e.vars.ACCESS_AUD ||
  e.vars.ACCESS_AUD.startsWith('REPLACE')
)
  throw Error('Configure Access team domain and application audience');
if (!e.routes?.length)
  throw Error(
    'Configure an Access-protected custom domain in routes before deployment',
  );
console.log(
  `${stage}: deployment configuration passed; verify Access policy with hospital Google identity before release`,
);
