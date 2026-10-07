const EPS = Number.EPSILON * 10;
export function mostellerBsa(heightCm, weightKg) {
    if (!(heightCm > 0) || !(weightKg > 0))
        throw new Error('Height and weight must be > 0');
    return Math.sqrt((heightCm * weightKg) / 3600);
}
export function cockcroftGaultCrCl(patient) {
    const scr = patient.serumCreatinineMgDl;
    if (!(patient.ageYears > 0) || !(patient.weightKg > 0) || !(scr && scr > 0)) {
        throw new Error('Age, weight, and serum creatinine are required for Cockcroft-Gault');
    }
    let crcl = ((140 - patient.ageYears) * patient.weightKg) / (72 * scr);
    if (patient.sex === 'female')
        crcl *= 0.85;
    return Math.max(0, crcl);
}
export function resolveKidneyFunction(patient, bsaM2) {
    const method = patient.kidneyMethod;
    if (!method)
        return {};
    if (method === 'measured_gfr') {
        if (!(patient.kidneyValue && patient.kidneyValue > 0))
            throw new Error('Measured GFR is required');
        return { value: patient.kidneyValue, label: 'Measured GFR (mL/min)' };
    }
    if (method === 'bsa_adjusted_egfr') {
        if (!(patient.kidneyValue && patient.kidneyValue > 0))
            throw new Error('eGFR is required');
        return {
            value: patient.kidneyValue * (bsaM2 / 1.73),
            label: 'BSA-adjusted eGFR (mL/min)',
        };
    }
    if (method === 'cockcroft_gault_legacy') {
        return {
            value: cockcroftGaultCrCl(patient),
            label: 'Cockcroft-Gault CrCl (legacy/local protocol)',
            warning: 'Cockcroft-Gault is provided only for legacy/local protocols. Verify the kidney-function method required by the regimen.',
        };
    }
    return assertNever(method);
}
export function convertDose(value, from, to) {
    if (from === to)
        return value;
    if (from === 'g' && to === 'mg')
        return value * 1000;
    if (from === 'mg' && to === 'g')
        return value / 1000;
    if (from === 'mg' && to === 'mcg')
        return value * 1000;
    if (from === 'mcg' && to === 'mg')
        return value / 1000;
    throw new Error(`Unsupported unit conversion ${from} -> ${to}`);
}
export function roundHalfUp(value, increment) {
    if (!(increment > 0))
        throw new Error('Rounding increment must be > 0');
    return Math.floor(value / increment + 0.5 + EPS) * increment;
}
export function applyRounding(value, unit, profile) {
    if (profile.method === 'none')
        return { recommended: value, difference: 0, differencePct: 0 };
    let profileValue;
    try {
        profileValue = convertDose(value, unit, profile.unit);
    }
    catch {
        return { warning: `Rounding profile ${profile.label} uses ${profile.unit}, but dose is ${unit}.` };
    }
    const candidate = roundHalfUp(profileValue, profile.increment);
    const difference = candidate - profileValue;
    const differencePct = profileValue === 0 ? 0 : (difference / profileValue) * 100;
    const absPct = Math.abs(differencePct);
    const absDifference = Math.abs(difference);
    if (absPct > profile.maxPercentDifference + EPS) {
        return { warning: `Rounded candidate differs by ${absPct.toFixed(2)}%, exceeding ${profile.maxPercentDifference}%. Pharmacist review required.` };
    }
    if (profile.maxAbsoluteDifference !== undefined && absDifference > profile.maxAbsoluteDifference + EPS) {
        return { warning: `Rounded candidate differs by ${absDifference.toFixed(2)} ${profile.unit}, exceeding the approved absolute limit.` };
    }
    const recommendedInOriginalUnit = convertDose(candidate, profile.unit, unit);
    return {
        recommended: recommendedInOriginalUnit,
        difference: recommendedInOriginalUnit - value,
        differencePct: value === 0 ? 0 : ((recommendedInOriginalUnit - value) / value) * 100,
    };
}
function selectDoseValue(dose, orderId, selections) {
    if (dose.options?.length) {
        const selected = selections[orderId] ?? dose.defaultOption;
        if (selected === undefined)
            throw new Error('Clinical dose selection is required');
        if (!dose.options.some((v) => Math.abs(v - selected) < EPS))
            throw new Error('Selected dose is not an approved option');
        return selected;
    }
    if (dose.value === undefined)
        throw new Error('Dose value is missing');
    return dose.value;
}
function calculateRawDose(dose, orderId, selections, patient, bsaM2, kidneyFunctionMlMin) {
    const value = selectDoseValue(dose, orderId, selections);
    switch (dose.basis) {
        case 'fixed': return value;
        case 'bsa': return value * bsaM2;
        case 'weight': return value * patient.weightKg;
        case 'auc': {
            if (!(kidneyFunctionMlMin !== undefined && kidneyFunctionMlMin >= 0))
                throw new Error('Kidney function is required for Carboplatin AUC calculation');
            return value * (kidneyFunctionMlMin + 25);
        }
        default: return assertNever(dose.basis);
    }
}
function applyClinicalRules(value, unit, rules, kidneyFunctionMlMin) {
    let current = value;
    const notes = [];
    const warnings = [];
    for (const rule of rules ?? []) {
        if (rule.type === 'hard_max') {
            let maxInDoseUnit;
            try {
                maxInDoseUnit = convertDose(rule.value, rule.unit, unit);
            }
            catch {
                warnings.push(`Cannot apply hard maximum: unit mismatch (${rule.unit} vs ${unit}).`);
                continue;
            }
            if (current > maxInDoseUnit) {
                notes.push(`Hard maximum applied: ${formatNumber(rule.value)} ${rule.unit}. ${rule.reason}`);
                current = maxInDoseUnit;
            }
        }
        else if (rule.type === 'warning_threshold') {
            if (rule.metric === 'kidney_function' && kidneyFunctionMlMin !== undefined) {
                const matched = compare(kidneyFunctionMlMin, rule.operator, rule.value);
                if (matched)
                    warnings.push(rule.message);
            }
        }
        else {
            assertNever(rule);
        }
    }
    return { value: current, notes, warnings };
}
function compare(value, operator, threshold) {
    if (operator === 'gt')
        return value > threshold;
    if (operator === 'gte')
        return value >= threshold;
    if (operator === 'lt')
        return value < threshold;
    return value <= threshold;
}
export function scheduleText(schedule) {
    const dayText = schedule.days.length === 1
        ? `day ${schedule.days[0]}`
        : `days ${schedule.days.join(', ')}`;
    const parts = [dayText];
    if (schedule.administrationsPerDay && schedule.administrationsPerDay > 1)
        parts.push(`${schedule.administrationsPerDay} administrations/day`);
    if (schedule.continuousInfusionHours)
        parts.push(`continuous infusion ${schedule.continuousInfusionHours} h`);
    else if (schedule.infusionMinutes)
        parts.push(`infusion ${schedule.infusionMinutes} min`);
    if (schedule.note)
        parts.push(schedule.note);
    return parts.join(' · ');
}
export function protocolDoseText(dose) {
    const valueText = dose.options?.length
        ? dose.options.map(formatNumber).join(' or ')
        : formatNumber(dose.value ?? NaN);
    if (dose.basis === 'auc')
        return `AUC ${valueText}`;
    if (dose.basis === 'bsa')
        return `${valueText} ${dose.unit}/m²`;
    if (dose.basis === 'weight')
        return `${valueText} ${dose.unit}/kg`;
    return `${valueText} ${dose.unit}`;
}
export function calculateRegimen(context) {
    const { patient, regimen, cycle, selections, roundingProfiles } = context;
    if (regimen.status !== 'published')
        throw new Error('Only published regimens can be calculated');
    if (regimen.population === 'adult' && patient.ageYears < 18)
        throw new Error('Selected regimen is adult-only');
    if (!(cycle >= 1))
        throw new Error('Cycle must be >= 1');
    const bsaM2 = mostellerBsa(patient.heightCm, patient.weightKg);
    const kidney = resolveKidneyFunction(patient, bsaM2);
    const warnings = [];
    if (kidney.warning)
        warnings.push(kidney.warning);
    if (!regimen.localApproval)
        warnings.push('CLINICAL APPROVAL PENDING: regimen has not been marked as locally approved by BHH. Verify local approval before patient care.');
    const phase = regimen.phases.find((p) => cycle >= p.cycleStart && (p.cycleEnd === undefined || cycle <= p.cycleEnd));
    if (!phase)
        throw new Error(`No regimen phase is defined for cycle ${cycle}`);
    const results = phase.orders.map((order) => {
        const resultWarnings = [];
        let blocked = false;
        let rawCalculatedDose = 0;
        let clinicalDose = 0;
        let recommendedDose;
        let difference;
        let differencePct;
        let roundingProfileLabel;
        const clinicalRuleNotes = [];
        try {
            rawCalculatedDose = calculateRawDose(order.dose, order.id, selections, patient, bsaM2, kidney.value);
            const clinical = applyClinicalRules(rawCalculatedDose, order.dose.unit, order.clinicalRules, kidney.value);
            clinicalDose = clinical.value;
            clinicalRuleNotes.push(...clinical.notes);
            resultWarnings.push(...clinical.warnings);
            if (order.roundingProfileId) {
                const profile = roundingProfiles[order.roundingProfileId];
                if (!profile) {
                    resultWarnings.push(`Unknown rounding profile: ${order.roundingProfileId}`);
                }
                else {
                    roundingProfileLabel = profile.label;
                    const rounded = applyRounding(clinicalDose, order.dose.unit, profile);
                    if (rounded.warning)
                        resultWarnings.push(rounded.warning);
                    recommendedDose = rounded.recommended;
                    difference = rounded.difference;
                    differencePct = rounded.differencePct;
                }
            }
        }
        catch (error) {
            blocked = true;
            resultWarnings.push(error instanceof Error ? error.message : String(error));
        }
        const administrations = Math.max(1, order.schedule.days.length * (order.schedule.administrationsPerDay ?? 1));
        const base = {
            orderId: order.id,
            drugName: order.drugName,
            protocolDoseText: protocolDoseText(order.dose),
            route: order.route,
            scheduleText: scheduleText(order.schedule),
            rawCalculatedDose,
            rawUnit: order.dose.unit,
            clinicalDose,
            clinicalUnit: order.dose.unit,
            clinicalRuleNotes,
            warnings: resultWarnings,
            blocked,
            administrationsThisCycle: administrations,
            cycleTotalClinicalDose: clinicalDose * administrations,
        };
        if (recommendedDose !== undefined)
            base.recommendedDose = recommendedDose;
        if (recommendedDose !== undefined)
            base.recommendedUnit = order.dose.unit;
        if (difference !== undefined)
            base.difference = difference;
        if (differencePct !== undefined)
            base.differencePct = differencePct;
        if (roundingProfileLabel !== undefined)
            base.roundingProfileLabel = roundingProfileLabel;
        return base;
    });
    const summary = { bsaM2, results, warnings };
    if (kidney.value !== undefined)
        summary.kidneyFunctionMlMin = kidney.value;
    if (kidney.label !== undefined)
        summary.kidneyMethodLabel = kidney.label;
    return summary;
}
export function formatNumber(value, maxDecimals = 2) {
    if (!Number.isFinite(value))
        return '—';
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: maxDecimals }).format(value);
}
function assertNever(value) {
    throw new Error(`Unexpected value: ${String(value)}`);
}
