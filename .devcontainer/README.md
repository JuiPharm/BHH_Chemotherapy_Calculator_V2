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

## Troubleshooting `HTTP ERROR 502` on a forwarded Codespaces URL

A 502 at a private `<codespace>-8792.app.github.dev` URL often means **port 8792 is no longer connected to a healthy local listener** or a stale forwarded-port mapping remains. This is not a chemotherapy dosing calculation failure.

**No Windows PowerShell is required.** Use the browser-only Codespaces UI:

1. In the Codespace editor, open **PORTS**. Locate port **8792**, right-click → **Remove Port**; use **Add Port** to re-forward **8792**, set visibility **Private** and HTTP protocol. Click its **Open in Browser** icon again.
2. If you do not see the browser preview, use **View → Command Palette** → **Codespaces: Rebuild Container** (or **Dev Containers: Rebuild Container**, depending on your interface). A rebuild applies new `.devcontainer` settings and runs the self-healing `postStartCommand` and `postAttachCommand`. Open port 8792 only after the startup process finishes.
3. If the Codespace was created before these code fixes, its checkout may still contain an older commit. In VS Code's **Source Control → … → Pull** to update the `staging-internal-auth-v3` branch first; then rebuild the container. Alternatively create a *new* Codespace from the latest branch after safely preserving your own uncommitted changes.
4. If it still fails, open **Explorer → `v3/.staging-secrets/codespaces-preview.log`** in the browser editor. The log contains diagnostic startup text and possibly **synthetic-only** test secrets. Share **only** the error portion, not the contents of `CODESPACES_LOGIN.txt` or any secret.

The local Codespaces Worker now listens on `0.0.0.0:8792` for the **private** forwarded port, supports the exact `https://$CODESPACE_NAME-8792.app.github.dev` browser origin in local-preview mode only and refuses other Origins. A GitHub CI simulation checks the HTTPS-hostname headers, CSRF denial and preview restart.

Do **not** change this port to Public. The hosting URL is authenticated by GitHub; Cloudflare Workers staging remains untouched. Use only fake test data.
