# BHH Chemotherapy Calculator V3 — Dedicated Production Release

## Release status / clinical boundary

Production deploy uses a NEW Cloudflare Worker **`bhh-chemotherapy-v3-production`** at
`https://bhh-chemotherapy-v3-production.juipharm.workers.dev/`. It never overwrites
`bhh.juipharm.workers.dev`, the V2 GitHub Pages site or staging Worker/D1.

**Producing a live site does not independently certify chemotherapy regimens for treating patients.**
Each published regimen needs named clinical signoff, approved indication, route, dose,
days/cycle, references, adjustments and dose/rounding validation per hospital policy.
The 136 unreviewed legacy source entries remain **Reference Only**, not automatically
published as executable regimens. The 6 existing pilot regimens carry prior source
approval provenance; the hospital must validate their current suitability before
patient care.

## Public Calculator / author / independent approval

- Anonymous visitors can view original source references and **Published only** doses.
  No patient identifiers are stored by the application. Actual patient orders require
  independent clinical verification and hospital authorization.
- Named Editor: 10-digit individual PIN → Regimen Builder → Save Draft →
  re-confirm PIN → Submit Review.
- A different named Oncology Pharmacist with a different 10-digit PIN:
  Registry → Submitted → Start Clinical Review → clinical attestation and explanation →
  Approve & Publish. Server rejects self-approval, nonstructured/invalid regimens,
  unauthorized actions, and preserves immutable approval history.
- Production sessions use production-only HMAC pepper, one-hour Secure HttpOnly cookies,
  PIN attempt limits and separate D1 staff identity records. This workflow requires
  the hospital's IT security review of PIN-only internet exposure before clinical go-live.

## First-time one-click Production Cloudflare release (no PowerShell)

In GitHub → Settings → Secrets and variables → Actions, configure securely:

| Type | Name | Value |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | Existing validated scoped account token with Workers and D1 rights |
| Secret | `PRODUCTION_PASSWORD_PEPPER` | NEW unique random 40+ character secret, NEVER the Staging pepper |
| Secret | `PRODUCTION_EDITOR_PIN` | Unique 10-digit PIN for named editor (not Staging PIN) |
| Secret | `PRODUCTION_REVIEWER_PIN` | A different unique 10-digit PIN for a different pharmacist |
| Variable | `PRODUCTION_REVIEWER_EMAIL` | Named email of the second oncology pharmacist |
| Variable (later) | `PRODUCTION_D1_UUID` | **On second/subsequent deploys**, UUID printed from first production deploy (non-secret) |

Set `Environment: cloudflare-production` with **required human reviewers** under
GitHub → Settings → Environments for a separate approval gate. The GH Action uses
this named environment. The developer/runner never prints the secrets.

The existing GitHub Actions launcher `.github/workflows/v3-staging.yml`
on the default branch supports choosing another branch, and its
`approval` text input can specify `DEPLOY_PRODUCTION_ONLY`.
Open **Actions → Deploy V3 — Isolated Staging or Production → Run workflow**,
select **`production-v3-live`**, type exactly **`DEPLOY_PRODUCTION_ONLY`**,
enter **Editor's real email** in `editor_email`, then Run.

The first release: fail closed if any required operator identity or credential is missing;
complete clinical/technical regression suite; inspect Cloudflare D1 account;
create **`bhh-chemo-production`** in APAC *only if absent*;
resolve its UUID in runner's throwaway config; verify it is NOT the staging D1;
migrate this new database; deploy **only** Worker
`bhh-chemotherapy-v3-production`; set **PRODUCTION_PASSWORD_PEPPER**
as encrypted Worker secret; enroll both accountable staff identities; perform
live published-only, least-privilege and named PIN role smoke tests.

If the database exists, automatic migrations are **BLOCKED** until GitHub
Actions Variable `PRODUCTION_D1_UUID` matches the live UUID exactly. Record
the UUID from first deployment in that GitHub variable for future releases;
never overwrite or reuse any other database, including the staging D1.

## Status and important limitations

This document is an operational release workflow, not evidence that:
- the account already has Production secrets / clinical IT approval;
- Production has been deployed;
- any unreviewed regimen is safe to calculate;
- a hospital has authorized use of the software for patient prescriptions.

Live clinical release must include human UAT with dummy cases,
Oncology Pharmacy signoff, rollback plan, Workers resource/availability monitoring,
incident response, approved site accessibility and user training.

Reference guidelines: Cloudflare D1 creation and Wrangler migration:
https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/create/
https://developers.cloudflare.com/d1/reference/migrations/

## Synchronization between hospital computers

All computers use the **same central Cloudflare D1 Production database**. A Draft edit, approval, Publish or retirement increments the global `system_revision`; other open computers check every 10 seconds while visible, whenever browser focus returns, and before each Calculate. Published catalog and selected protocol are refreshed from the server, and Registry searches also update automatically. Changes made while another user is editing the *same* Draft are blocked by server-side `expectedRevision`/409 optimistic concurrency checks; the browser warns to reload the latest Draft rather than overwrite it. The calculator does not send patient measurement fields to any API.

**Offline:** cached Published data may be viewed but can **not be used for dose calculation** until a fresh online revision check succeeds. This prevents a retired or changed protocol from being calculated offline. A disconnected computer cannot receive updates until online. There is no per-PC installation or local database to synchronize.

Clinical content still requires named independent pharmacist review prior to Publish; administrative approval *reference-number variables* are not required by the deployment workflow. A successful automated test is not a hospital clinical signoff.
