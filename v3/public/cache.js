const open = () =>
  new Promise((resolve, reject) => {
    const q = indexedDB.open('bhh-v3-published', 1);
    q.onupgradeneeded = () => q.result.createObjectStore('snapshots');
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
export async function cacheGet(key) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const q = db.transaction('snapshots').objectStore('snapshots').get(key);
    q.onsuccess = () => resolve(q.result);
    q.onerror = () => reject(q.error);
  });
}
export async function cachePut(key, value) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction('snapshots', 'readwrite');
    t.objectStore('snapshots').put(value, key);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}
export async function clearCache() {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction('snapshots', 'readwrite');
    t.objectStore('snapshots').clear();
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  });
}
