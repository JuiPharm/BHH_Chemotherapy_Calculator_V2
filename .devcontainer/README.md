# No-PowerShell, browser-only test of BHH Chemotherapy Calculator V3

The dev container exists **only on branch `staging-internal-auth-v3`**. It is not a Cloudflare deployment and does not access the user's remote D1.

1. On GitHub, open the branch `staging-internal-auth-v3` of `JuiPharm/BHH_Chemotherapy_Calculator_V2`.
2. Click **Code → Codespaces → Create codespace on staging-internal-auth-v3**. If Codespaces is not offered, your account or organization may not permit it; do not add a payment method just for this test.
3. GitHub opens an editor in your browser and automatically installs dependencies, builds the web assets and starts a local Worker with **temporary local D1**. This is hosted inside your own Codespace, not on Cloudflare Workers.
4. Open the **PORTS** tab in the browser editor, confirm port **8792** shows **Private**, and open the forwarded link (an HTTPS `*.app.github.dev` URL). It opens the staging Login form; **do not use** `localhost:8792` on your personal Windows PC.
5. In the explorer, open `v3/.staging-secrets/CODESPACES_LOGIN.txt` to see **synthetic** tester emails for calculator/editor/reviewer/admin, a **synthetic** test password and TOTP setup seeds. These are random temporary fixtures, **not hospital accounts**, and the file is ignored by Git.
6. On your phone, open a TOTP authenticator app (e.g., Microsoft Authenticator), **add an account manually** with one fake test-only TOTP secret, select **time-based SHA1, six digits, 30 seconds** and sign in. Test the drug calculator, rounding, regimen library, role access, logout. **Never use real patient records, actual staff credentials or real clinic data.**
7. After testing, **stop or delete the Codespace** at [github.com/codespaces](https://github.com/codespaces), which stops the billed compute usage. Keep the port visibility Private; do not share the link publicly.

The static preview is not a Production-ready clinical calculator. **Password+TOTP requires a separate security review before remote staging**; this Codespace proves usability but does not prove Cloudflare Workers Free CPU limits. If the Codespace fails to start, the terminal shows its setup log; more detail appears in ignored `v3/.staging-secrets/codespaces-preview.log`.

**Security:** The setup script never calls `wrangler login`, `wrangler deploy`, or `wrangler --remote`. It runs only local test migrations against a random temp D1 and generates fake credentials. The secret output is placed in an ignored user-local file visible only to the Codespace owner. Do not configure this port as Public.

**Resource availability:** GitHub personal accounts include free monthly Codespaces compute and storage allowances. If your quota is exhausted or Codespaces disabled, the procedure will not work without account/admin changes. Do not add billing details against your preferences.
