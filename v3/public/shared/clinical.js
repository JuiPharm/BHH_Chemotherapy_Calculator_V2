// Structured clinical definitions only. Never evaluate free text or executable expressions.
export const policies = {
  NO_ROUND: { id: 'NO_ROUND', label: 'No rounding', increment: 0 },
  BHH_NEAREST_1MG_DEFAULT: {
    id: 'BHH_NEAREST_1MG_DEFAULT',
    label: 'Nearest 1 mg',
    increment: 1,
  },
  BHH_NEAREST_5MG_DEFAULT: {
    id: 'BHH_NEAREST_5MG_DEFAULT',
    label: 'Nearest 5 mg',
    increment: 5,
  },
  BHH_NEAREST_10MG_DEFAULT: {
    id: 'BHH_NEAREST_10MG_DEFAULT',
    label: 'Nearest 10 mg',
    increment: 10,
  },
};
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
const positive = (x) => finite(x) && x > 0;
const fail = (m) => {
  throw new Error(m);
};
const known = (o, keys, path) => {
  if (!o || typeof o !== 'object' || Array.isArray(o))
    fail(`${path}: object required`);
  for (const k of Object.keys(o))
    if (!keys.includes(k)) fail(`${path}: unsupported field ${k}`);
};
export function validateDefinition(r) {
  known(
    r,
    [
      'id',
      'version',
      'name',
      'cancerGroup',
      'indication',
      'setting',
      'intent',
      'population',
      'cycleIntervalDays',
      'cycleCount',
      'status',
      'localApproval',
      'effectiveDate',
      'lastReviewed',
      'references',
      'clinicalNotes',
      'phases',
      'alias',
      'sourceRecord',
    ],
    'regimen',
  );
  for (const k of ['id', 'name', 'cancerGroup', 'indication'])
    if (typeof r[k] !== 'string' || !r[k].trim() || r[k].length > 1000)
      fail(`${k} required`);
  if (!['adult', 'pediatric'].includes(r.population))
    fail('Explicit adult/pediatric population required');
  for (const k of ['cycleIntervalDays', 'cycleCount'])
    if (!Number.isInteger(r[k]) || r[k] < 1 || r[k] > 1000)
      fail(`${k} must be a positive integer`);
  if (!Array.isArray(r.references) || !r.references.length)
    fail('Clinical reference required');
  for (const x of r.references) {
    known(x, ['label', 'url', 'accessedDate'], 'reference');
    if (!x.label || typeof x.url !== 'string' || !/^https:\/\//.test(x.url))
      fail('HTTPS clinical reference required');
  }
  if (!Array.isArray(r.phases) || !r.phases.length)
    fail('Structured phases required');
  const ids = new Set(),
    ranges = [];
  for (const p of r.phases) {
    known(p, ['id', 'name', 'cycleStart', 'cycleEnd', 'orders'], 'phase');
    if (
      !p.id ||
      !p.name ||
      !Number.isInteger(p.cycleStart) ||
      !Number.isInteger(p.cycleEnd) ||
      p.cycleStart < 1 ||
      p.cycleEnd < p.cycleStart ||
      p.cycleEnd > r.cycleCount
    )
      fail('Invalid phase cycle range');
    if (ranges.some(([a, b]) => p.cycleStart <= b && p.cycleEnd >= a))
      fail('Overlapping phases');
    ranges.push([p.cycleStart, p.cycleEnd]);
    if (!Array.isArray(p.orders) || !p.orders.length)
      fail('Phase drug orders required');
    for (const o of p.orders) {
      known(
        o,
        [
          'id',
          'drugId',
          'drugName',
          'dose',
          'route',
          'schedule',
          'roundingProfileId',
          'allowedRoundingPolicies',
          'clinicalRules',
          'notes',
        ],
        'order',
      );
      if (!o.id || ids.has(o.id) || !o.drugId || !o.drugName || !o.route)
        fail('Unique order id, drug and route required');
      ids.add(o.id);
      known(
        o.dose,
        [
          'basis',
          'value',
          'unit',
          'displayDenominator',
          'options',
          'defaultOption',
        ],
        'dose',
      );
      if (!['fixed', 'bsa', 'weight', 'auc'].includes(o.dose.basis))
        fail('Unknown dose expression');
      if (!['mg', 'g', 'IU'].includes(o.dose.unit)) fail('Unknown dose unit');
      if (
        o.dose.basis === 'auc' &&
        (o.dose.unit !== 'mg' || o.drugId !== 'carboplatin')
      )
        fail('AUC is restricted to Carboplatin mg');
      if (o.drugId === 'bleomycin' && o.dose.unit !== 'IU')
        fail('Bleomycin must remain IU');
      if (o.dose.options !== undefined) {
        if (
          !Array.isArray(o.dose.options) ||
          !o.dose.options.length ||
          !o.dose.options.every(positive) ||
          o.dose.value !== undefined
        )
          fail('Invalid explicit dose options');
        if (
          o.dose.defaultOption !== undefined &&
          !o.dose.options.includes(o.dose.defaultOption)
        )
          fail('Invalid default option');
      } else if (!positive(o.dose.value))
        fail('Positive numeric dose required');
      known(
        o.schedule,
        [
          'days',
          'administrationsPerDay',
          'continuousInfusionHours',
          'infusionMinutes',
          'note',
        ],
        'schedule',
      );
      if (
        !Array.isArray(o.schedule.days) ||
        !o.schedule.days.length ||
        o.schedule.days.some(
          (d) => !Number.isInteger(d) || d < 1 || d > r.cycleIntervalDays,
        ) ||
        new Set(o.schedule.days).size !== o.schedule.days.length
      )
        fail('Invalid administration days');
      for (const k of [
        'administrationsPerDay',
        'continuousInfusionHours',
        'infusionMinutes',
      ])
        if (o.schedule[k] !== undefined && !positive(o.schedule[k]))
          fail('Invalid schedule frequency/duration');
      if (
        o.schedule.administrationsPerDay !== undefined &&
        !Number.isInteger(o.schedule.administrationsPerDay)
      )
        fail('Administrations per day must be integer');
      if (o.schedule.continuousInfusionHours && o.schedule.infusionMinutes)
        fail('Conflicting infusion duration');
      if (o.schedule.continuousInfusionHours > r.cycleIntervalDays * 24)
        fail('Infusion exceeds cycle');
      if (
        !Array.isArray(o.allowedRoundingPolicies) ||
        !o.allowedRoundingPolicies.length ||
        !o.allowedRoundingPolicies.every((x) => policies[x])
      )
        fail('Approved rounding policy allowlist required');
      if (!o.allowedRoundingPolicies.includes(o.roundingProfileId))
        fail('Default rounding policy is not permitted');
      if (
        o.dose.unit !== 'mg' &&
        o.allowedRoundingPolicies.some((x) => x !== 'NO_ROUND')
      )
        fail('mg rounding forbidden for g/IU doses');
      for (const x of o.clinicalRules || []) {
        if (['hard_max', 'hard_min'].includes(x.type)) {
          known(x, ['type', 'value', 'unit', 'reason'], 'rule');
          if (!positive(x.value) || x.unit !== o.dose.unit || !x.reason)
            fail('Invalid hard limit');
        } else if (x.type === 'multiply') {
          known(x, ['type', 'factor', 'reason'], 'rule');
          if (!positive(x.factor) || !x.reason)
            fail('Invalid protocol multiplier');
        } else if (x.type === 'warning_threshold') {
          known(x, ['type', 'metric', 'operator', 'value', 'message'], 'rule');
          if (
            x.metric !== 'kidney_function' ||
            !['gt', 'gte', 'lt', 'lte'].includes(x.operator) ||
            !finite(x.value) ||
            !x.message
          )
            fail('Unknown clinical warning rule');
        } else fail('Unknown clinical rule');
      }
      const min = Math.max(
        0,
        ...(o.clinicalRules || [])
          .filter((x) => x.type === 'hard_min')
          .map((x) => x.value),
      );
      const max = Math.min(
        Infinity,
        ...(o.clinicalRules || [])
          .filter((x) => x.type === 'hard_max')
          .map((x) => x.value),
      );
      if (min > max) fail('Conflicting hard limits');
    }
  }
  for (let c = 1; c <= r.cycleCount; c++)
    if (!ranges.some(([a, b]) => a <= c && c <= b))
      fail(`No phase for cycle ${c}`);
  return true;
}
export const halfUp = (v, n) =>
  Math.floor(v / n + 0.5 + Number.EPSILON * 10) * n;
export const mosteller = (h, w) => Math.sqrt((h * w) / 3600);
export function validatePatient(p, cycle, r) {
  if (
    !positive(p.ageYears) ||
    p.ageYears >= 140 ||
    !['male', 'female'].includes(p.sex) ||
    !positive(p.heightCm) ||
    !positive(p.weightKg)
  )
    fail('Age, sex, height and weight required');
  if (r.population === 'adult' && p.ageYears < 18)
    fail('Adult regimen: pediatric patient blocked');
  if (r.population === 'pediatric' && p.ageYears >= 18)
    fail('Pediatric regimen: adult patient blocked');
  if (!Number.isInteger(cycle) || cycle < 1 || cycle > r.cycleCount)
    fail('Cycle outside approved schedule');
  if (
    !['cockcroft_gault', 'measured_gfr', 'bsa_adjusted_egfr'].includes(
      p.kidneyMethod,
    )
  )
    fail('Explicit kidney method required');
}
export function calculate(
  r,
  p,
  cycle,
  policy = 'drug-specific',
  selections = {},
) {
  validateDefinition(r);
  if (r.status !== 'published' || r.localApproval !== true)
    fail('Only approved published protocols can be calculated');
  validatePatient(p, cycle, r);
  const bsa = mosteller(p.heightCm, p.weightKg),
    phase = r.phases.find((x) => cycle >= x.cycleStart && cycle <= x.cycleEnd);
  const requiresKidney = phase.orders.some(
    (o) =>
      o.dose.basis === 'auc' ||
      o.clinicalRules?.some((x) => x.metric === 'kidney_function'),
  );
  let kidney;
  if (requiresKidney) {
    if (p.kidneyMethod === 'cockcroft_gault') {
      if (p.ageYears < 18)
        fail('Cockcroft-Gault is not a pediatric kidney method');
      if (!positive(p.serumCreatinineMgDl))
        fail('Serum creatinine mg/dL required');
      kidney =
        (((140 - p.ageYears) * p.weightKg) / (72 * p.serumCreatinineMgDl)) *
        (p.sex === 'female' ? 0.85 : 1);
    } else {
      if (!positive(p.kidneyValue)) fail('Kidney function value required');
      kidney =
        p.kidneyValue *
        (p.kidneyMethod === 'bsa_adjusted_egfr' ? bsa / 1.73 : 1);
    }
  }
  const rows = phase.orders.map((o) => {
    const v = o.dose.options
      ? (selections[o.id] ?? o.dose.defaultOption)
      : o.dose.value;
    if (!positive(v) || (o.dose.options && !o.dose.options.includes(v)))
      fail('Explicit approved dose option required');
    const base =
      o.dose.basis === 'fixed'
        ? v
        : o.dose.basis === 'bsa'
          ? v * bsa
          : o.dose.basis === 'weight'
            ? v * p.weightKg
            : v * (kidney + 25);
    let clinical = base;
    const notes = [],
      warnings = [];
    const rules = o.clinicalRules || [];
    for (const x of rules.filter((x) => x.type === 'multiply')) {
      clinical *= x.factor;
      notes.push(x.reason);
    }
    const min = Math.max(
        0,
        ...rules.filter((x) => x.type === 'hard_min').map((x) => x.value),
      ),
      max = Math.min(
        Infinity,
        ...rules.filter((x) => x.type === 'hard_max').map((x) => x.value),
      );
    const limited = Math.max(min, Math.min(max, clinical));
    if (limited !== clinical)
      notes.push('Protocol hard limit applied before rounding');
    clinical = limited;
    for (const x of rules.filter((x) => x.type === 'warning_threshold')) {
      if (
        {
          gt: kidney > x.value,
          gte: kidney >= x.value,
          lt: kidney < x.value,
          lte: kidney <= x.value,
        }[x.operator]
      )
        warnings.push(x.message);
    }
    const chosen = policy === 'drug-specific' ? o.roundingProfileId : policy;
    if (!o.allowedRoundingPolicies.includes(chosen))
      fail(`${o.drugName}: rounding policy not approved`);
    const increment = policies[chosen].increment;
    let recommended = increment ? halfUp(clinical, increment) : clinical;
    if (recommended > max || recommended < min) {
      recommended = clinical;
      warnings.push(
        'Rounding would cross a protocol hard limit; clinical dose retained',
      );
    }
    const difference = recommended - clinical,
      pct = clinical ? (difference / clinical) * 100 : 0;
    if (increment && Math.abs(pct) > 5) {
      recommended = clinical;
      warnings.push('Rounding difference exceeds 5%; clinical dose retained');
    }
    if (
      !finite(base) ||
      !finite(clinical) ||
      !finite(recommended) ||
      clinical < 0
    )
      fail('Non-finite or negative dose blocked');
    return {
      id: o.id,
      drug: o.drugName,
      unit: o.dose.unit,
      base,
      clinical,
      recommended,
      difference: recommended - clinical,
      differencePct: clinical ? ((recommended - clinical) / clinical) * 100 : 0,
      notes,
      warnings,
      route: o.route,
      schedule: o.schedule,
      administrations:
        o.schedule.days.length * (o.schedule.administrationsPerDay || 1),
    };
  });
  return { bsa, kidney, phase: phase.name, rows };
}
export function allowedPolicies(r, cycle) {
  const orders =
    r.phases.find((x) => cycle >= x.cycleStart && cycle <= x.cycleEnd)
      ?.orders || [];
  return [
    'drug-specific',
    ...Object.keys(policies).filter(
      (k) =>
        orders.length &&
        orders.every((o) => o.allowedRoundingPolicies.includes(k)),
    ),
  ];
}
