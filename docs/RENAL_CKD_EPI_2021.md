# CKD-EPI 2021 (Race-free) — Renal Calculation (v2.7.1)

## User workflow
In Calculator → **Kidney function method**, choose **CKD-EPI 2021 (Race-free) — คำนวณจาก SCr**.
Enter **adult age**, **sex (male/female)**, **height**, **weight**, and **IDMS-standardized serum creatinine (mg/dL)**.
The Renal panel displays immediately, before Calculate:

- **Indexed eGFR** in mL/min/1.73 m² — CKD-EPI 2021 creatinine race-free value.
- **De-indexed eGFR** in mL/min — indexed eGFR × patient's Mosteller BSA ÷ 1.73.
- The explicitly selected equation and an eviQ/ADDIKD caution for Carboplatin.

The de-indexed value (mL/min) is the GFR passed to the Calvert calculation **only if the pharmacist explicitly selects CKD-EPI 2021**; this does not change the default Cockcroft-Gault method or regimen-level protocol approval. **CKD-EPI 2021 is not the CKD-EPI 2009 formula used by eviQ/ADDIKD's Carboplatin calculator**, and replacing the renal equation may materially change the calculated dose. The software warning does not constitute oncology pharmacist approval. Prefer measured GFR in clinical scenarios specified by the protocol.

The existing Measured GFR, Cockcroft-Gault CrCl, and Lab-reported indexed eGFR (BSA-adjusted) methods remain available.

## Equation
NKF 2021 creatinine equation (adults):
`142 × min(SCr/κ,1)^α × max(SCr/κ,1)^−1.200 × 0.9938^age × (female ? 1.012 : 1)`.
- female: κ = 0.7, α = −0.241
- male: κ = 0.9, α = −0.302
- SCr: IDMS standardized, mg/dL
- no race variable

Calculations use full floating-point precision internally, displaying rounded values only.
Input constraints: age 18–120 years, positive creatinine, sex male/female, positive height/weight.

## References
- [National Kidney Foundation — CKD-EPI Creatinine Equation (2021)](https://www.kidney.org/ckd-epi-creatinine-equation-2021)
- [eviQ — Carboplatin Dose Calculator / ADDIKD methodology](https://www.eviq.org.au/clinical-resources/eviq-calculators/4171-carboplatin-dose-calculator)
- [eviQ — Assessing kidney function](https://www.eviq.org.au/pages/addikd-frequently-asked-questions/assessing-kidney-function)

## Verification
- Single shared runtime equation in `renal-equations.js`, used in browser `app.bundle.js` and test engine `dist/engine.js`.
- Golden cases: four NKF formula branches (male/female, below/above κ) and de-indexation.
- Regression tests: unchanged CG, measured GFR and lab indexed eGFR; invalid inputs; Carboplatin Calvert unit test; real browser renal preview.
- Entry point: `node tests/ckd-epi-2021.mjs`.
