# Changelog

## 2.2.0 — 2026-10-07
- Fixed critical runtime startup defect: `init;` → `init();`.
- Replaced production ES-module/fetch startup with a single-file non-module runtime.
- Embedded 6 approved regimens, rounding defaults, and 136 V1 regimens.
- Removed Service Worker as an application dependency.
- Added cleanup for old Service Worker/cache state.
- Added CI startup-contract validation.

## 2.1.1 — 2026-10-07
- Added the 136-regimen V1 migration library and cache hardening.

## 2.1.0 — 2026-10-07
- Approved six pilot regimens and added editable rounding policy.
