// Security and clinical-validation contract for Cloudflare Pages Functions.
export function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
}
export function verifyPin(pin, env) {
  const configured = typeof env?.APPROVE_PIN === 'string' ? env.APPROVE_PIN.trim() : '';
  if (!configured || configured === '1234') return { status: 503, message: 'Secure APPROVE_PIN is not configured' };
  if (!pin || String(pin).trim() !== configured) return { status: 401, message: 'Invalid pharmacist PIN' };
  return null;
}
export function ensureDatabase(env) {
  if (!env?.REGIMENS_DB || typeof env.REGIMENS_DB.prepare !== 'function') {
    const err = Error('Missing D1 binding REGIMENS_DB'); err.code = 'NO_DB'; throw err;
  }
  return env.REGIMENS_DB;
}
const UNITS = new Set(['mg', 'mcg', 'g', 'IU']);
const BASES = new Set(['fixed', 'bsa', 'weight', 'auc']);
export function validateRegimen(r, publishing = true) {
  const errors = [], add = (field, reason) => errors.push({ field, reason });
  if (!r || typeof r !== 'object' || Array.isArray(r)) return [{ field: 'regimen', reason: 'Structured regimen object required' }];
  if (typeof r.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{2,120}$/.test(r.id)) add('id', 'Valid ID required');
  if (typeof r.name !== 'string' || !r.name.trim()) add('name', 'Name required');
  if (typeof r.indication !== 'string' || !r.indication.trim()) add('indication', 'Indication required');
  if (!publishing) return errors; // Drafts may be incomplete; publication is strictly validated.
  if (!Number.isInteger(r.cycleIntervalDays) || r.cycleIntervalDays < 1 || r.cycleIntervalDays > 365) add('cycleIntervalDays', 'Invalid interval');
  if (!Number.isInteger(r.cycleCount) || r.cycleCount < 1 || r.cycleCount > 200) add('cycleCount', 'Invalid cycle count');
  if (!Array.isArray(r.phases) || (publishing && !r.phases.length)) add('phases', 'Structured phases required');
  const orderIds = new Set();
  for (const [pi, phase] of (Array.isArray(r.phases) ? r.phases : []).entries()) {
    const pp = `phases[${pi}]`;
    if (!Number.isInteger(phase.cycleStart) || phase.cycleStart < 1 || !Number.isInteger(phase.cycleEnd) || phase.cycleEnd < phase.cycleStart || phase.cycleEnd > r.cycleCount) add(pp, 'Invalid phase range');
    if (!Array.isArray(phase.orders) || !phase.orders.length) add(pp+'.orders', 'Drug orders required');
    for (const [oi, order] of (Array.isArray(phase.orders) ? phase.orders : []).entries()) {
      const op = pp+'.orders['+oi+']';
      if (!order.id || orderIds.has(order.id)) add(op+'.id', 'Unique order ID required');
      orderIds.add(order.id);
      if (typeof order.drugName !== 'string' || !order.drugName.trim()) add(op+'.drugName', 'Drug name required');
      if (typeof order.route !== 'string' || !order.route.trim()) add(op+'.route', 'Route required');
      const dose = order.dose || {};
      if (!BASES.has(dose.basis) || !UNITS.has(dose.unit)) add(op+'.dose', 'Unknown dose basis/unit');
      if (Array.isArray(dose.options) && dose.options.length) {
        if (!dose.options.every(v=>Number.isFinite(v)&&v>0) || (dose.defaultOption!==undefined&&!dose.options.includes(dose.defaultOption))) add(op+'.dose.options', 'Invalid dose options');
      } else if (!Number.isFinite(dose.value) || dose.value <= 0) add(op+'.dose.value', 'Positive dose required');
      const days = order.schedule?.days;
      if (!Array.isArray(days) || !days.length || days.some(d=>!Number.isInteger(d)||d<1||d>r.cycleIntervalDays) || new Set(days).size!==days.length) add(op+'.schedule.days', 'Unique administration days within cycle required');
      const times = order.schedule?.administrationsPerDay;
      if (times!==undefined && (!Number.isInteger(times)||times<1||times>24)) add(op+'.schedule.administrationsPerDay','Invalid administrations/day');
      if (order.clinicalRules && !Array.isArray(order.clinicalRules)) add(op+'.clinicalRules','Invalid rules');
      for (const rule of Array.isArray(order.clinicalRules) ? order.clinicalRules : []) {
        if (rule.type==='hard_max' && (!Number.isFinite(rule.value)||rule.value<=0||!UNITS.has(rule.unit))) add(op+'.clinicalRules','Invalid hard maximum');
        if (!['hard_max','warning_threshold'].includes(rule.type)) add(op+'.clinicalRules','Unknown rule');
      }
    }
  }
  if (publishing && Array.isArray(r.phases) && r.phases.length && Number.isInteger(r.cycleCount) && r.cycleCount <= 200) {
    for (let c=1;c<=r.cycleCount;c++) {
      if (r.phases.filter(p=>c>=p.cycleStart&&c<=p.cycleEnd).length!==1) { add('phases', 'Each cycle must match exactly one phase'); break; }
    }
  }
  // Deliberately do not require references, URL, or external protocol ID.
  return errors;
}
