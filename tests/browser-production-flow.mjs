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
  const child=cp.spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--remote-debugging-port='+debug,'--remote-allow-origins=*','--user-data-dir=/tmp/bhh-clinical-browser-9235','http://127.0.0.1:'+port+'/'],{stdio:'ignore'});
  let socket;
  try{
    let target;
    for(let i=0;i<100;i++){
      try {const pages=await (await fetch('http://127.0.0.1:'+debug+'/json/list')).json();target=pages.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break;}catch{}
      await new Promise(r=>setTimeout(r,150));
    }
    if(!target)throw Error('Chrome CDP did not start');
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
    console.log('BROWSER_FLOW_PASS');
  }finally{
    socket?.close();child.kill();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error('BROWSER_FLOW_FAIL:',e);process.exitCode=1;});
