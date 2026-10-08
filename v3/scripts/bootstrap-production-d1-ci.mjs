// CI-only production D1 bootstrap. NO staging D1 access and NO patient data transfer.
// Run only after validated Production approval, named operators and independent secrets.
import {readFileSync,writeFileSync} from 'node:fs';
const env=process.env;
const account=env.CLOUDFLARE_ACCOUNT_ID||'';
const token=env.CLOUDFLARE_API_TOKEN||'';
const dbName='bhh-chemo-production';
const workerName='bhh-chemotherapy-v3-production';
const stagingId='3d936db6-eed1-4880-9561-1f22101cb27e';
if(!/^[a-f0-9]{32}$/.test(account)||!token||!env.RUNNER_TEMP)
 throw Error('Cloudflare Production API connection is not configured');
const api='https://api.cloudflare.com/client/v4/accounts/'+account+'/d1/database';
async function req(url,opts={}){
 const response=await fetch(url,{...opts,headers:{
  Authorization:'Bearer '+token,...(opts.body?{'Content-Type':'application/json'}:{})
 }});
 let payload;try{payload=await response.json()}catch{}
 if(!response.ok||!payload?.success)
  throw Error('Cloudflare D1 inventory/create failed. No schema migration attempted.');
 return payload;
}
const found=await req(api+'?per_page=100');
const existing=(found.result||[]).filter(d=>d.name===dbName);
if(existing.length>1)throw Error('Ambiguous Production D1 database name');
let id=existing[0]?.uuid;
if(id){
 // An existing production database can contain clinical records: refuse automatic adoption
 // unless the explicitly registered UUID matches exactly.
 if(!/^[a-f0-9-]{36}$/i.test(env.PRODUCTION_D1_UUID||'') ||
     env.PRODUCTION_D1_UUID!==id)
   throw Error('Production D1 exists; register its exact UUID in GitHub Actions Variable PRODUCTION_D1_UUID before permitting migrations.');
 console.log('Using explicitly acknowledged dedicated Production D1, no DB recreated');
}else{
 if(env.PRODUCTION_D1_UUID)throw Error('Registered Production D1 UUID does not exist, refusing to create a replacement');
 const result=await req(api,{method:'POST',body:JSON.stringify({
  name:dbName,primary_location_hint:'apac',read_replication:{mode:'disabled'}
 })});
 id=result.result?.uuid;
 console.log('Created dedicated NEW Production D1 in APAC; no staging database was accessed');
}
if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)||id===stagingId)
 throw Error('Untrusted Production D1 ID');
const c=JSON.parse(readFileSync('v3/wrangler.jsonc','utf8'));
if(c.env?.production?.name!==workerName ||
   c.env.production.d1_databases?.[0]?.database_name!==dbName ||
   c.env.staging.d1_databases?.[0]?.database_id!==stagingId)
 throw Error('Production deployment target is not isolated');
c.env.production.d1_databases[0].database_id=id;
writeFileSync('v3/wrangler.jsonc',JSON.stringify(c,null,2)+'\n',{mode:0o600});
console.log('Production D1 UUID:',id);
console.log('Validated isolated production Worker/D1 configuration. Production database UUID is safe to store in GitHub Actions Variable PRODUCTION_D1_UUID for future deploys.');
