# Architecture and clinical boundaries

Browser → same-origin Access-protected Worker → D1. The browser downloads one compact catalog, loads detail when a version is selected, and calculates from that in-memory immutable published detail. No clinical write goes to GitHub or localStorage.

## API contract

| Route | Method | Role / behavior |
|---|---|---|
| /api/session | GET | Provisioned active user; D1-backed role |
| /api/revision | GET | Global write revision; no-store |
| /api/catalog | GET | Compact catalog; ETag; private revalidation |
| /api/registry | GET | All versions and governance metadata |
| /api/versions/:id | GET | Full definition, governance, history, ETag |
| /api/drafts | POST | Editor/reviewer/admin; clone or create new version |
| /api/versions/:id | PUT | Draft only, expectedRevision, reason |
| /api/versions/:id/submit | POST | Editor/reviewer/admin; validated structured document |
| /api/versions/:id/start-review | POST | Reviewer/admin; Submitted → Clinical Review Required |
| /api/versions/:id/approve | POST | Reviewer/admin, independent of creator/submitter |
| /api/versions/:id/request-revision | POST | Reviewer/admin; returns Draft |
| /api/versions/:id/reject | POST | Reviewer/admin; terminal Rejected |
| /api/versions/:id/publish | POST | Admin; Approved only; supersedes old active version |
| /api/versions/:id/retire | POST | Admin; Published only |
| /api/audit | GET | Admin; last 200 append-only events |

All writes require same-origin Origin and the application's request header; credentials and role assertions are not accepted from the production browser. Local test identities are accepted only in explicit local environment on loopback addresses. JWT tests cover signature, audience, issuer, expiry and missing identity; actual Google/Access login must be verified in staging.

## Persistence and concurrency

`regimen_versions.document` is the canonical clinical schema. `regimen_phases`, `regimen_drugs`, `regimen_rules`, `regimen_references` and `drug_rounding_policies` are per-version relational projections. They are saved in the same transactional D1 batch as the version and audit event. Domain tables have created/updated actor/time fields; transient optimistic operation guards are not clinical entities. Approval history and audit tables are append-only. Submitted/approved/published/retired definitions are frozen by DB triggers. A unique filtered index permits only one Published version per regimen.

Each write compares version revision and status using a CHECK-protected transaction guard. A concurrent loser aborts the complete batch (including projection and audit writes), returns 409, and must reload. New version numbering is unique per regimen. Publication retires the prior active version and updates catalog metadata in the same batch.

## Calculation

Strict enumerated JSON fields only; no expression evaluation, free-text extraction or `eval`. Known bases: fixed, bsa, weight, auc. Units: mg, g, IU. AUC is reserved for Carboplatin mg. Bleomycin must be IU. Mosteller retains full precision. Cockcroft-Gault uses entered actual weight and mg/dL creatinine, with female factor 0.85; measured GFR is mL/min, and indexed eGFR is de-indexed with BSA/1.73. No automatic SCr floor, adjusted weight, GFR125 cap or BSA cap is introduced.

Pipeline: entered patient + explicit cycle/approved dose option → base dose → approved protocol multipliers → hard min/max → clinical dose → approved per-order rounding → recommended dose. Rounding uses half-up; a candidate crossing a hard limit or exceeding a 5% difference retains the clinical dose and warns. Clinical modifications other than those enumerated require a new implemented/tested rule and a reviewed protocol version; unknowns block the calculation rather than being ignored.

Per-administration doses are displayed alongside administration days/frequency and infusion duration. No cumulative toxicity adjustment, organ-function dose modification, administration order verification or prescribing order export is inferred. Those require explicit additional governed protocols. The checkbox records verification only in the current screen; it is not a signed order or persisted patient record.

## Revision and offline behavior

- Memory detail cache is invalidated on any observed system revision change. Catalog ETag is available to external clients; this UI uses revision polling to avoid redundant full catalog reloads.
- Poll session/revision every 15 seconds. Calculation makes no D1/network query. It is blocked online if the last revision check is over 35 seconds old. The UI displays the last successful revision/time; this gives bounded freshness, not instantaneous retirement notification.
- A changed revision clears results and reloads the selected active version. Reconnection also clears offline results and revalidates from the central database even if revision number appears unchanged.
- IndexedDB stores only catalog entries and detail snapshots that were retrieved as Published. Details are cached on demand, so a never-loaded regimen is not available offline. No patient inputs or drafts are stored persistently.
- A versioned, content-hashed service-worker cache holds app shell/font/logo assets only. API requests never pass through service-worker cache. Local cached protocols are an explicitly marked availability snapshot, not the master database.
- Offline mode hides/disables authoring and governance actions and displays OFFLINE / CACHED PUBLISHED PROTOCOL plus saved version/publication date. Existing approved snapshot calculations work; there is no claim that an offline client can detect a central retirement.
- 401/403 are authorization failures, not offline availability failures: the client clears protocols and results rather than falling back. Published protocol snapshots do not contain PHI; availability while network is absent must still follow hospital shared-device policy.

## Import provenance

136 original source records / 432 drug entries remain unchanged in source-record JSON, with stable ordinal IDs. Six approved V2.1.0 definitions are separately imported with explicit prior-approval evidence and rounding policy provenance. There is no fuzzy name-based auto-merge. The conservative import classifier marks possible structural complexity, but never turns text into a calculable dose. In this input 19 are AUTO-STRUCTURABLE candidates, 117 require review, and 0 lack a dose enough to be BLOCKED. All 136 remain Draft regardless of classification.
