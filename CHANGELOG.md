# Changelog

## 2.1.0 — 2026-10-07

- Recorded local approval for all six pilot regimens per project-owner confirmation.
- Added editable Rounding Policy screen with local save, import, export, and reset.
- Renamed candidate rounding profiles to published default profile IDs.
- Updated production UI and regression checks.

## 2.0.0 — 2026-10-07

### Production deployment candidate

- Structured dose engine; no free-text dose calculation.
- Explicit fixed/BSA/weight/AUC dose basis.
- IU-safe Bleomycin handling.
- Explicit kidney-function method for Carboplatin; no hidden universal 125 mL/min cap.
- Calculated dose and recommended rounded dose shown separately.
- Candidate nearest-10-mg rule validates `688 → 690`, `682 → 680`, and half-up `685 → 690`.
- Clinical caps applied before operational rounding.
- Multi-phase regimen support.
- Zero-code Draft Regimen Builder.
- Legacy free-text validator with fail-closed migration flags.
- GitHub Pages validation/deployment workflow for a new repository.
- Production smoke tests gate deployment.

Clinical regimen approval remains a separate BHH governance step.
