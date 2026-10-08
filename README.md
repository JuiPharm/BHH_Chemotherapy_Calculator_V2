## Production branch candidate v2.7.0

See [Production Setup](docs/PRODUCTION_SETUP_20261009.md). This branch retains six structured pilot records and 136 legacy regimen masters. **Legacy free-text regimens are NOT calculation-ready.** The six pilot records are software fixtures with original local-approval flags, and need independent pharmacist validation for patient care.

Guideline source/link are optional. Published structured regimens and global rounding policy are maintained in Cloudflare Pages + D1; GitHub Pages has no write API. Pharmacist PIN is verified server-side only, not stored in the browser. The guided multi-phase Regimen Builder, Drafts, Legacy Validator, Review, Bulk Publish, JSON/CSV export, and Calculator are available.

**Deployment is incomplete until REGIMENS_DB, schema migration and APPROVE_PIN secret are set on Cloudflare Pages.** Treat GitHub Pages as read-only/static. A separate independent Oncology Pharmacy clinical signoff is required for production patient-care use.
