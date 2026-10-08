import { verifyPin, json } from '../../src/server/clinical.js';
export async function onRequestPost({request, env}) {
  try {
    const body=await request.json();
    const issue=verifyPin(body?.pin,env);
    if (issue) return json({ success:false,valid:false,message:issue.message }, issue.status);
    return json({ success:true,valid:true });
  } catch {
    return json({ success:false,valid:false,message:'Invalid request' },400);
  }
}
