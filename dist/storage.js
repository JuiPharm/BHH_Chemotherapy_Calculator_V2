const DRAFT_KEY = 'bhh-chemo-v2-regimen-drafts';
export function loadDrafts() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
export function saveDraft(regimen) {
    const drafts = loadDrafts();
    const next = drafts.filter((r) => r.id !== regimen.id);
    next.push(regimen);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
}
export function deleteDraft(id) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(loadDrafts().filter((r) => r.id !== id)));
}
const ROUNDING_KEY = 'bhh-chemo-v2-rounding-overrides';
export function loadRoundingOverrides() {
    try {
        const raw = localStorage.getItem(ROUNDING_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : null;
    }
    catch {
        return null;
    }
}
export function saveRoundingOverrides(profiles) {
    localStorage.setItem(ROUNDING_KEY, JSON.stringify(profiles));
}
export function clearRoundingOverrides() {
    localStorage.removeItem(ROUNDING_KEY);
}
//# sourceMappingURL=storage.js.map