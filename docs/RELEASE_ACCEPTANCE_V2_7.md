# Release acceptance — v2.7.0 release candidate

## Source and CI references
- Baseline: `a1e9d68`, PR [#5](https://github.com/JuiPharm/BHH_Chemotherapy_Calculator_V2/pull/5).
- PR CI: [Production Safety PR Verification](https://github.com/JuiPharm/BHH_Chemotherapy_Calculator_V2/actions).
- Quality gates execute 6+ distinct review dimensions using deterministic tests. This is NOT an independent human/AI sub-agent clinical approval.

## Six repeatable review dimensions
1. Clinical safety: 136 legacy records retained and excluded from automatic calculator readiness; only validated structured versions can calculate.
2. Reference UX: source and URL/text optional, internal hospital document labels accepted; malicious URL schemes are not rendered as clickable links.
3. PIN/authentication: legacy 1234 excluded, no browser PIN fallback, no credentials stored in LocalStorage/SessionStorage, API 401/503 fail closed.
4. Central publication: D1 published-only GET, versioned conflict detection, server-confirmed individual/batch approvals, audit trail for regimen write actions.
5. Prototype parity: Calculator, Library, Manager, guided multi-phase Builder/Clone/Save Draft/Export, Legacy Validator CSV, Rounding Policy, and Print/Export.
6. Real-browser UX + central safety: headless Chrome checks search, selected regimen gate, builder opening, and failed central API behaviour; global rounding is server-owned and versioned.

## Regression evidence at release candidate stage
- `node tests/production-smoke.mjs` — six structured pilot fixtures, 136 master files, unit rounding and clinical cap fixtures.
- `node tests/ckd-epi-2021.mjs` — five renal checks: NKF 2021 male/female formula branches, BSA indexation, legacy method parity, invalid SCr and Calvert de-indexation.
- `node tests/production-safety.mjs` — 12 security/schema/reference/D1 checks.
- `node tests/rounding-security.mjs` — 5 rounding/auth checks.
- `node tests/runtime-startup-static.mjs` — UI contract checks.
- `node tests/browser-production-flow.mjs` — 11 real Chrome user-flow assertions, including CKD-EPI indexed/de-indexed live preview, browser arithmetic and Cockcroft-Gault selection continuity.

## Production gate — not yet independently confirmed
- Cloudflare Pages actual deployment, Pages Functions bundling, APPROVE_PIN secret, REGIMENS_DB binding, D1 SQL migration, WAF PIN rate limiting, and D1 backup.
- Two-device live end-to-end Publish + synchronization + policy propagation.
- Identified BHH oncology pharmacist review and independent clinical verification of each pilot/regimen and locally authorized dose-rounding policy.
- Product-owner acceptance of mobile UI and workflow. Shared-PIN attribution remains generic unless supplemented by institutional identity controls.

**Do not merge this branch or use as a patient-care medication ordering source until these external checks are completed.** GitHub Pages remains the unchanged baseline while PR #5 is under review.

## CKD-EPI 2021 (Race-free) addition
- Adult SCr-based 2021 race-free method with IDMS-standardized creatinine; indexed eGFR (mL/min/1.73 m²) and BSA de-indexed eGFR (mL/min) displayed separately.
- Original CG/Measured GFR/Lab eGFR pathways retained. Method selection is explicit; CG default unchanged.
- Prominent warning: eviQ/ADDIKD Carboplatin clinical calculator uses CKD-EPI 2009 rather than 2021. The oncology team must verify protocol choice before patient dosing.
- Source equation and behavior: [CKD-EPI clinical notes](RENAL_CKD_EPI_2021.md).
