# BHH Chemotherapy Calculator V3 — Staging Test Readiness

**Branch:** `staging-internal-auth-v3` · Draft PR #2. No production merge, no remote D1 migration, no Cloudflare deployment.

## Local preview (no Cloudflare account or deploy required)

Run `npm ci` and `npm run build:v3`, then:

```sh
npm run preview:staging:v3
```

Open `http://127.0.0.1:8792/login`. The terminal prints a **temporary synthetic password**, four fake role emails and their test-only TOTP enrollment seeds. Add a selected fake user's seed to your Authenticator app to obtain a six-digit code, then sign in and test Library, Calculator, Registry, Builder, role controls, and Logout. The script uses `--local` for every D1 command, has no `--remote` or deploy step, and deletes all temporary account data on Ctrl+C. **Never enter real staff passwords, actual TOTP secrets or patient records into this preview.**

## 1. Run tests safely on Windows, Linux or macOS

Use **Node.js 24 LTS** and source code from the exact branch above. In a terminal at the repository root:

```sh
npm ci
npm run import:v3
npm run build:v3
npm run check:deploy:v3
npm test
npm run test:v3
npm run test:api:v3
npm run test:browser:v3
npm run test:staging:v3
```

The **staging-mode end-to-end test** (`test:staging:v3`) is explicitly *local-only* and:
- creates a **temporary local D1 state** and applies all migrations with `wrangler --local`, never `--remote`;
- generates eight **synthetic test identities**: calculator, editor, pharmacist reviewer and admin for the API and separate versions for Chromium;
- uses only a temporary test pepper, derived verifiers and synthetic TOTP secrets (no actual staff usernames or credentials);
- starts a local Worker with `APP_ENV=staging` and `AUTH_MODE=internal`;
- checks unauthenticated access denial, password stretching + TOTP, secure cookies, D1 role authorization, 142 catalog records, protected static assets, audit, replay denial and logout;
- opens the real login form in Chromium, computes browser PBKDF2, verifies a golden dose, checks role-gated UI and logout;
- deletes temporary D1 data and fixture SQL on exit.

The preexisting Local Test identity selector is used **only** in `test:api:v3` / `test:browser:v3`. It is not accepted by the staging login test. CI runs both separately. **Local acceptance proves implementation wiring only, not Cloudflare Free CPU performance or remote security approval.**

## 2. Remote Staging preparations (NOT authorized to execute yet)

| Item | Value / status |
| --- | --- |
| Cloudflare Account ID | `3229fd47f39f8ca1809f92d4282b5ab5` (operator-supplied) |
| Separate staging Worker | `bhh-chemotherapy-v3-staging` |
| Expected staging hostname | `https://bhh-chemotherapy-v3-staging.juipharm.workers.dev` (not verified as live) |
| Existing unrelated Worker | `https://bhh.juipharm.workers.dev` — **do not overwrite** |
| D1 staging UUID | `3d936db6-eed1-4880-9561-1f22101cb27e` |
| Production D1 | separate/untouched, placeholders remain |
| Identity method | staging password + TOTP; **not** Cloudflare Access |
| Staging password pepper | not provisioned; encrypted Worker Secret `STAGING_PASSWORD_PEPPER` required |
| Real staging tester users | not provisioned; four named separate-role users required |

Before remote UAT, hospital IT must review the split PBKDF2-HMAC security model and verify 10-ms Workers Free CPU constraints. Reuse the operator-approved identity enrollment and migration procedures in [STAGING_INTERNAL_LOGIN.md](STAGING_INTERNAL_LOGIN.md).

**Never send or commit** passwords, generated SQL, staff TOTP enrollment keys, Cloudflare tokens, or the staging pepper. Remote D1 migrations and any deployment remain forbidden until explicit authorization.

## 3. Staging acceptance checklist (future, synthetic patient parameters only)

- [ ] Hospital IT approves authentication, account recovery, secret rotation and network exposure
- [ ] Staging hostname and dedicated D1 UUID independently verified in Cloudflare account
- [ ] Dedicated `STAGING_PASSWORD_PEPPER` installed as Worker secret (not public `vars`)
- [ ] Four individually provisioned, active users with distinct roles and TOTP apps
- [ ] Staff TOTP login succeeds; wrong factors, unknown users, replay and throttling denied
- [ ] Unauthorized requests cannot load `/app.js`, `/sw.js`, `/api/session`, `/api/catalog`
- [ ] Session expiry, logout, inactive staff account and offline-cache clearing verified on two browsers
- [ ] Approval author and reviewer are separate; creation, revision, approval, publication and audit are durable in staging D1
- [ ] Golden clinical calculations checked manually, including 688→690, 682→680, AUC, vincristine hard max and IU dosing
- [ ] Real Workers Free CPU exceeded/quota metrics and latency recorded (no 1102 errors)
- [ ] Clinical pharmacist + IT sign-off recorded; only then discuss Production cutover separately

**No live-patient use, no Production claims, no merge to `main` until all release gates pass.**
