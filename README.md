# BHH Chemotherapy Calculator V2 — Completed Production Release

Version: `2.1.0`  
Generated: 7 October 2026

This package is the **completed production release v2.1.0** for the new repository. The six pilot regimens have local approval recorded per project-owner confirmation on 7 October 2026. Future regimens continue to require structured validation and approval before publication.

## What changed from V1

- Structured dose objects are the only source of truth for calculation.
- No regex/free-text dose parsing is used in the calculator.
- Supports fixed dose, mg/m², g/m² engine semantics, mg/kg, IU/IU per BSA, and Carboplatin AUC.
- Carboplatin kidney function method is explicit; no hidden universal 125 mL/min cap.
- Multi-phase regimens are represented by cycle ranges.
- Clinical hard maximum rules are applied before operational rounding.
- Exact calculated dose and recommended rounded dose are shown together.
- Rounding test behavior includes `688 mg -> 690 mg` and `682 mg -> 680 mg` for the `nearest 10 mg` profile.
- Rounding is a drug/protocol profile, not a universal rule.
- Legacy JSON is audit-only and fails closed for ambiguous expressions.
- Regimen Builder saves DRAFT records only; it cannot publish them.
- Patient inputs are not persisted.
- No runtime external JavaScript libraries or CDNs.

## Included pilot regimen records

1. TCH — eviQ ID 53 reference model
2. modified FOLFOX6 — eviQ ID 637 reference model
3. R-CHOP21 — eviQ ID 70 reference model
4. ABVD advanced stage — eviQ ID 56 reference model
5. BEP metastatic testicular germ cell — eviQ ID 320 reference model
6. Carboplatin + Paclitaxel ovarian — eviQ ID 252 reference model

All six included pilot records have `localApproval: true` for this project release. Their structured definitions, sources, and calculation behavior remain visible for ongoing review and future change control.

## Run locally before deployment

Do not double-click `index.html`, because browsers restrict `fetch()` under `file://`.

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080`

Any static server is acceptable. The built files are already included.

## Build from TypeScript source

TypeScript 5.8+ is recommended.

```bash
tsc -p tsconfig.json
```

Or, if using npm in a normal development environment:

```bash
npm install
npm run build
```

## Run automated tests

With TypeScript available:

```bash
npm test
```

Core tests cover:

- Mosteller BSA
- `688 -> 690 mg`
- `682 -> 680 mg`
- half-up at `685 -> 690 mg`
- rounding safety threshold
- Vincristine 2 mg hard maximum before rounding
- Bleomycin International Units remain IU
- Calvert formula with no silent 125 mL/min cap

## Deploy

The folder is static and can be deployed to GitHub Pages or Netlify. For future clinical-data changes, retain these governance checks:

1. Every regimen has been independently reviewed by Oncology Pharmacy.
2. BHH-approved rounding profiles replace the test rounding profiles.
3. Local kidney-function policy for Carboplatin is approved.
4. Golden clinical test cases are signed off.
5. `localApproval` is explicitly recorded in the approved snapshot.
6. Change control / PTC governance is documented.
7. Record approval/version changes in the published snapshot and changelog.

## Legacy migration

Use the **Legacy Validator** tab and choose the existing V1 `regimens.json`. The tool does not calculate from it. Ambiguous structures such as dose ranges, `g/m²`, IU/units, loading→maintenance, `/day`, and repeated intra-day schedules are blocked for manual structured migration.

## Security / privacy

- Content-Security-Policy restricts resources to the same origin.
- No external analytics.
- No patient values are stored in localStorage.
- Draft regimen records are local to the browser and must not be treated as approved data.
- For multi-user clinical production, move regimen governance/audit trail to authenticated server-side storage (e.g. Supabase with RLS), while retaining an immutable published snapshot for the calculator.


## v2.1 completed release

- Six pilot regimens have `localApproval: true` per project-owner confirmation on 7 October 2026.
- Added browser-editable Rounding Policy Editor.
- Rounding edits are local to the browser until exported and centrally published to `data/rounding-profiles.json`.
- Current defaults retain `688 mg -> 690 mg` and `682 mg -> 680 mg` behavior for the nearest-10-mg profile.
