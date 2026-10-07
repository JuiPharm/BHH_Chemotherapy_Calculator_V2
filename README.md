# BHH Chemotherapy Calculator V2 — Completed Production Release

Version: `2.1.1`  
Released: 7 October 2026

This repository contains the deployed static production release. The six pilot regimens are active and locally approved in the structured calculator. The original V1 regimen dataset is also preserved in V2 as a searchable migration library so legacy content is not lost while clinical normalization proceeds.

## Production URL

GitHub Pages is deployed from `main` through `.github/workflows/deploy-pages.yml`. Every push must pass production smoke tests and browser-runtime parse checks before deployment.

## Active approved pilot regimens

1. TCH — eviQ ID 53 reference model
2. modified FOLFOX6 — eviQ ID 637 reference model
3. R-CHOP21 — eviQ ID 70 reference model
4. ABVD advanced stage — eviQ ID 56 reference model
5. BEP metastatic testicular germ cell — eviQ ID 320 reference model
6. Carboplatin + Paclitaxel ovarian — eviQ ID 252 reference model

## Full V1 regimen library

The original repository contains 136 regimen records / 432 drug entries. All 136 records are preserved in:

`data/legacy-regimens.v1.json`

They are visible in **All Regimens (V1 Library)** and searchable by regimen, cancer, and drug. Legacy records are reference/migration data only until converted to structured schema and reviewed. They are deliberately not parsed directly into patient calculations.

## v2.1.1 hotfix

This version addresses the main browser-runtime risk found during re-review:

- Service Worker changed from cache-first to network-first for HTML/JS/JSON.
- `skipWaiting()` and `clients.claim()` activate fresh production files immediately.
- registration uses `updateViaCache: 'none'` and checks for an update on page load.
- old cache versions are removed automatically.
- removed runtime dependence on `structuredClone`, `CSS.escape`, and mandatory `crypto.randomUUID()` by adding compatible fallbacks.
- CI now parse-checks the deployed browser JavaScript.
- deployment verifies that the 136-regimen legacy library is included.

## Key safety behavior

- Structured dose objects are the calculation source of truth.
- Legacy free text is never used directly for production calculation.
- Supports fixed dose, BSA-based dose, weight-based dose, International Units, and Carboplatin AUC.
- Carboplatin kidney-function method is explicit; no hidden universal 125 mL/min cap.
- Clinical hard maximum rules are applied before operational rounding.
- Exact calculated dose and recommended dose are both visible.
- Published nearest-10-mg behavior includes `688 → 690 mg`, `682 → 680 mg`, and half-up `685 → 690 mg`.
- Bleomycin remains IU; it is never silently converted to mg.
- Patient inputs are not persisted in localStorage.

## Editable Rounding Policy

The **Rounding Policy** tab allows editing increment, maximum percentage difference, maximum absolute difference, and label. Changes are browser-local until exported and centrally published, preventing a workstation from silently changing hospital-wide policy.

## Regimen migration rule

New or migrated regimens follow:

Legacy source → structured draft → schema validation → Oncology Pharmacist review → golden test cases → approval → published structured snapshot.

## Run locally

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Automated validation

```bash
npm test
```

The production gate verifies six active approved pilots, 136 preserved V1 regimens, zero structured-registry schema errors, dose-rounding regressions, Vincristine cap behavior, Bleomycin IU handling, and Carboplatin AUC behavior.

## Security / privacy

- Same-origin Content-Security-Policy.
- No external analytics.
- Patient calculation inputs are not persisted.
- Draft regimens and local rounding overrides stay browser-local.
