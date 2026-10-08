// National Kidney Foundation 2021 CKD-EPI creatinine equation, no race coefficient.
// Scr: IDMS-standardized mg/dL; eGFR indexed to 1.73 m².
(function(root) {
  'use strict';
  function ckdEpi2021Indexed({ageYears,sex,serumCreatinineMgDl}) {
    if (!Number.isFinite(ageYears) || ageYears < 18 || ageYears > 120)
      throw Error('CKD-EPI 2021 creatinine equation requires adult age (18–120 years)');
    if (sex !== 'female' && sex !== 'male')
      throw Error('Sex (female or male) is required for CKD-EPI 2021');
    if (!Number.isFinite(serumCreatinineMgDl) || serumCreatinineMgDl <= 0)
      throw Error('Positive IDMS-standardized serum creatinine (mg/dL) is required');
    const female=sex==='female',k=female?0.7:0.9,alpha=female?-0.241:-0.302;
    const ratio=serumCreatinineMgDl/k;
    return 142 * (Math.min(ratio,1)**alpha) * (Math.max(ratio,1)**-1.2) * (0.9938**ageYears) * (female?1.012:1);
  }
  function deindexEgfr(indexedEgfr,bsaM2) {
    if (!Number.isFinite(indexedEgfr) || indexedEgfr<=0 ||
        !Number.isFinite(bsaM2) || bsaM2<=0) throw Error('Indexed eGFR and BSA must be positive');
    return indexedEgfr*bsaM2/1.73;
  }
  function ckdEpi2021WithBsa(patient,bsaM2) {
    const indexedEgfr=ckdEpi2021Indexed(patient);
    return {
      indexedEgfr,
      deindexedEgfr:deindexEgfr(indexedEgfr,bsaM2),
      equation:'CKD-EPI 2021 creatinine (race-free)',
      source:'https://www.kidney.org/ckd-epi-creatinine-equation-2021'
    };
  }
  root.BHH_RENAL=Object.freeze({ckdEpi2021Indexed,deindexEgfr,ckdEpi2021WithBsa});
})(globalThis);
