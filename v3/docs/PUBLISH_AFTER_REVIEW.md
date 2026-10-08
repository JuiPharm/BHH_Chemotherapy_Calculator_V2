# BHH Chemotherapy V3 — Published หลังทบทวนสูตรยา (Staging Workflow)

**Function implemented in staging source branch, NOT clinical Production release authorization.** A human must independently validate regimen clinical contents and references. Publishing status is distinct from formal hospital approval for patient administration.

## What changes status to Published

1. **Editor (named individual PIN)**: Manage / Review Regimen → Confirm PIN → Regimen Registry → Search regimen → **Edit Draft**. For one of 136 original text-only source records, press **Create editable drug rows (DOSES NOT FILLED)**. It copies drug names and unverified source text into blank entry rows; it NEVER assigns clinical dose or route. Independently enter and confirm all numeric doses, drug IDs/units, phases, days/cycle, route, hard limits, and **authoritative HTTPS Clinical Reference**. Save Draft. Repeat until structured schema validation passes. Then Submit Review, and enter Editor PIN a second time.
2. **Reviewer (a DIFFERENT named oncology pharmacist, with a DIFFERENT PIN)**: Enter the public app → Manage / Review Regimen → Confirm PIN → use the independently provisioned Reviewer PIN. A Reviewer PIN opens the **Regimen Registry** with Submitted entries filtered. Choose submitted entry → View → Start Clinical Review. Check indications, source, patient population, all drug doses/basis, units, preparation/infusion, renal adjustments, maximum limits and dose rounding. On required review stage, enter an accountable review comment, check the Clinical Attestation box and click **Approve & Publish**.
3. **System state transitions:** Draft → Submitted → Clinical Review Required → Approved → Published. The final two transitions are sent with server-side version checks; if the publication transaction fails, version stays Approved and Reviewer can retry **Publish**. Server only allows the separate verified reviewer identity to approve/publish on STAGING; writer cannot approve their own submission. Publish preserves reviewer provenance and audit and runs read-after-write structural/one-active-version verification.
4. **Immediately after success**, Registry version shows Published, and anonymous Calculator / Regimen dropdown selects the newly Published structured version. Reference-only status disappears for the original source once its clinically approved structured version is published. Verify original Protocol Dose and all computed/recommended doses independently before any patient treatment.

## First-time setup (GitHub web browser only)

The pre-existing GitHub secret `STAGING_EDITOR_PIN` is NOT a Reviewer PIN. Add:

- **Repository Actions Secret:** `STAGING_REVIEWER_PIN` = a fresh **different** 10-digit numerical PIN of the second oncology pharmacist. Never post this PIN in chat or GitHub files.
- **Repository Actions Variable:** `STAGING_REVIEWER_EMAIL` = the second oncology pharmacist's real named email, NOT the Editor email. Settings → Secrets and variables → Actions → **Variables** → New repository variable.
- GitHub → Actions → Deploy V3 Staging — Public Calculator and PIN Editor → Run workflow on branch `staging-internal-auth-v3`, Approval `DEPLOY_STAGING_ONLY`, and named `editor_email` for the Writer. This provisions two independent named identities (the Editor/Reviewer), not any Production credentials. The workflow executes prerelease CI including synthetic end-to-end Editor PIN Submit → distinct Reviewer PIN Approve/Publish → public Catalog verification.
- The Account editor/reader roles are verified against D1 on every request and can be revoked by hospital IT. Separate identities are essential for clinical accountability.

## Why not mass publish all 136 automatically

Source data `data/legacy-regimens.v1.json` includes 136 source-only definitions and 432 drug entries. These imported entries have empty `phases` and `references` fields, so they do **not** define executable treatment orders. A status update alone would create unvalidated doses. The completed structural risk review is `v3/docs/LEGACY_136_CLINICAL_REVIEW.md`, with 117 REVIEW REQUIRED and 19 text entries automatically identified as simple enough to structure — both groups still need a pharmacist's independent clinical verification. The app presents all original sources as **Reference only** until individually reviewed and published.

## If Publish is unavailable

- Editor PIN only: submit/modify Draft but **cannot** Approve/Publish. Reviewer PIN secret and named account must be provisioned separately.
- Reviewer account not visible: confirm GitHub Variable `STAGING_REVIEWER_EMAIL` and Secret `STAGING_REVIEWER_PIN`, then complete the staging-only Deploy workflow; login PIN can only be used after provisioning.
- Submit blocked: fill every required structured field, include HTTPS source reference(s), resolve dose and unit constraints.
- Reviewer can't approve own Draft: ask a different named oncology pharmacist to review.
- Version Approved but not Published: Reviewer can open it and click Publish with a new reason; no auto-dosing until actual Published state.
- This is STAGING; moving to clinical Production additionally requires hospital Oncology Pharmacy signoff, security review and separate explicit approval.

No secret, real patient data, or clinician password belongs in this document.
