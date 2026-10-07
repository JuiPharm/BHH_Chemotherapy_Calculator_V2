# Deployment — one-time Cloudflare account setup

This is a **locally verified production candidate**, not a deployed clinical service. No Cloudflare account authorization is available in this session. Complete the following in your account, then run the same UAT against staging before main merge or patient care.

## Local use on Windows (no Python)

Install Node.js 24 LTS. Extract the source ZIP or clone the `production-v3-cloudflare` branch. Open Terminal in the repository root:

```sh
npm ci
npm run build:v3
npm run setup:local:v3
npm run dev:v3
```

Open the printed localhost URL. Choose LOCAL TEST identity to simulate roles. Test with synthetic data only. This is a real local Worker and local D1, not an HTML-only mock. Delete `v3/.wrangler` to reset local test data, then rerun setup; do not do this on a live database.

## Staging provisioning

1. Run `npx wrangler login` locally. Do not send a Cloudflare token in chat and do not put a token into `v3/public`.
2. Create independent D1 databases:

```sh
npx wrangler d1 create bhh-chemo-staging
npx wrangler d1 create bhh-chemo-production
```

3. Copy their IDs into the matching `d1_databases` entries in `v3/wrangler.jsonc`. Staging must not point at production. Local ID is only for the local simulator.
4. **Staging no-domain option (selected):** use the isolated `bhh-chemotherapy-v3-staging.<YOUR_WORKERS_SUBDOMAIN>.workers.dev` hostname; `env.staging.workers_dev` is `true` and no staging `routes` are required. Follow [STAGING_OTP.md](STAGING_OTP.md) for the exact Zero Trust application setup. If a hospital staging domain exists, instead set `workers_dev=false` and use a genuine `routes` custom domain for staging.
5. **Staging identity method: Cloudflare Access email One-time PIN (OTP)**, no Google Cloud Console or Google OAuth required. Add One-time PIN in Zero Trust > Integrations > Identity providers, create a staging self-hosted Access application covering the full exact hostname, and allow only named tester email addresses with Require: One-time PIN login method. Never use a public/Everyone Access policy, and protect `/api`, assets and the service worker. Production will have a separate Access application and hospital-approved authentication method, not automatically inherited from staging.
6. Set the actual team domain (`yourteam.cloudflareaccess.com`) and the **matching staging application audience** in the staging environment. The Worker verifies JWT signature, issuer, audience, expiry, subject and app token type. Roles come from D1, not browser identity fields. Staging's `workers.dev` endpoint can be publicly reachable but must fail closed without a valid Access JWT and a provisioned D1 user. Root production `workers_dev` remains false and must use an Access-protected custom domain.
7. Run the deploy guard and apply migrations **to staging only**:

```sh
npm run check:deploy:v3
npx wrangler d1 migrations apply DB --config v3/wrangler.jsonc --env staging --remote
```

Never apply `v3/scripts/local-users.sql` remotely. Real environments have no test authentication or test account selector.

8. Provision the four real identities in D1 before signing in. Use a reviewed SQL file, with actual email addresses and named operator IDs. Example for the initial administrator (replace placeholders, record this operation in your change record):

```sql
INSERT INTO users(id,email,role_code,active,created_at,created_by,updated_at,updated_by)
VALUES('REPLACE_ADMIN_EMAIL','REPLACE_ADMIN_EMAIL','clinical_admin',1,
       strftime('%Y-%m-%dT%H:%M:%fZ','now'),'REPLACE_OPERATOR',
       strftime('%Y-%m-%dT%H:%M:%fZ','now'),'REPLACE_OPERATOR');
INSERT INTO audit_logs VALUES(
 'REPLACE_UNIQUE_EVENT_ID','user','REPLACE_ADMIN_EMAIL',NULL,'provision',NULL,
 '{"role":"clinical_admin","active":true}','REPLACE_OPERATOR',
 strftime('%Y-%m-%dT%H:%M:%fZ','now'),'Initial authorized account provisioning',
 strftime('%Y-%m-%dT%H:%M:%fZ','now'),'REPLACE_OPERATOR',
 strftime('%Y-%m-%dT%H:%M:%fZ','now'),'REPLACE_OPERATOR');
```

Provision calculator_user, regimen_editor and oncology_pharmacist similarly. Use lowercase email addresses verified by the selected Access login method (OTP for staging). Separate the author from the independent reviewer. Do not grant admin to all users. Run reviewed user provisioning/audit inserts together as one transaction using the Cloudflare D1 console.

9. Deploy staging:

```sh
npm run deploy:staging:v3
```

10. Sign in from two separate browsers using allowlisted, real OTP inboxes and named staging D1 accounts. Run the checks listed in REQUIREMENT_MATRIX.md: identities and role denial; 142 seeded records; clone/save/review/publish; same content on both clients; hard max, IU and AUC golden checks; cache invalidation and offline banner; logout/session expiry and denied accounts. Use only synthetic patient parameters during UAT.

## GitHub CI

`v3-validate.yml` checks the candidate without Cloudflare secrets. `v3-staging.yml` is manual, uses the protected `cloudflare-staging` environment and requires account-scoped `CLOUDFLARE_ACCOUNT_ID` and minimum-permission `CLOUDFLARE_API_TOKEN` for Worker/D1 deployment. Configure reviewed real values in wrangler first; placeholder configurations are intentionally rejected. The existing V2 Pages workflow remains preserved on main until V3 cutover is approved. No automatic production migration/deployment is added.

## Production cutover

After staging UAT and hospital clinical/IT sign-off **including separate production identity assurance/MFA decision**, apply migrations to the dedicated production D1, provision real identities, configure the production Access application and custom domain, run `node v3/scripts/check-deploy.mjs production`, and deploy using:

```sh
npx wrangler d1 migrations apply DB --config v3/wrangler.jsonc --remote
npx wrangler deploy --config v3/wrangler.jsonc
```

Take a D1 export before migration/cutover and before every data change batch. Validate the six original pilot approval provenance with the hospital owner (original named reviewer and exact original publication time were absent in V2 source). Only recorded V2 review/effective dates are retained; exact original time is not fabricated. Import audit timestamps come from actual D1 execution. Freeze V2 clinical editing after V3 cutover to avoid two masters. Keep the V2 application/archive for read-only traceability; future clinical changes must be made through the V3 review workflow.

## Rollback / operations

- Use Cloudflare Worker version rollback for an application regression. Do not overwrite already published regimen JSON or reuse a version number.
- Restore D1 from a documented export/time-travel point only under a reviewed incident change; warn clients that revisions/protocols may have changed.
- Retire an unsafe protocol through the web registry; issue an incident notice through existing hospital procedures. Online clients clear selection after their next revision check (15-second polling); offline clients cannot learn retirement until reconnection, so their offline banner remains mandatory.
- Monitor Worker 5xx, D1 errors, Access denials and revision heartbeat. Confirm backup retention and incident ownership with hospital IT before clinical release.
- Offline storage contains published protocols only, not patient inputs. Clear cached protocols on shared/public workstations or at decommissioning. This availability fallback is not a substitute for current-protocol verification.

Official documentation: [Static Assets](https://developers.cloudflare.com/workers/static-assets/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [D1 batch transactions](https://developers.cloudflare.com/d1/worker-api/d1-database/), [Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
