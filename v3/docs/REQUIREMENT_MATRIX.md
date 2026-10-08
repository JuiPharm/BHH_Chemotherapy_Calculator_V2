# Requirement verification matrix — V3 candidate

“PASS local” means executed in local Worker/D1/Chromium, not deployed Cloudflare. Remote gates explicitly remain PENDING ACCOUNT / STAGING. Evidence files are provided in the release QA archive; test commands are in v3/README.md.

| Requirement | Implemented? | Tested? | Result / evidence |
|---|---|---|---|
| Cloudflare Static Assets + Worker + D1 | Yes | Actual local runtime | PASS local; remote PENDING ACCOUNT |
| Dedicated staging/production databases | Config + deploy guard | Guard rejects placeholders, same IDs and local auth | PENDING real account IDs |
| Responsive clinical UI / BDMS theme / existing BHH logo | Yes | Desktop + 390px browser; visual screenshots | PASS local |
| Central clinical master, no GitHub/localStorage editor | Yes | Source review + real central CRUD | PASS local |
| Four roles | Yes | API denials, four browser identities | PASS local |
| Staging internal password + TOTP | JWT code unchanged; OTP runbook/hosting guard updated | JWT fixture and deploy guard local tests | JWT crypto baseline PASS; deploy guard local tests PASS; real password+TOTP login PENDING STAGING |
| All required D1 domain tables | Yes | Migration tests, schema inspection | PASS local |
| All writes include domain actor/time + audit | Yes | Schema, API audit before/after | PASS local; real user provisioning must include audit |
| Draft/Submitted/Clinical Review Required/Approved/Published/Retired | Yes | API + browser transitions | PASS local |
| Approve / request revision / reject via web/API | Yes | Browser approve; API revision/reject | PASS local |
| Independent oncology reviewer | Yes | Creator/submitter/admin self-approval denied | PASS local |
| Approval actor/time/comment/source/previous version | Yes | API provenance/history assertions | PASS local; prior V2 identity absence explicitly documented |
| Approved/Published definition cannot be overwritten | Yes | DB trigger + API negative test | PASS local |
| Edit approved/published creates new version | Yes | API new-version / supersession | PASS local |
| Only one active Published per regimen | Yes | Unique index + API transactional publish | PASS local |
| All Regimens Library | Yes | Browser search/cancer/status/view/clone | PASS local |
| Preserve all 136 original records / 432 drug entries | Yes | Source assertions + D1/SQLite counts | PASS local; six pilots separate, 142 total |
| Registry metadata and permission actions | Yes | Four-user browser workflow + API | PASS local |
| Builder structural phases/drugs/doses/schedules/rules/references | Yes | Clone/edit/save/submit via browser; schema validation | PASS local |
| Original unstructured source can be viewed/cloned/edited | Yes | Source retained; original Library available | PASS local; calculation remains gated |
| Autocomplete searches regimen, indication, cancer, drug, aliases | Yes | Browser typeahead / source review | PASS local |
| Cancer Type → Search Regimen | Yes | Browser cancer selection/typeahead | PASS local |
| Compact catalog; detail fetched only on selection | Yes | Worker routes + browser network | PASS local |
| Client-side calculation; no D1 query on Calculate | Yes | Engine module and browser result | PASS local |
| Memory cache + ETag + system_revision | Yes | API ETag304 / second client | PASS local |
| No silent stale selection after observed publish change | Yes | Second client poll invalidates/reloads | PASS local; 15s poll and 35s freshness gate documented |
| Fixed dose / mg/m² / g/m² / mg/kg / IU / IU/m² / AUC | Yes | Golden tests | PASS local |
| Mosteller full internal precision | Yes | Golden test | PASS local |
| Calvert with explicit kidney method, Cockcroft default | Yes | Engine golden + browser default | PASS local |
| No hidden universal GFR125 cap | Yes | GFR160 dose1110 mg golden | PASS local |
| Protocol modifications before hard min/max before rounding | Yes | Multiplier/limit order golden | PASS local |
| Unknown clinical rule / expression fails closed | Yes | Engine + server API negative tests | PASS local |
| Rounding 688→690 / 682→680 / 685→690 half-up | Yes | Golden tests | PASS local |
| Nearest1/5/10mg, No rounding, Drug-specific | Yes | Engine all five, browser selector | PASS local; policies shown only if approved for all active orders |
| Filter rounding by drug/protocol allowed policy | Yes | Disallowed-policy + IU tests | PASS local |
| Calculated/Clinical/Recommended/Difference amount/% together | Yes | Browser pastel result table | PASS local |
| Vincristine hard max 2mg before rounding | Yes | Golden test | PASS local |
| Rounding cannot exceed hard maximum | Yes | Boundary golden | PASS local |
| Bleomycin remains IU | Yes | ABVD/BEP golden | PASS local |
| Patient fields start blank | Yes | Browser all numeric fields + sex | PASS local |
| Required age/sex/height/weight/cycle/regimen/cancer/kidney method | Yes | Engine + native browser validation | PASS local |
| Kidney value required only when protocol/cycle needs it | Yes | UI selected phase + engine tests | PASS local |
| Adult regimen pediatric guard | Yes | Golden test | PASS local |
| No architecture slogan / safety panel / GitHub Edit button | Yes | V3 UI source inspection | PASS local; LOCAL TEST identity only on local simulator |
| Pastel accessible result colors | Yes | Browser computed color + visual screenshots | PASS local |
| Last Published snapshot offline, clear version/date banner | Yes | Service worker + IndexedDB + offline browser | PASS local, previously loaded protocols only |
| Offline cannot edit/review/approve/publish | Yes | Browser disabled control + API transport separation | PASS local |
| Reconnection clears old offline result and revalidates | Yes | Browser offline/reconnect regression | PASS local |
| Audit immutable previous/new/action/user/time/reason/version | Yes | API audit checks + DB append-only tests | PASS local |
| Import classification AUTO-STRUCTURABLE / REVIEW REQUIRED / BLOCKED | Yes | Classifier/migration assertions | PASS: 19/117/0 for source input; no inferred doses |
| Range/AUC/g/IU/loading/maintenance/per-day/infusion/max/duplicates/multi-phase review flags | Yes | Import report + conservative classifier | PASS; all flagged originals remain draft |
| Unknown/ambiguous originals never auto-published | Yes | Exactly six Published on fresh D1 | PASS local |
| Wrangler config / migrations / seed/import / API / build | Yes | Actual local deployment and deterministic build | PASS local |
| CI/CD and one-time deployment instructions | Yes | Files + updated staging guard; existing V2 checks | Code changes staged on branch; remote CI and actual OTP Access policy must be verified |
| Unit / integration / migration / API / golden / frontend tests | Yes | 31 unit/migration/auth + 42 API + 3 browser suites | PASS local |
| Two clients see new Published version and consistent reload | Yes | API + separate browser contexts | PASS local; real remote clients PENDING STAGING |
| Browser console/network/API/D1/workflow checked | Yes | Real browser/runtime logs and tests | PASS local |
| Cloudflare staging deployed and password+TOTP sign-in exercised | OTP/Worker/D1 templates ready | Cannot execute without account auth | PENDING ACCOUNT; NOT deployed or clinically approved |
| Merge main only after all release gates pass | Branch isolated | main untouched | NOT MERGED; staging/account gates pending |

**Staging internal-auth review (8 October 2026):** Isolated branch implements salted PBKDF2, RFC6238 TOTP replay protection, opaque D1-backed HttpOnly sessions, rate limiting and authenticated assets; source/tests added. These are **unverified for remote Workers Free and staging D1** until new CI plus real staged UAT; production Cloudflare Access is unchanged. See [STAGING_INTERNAL_LOGIN.md](STAGING_INTERNAL_LOGIN.md).
