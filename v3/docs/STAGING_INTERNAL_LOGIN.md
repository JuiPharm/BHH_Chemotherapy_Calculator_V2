# BHH V3 Staging — internal login (no Google OAuth / Cloudflare Access)

**Scope: isolated staging only, never clinical production.** This branch uses Workers Free + a dedicated D1 staging database with individual **password + TOTP authenticator** credentials. No third-party identity provider or email delivery service is required. The production Worker continues to require Cloudflare Access JWT verification; the main V2 application and existing draft PR are unchanged. **Do not deploy or use real patient identifiers until separate approval.**

## Security design
- Internal mode is strictly `APP_ENV=staging` AND `AUTH_MODE=internal`; production ignores this path and uses its original verified Cloudflare Access JWT logic.
- No public registration, reset-by-email, password in browser storage, shared PIN, or username header trust.
- Separate D1 `users`/roles authorization is required after both authentication factors. Accounts are provisioned by an operator, not sign-up.
- **Workers Free CPU workaround:** the user's browser performs PBKDF2-HMAC-SHA256 (600,000 iterations; random 16-byte per-account salt). It submits a password-equivalent prehash **only over HTTPS**. The Worker verifies `HMAC-SHA256(STAGING_PASSWORD_PEPPER, prehash)` against the D1 verifier using constant-time comparison. The secret HMAC pepper is a staging-only Worker Secret and is never stored in source code or D1. A captured prehash is password-equivalent; mandatory TOTP, rate limits, secure transport and no response caching mitigate replay. This nonstandard split-KDF design requires independent security review before deployment. TOTP is RFC6238 SHA-1, 6 digits, 30-second steps with ±1 step window and one-use replay prevention. The TOTP seed is a sensitive D1 credential.
- The session is a random opaque 256-bit token with only its SHA-256 digest stored in D1. An `__Host-` HttpOnly, Secure, SameSite=Strict cookie expires after 6 hours; logout deletes the session server-side. Users are checked as active on every request. Session is not a JWT.
- All clinical assets and APIs require a valid session. The only unauthenticated assets are the login screen, associated CSS/JS and BHH logo. Cross-site writes require the original exact same-origin Origin and X-Requested-With headers; login/logout require them too.
- D1-enforced per-email (5 attempts/15 minutes) and per-IP (30 attempts/15 minutes) limits and append-only login events. CF-Connecting-IP is trusted only at the Cloudflare edge. Manual account lockout/deactivation and session revocation remain available to IT by D1.
- Logout clears the browser's Published-protocol IndexedDB and service-worker caches and unregisters the service worker. An offline client already holding downloaded Published protocols cannot learn about a remote revocation until it reconnects; apply shared-device/offline policy. No patient identifiers are persisted.
- HTTPS workers.dev is mandatory in remote staging. Do not configure a public fallback path, a cross-origin API or `LOCAL_TEST_AUTH` on staging.

## Account and D1 setup
1. In Cloudflare Workers & Pages choose Workers Free and note your `workers.dev` subdomain. Whether the current Cloudflare signup process demands a payment method depends on account onboarding; **stop rather than adding billing details if the account requires them**.
2. The user's Cloudflare account identifier was provided as `3229fd47f39f8ca1809f92d4282b5ab5`; their D1 staging UUID is `3d936db6-eed1-4880-9561-1f22101cb27e`. The linked D1 Metrics page does **not** establish a Workers subdomain. Do not infer one. Create (or reuse) the project-specific staging D1:
   ```sh
   npx wrangler login
   npx wrangler d1 create bhh-chemo-staging
   ```
3. The supplied staging `database_id` is already filled in `v3/wrangler.jsonc`. Before any remote operation, independently verify the UUID identifies **`bhh-chemo-staging`** in the intended Cloudflare account and is not Production; keep staging `AUTH_MODE=internal` and `workers_dev=true`. Keep production's Access team domain/AUD placeholders and `workers_dev=false` unchanged. Never use the production D1 ID for staging.
4. Run `npm ci && npm run build:v3 && npm run test:v3 && npm run check:deploy:v3`, and `npm audit` to confirm the patched `sharp` 0.35.5 lockfile has no current advisories. Also run `npm run test:api:v3` and `npm run test:browser:v3` locally or in GitHub CI. When staging configuration passes and IT approves the exposure, apply **staging only** migrations:
   ```sh
   npx wrangler d1 migrations apply DB --config v3/wrangler.jsonc --env staging --remote
   ```
5. Generate a random high-entropy **staging-only secret pepper** of at least 32 characters using an approved password manager. Do not send it to ChatGPT or paste it into Git, chat, screenshots or terminal history. Store it securely, and supply the same `STAGING_PASSWORD_PEPPER` environment variable only on the operator's computer when running provisioning. Before deployment, an authorized operator must separately set this exact value as an encrypted Cloudflare Worker Secret named `STAGING_PASSWORD_PEPPER` using an approved deployment process; never place it in `wrangler.jsonc` `vars`. Provisioning and remote secret setup are *not* performed in this task. Generate four independent, reviewed tester identities, one for each role, on the operator's own machine:
   ```sh
   node v3/scripts/provision-staging.mjs tester@example.org calculator_user
   ```
   Repeat with `regimen_editor`, `oncology_pharmacist`, and `clinical_admin` and individual email addresses. The script requires an interactive terminal and a unique password at least 14 characters; it prints the TOTP setup key locally and writes one confidential SQL file to ignored `v3/.staging-secrets/`. Add the key directly to the user's authenticator application (TOTP, SHA1, 6 digits, 30-second period). **Never send the generated key, SQL, password or screenshot of setup to ChatGPT or GitHub.**
6. The operator must verify that the pepper is the same one provisioned as the future Worker Secret (a mismatch prevents every login) and verify each username/role against the approved tester list. Import a reviewed file **only against staging D1**, e.g.:
   ```sh
   npx wrangler d1 execute DB --config v3/wrangler.jsonc --env staging --remote --file v3/.staging-secrets/<reviewed-file>.sql
   ```
   The generated SQL inserts one user, one credential and a change audit together. Do not run `v3/scripts/local-users.sql` remotely. Securely delete the provisioning SQL after verification; consider backup and offboarding processes for TOTP seeds.
7. Deploy **only after explicit approval** by an operator authorized for the Cloudflare account:
   ```sh
   npm run deploy:staging:v3
   ```
   No Cloudflare credentials are needed in this repository or chat. The current task specifically **does not include deployment**.

## Real staging acceptance checks — still pending
- An unauthenticated visitor can open only `/login`, `/login.js`, `/login.css` and the logo; `/`, `/app.js`, `/sw.js`, `/api/session`, `/api/catalog` fail closed.
- Wrong password, bad OTP, replayed code, too many attempts, inactive D1 account, missing session and incorrect Origin are denied.
- Correct independent tester email/password/TOTP can login, receives an HttpOnly cookie, and observes only the corresponding D1 role (calculator/editor/reviewer/admin). A reviewer must be a different individual from the author.
- Signout deletes the session and local offline snapshot; expired sessions and role changes are rejected; test two browsers, same revision, approval audit and clinical golden doses (688→690, 682→680, Vincristine maximum, AUC).
- Validate actual Workers Free 10ms CPU allowance with real remote sign-in (HMAC + TOTP + D1); browser-side PBKDF2 latency under older mobile/desktop devices must also be measured. Local CI tests do **not** prove Cloudflare Free CPU compatibility.
- No real patient data, no production deployment, and no merge into main until staging UAT and formal clinical/IT review.

- Treat this staging-specific password split-KDF as provisional: it is not a standard identity provider, and hospital IT/security review must assess replay, secret rotation, account recovery, cross-device/offline handling, phishing risks and credential storage before any deployment.

References: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).
