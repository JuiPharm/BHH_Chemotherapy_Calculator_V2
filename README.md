# BHH Chemotherapy Calculator V2

Version: `2.2.0` — Simple Production Runtime

The previous deployed runtime contained a critical startup defect: `dist/app.js` ended with `init;` rather than `init();`. The JavaScript parsed, so CI passed, but the browser never initialized the application.

v2.2.0 fixes that defect and simplifies GitHub Pages runtime:
- single non-module `app.bundle.js`;
- 6 approved structured regimens, rounding defaults, and all 136 V1 regimens embedded at runtime build;
- no JSON fetch required to start Calculator;
- no Service Worker dependency for normal operation;
- old Service Worker/cache cleanup included;
- CI fails if runtime does not invoke `init();`.

## Active calculator
TCH, mFOLFOX6, R-CHOP21, ABVD, BEP, and ovarian Carboplatin/Paclitaxel.

## Other regimens
All 136 V1 regimen records / 432 drug entries remain visible in **All Regimens (V1 Library)**. They are searchable but not used directly in patient calculations until structured migration, clinical review, golden testing, and approval.

## Rounding
Default nearest-10-mg behavior retains:
- 688 mg → 690 mg
- 682 mg → 680 mg
- 685 mg → 690 mg

The Rounding Policy Editor remains available as a browser-local override.
