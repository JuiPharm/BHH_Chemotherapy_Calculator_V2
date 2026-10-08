import { json, ensureDatabase, verifyPin } from '../../src/server/clinical.js';

// Public: only centrally published, structured and approved regimen snapshots.
export async function onRequestGet({ env }) {
  try {
    const db = ensureDatabase(env);
    const result = await db.prepare("SELECT document FROM regimens WHERE status='published' ORDER BY id").all();
    const regimens = result.results.map(row => JSON.parse(row.document));
    return json({ regimens, refreshedAt: new Date().toISOString() }, 200, { 'Cache-Control': 'no-store' });
  } catch {
    return json({ success: false, message: 'Central registry unavailable' }, 503);
  }
}

// Authenticated list includes drafts for pharmacist editing; no PIN stored in browser.
export async function onRequestPost({ request, env }) {
  try {
    const { pin } = await request.json();
    const pinError = verifyPin(pin, env);
    if (pinError) return json({ success: false, message: pinError.message }, pinError.status);
    const db = ensureDatabase(env);
    const data = await db.prepare('SELECT document FROM regimens ORDER BY updated_at DESC').all();
    return json({ regimens: data.results.map(row => JSON.parse(row.document)) }, 200, { 'Cache-Control': 'no-store' });
  } catch {
    return json({ success: false, message: 'Central registry unavailable' }, 503);
  }
}
