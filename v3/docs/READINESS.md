# Production readiness report — V3 3.0.0-rc.1

Baseline verification date: 7 October 2026. Historical staging OTP configuration: 8 October 2026. Internal login proposal: 8 October 2026 (unverified staging candidate). Baseline V2 main commit: `c085426c9853dc733f7d9d2988f3170285a8d96a`.

**Result: local production candidate verified; Cloudflare staging authorization and real-account UAT are pending. Do not label this as clinically released production and do not merge into main yet.**

## Delivered

Worker API, D1 migrations/import, IdP-neutral Access JWT verification, four D1 roles, independent approval workflow, immutable clinical versions, Library/Registry/Builder, typeahead search, patient validation, clinical calculation, drug/protocol rounding allowlists, audit history, version/revision invalidation, offline Published snapshots, CI validation/staging template and deployment/runbook.

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

The reviewer screen displays explicit population, cycle interval/count, administration frequency, numeric hard limits, protocol multipliers and allowed/default rounding policies. Browser assertions verify review metadata and Vincristine hard maximum/recommended 2 mg.

During UAT, reconnect initially left an offline calculation visible when the revision number stayed unchanged. This was fixed: reconnect always invalidates results and re-fetches the active protocol. Multi-context testing also required removing single-process Chromium flags; this was a QA harness setting, not an application workaround.

## Staging identity amendment (8 October 2026)

Cloudflare Access **One-time PIN via approved email addresses** replaces Google Login for staging; no Google Cloud Console is needed. Wrangler staging permits a dedicated workers.dev hostname behind Cloudflare Access while root production remains workers_dev=false and custom-domain-only. The deployment guard has four dedicated local configuration test cases. See [STAGING_OTP.md](STAGING_OTP.md). The previously recorded 31 unit, 42 API and 3 Chromium local results are historical baseline results, **not re-execution evidence for these amendments**.

## Unverified staging authentication branch

The isolated branch `staging-internal-auth-v3` changes **staging only** from Cloudflare Access email OTP to D1-managed passwords + TOTP, opaque HttpOnly session cookies, rate limits and separate auth-event logs. Production retains the original Cloudflare Access JWT verification. See [STAGING_INTERNAL_LOGIN.md](STAGING_INTERNAL_LOGIN.md). CI results for this new branch must be separately collected; previous 31/42/3 test results refer to earlier code and must not be copied forward as proof of this authentication change. Staging and Production have **not** been deployed by this task.

## Staging Workers Free and dependency hardening (8 October 2026)

- Operator-provided Cloudflare account context: account ID `3229fd47f39f8ca1809f92d4282b5ab5`; staging D1 UUID `3d936db6-eed1-4880-9561-1f22101cb27e`. These are configuration identifiers, **not** proof of a remote DB connection or domain; Workers subdomain remains unknown.
- Original staging server PBKDF2 (600,000 iterations) risked exceeding Cloudflare Workers Free's **10ms/request CPU** allowance. Proposed mitigation: PBKDF2 remains at 600,000 iterations in the browser; staging Worker verifies a peppered SHA-256 HMAC of the client prehash with required `STAGING_PASSWORD_PEPPER` Worker Secret and the existing independent TOTP factor. This design avoids server-side high-cost password stretching but must be security-reviewed because the client prehash is password-equivalent and remote CPU usage is unverified.
- The `wrangler → miniflare → sharp` development dependency inherited **CVE-2026-96889** affecting `sharp <0.35.5`. This branch pins an override and regenerated lockfile to `sharp 0.35.5` and upgraded prebuilt libvips packages. The CI lockfile regeneration job reported **0 vulnerabilities**; ongoing CI now fails on npm audit High/Critical. This does not guarantee freedom from all vulnerabilities.
- Main V2, original V3 Production Access authentication and production D1 placeholders have not been deployed or changed by this work. No remote D1 migrations, credential provisioning, Cloudflare secrets, Workers subdomain, or real user login are verified.
- **BLOCKED pending:** independent authentication/security review, real Workers Free per-request CPU measurement on actual staging (error 1102/Exceeded CPU), TOTP enrolment, negative UAT and documented hospital IT/clinical approval. Use only synthetic patient data.

## Remaining deployment gates

1. Cloudflare account authorization and staging D1 ID, exact staging workers.dev hostname, named password+TOTP tester provisioning, verified TOTP enrollment and distinct production custom domain/Access identity decision.
2. Provision named staging users and verify password/TOTP login, replay resistance, session expiry, brute-force throttling and role enforcement end-to-end against staging D1.
3. Repeat the requirement matrix against deployed staging: two real clients, actual remote D1, JWT headers, cache/offline, audit and protocol workflow.
4. Hospital clinical/IT release sign-off: validate preserved pilot source approval provenance, original reviewer/publication time when available, operational rounding policy, offline use and backup/incident ownership.

Items 1–3 require account access and cannot be replaced by local tests. No remote staging deployment, TOTP login or clinical clearance is claimed by this document. Staging OTP setup does not constitute production identity approval. All 136 unstructured source records remain review-gated; no automatic publication occurs.

## Deliberate boundaries

- Existing pilot rounding defaults are preserved, with No rounding allowed. Nearest 5 mg is implemented and can be proposed in the Builder, but is not silently added to existing clinical approvals. The global selector filters by the selected phase's permitted drug policies.
- Imported prior approval uses the explicit `v2-approved-import` actor. It is an import provenance actor, not an invented oncology pharmacist signature. Original named reviewer/exact publication time were unavailable; only the recorded V2 review/effective dates are retained; exact time is not fabricated.
- Offline caches are on demand: only previously opened Published details can be calculated. A retired protocol cannot be discovered by a disconnected client; banner and pharmacist verification are mandatory.
- No patient data is persisted; no EHR, prescribing order, treatment plan, cumulative exposure or toxicity decision is generated.
- GitHub remains source/CI only. Root V2 files are preserved for history and do not become the V3 clinical master.
