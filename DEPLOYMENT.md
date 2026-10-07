# Deployment — new GitHub repository

Recommended repository name: `BHH_Chemotherapy_Calculator_V2`

## One-time GitHub setup

1. Create a **new** GitHub repository. Do not overwrite the legacy `Chemotherapy_Calculator` repository.
2. Upload/push the contents of this folder to the repository root on branch `main`.
3. Open **Settings → Pages**.
4. Under **Build and deployment → Source**, select **GitHub Actions**.
5. Open **Actions** and confirm `Validate and Deploy GitHub Pages` passes.
6. The deployed URL appears in the deployment job and in **Settings → Pages**.

The included workflow validates the structured regimen registry and critical dose-engine behaviors before deploying. If validation fails, deployment is blocked.

## Clinical release gate

A successful GitHub Pages deployment means the **software deployment** passed. It does not by itself approve the clinical dataset.

Before patient-care use, BHH Oncology Pharmacy/PTC should approve:

- each regimen/version;
- local Carboplatin kidney-function policy;
- drug/protocol-specific dose rounding;
- hard maximum/minimum rules;
- renal/hepatic/hematologic/toxicity modification rules;
- adult/pediatric scope;
- local formulations and unit semantics;
- signed golden test cases.

The current registry intentionally retains `localApproval: true` for the included pilot records.
