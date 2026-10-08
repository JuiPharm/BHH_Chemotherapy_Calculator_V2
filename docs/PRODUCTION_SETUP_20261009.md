# Production deployment — Cloudflare Pages + D1

## Critical: two prerequisites
1. Deploy the **Cloudflare Pages project** from the `fix/production-safety-sync-20261009` branch for verification, with build output directory `.` and no build command (static frontend + Pages Functions). The GitHub Pages URL stays read-only; it CANNOT verify PIN or publish via `/api/*` because those are Cloudflare Functions.
2. In Cloudflare create a D1 database and bind it to Pages as **REGIMENS_DB** for BOTH Preview and Production as applicable. Run `migrations/0001_regimen_registry.sql` against that D1 database. Configure **APPROVE_PIN** as a Cloudflare secret (not 1234). Ensure WAF/rate limits on `/api/verify-pin`, `/api/publish`, `/api/regimens` POST.

## Operational rules
- No PIN or clinical approval key in GitHub source, browser storage or URL.
- Clinical reference source/URL is optional, but a qualified pharmacist still reviews drug, dose, units, route and schedule against source material BEFORE approving.
- A legacy free-text master may be reviewed but CANNOT be calculated or published as a structured regimen until manually converted and approved. Never auto-approve 136 legacy regimens.
- Server sends success ONLY after a D1 write; conflict on concurrent edits is HTTP 409. Browser polls /api/regimens roughly every 10 seconds, so propagation is *near real-time*, not guaranteed instantaneous.
- Database is empty initially; six read-only pilot regimens remain bundled as JSON for continuity. Verify pilot protocols clinically before using them for patient care. The final D1 registry should be seeded with clinical-approved structured records through the authenticated editor; do not blindly bulk import unreviewed sources.
- Cloudflare Pages Functions imports `src/server/clinical.js`; deploy the repository root, not only copied GitHub Pages files.
- Published and draft versions are kept separately by status. Maintain D1 backups and access controls.
- For rollout: verify invalid PIN/404/500/offline fail closed; optional reference input; D1 missing binding -> 503; valid publish -> visible on second device after refresh; stale expectedRevision -> 409; clinical cases and 6 pilots independently approved.
