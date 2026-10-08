import fs from 'node:fs';
const stage = process.argv[2] || 'staging';
if (!['staging', 'production'].includes(stage))
  throw Error('Only staging and production deployments are supported');
const c = JSON.parse(fs.readFileSync('v3/wrangler.jsonc', 'utf8'));
const e = stage === 'production' ? c : c.env?.staging;
if (!e || e.vars?.APP_ENV !== stage || e.vars.LOCAL_TEST_AUTH)
  throw Error('Invalid deployed authentication environment');
if (c.workers_dev !== false || c.assets?.run_worker_first !== true)
  throw Error('Production default must disable workers.dev and authenticate all assets through the Worker');
const id = e.d1_databases?.[0]?.database_id;
if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id || '') || id === '00000000-0000-0000-0000-000000000003')
  throw Error('A real dedicated D1 database ID is required');
if (c.d1_databases?.[0]?.database_id === c.env?.staging?.d1_databases?.[0]?.database_id)
  throw Error('Staging and production must use separate D1 databases');
if (stage === 'production') {
  if (e.vars.AUTH_MODE === 'internal' ||
      typeof e.vars.ACCESS_TEAM_DOMAIN !== 'string' ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(e.vars.ACCESS_TEAM_DOMAIN) ||
      e.vars.ACCESS_TEAM_DOMAIN.startsWith('REPLACE') ||
      typeof e.vars.ACCESS_AUD !== 'string' ||
      !e.vars.ACCESS_AUD.trim() ||
      e.vars.ACCESS_AUD.startsWith('REPLACE'))
    throw Error('Production must use configured Cloudflare Access JWT authentication');
} else if (e.vars.AUTH_MODE !== 'internal' ||
           e.vars.ACCESS_AUD || e.vars.ACCESS_TEAM_DOMAIN) {
  throw Error('Staging must use internal authentication without Access configuration');
}
const routes = e.routes ?? [];
const validRoutes =
  Array.isArray(routes) &&
  routes.length > 0 &&
  routes.every((route) => {
    const host = route?.pattern;
    return (
      route.custom_domain === true &&
      typeof host === 'string' &&
      /^[a-z0-9.-]+$/i.test(host) &&
      host.includes('.') &&
      !host.includes('..') &&
      !host.startsWith('.') &&
      !host.endsWith('.') &&
      !host.includes('REPLACE') &&
      !host.includes('your-hospital-domain')
    );
  });
if (stage === 'production') {
  if (e.workers_dev !== false || !validRoutes)
    throw Error('Production requires a real custom-domain route and workers_dev false');
} else if (e.workers_dev === true) {
  if (routes.length)
    throw Error('Staging workers.dev mode must not also specify custom-domain routes');
} else if (e.workers_dev !== false || !validRoutes) {
  throw Error('Staging requires workers.dev true OR workers.dev false with a real custom-domain route');
}
console.log(
  `${stage}: configuration valid. Manually verify staging TOTP credentials, rate limiting, HTTPS and named D1 users before UAT.`,
);
