> **SUPERSEDED for the isolated `staging-internal-auth-v3` branch.** The Cloudflare Access OTP path below is retained as historical context only. Current staging candidate: [STAGING_INTERNAL_LOGIN.md](STAGING_INTERNAL_LOGIN.md). Do not configure both identity paths at once.

# Staging authentication — Cloudflare Access email One-time PIN

**Decision (8 Oct 2026): staging only uses Cloudflare Access email OTP, not Google OAuth.** No Google Cloud Console, Google OAuth client ID or client secret is required for staging. Production authentication remains a separate hospital IT/security decision. This is a deployment runbook, not proof of remote testing or clinical approval.

## Before the first staging deployment (no custom domain required)

1. In Cloudflare dashboard, find your account's **Workers & Pages** `workers.dev` subdomain. The staging Worker name in `v3/wrangler.jsonc` is `bhh-chemotherapy-v3-staging`. The staging URL will be `https://bhh-chemotherapy-v3-staging.<YOUR_WORKERS_SUBDOMAIN>.workers.dev`.
2. In **Zero Trust > Integrations > Identity providers > Add new identity provider**, add **One-time PIN**. Cloudflare OTP is not added automatically to every new account.
3. In **Zero Trust > Access controls > Applications**, add a **Self-hosted public** application protecting the **exact full staging hostname** (all paths). Configure an **Allow** policy with **Include: specific individual tester email addresses** and **Require: Login methods = One-time PIN**. Do not use `Everyone`, broad email-domain allowlists, or `Login methods = One-time PIN` alone as an Include rule. Do not create Bypass/Service Auth exceptions to expose assets, `/api`, or `sw.js`.
4. From that staging Access application, copy the **Application Audience (AUD) Tag** (Additional settings). Record the **Zero Trust team domain** (`<TEAM>.cloudflareaccess.com`). This staging Access application and its AUD must match the hostname used to test. Access can be configured for the planned workers.dev hostname before deploying the Worker.
5. Create the two independent D1 databases, or reuse existing empty databases previously created for this project; record the returned **database IDs**, not just database names. Stage and production must never share a D1 ID.
6. Fill only real values in `v3/wrangler.jsonc`: staging `ACCESS_TEAM_DOMAIN`, staging `ACCESS_AUD`, staging D1 `database_id`; leave `env.staging.workers_dev=true` and staging `routes` absent. Production `workers_dev=false` and its production placeholders/strict custom-domain gate remain in place until a separately approved cutover.
7. Run `npm ci`, `npm run build:v3` and `npm run check:deploy:v3` locally. The guard checks config structure, not whether the Access application or security policy is actually enabled. **Verify the Access allowlist and authentication settings in Cloudflare before allowing access to staging.**

## Stage database, identities and deployment

8. Apply staging migrations only:

   ```sh
   npx wrangler d1 migrations apply DB --config v3/wrangler.jsonc --env staging --remote
   ```

9. Provision only the verified tester email addresses as named active users in staging D1 using the audited provisioning instructions in [DEPLOYMENT.md](DEPLOYMENT.md). Map exactly one of `calculator_user`, `regimen_editor`, `oncology_pharmacist` or `clinical_admin` to each user. The pharmacist reviewer must not be the same as the author/submitter. Email matching uses lowercased addresses from the verified Access JWT; there are **two gates**: the Access allow policy and the D1 `users` table. Do not run `v3/scripts/local-users.sql` remotely.
10. Deploy from a machine authorized by `npx wrangler login`, or via the protected `cloudflare-staging` GitHub Actions environment after its secrets and deployment review are set:

    ```sh
    npm run deploy:staging:v3
    ```

    A ChatGPT session does not receive deployment permission simply because an operator signs in locally.

## Authentication and negative UAT checks

11. Visit the exact staging URL. On the Cloudflare Access page, enter an individually allowlisted tester email, select **Send login code**, and enter the PIN received in the inbox. OTP is single-use and expires after 10 minutes. The browser proceeds to the calculator only after Cloudflare Access succeeds and the Worker validates the signed application JWT.
12. Confirm an unknown email is denied by Access (Cloudflare may still display “code emailed” without sending an email). Confirm an Access-allowed email **missing or inactive in D1 receives 403** and sees no clinical assets. Verify each role, independent review, audit, calculation golden cases, session expiry, two browsers, offline and reconnect. Use **synthetic patient parameters only**.
13. Confirm missing/invalid/expired JWT and wrong AUD are denied, and Access protects the **entire hostname**, including `/api/*` and the service worker. Test logout and repeat access. In the case of email non-delivery, check the allowlist and email gateway for `noreply@notify.cloudflare.com`.
14. Record staging UAT evidence in the readiness report. **Passing local tests or merely creating an Access application does not mean staging has been deployed or is clinically approved.**

## If a hospital-controlled staging domain is introduced later

Change only staging to `workers_dev=false` and set a genuine custom-domain `routes` entry. Create/update an Access app for that exact hostname, record its actual AUD in staging `ACCESS_AUD`, verify that no old reachable hostname bypasses the policy, and rerun UAT. **Production remains custom-domain-only and must retain its own D1 and Access application.**

## Security and scope notes

- Email OTP verifies possession of an allowed inbox; **it is not equivalent to phishing-resistant MFA or managed workforce SSO**. Hospital IT must independently approve the production identity assurance requirements.
- Keep Worker JWT verification (`signature`, `issuer`, `AUD`, `expiry`, `subject`, `type`) and D1 provisioning. Do not replace these with client email fields, headers, a shared PIN, or an open staging bypass.
- Do not send Cloudflare API tokens, Google secrets, or OTP codes through chat or commit them to the repository. D1 IDs, Access audience tags and public hostnames may be recorded for staging configuration, but no authentication secret is needed in the application source.

Official references: [Access OTP](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/), [Cloudflare Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [Wrangler staging on workers.dev](https://developers.cloudflare.com/workers/wrangler/environments/), [JWT verification](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
