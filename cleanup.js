(function(){
  try {
    if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});
    if ('caches' in window) caches.keys().then(keys=>keys.forEach(k=>caches.delete(k))).catch(()=>{});
  } catch {}
  try {
    // Preserve un-synced historical review notes as local backup, but do not trust as approvals.
    const legacy=localStorage.getItem('bhh_custom_approvals_v2');
    if(legacy && !localStorage.getItem('bhh_pre_v27_approvals_backup'))localStorage.setItem('bhh_pre_v27_approvals_backup',legacy);
    localStorage.removeItem('bhh_custom_approvals_v2');
    localStorage.removeItem('bhh_approve_pin');
    sessionStorage.removeItem('bhh_pharmacist_pin_unlocked');
    sessionStorage.removeItem('bhh_pharmacist_pin_token');
  }catch{}
})();
