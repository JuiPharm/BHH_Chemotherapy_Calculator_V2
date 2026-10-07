self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(event){
  event.waitUntil((async function(){
    try {
      const keys=await caches.keys();
      await Promise.all(keys.map(k=>caches.delete(k)));
      await self.registration.unregister();
      const clientsList=await self.clients.matchAll({type:'window'});
      clientsList.forEach(c=>c.navigate(c.url));
    } catch (_) {}
  })());
});
