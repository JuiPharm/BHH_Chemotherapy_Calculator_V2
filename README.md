# BHH Chemotherapy Calculator V2 — Completed Production Release

Version: `2.1.0`  
Released: 7 October 2026

This repository contains the deployed static production release. The six pilot regimens have `localApproval: true` per project-owner confirmation on 7 October 2026. Future or modified regimens continue to require structured validation, independent clinical review, versioning, and publication control.

## Production URL

GitHub Pages is deployed from `main` through `.github/workflows/deploy-pages.yml`. Every push must pass the production smoke gate before Pages deployment.

## Included approved pilot regimens

1. TCH — eviQ ID 53 reference model
2. modified FOLFOX6 — eviQ ID 637 reference model
3. R-CHOP21 — eviQ ID 70 reference model
4. ABVD advanced stage — eviQ ID 56 reference model
5. BEP metastatic testicular germ cell — eviQ ID 320 reference model
6. Carboplatin + Paclitaxel ovarian — eviQ ID 252 reference model

## Key safety behavior

- Structured dose objects are the calculation source of truth; production does not calculate from legacy free text.
- Supports fixed dose, BSA-based dose, weight-based dose, International Units, and Carboplatin AUC.
- Carboplatin kidney-function method is explicit; there is no hidden universal 125 mL/min cap.
- Clinical hard maximum rules are applied before operational rounding.
- Exact calculated dose and recommended dose are both visible.
- Published nearest-10-mg behavior includes `688 → 690 mg`, `682 → 680 mg`, and half-up `685 → 690 mg`.
- Rounding safety thresholds can block a mathematically nearest dose when the percentage/absolute deviation exceeds policy.
- Bleomycin remains IU; the engine never silently converts IU to mg.
- Patient inputs are not persisted in localStorage.

## Editable Rounding Policy

The **Rounding Policy** tab allows editing:

- increment,
- maximum percentage difference,
- maximum absolute difference,
- display label.

Changes are stored as a **browser-local override**. Users can Export JSON, Import JSON, or Reset to Published Default. This intentionally prevents one workstation from silently changing the hospital-wide policy.

To make a policy global, review the exported JSON through BHH change control and publish the approved values to `data/rounding-profiles.json`.

## Regimen Builder

The browser Regimen Builder creates DRAFT records only. Drafts cannot be selected by the production calculator. This preserves the workflow:

Draft → validation → clinical review → approval → published structured snapshot.

## Legacy migration

The **Legacy Validator** can load the V1 `regimens.json` and flags ambiguous expressions such as dose ranges, g/m² free text, IU/units, loading→maintenance, /day, and repeated intra-day schedules. Legacy free text is never used directly as a production calculation source.

## Run locally

Serve the repository root through any static HTTP server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Automated validation

```bash
npm test
```

The production smoke test verifies:

- exactly six approved pilot regimens,
- zero registry schema errors,
- `688 → 690 mg`,
- `682 → 680 mg`,
- `685 → 690 mg`,
- safety-threshold blocking,
- Vincristine hard maximum 2 mg before rounding,
- Bleomycin remains IU,
- Calvert calculation does not silently cap kidney function at 125 mL/min.

## Change control

For future clinical-data changes, retain these gates:

1. source and indication verified,
2. structured schema validated,
3. Oncology Pharmacist review completed,
4. golden calculation tests updated/passed,
5. `localApproval` explicitly recorded,
6. regimen/version change documented,
7. GitHub Actions validation succeeds before deployment.

## Security / privacy

- Same-origin Content-Security-Policy.
- No external analytics.
- Patient calculation inputs are not persisted.
- Draft regimens and local rounding overrides remain local to the browser.
- For multi-user centralized authoring/audit in a future phase, use authenticated server-side governance while retaining an immutable published snapshot for the calculator.
