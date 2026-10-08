// GitHub Actions ephemeral runner only. Provisions ONE individually attributable staging Draft Editor PIN.
// Never put real PIN or HMAC pepper in repository, workflow inputs, or logs.
import { createHmac, randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
const email=(process.env.STAGING_EDITOR_EMAIL||'').trim().toLowerCase();
const pin=process.env.STAGING_EDITOR_PIN||'';
const pepper=process.env.STAGING_PASSWORD_PEPPER||'';
if(!/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(email) ||
   !/^[0-9]{10}$/.test(pin) || pin==='8342719056' || pepper.length<32 ||
   !process.env.RUNNER_TEMP)throw Error('Missing approved staging editor email, individual 10-digit PIN or pepper');
const h=createHmac('sha256',pepper).update('bhh-editor-pin-v1:'+pin).digest('hex');
const id=randomUUID();
const q=t=>"'"+String(t).replaceAll("'","''")+"'";
const stamp="strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const sql=`-- Staging only. Never commit or log. Wrangler D1 execute manages its own transaction.
INSERT INTO users(id,email,role_code,active,created_at,created_by,updated_at,updated_by)
VALUES(${q(id)},${q(email)},'regimen_editor',1,${stamp},'staging-uat-setup',${stamp},'staging-uat-setup')
ON CONFLICT(email) DO NOTHING;
INSERT INTO staging_editor_pins(user_id,pin_hash,created_at,created_by)
SELECT id,${q(h)},${stamp},'staging-uat-setup'
FROM users WHERE email=${q(email)} AND active=1 AND role_code='regimen_editor'
ON CONFLICT(user_id) DO UPDATE SET pin_hash=excluded.pin_hash;
`;
const output=join(process.env.RUNNER_TEMP,'bhh-staging-editor-pin.sql');
writeFileSync(output,sql,{flag:'wx',mode:0o600});
console.log('Generated staging-only editor grant SQL securely in runner temp (credentials not printed).');
