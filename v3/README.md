# BHH Chemotherapy Calculator V3 — 3.0.0-rc.1

Cloudflare Worker + D1 + Static Assets clinical release candidate. V2 history and source files remain preserved at repository root. V3 serves only `v3/public`; it does not expose a GitHub editor, GitHub clinical JSON endpoint, localStorage master database or browser credentials.

## Start a local test (Node.js 24 LTS; Python not required)

From the repository root:

```sh
npm ci
npm run build:v3
npm run setup:local:v3
npm run dev:v3
```

Open the URL printed by Wrangler. This candidate requires a Worker/D1 server; opening the HTML file directly cannot test central approval or authentication. In **local mode only**, use the LOCAL TEST identity selector for calculator/editor/reviewer/admin. No real patient identifiers are collected or persisted.

## Tests

```sh
npm test
npm run test:v3
npm run test:api:v3
npm run test:browser:v3
```

The API and browser runners create independent temporary D1 databases, apply all migrations and local test users, start the actual local Worker, and clean up after testing. Chromium automation uses a bundled Linux headless Chromium; run the full browser suite on Linux or GitHub Actions. Normal app operation supports Windows/macOS browsers. Screenshots and Worker logs are written to `v3/test-results`; Playwright's output uses the config-relative output directory.

## Data and governance

- Preserve all 136 original records / 432 original drug entries as searchable draft source records.
- Import the six preapproved V2 pilot definitions separately, avoiding false mappings (e.g. FOLFOX-4 is not mFOLFOX6; R-CHOP may refer to adult/pediatric variants).
- Initial compact catalog has 142 entries; only six are calculation-enabled.
- Import classification: 19 AUTO-STRUCTURABLE candidates and 117 REVIEW REQUIRED, 0 BLOCKED in this particular input. AUTO-STRUCTURABLE is only a conservative lexical flag: no numeric clinical definition is guessed or published from text. All 136 originals require authoring, submission, independent review and publication before calculation.
- Prior approval import explicitly records V2 provenance and the absence of a named original reviewer. It does not invent a clinician or claim new V3 approval.
- Draft → Submitted → Clinical Review Required → Approved → Published → Retired. Review can return to draft or reject. The reviewer must differ from the creator and submitter, including admin users.
- Submitted definitions are frozen while under review. Approved/Published versions require a new version for changes. Publication atomically supersedes the prior active version.
- The canonical JSON clinical document and its normalized phases/drugs/rules/references/policies are stored in D1. Projection writes and audit events occur in the same D1 batch; optimistic revision guards reject concurrent writes.
- Rounding policies are approved per order/version. Existing pilots retain their recorded default + No rounding; authors may propose nearest 1/5/10 mg for review. Global choices are the intersection of the selected phase's allowlists. IU/g protocols do not receive mg rounding.
- Unknown clinical fields, dose bases and rules fail closed. All dose values and schedules are explicit and finite.

Read [DEPLOYMENT.md](docs/DEPLOYMENT.md), [READINESS.md](docs/READINESS.md), [REQUIREMENT_MATRIX.md](docs/REQUIREMENT_MATRIX.md), [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [import-report.json](docs/import-report.json).
