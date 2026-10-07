(function(){
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister();});}).catch(function(){});
    if ('caches' in window) caches.keys().then(function(keys){keys.forEach(function(k){caches.delete(k);});}).catch(function(){});
  } catch (_) {}
})();