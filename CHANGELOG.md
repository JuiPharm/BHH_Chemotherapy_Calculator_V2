# Changelog

## 2.1.1 — 2026-10-07

- Re-reviewed the exact GitHub Pages deployment artifact after a report that the deployed app could not be used.
- Fixed stale Service Worker behavior: network-first critical assets, `skipWaiting`, `clients.claim`, update without HTTP cache, and automatic old-cache cleanup.
- Added compatibility fallbacks for `structuredClone`, `CSS.escape`, and `crypto.randomUUID`.
- Imported the complete original V1 regimen dataset: 136 regimens / 432 drug entries.
- Added **All Regimens (V1 Library)** with search by regimen, cancer, and drug.
- Kept legacy regimens out of patient calculations until structured clinical migration and approval.
- CI now verifies the 136-regimen library and parse-checks deployed browser JavaScript.

## 2.1.0 — 2026-10-07

- Recorded local approval for all six pilot regimens per project-owner confirmation.
- Added editable Rounding Policy screen with local save, import, export, and reset.
- Renamed candidate rounding profiles to published default profile IDs.
- Updated production UI and regression checks.

## 2.0.0 — 2026-10-07

- Structured dose engine; no free-text dose calculation.
- Explicit fixed/BSA/weight/AUC dose basis.
- IU-safe Bleomycin handling.
- Explicit kidney-function method for Carboplatin; no hidden universal 125 mL/min cap.
- Calculated dose and recommended rounded dose shown separately.
- Nearest-10-mg regression checks for `688 → 690`, `682 → 680`, and half-up `685 → 690`.
- Clinical caps applied before operational rounding.
- Multi-phase regimen support.
- Zero-code Draft Regimen Builder.
- Legacy free-text validator with fail-closed migration flags.
- GitHub Pages CI/CD.
