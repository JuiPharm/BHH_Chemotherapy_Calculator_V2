const CACHE = 'bhh-chemo-v2-prod-2.1.1';
const CORE = [
  './','./index.html','./styles.css','./manifest.json','./register-sw.js',
  './dist/app.js','./dist/engine.js','./dist/types.js','./dist/validators.js','./dist/storage.js',
  './data/regimens.published.json','./data/rounding-profiles.json','./data/legacy-regimens.v1.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const critical = event.request.mode === 'navigate'
    || /\.(?:js|json|html)$/.test(url.pathname)
    || url.pathname.endsWith('/');
  event.respondWith(critical ? networkFirst(event.request) : cacheFirst(event.request));
});
