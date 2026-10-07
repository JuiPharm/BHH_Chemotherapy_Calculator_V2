const KNOWN_UNITS = new Set(['mcg', 'mg', 'g', 'IU']);
export function validateRegimen(regimen) {
    const issues = [];
    const add = (severity, path, message) => issues.push({ severity, path, message });
    if (!regimen.id.trim())
        add('error', 'id', 'Regimen ID is required.');
    if (!regimen.name.trim())
        add('error', 'name', 'Regimen name is required.');
    if (!regimen.indication.trim())
        add('error', 'indication', 'Indication is required.');
    if (!(regimen.cycleIntervalDays > 0))
        add('error', 'cycleIntervalDays', 'Cycle interval must be > 0.');
    if (!regimen.references.length)
        add('error', 'references', 'At least one clinical source is required.');
    if (!regimen.phases.length)
        add('error', 'phases', 'At least one phase is required.');
    if (regimen.status === 'published' && !regimen.lastReviewed)
        add('error', 'lastReviewed', 'Published regimen requires a review date.');
    const orderIds = new Set();
    for (const [pi, phase] of regimen.phases.entries()) {
        const p = `phases[${pi}]`;
        if (!(phase.cycleStart >= 1))
            add('error', `${p}.cycleStart`, 'Cycle start must be >= 1.');
        if (phase.cycleEnd !== undefined && phase.cycleEnd < phase.cycleStart)
            add('error', `${p}.cycleEnd`, 'Cycle end must be >= cycle start.');
        if (!phase.orders.length)
            add('warning', `${p}.orders`, 'Phase has no drug orders.');
        for (const [oi, order] of phase.orders.entries()) {
            const o = `${p}.orders[${oi}]`;
            if (orderIds.has(order.id))
                add('error', `${o}.id`, `Duplicate order ID: ${order.id}`);
            orderIds.add(order.id);
            if (!order.drugName.trim())
                add('error', `${o}.drugName`, 'Drug name is required.');
            if (!KNOWN_UNITS.has(order.dose.unit))
                add('error', `${o}.dose.unit`, `Unsupported unit: ${order.dose.unit}`);
            if (order.dose.options?.length) {
                if (order.dose.options.some((x) => !(x > 0)))
                    add('error', `${o}.dose.options`, 'Dose options must be > 0.');
                if (order.dose.defaultOption !== undefined && !order.dose.options.includes(order.dose.defaultOption)) {
                    add('error', `${o}.dose.defaultOption`, 'Default option must be one of the approved options.');
                }
            }
            else if (!(order.dose.value !== undefined && order.dose.value > 0)) {
                add('error', `${o}.dose.value`, 'Dose must be > 0.');
            }
            if (!order.schedule.days.length)
                add('error', `${o}.schedule.days`, 'At least one administration day is required.');
            if (order.schedule.days.some((d) => !Number.isInteger(d) || d < 1))
                add('error', `${o}.schedule.days`, 'Administration days must be positive integers.');
        }
    }
    if (!regimen.localApproval)
        add('warning', 'localApproval', 'Local BHH approval is not recorded. Keep TEST/NOT FOR PATIENT CARE banner enabled.');
    return issues;
}
export function auditLegacyRegimens(input) {
    const root = input;
    const regimens = (root?.['สูตรยาเคมีบำบัด'] ?? input);
    if (!Array.isArray(regimens))
        throw new Error('Legacy file must contain an array or {"สูตรยาเคมีบำบัด": [...]}');
    const findings = [];
    for (const item of regimens) {
        const r = item;
        const regimenName = String(r['ชื่อสูตรยา'] ?? 'Unnamed regimen');
        const indication = String(r['ชนิดของมะเร็ง'] ?? '');
        const drugs = Array.isArray(r['รายการยา']) ? r['รายการยา'] : [];
        for (const drugItem of drugs) {
            const d = drugItem;
            const drugName = String(d['ชื่อยา'] ?? 'Unknown drug');
            const doseText = String(d['ขนาดยา'] ?? '').trim();
            const blockReason = legacyBlockReason(doseText);
            findings.push({
                regimenName,
                indication,
                drugName,
                doseText,
                status: blockReason ? 'blocked' : 'migratable_draft',
                reason: blockReason ?? 'Simple expression detected. It may be migrated to DRAFT only and still requires pharmacist review.',
            });
        }
    }
    return findings;
}
function legacyBlockReason(text) {
    if (!text)
        return 'Dose text is empty.';
    if (/\bthen\b/i.test(text))
        return 'Multi-phase loading/maintenance expression requires structured phases.';
    if (/\d+(?:\.\d+)?\s*[-–]\s*\d+(?:\.\d+)?/i.test(text))
        return 'Dose/AUC range requires explicit clinical selection rules.';
    if (/\bg\/m[²2]\b/i.test(text))
        return 'g/m² must be explicitly structured and unit-normalized.';
    if (/\b(?:units?|IU)\b/i.test(text))
        return 'International Units/units require explicit unit semantics.';
    if (/\/day\b/i.test(text))
        return 'Per-day dose requires an explicit multi-day schedule.';
    if (/every\s+\d+\s*h|q\d+h|BID|TID|QID/i.test(text))
        return 'Repeated intra-day schedule requires structured frequency.';
    if (/AUC\s*\d+(?:\.\d+)?/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\/m[²2]\b/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\/kg\b/i.test(text))
        return undefined;
    if (/\d+(?:\.\d+)?\s*mg\b/i.test(text))
        return undefined;
    return 'Expression is not recognized safely. Manual structured migration is required.';
}
//# sourceMappingURL=validators.js.map