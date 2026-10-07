> V3 Cloudflare production candidate is in [v3/README.md](v3/README.md). The root files below preserve the V2.3 application and history. V3 uses Worker/D1 as its clinical master; root JSON is import source only.

# BHH Chemotherapy Calculator

Version: `2.3.0`

Production frontend for Bangkok Hospital Hatyai Pharmacy Department.

## Frontend

- Bangkok Hospital Hatyai logo is derived from the project Library.
- Patient fields start blank; no clinical values are prefilled.
- Clinical inputs are required.
- Cockcroft-Gault CrCl is the initial kidney-function method.
- Regimen selection follows **Cancer Type → Search → Regimen**.
- Regimen Library is searchable and grouped by Cancer Type.
- The central catalog contains all 136 original regimen records.
- The six clinically approved structured pilot regimens remain calculation-enabled.

## Central regimen editing

Regimen Master is not stored in localStorage. Shared data is version-controlled in this repository:

- `data/legacy-regimens.v1.json` — central 136-regimen catalog.
- `data/regimens.published.json` — approved structured calculation definitions.
- `data/rounding-profiles.json` — global rounding defaults.

After an approved edit is committed to `main`, GitHub Actions validates and deploys the update. All workstations then read the same centrally deployed data on the next load.

Direct multi-user editing inside the web app with login, roles, approvals, and immutable audit trail should use an authenticated backend such as Supabase with RLS. GitHub write credentials must never be embedded in the browser.

## 136 regimen catalog

All 136 original regimen records can be searched, filtered by Cancer Type, selected, and reviewed from the Calculator/Regimen Library. Records without an approved structured calculation definition display their original regimen details but calculation remains blocked until that regimen is structured and clinically approved. The application does not guess a production dose from ambiguous free text.

## Rounding

Published nearest-10-mg behavior retains:

- 688 mg → 690 mg
- 682 mg → 680 mg
- 685 mg → 690 mg

Browser-local rounding changes are for testing. Hospital-wide rounding changes are made centrally in `data/rounding-profiles.json` and deployed through the same validation workflow.
