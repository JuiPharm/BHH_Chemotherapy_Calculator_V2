import { json, verifyPin, ensureDatabase } from '../../src/server/clinical.js';
const VALID_IDS=new Set(['BHH_NEAREST_10MG_DEFAULT','BHH_NEAREST_1MG_DEFAULT','NO_ROUND']);
function validate(profiles) {
  return Array.isArray(profiles) && profiles.length===3 &&
    new Set(profiles.map(x=>x.id)).size===3 && profiles.every(p=>
      VALID_IDS.has(p.id) &&
      (p.id==='NO_ROUND'?p.method==='none':p.method==='nearest_half_up') &&
      p.unit==='mg' && Number.isFinite(p.increment) && p.increment>0 &&
      Number.isFinite(p.maxPercentDifference) && p.maxPercentDifference>=0 && p.maxPercentDifference<=100 &&
      (p.maxAbsoluteDifference===undefined || (Number.isFinite(p.maxAbsoluteDifference)&&p.maxAbsoluteDifference>=0)));
}
export async function onRequestGet({env}) {
  try {
    const db=ensureDatabase(env);
    const row=await db.prepare("SELECT document,revision FROM app_settings WHERE key='rounding'").first();
    return json({revision:row?.revision||0,profiles:row?JSON.parse(row.document):null});
  } catch {
    return json({success:false,message:'Central rounding policy unavailable'},503);
  }
}
export async function onRequestPost({request,env}) {
  try {
    const body=await request.json(),issue=verifyPin(body?.pin,env);
    if(issue)return json({success:false,message:issue.message},issue.status);
    const db=ensureDatabase(env);
    if(!validate(body.profiles))return json({success:false,message:'Invalid controlled rounding profiles'},422);
    const expected=Number(body.expectedRevision||0);
    if(!Number.isSafeInteger(expected)||expected<0)return json({success:false,message:'Invalid revision'},400);
    const statement=db.prepare(`INSERT INTO app_settings (key,revision,document,updated_at)
      VALUES ('rounding',?,?,?) ON CONFLICT(key) DO UPDATE SET revision=excluded.revision,
      document=excluded.document, updated_at=excluded.updated_at WHERE app_settings.revision=?`)
      .bind(expected+1,JSON.stringify(body.profiles),new Date().toISOString(),expected);
    const res=await statement.run();
    if(res?.meta?.changes!==1)return json({success:false,message:'Rounding policy changed on another device. Reload first.'},409);
    return json({success:true,profiles:body.profiles,revision:expected+1});
  }catch(e){return json({success:false,message:'Unable to save central rounding policy'},503);}
}
