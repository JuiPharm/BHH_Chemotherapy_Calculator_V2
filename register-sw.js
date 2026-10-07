if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js?v=2.2.0', { updateViaCache: 'none' }).catch(function(){});
}
