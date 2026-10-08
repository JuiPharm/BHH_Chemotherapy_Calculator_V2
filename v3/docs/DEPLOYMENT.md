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

## Staging provisioning — internal authentication candidate

The staging-only branch `staging-internal-auth-v3` replaces Cloudflare Access OTP with individually provisioned **password + TOTP** accounts. No Google Cloud Console, Access application or email-OTP vendor is used. See [STAGING_INTERNAL_LOGIN.md](STAGING_INTERNAL_LOGIN.md) for operator-only user provisioning, secure storage, rate limiting, login / logout and negative UAT checks.

1. Use Workers Free + staging D1 only. Stop if your Cloudflare account onboarding requires an unwanted payment method; the Free service allowance does not establish what Cloudflare will ask for during signup.
2. In `v3/wrangler.jsonc`, replace `REPLACE_STAGING_D1_ID` with the real staging database ID. Do not fill staging Access AUD/team-domain fields: `AUTH_MODE=internal` replaces them. Production remains Cloudflare Access and must not be changed.
3. After the local build and tests pass, apply `npx wrangler d1 migrations apply DB --config v3/wrangler.jsonc --env staging --remote` **only after authorization**. The 0004 migration adds the staging credential/session/login-audit schema and does not provision any account.
4. An authorized operator runs `node v3/scripts/provision-staging.mjs <email> <role>` locally with masked password input, registers the generated TOTP secret directly with its intended tester and imports the confidential generated SQL **only into staging**. No bootstrap password or login secret goes into the repository.
5. With explicit approval, `npm run deploy:staging:v3` will deploy the isolated staging Worker. This task does **not** execute the deployment.
6. Before clinical UAT, validate mandatory two-factor login, unknown/inactive users, replay, lockout, HTTPS, role separation, logout, offline cache, audit log and Free-tier runtime limits; use synthetic patient parameters.

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
