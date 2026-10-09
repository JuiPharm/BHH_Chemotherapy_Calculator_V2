(async function browserFlowTest(){
  const http=await import('node:http'), fs=await import('node:fs'), path=await import('node:path'), cp=await import('node:child_process');
  const port=8135,debug=9235,root=process.cwd();
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
  const server=http.createServer((req,res)=>{
    const url=new URL(req.url,'http://127.0.0.1:'+port);
    if(url.pathname.startsWith('/api/')){res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({success:false,message:'Central API unavailable in static browser test'}));return;}
    const file=path.join(root,url.pathname==='/'?'index.html':url.pathname.slice(1));
    if(!file.startsWith(root)||!fs.existsSync(file)||fs.statSync(file).isDirectory()){res.writeHead(404);res.end('Missing');return;}
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);
  });
  await new Promise(r=>server.listen(port,'127.0.0.1',r));
  const paths=['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
  const chromePath=paths.find(p=>fs.existsSync(p));
  if(!chromePath)throw Error('Chromium/Chrome not available for browser E2E');
  const child=cp.spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+debug,'--remote-allow-origins=*','--user-data-dir=/tmp/bhh-clinical-browser-9235','http://127.0.0.1:'+port+'/'],{stdio:['ignore','pipe','pipe']});
  let chromeErrors='';child.stderr.on('data',x=>{chromeErrors+=x.toString().slice(0,2000);});
  child.on('exit',(code,signal)=>console.error('Chrome exited:',code,signal));
  let socket;
  try{
    let target;
    for(let i=0;i<100;i++){
      try {const pages=await (await fetch('http://127.0.0.1:'+debug+'/json/list')).json();target=pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break;}catch{}
      await new Promise(r=>setTimeout(r,150));
    }
    if(!target)throw Error('Chrome CDP did not start. path='+chromePath+' stderr='+chromeErrors.slice(-1200));
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
    let seq=0;const responses=new Map();
    socket.onmessage=event=>{
      const m=JSON.parse(event.data);if(!m.id)return;
      const wait=responses.get(m.id);if(!wait)return;responses.delete(m.id);
      if(m.error)wait.reject(Error(m.error.message));else wait.resolve(m.result);
    };
    const call=(method,params={})=>new Promise((resolve,reject)=>{
      const id=++seq;responses.set(id,{resolve,reject});
      socket.send(JSON.stringify({id,method,params}));
    });
    const evalJS=async expression=>{
      const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails)throw Error(result.exceptionDetails.text||'Runtime exception');
      return result.result?.value;
    };
    let ready=false;
    for(let i=0;i<90;i++){
      ready=await evalJS("!document.getElementById('app-shell')?.classList.contains('hidden') && !!window.BHH_PUBLISH && !!window.BHH_BUILDER");
      if(ready)break;
      await new Promise(r=>setTimeout(r,150));
    }
    if(!ready)throw Error('App did not reach interactive ready state');
    const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
    const count=await evalJS("catalog.length");
    assert(count>=136,'Expected 136 legacy regimens + pilot records');
    console.log('BROWSER_PASS 01: app loads '+count+' catalog entries');
    const readyCount=await evalJS("catalog.filter(x=>x.structured?.status==='published'&&x.structured.localApproval).length");
    assert(readyCount===6,'Unreviewed legacy regimens must not be calculator ready');
    console.log('BROWSER_PASS 02: only six structured pilot records are calculation-ready');
    await evalJS("document.getElementById('admin-pin-toggle-btn').click(); document.getElementById('pin-auth-input').value='5678'; document.getElementById('pin-auth-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));");
    await new Promise(r=>setTimeout(r,350));
    const unlocked=await evalJS("!document.querySelector('.admin-tab').classList.contains('hidden')");
    const stored=await evalJS("localStorage.getItem('bhh_approve_pin')");
    assert(unlocked===false&&stored===null,'PIN fallback must be rejected');
    console.log('BROWSER_PASS 03: 503 PIN cannot unlock admin or create local PIN');
    await evalJS("document.getElementById('pin-auth-close').click()");
    await evalJS("selectRegimenByKey('master:BHH-MASTER-007')");
    const disabled=await evalJS("document.getElementById('calculate-btn').disabled");
    assert(disabled===true,'Legacy no structured calculation must be blocked');
    console.log('BROWSER_PASS 04: unreviewed complex legacy regimen blocked');
    await evalJS("document.getElementById('regimen-search').value='FOLFOX'; document.getElementById('regimen-search').dispatchEvent(new Event('input',{bubbles:true}));");
    const matches=await evalJS("document.querySelectorAll('#regimen-search-dropdown [data-select-key]').length");
    assert(matches>0,'Instant search should return results');
    console.log('BROWSER_PASS 05: instant search works');

    const popup=await evalJS("(()=>{const a=document.getElementById('regimen-search').getBoundingClientRect(),b=document.getElementById('regimen-search-dropdown').getBoundingClientRect();return {inputTop:a.top,inputBottom:a.bottom,popupTop:b.top,popupBottom:b.bottom,popupLeft:b.left,popupRight:b.right,vh:innerHeight,vw:innerWidth,parent:document.getElementById('regimen-search-dropdown').parentElement.tagName,count:document.querySelectorAll('#regimen-search-dropdown [data-select-key]').length,documentY:document.scrollingElement.scrollTop};})()");
    assert(popup.parent==='BODY','Search results must be portaled out of the grid into body');
    assert(Math.abs(popup.popupTop-popup.inputBottom)<14 || Math.abs(popup.popupBottom-popup.inputTop)<14,'Search results must open directly next to search input');
    assert(popup.count>0&&popup.count<=4,'Instant search must show at most four visible top matches');
    assert(popup.popupBottom<=popup.vh+3 && popup.popupLeft>=0 && popup.popupRight<=popup.vw+3,'Search result popup must stay inside viewport');
    console.log('BROWSER_PASS 12: popup anchored to search input; four-item compact layout');
    await evalJS("(()=>{const input=document.getElementById('regimen-search');input.value='R-CHOP';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));})()");
    const chosen=await evalJS("({name:selectedItem?.name,ready:!document.getElementById('calculate-btn').disabled,closed:document.getElementById('regimen-search-dropdown').classList.contains('hidden')})");
    assert(chosen.name?.toLowerCase().startsWith('r-chop')&&chosen.ready&&chosen.closed,'ArrowDown + Enter must select approved R-CHOP and close popup');
    console.log('BROWSER_PASS 13: keyboard selection keeps correct regimen and closes suggestions');
    await evalJS("(()=>{const input=document.getElementById('regimen-search');input.value='R-B';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    const reset=await evalJS("({cleared:selectedItem===null,disabled:document.getElementById('calculate-btn').disabled,hasOptions:document.querySelectorAll('#regimen-search-dropdown [data-select-key]').length>0})");
    assert(reset.cleared&&reset.disabled&&reset.hasOptions,'Editing a selected regimen must invalidate the old calculation and show new choices');
    await evalJS("document.getElementById('regimen-search').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))");
    const escaped=await evalJS("document.getElementById('regimen-search-dropdown').classList.contains('hidden')");
    assert(escaped,'Escape must dismiss search results');
    console.log('BROWSER_PASS 14: stale regimen selection reset, Escape closes popup');
    await call('Emulation.setDeviceMetricsOverride',{width:390,height:750,deviceScaleFactor:1,mobile:true});
    await evalJS("(()=>{const input=document.getElementById('regimen-search');input.value='R';input.dispatchEvent(new Event('input',{bubbles:true}));})()");
    const mobilePopup=await evalJS("(()=>{const a=document.getElementById('regimen-search').getBoundingClientRect(),b=document.getElementById('regimen-search-dropdown').getBoundingClientRect();return {inTop:a.top,inBottom:a.bottom,top:b.top,bottom:b.bottom,left:b.left,right:b.right,vh:innerHeight,vw:innerWidth};})()");
    assert(mobilePopup.left>=0 && mobilePopup.right<=mobilePopup.vw+3 && mobilePopup.top>=0 && mobilePopup.bottom<=mobilePopup.vh+3,'Mobile search popup must remain on-screen');
    assert(Math.abs(mobilePopup.top-mobilePopup.inBottom)<14 || Math.abs(mobilePopup.bottom-mobilePopup.inTop)<14,'Mobile search popup must stay near input');
    await call('Emulation.clearDeviceMetricsOverride');
    await evalJS("closeSearchDropdown()");
    console.log('BROWSER_PASS 15: responsive mobile popup remains anchored without page scrolling');

    await evalJS("window.BHH_BUILDER.open(catalog.find(x=>x.master?.catalog_id==='BHH-CATALOG-007'))");
    const builder=await evalJS("!!document.querySelector('#builder-content [data-phase]') && !!document.querySelector('#builder-content [data-order]')");
    assert(builder,'Builder should display editable structured phases/drugs');
    console.log('BROWSER_PASS 06: structured multi-phase editor opens with legacy names only');
    const doseDefault=await evalJS("document.querySelector('#builder-content [data-o=value]').value");
    assert(doseDefault==='','Master legacy dose must not auto-fill a trusted structured dose');
    console.log('BROWSER_PASS 07: legacy text does not prefill trusted dose');
    await evalJS("document.getElementById('builder-pin').value='5678'; document.getElementById('builder-save').click()");
    await new Promise(r=>setTimeout(r,200));
    const serverMessage=await evalJS("document.getElementById('builder-message').textContent");
    assert(!/saved draft.+central|published.+central/i.test(serverMessage),'Offline/server error must not show central success');
    console.log('BROWSER_PASS 08: draft fails closed without central API');
    await evalJS("(()=>{const vals={'age-input':'65','sex-input':'female','height-input':'160','weight-input':'60','scr-input':'1.2'}; for(const [id,value] of Object.entries(vals))document.getElementById(id).value=value; document.getElementById('kidney-method').value='ckd_epi_2021_cr';updateKidneyUi();})()");
    const renalPreview=await evalJS("document.getElementById('renal-preview').textContent");
    const renalMethodVisible=await evalJS("!document.getElementById('scr-wrap').classList.contains('hidden')&&document.getElementById('kidney-value-wrap').classList.contains('hidden')");
    assert(renalMethodVisible&&renalPreview.includes('Indexed eGFR')&&renalPreview.includes('De-indexed eGFR')&&renalPreview.includes('2021')&&renalPreview.includes('2009'),'CKD-EPI 2021 renal preview should show indexed/de-indexed values and eviQ caution');
    console.log('BROWSER_PASS 09: CKD-EPI 2021 UI shows indexed/de-indexed eGFR with protocol warning');
    const expectedRenal=await evalJS("window.BHH_RENAL.ckdEpi2021WithBsa({ageYears:65,sex:'female',serumCreatinineMgDl:1.2},Math.sqrt(160*60/3600))");
    assert(Math.abs(expectedRenal.indexedEgfr-50.234665676)<1e-6 && Math.abs(expectedRenal.deindexedEgfr-50.234665676*Math.sqrt(160*60/3600)/1.73)<1e-6,'Browser CKD values diverged from NKF reference');
    console.log('BROWSER_PASS 10: browser arithmetic matches NKF 2021 reference');
    await evalJS("document.getElementById('kidney-method').value='cockcroft_gault_legacy';updateKidneyUi()");
    const cgSelected=await evalJS("document.getElementById('kidney-method').value==='cockcroft_gault_legacy' && document.getElementById('scr-input').value==='1.2'");
    assert(cgSelected,'Switching back must retain the serum creatinine input');
    console.log('BROWSER_PASS 11: existing Cockcroft-Gault option and SCr retained after switching methods');
    console.log('BROWSER_FLOW_PASS');
  }finally{
    socket?.close();child.kill();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error('BROWSER_FLOW_FAIL:',e);process.exitCode=1;});
