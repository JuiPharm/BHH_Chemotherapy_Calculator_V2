# Production readiness report — V3 3.0.0-rc.1

Date: 7 October 2026. Baseline V2 main commit: `c085426c9853dc733f7d9d2988f3170285a8d96a`.

**Result: local production candidate verified; Cloudflare staging authorization and real-account UAT are pending. Do not label this as clinically released production and do not merge into main yet.**

## Delivered

Worker API, D1 migrations/import, Access JWT verification, four D1 roles, independent approval workflow, immutable clinical versions, Library/Registry/Builder, typeahead search, patient validation, clinical calculation, drug/protocol rounding allowlists, audit history, version/revision invalidation, offline Published snapshots, CI validation/staging template and deployment/runbook.

Source input preserved: 136 original regimens and 432 drug entries. Six preapproved pilot definitions are retained as distinct protocols. Initial catalog: 142 records. Original-record classification: 19 AUTO-STRUCTURABLE candidates, 117 REVIEW REQUIRED, 0 BLOCKED; all 136 original records remain calculation-disabled Drafts. No free-text parser creates clinical doses.

## Executed QA

| Suite | Executed environment | Result |
|---|---|---|
| V2 existing smoke and runtime contract | Node.js 24 | Both passed; active pilots 6, original master 136, schema errors 0 |
| Unit, golden calculation, auth and SQLite migration tests | Node.js 24; built-in SQLite; signed JWT/JWKS fixtures | 31 tests passed |
| Worker/D1 API integration | Actual Wrangler local Worker + isolated local D1, all migrations | 42 assertions passed; includes independent approval, role denial, audit, revision and concurrent writes |
| Browser UAT | Real Linux headless Chromium + actual local Worker/D1 | 3 scenario tests passed: clinical calculator; four-user review/publish + second client; offline/reload/reconnect + mobile |
| Runtime console | Browser pageerror and console.error listeners during connected calculator and full workflow | No errors in these normal connected UAT scenarios |
| Network/API | Real browser and Worker API assertions | Successful central loads/writes and expected denial/conflict statuses; no frontend mock API |
| D1 integrity | Fresh SQLite migrations and real local D1 migrations | 142 seeded records, 136 retained sources, 432 source entries, 6 Published, foreign-key integrity passed |
| Visual inspection | Saved desktop calculation and responsive mobile screenshots | Pastel dose columns and BHH logo checked; Thai font bundled to avoid missing glyphs |

Critical golden checks passed: 688→690, 682→680, 685→690; Vincristine hard max 2 mg; Bleomycin IU; Carboplatin AUC6 with GFR90→690 mg; GFR160 remains uncapped; adult pediatric guard; unknown expression/rule/unit mismatch block; loading/maintenance phases; indexed eGFR; protocol multiplier before hard caps; post-rounding cap protection.

Browser workflow exercised actual UI controls: blank patient inputs, required fields, default Cockcroft-Gault, cancer filter and autocomplete, original 136-regimen availability, Registry, Clone, structured Builder save, Submit, independent Review/Approve, admin Publish, revision refresh on a second browser context, rounding selection, pastel results, reload consistency, offline cached calculation and disabled writes.

During UAT, reconnect initially left an offline calculation visible when the revision number stayed unchanged. This was fixed: reconnect always invalidates results and re-fetches the active protocol. Multi-context testing also required removing single-process Chromium flags; this was a QA harness setting, not an application workaround.

## Remaining deployment gates

1. Cloudflare account authorization, separate staging/production D1 IDs, custom hostnames, actual Access team domain/audiences and Google identity provider setup.
2. Provision named real users and verify Access/Google login, session expiry and role enforcement end-to-end in that account.
3. Repeat the requirement matrix against deployed staging: two real clients, actual remote D1, JWT headers, cache/offline, audit and protocol workflow.
4. Hospital clinical/IT release sign-off: validate preserved pilot source approval provenance, original reviewer/publication time when available, operational rounding policy, offline use and backup/incident ownership.

Items 1–3 require account access and cannot be replaced by local tests. This candidate is not deployed to Cloudflare and no remote Google login claim is made. All 136 unstructured source records remain review-gated; no automatic publication occurs.

## Deliberate boundaries

- Existing pilot rounding defaults are preserved, with No rounding allowed. Nearest 5 mg is implemented and can be proposed in the Builder, but is not silently added to existing clinical approvals. The global selector filters by the selected phase's permitted drug policies.
- Imported prior approval uses the explicit `v2-approved-import` actor. It is an import provenance actor, not an invented oncology pharmacist signature. Original named reviewer/exact publication time were unavailable; only the recorded V2 review/effective dates are retained; exact time is not fabricated.
- Offline caches are on demand: only previously opened Published details can be calculated. A retired protocol cannot be discovered by a disconnected client; banner and pharmacist verification are mandatory.
- No patient data is persisted; no EHR, prescribing order, treatment plan, cumulative exposure or toxicity decision is generated.
- GitHub remains source/CI only. Root V2 files are preserved for history and do not become the V3 clinical master.
