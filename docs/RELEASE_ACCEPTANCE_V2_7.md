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
- `node tests/production-safety.mjs` — 12 security/schema/reference/D1 checks.
- `node tests/rounding-security.mjs` — 5 rounding/auth checks.
- `node tests/runtime-startup-static.mjs` — UI contract checks.
- `node tests/browser-production-flow.mjs` — 8 real Chrome user-flow assertions.

## Production gate — not yet independently confirmed
- Cloudflare Pages actual deployment, Pages Functions bundling, APPROVE_PIN secret, REGIMENS_DB binding, D1 SQL migration, WAF PIN rate limiting, and D1 backup.
- Two-device live end-to-end Publish + synchronization + policy propagation.
- Identified BHH oncology pharmacist review and independent clinical verification of each pilot/regimen and locally authorized dose-rounding policy.
- Product-owner acceptance of mobile UI and workflow. Shared-PIN attribution remains generic unless supplemented by institutional identity controls.

**Do not merge this branch or use as a patient-care medication ordering source until these external checks are completed.** GitHub Pages remains the unchanged baseline while PR #5 is under review.
