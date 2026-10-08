# BHH Chemotherapy Calculator V3 — Public Calculator + Confirm PIN

**Status: staging UAT candidate only, never approved for clinical prescribing.**

## User workflow

- Open the future staging URL `https://bhh-chemotherapy-v3-staging.juipharm.workers.dev` without login to calculate with **Published** regimens only. There are 6 preloaded pilot Published records; 136 prior unstructured source regimens are intentionally invisible to public visitors.
- Click **Manage Regimen → Confirm PIN**. Enter one **individual** 10-digit PIN from hospital IT to enable **Draft/Regimen Builder** and Registry. PIN verification and the edit session happen on the server. No self-registration, no common hospital-wide PIN.
- Save Draft → Submit Review. **A PIN does not allow Clinical Review, Approve, Publish, Audit, or Admin**. These require separate individually identified Oncology Pharmacist / Admin login at `/login`, still password + TOTP pending IT approval.
- On the public calculator, always independently verify protocol selection, clinical dose, rounding and patient parameters before administration. No real patient data or hospital PHI in staging.

## Test from browser (without PowerShell)

1. Open GitHub branch `staging-internal-auth-v3` with Codespaces (see `.devcontainer/README.md`) and rebuild the container or create a new Codespace.
2. Open port **8792** from PORTS with **Private** visibility.
3. Calculator should load directly — **no Login**.
4. Open `v3/.staging-secrets/CODESPACES_LOGIN.txt` inside Codespaces. The file contains a **synthetic test editor PIN** as well as synthetic password + TOTP details for role UAT.
5. Click Manage Regimen and enter the local synthetic PIN. Try New Regimen, Save Draft, check independent Publish cannot occur using PIN and Exit editor.
6. No remote D1 is accessed. Temporary test identity and PIN change when a new preview is created.

## Browser-only deployment when authorized by Cloudflare account owner

The deploy remains **manual**, staging-only, isolated from `bhh.juipharm.workers.dev` and V2 production.

1. In the GitHub repo, Settings → Secrets and variables → Actions → New repository secret. Set:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare token authorized for Workers Script edit and D1 read/write on the intended account, never paste into chat or git.
   - `STAGING_PASSWORD_PEPPER`: a random dedicated staging secret at least 32 characters (keep a backup in the organization's approved password manager).
   - `STAGING_EDITOR_PIN`: a unique randomly generated 10-digit editor PIN, stored as a GitHub encrypted Secret; **never reuse a PIN that has been published in docs/chat**.
2. Github Actions → **Deploy V3 Staging — Public Calculator and PIN Editor** → Run workflow. Select `staging-internal-auth-v3`. Enter approval `DEPLOY_STAGING_ONLY` and an individual editor's **staging-only** email. Review the `cloudflare-staging` environment approval if configured.
3. This workflow checks dependencies and code, applies schema migrations to only `bhh-chemo-staging` D1, deploys only `bhh-chemotherapy-v3-staging` Worker, sets its encrypted pepper, and creates the individual Draft Editor's PIN verifier. It does **not** create reviewer/admin credentials or bypass clinical approval.
4. After Success, check `https://bhh-chemotherapy-v3-staging.juipharm.workers.dev`. Guest must see exactly 6 Published entries and `/api/registry` must deny anonymous requests. Then perform clinical / IT UAT. Cloudflare Workers Free CPU and D1 quotas require monitoring on the actual deployment.

**No Cloudflare deploy has been executed from this chat.** The ChatGPT connection currently has GitHub code editing and CI read access but not an authenticated Cloudflare deployment action or access to the required account secrets. A GitHub Actions workflow is ready to run only when the Cloudflare account owner supplies secrets in GitHub and explicitly runs it. No secrets should ever be transmitted through this conversation.

## Security notes

- Public/guest role is read-only with server-side allowlisting: `/api/session`, `/api/catalog`, `/api/revision`, and Published `/api/versions/:id`. No Draft details, Registry, Audit, or mutations.
- PIN grants at most `regimen_editor` from an active, individually provisioned user. Server stores a pepper-keyed HMAC, not plaintext PIN. Rate-limited to 5 attempts/15 minutes per IP and 100 total/15 minutes. Session cookie is Secure + HttpOnly + SameSite=Strict, expires after one hour; logout revokes DB session.
- PIN-based editor entry **requires independent hospital IT assessment before a public Internet release**. Unrestricted public information access to chemotherapy protocols must also be approved under the hospital's publication policy.
- Reviewer/Admin remain separate password+TOTP roles; approval refuses self-review by the submitter. No PIN automatically publishes regimens.
