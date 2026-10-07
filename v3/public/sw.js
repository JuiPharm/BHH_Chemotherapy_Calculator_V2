const NAME='bhh-v3-shell-b64174e2b92f764f';
const SHELL = [
  '/',
  '/index.html',
  '/app.js',
  '/cache.js',
  '/shared/clinical.js',
  '/style.css',
  '/logo.png',
  '/fonts/thai-400.woff2',
  '/fonts/thai-700.woff2',
];
self.addEventListener('install', (e) =>
  e.waitUntil(
    caches
      .open(NAME)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener('activate', (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  ),
);
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== 'GET' ||
    u.origin !== self.location.origin ||
    !SHELL.includes(u.pathname)
  )
    return;
  e.respondWith(
    fetch(e.request)
      .then(async (r) => {
        if (
          r.ok &&
          r.headers
            .get('content-type')
            ?.includes(
              u.pathname.endsWith('.js')
                ? 'javascript'
                : u.pathname.endsWith('.css')
                  ? 'css'
                  : u.pathname.endsWith('.png')
                    ? 'image'
                    : u.pathname.endsWith('.woff2')
                      ? 'font'
                      : 'html',
            )
        ) {
          const c = await caches.open(NAME);
          await c.put(e.request, r.clone());
        }
        return r;
      })
      .catch(() => caches.match(e.request).then((r) => r || Response.error())),
  );
});
