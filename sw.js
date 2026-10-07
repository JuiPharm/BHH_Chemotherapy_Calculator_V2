const CACHE = 'bhh-chemo-v2-prod-2.1.0';
const ASSETS = [
  './','./index.html','./styles.css','./manifest.json','./register-sw.js',
  './dist/app.js','./dist/engine.js','./dist/types.js','./dist/validators.js','./dist/storage.js',
  './data/regimens.published.json','./data/rounding-profiles.json'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  })));
});
