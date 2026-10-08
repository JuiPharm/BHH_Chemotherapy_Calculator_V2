// Staging only. Generates SQL to provision an INDIVIDUAL Oncology Pharmacist reviewer PIN.
// Does not expose PIN, hashed PIN, pepper or SQL in CI logs. Never grant admin role.
import {createHmac,randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const email=(process.env.STAGING_REVIEWER_EMAIL||'').trim().toLowerCase();
const editorEmail=(process.env.STAGING_EDITOR_EMAIL||'').trim().toLowerCase();
const pin=process.env.STAGING_REVIEWER_PIN||'';
const editorPin=process.env.STAGING_EDITOR_PIN||'';
const pepper=process.env.STAGING_PASSWORD_PEPPER||'';
if(!/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(email) ||
 email===editorEmail || email.endsWith('@example.invalid') ||
 !/^[0-9]{10}$/.test(pin) || pin==='8342719056' || pin===editorPin ||
 pepper.length<32 || !process.env.RUNNER_TEMP)
 throw Error('Staging reviewer requires distinct named email, unique 10-digit PIN and valid pepper');
const hash=createHmac('sha256',pepper).update('bhh-editor-pin-v1:'+pin).digest('hex');
const id=randomUUID(),q=x=>"'"+String(x).replaceAll("'","''")+"'";
const now="strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const sql=`-- Dedicated STAGING named independent Oncology Reviewer, not clinical Admin.
INSERT INTO users(id,email,role_code,active,created_at,created_by,updated_at,updated_by)
VALUES(${q(id)},${q(email)},'oncology_pharmacist',1,${now},'staging-reviewer-provision',${now},'staging-reviewer-provision')
ON CONFLICT(email) DO NOTHING;
INSERT INTO staging_editor_pins(user_id,pin_hash,created_at,created_by)
SELECT id,${q(hash)},${now},'staging-reviewer-provision'
FROM users WHERE email=${q(email)} AND active=1 AND role_code='oncology_pharmacist'
ON CONFLICT(user_id) DO UPDATE SET pin_hash=excluded.pin_hash;
`;
writeFileSync(join(process.env.RUNNER_TEMP,'bhh-staging-reviewer-pin.sql'),sql,{flag:'wx',mode:0o600});
console.log('Named Oncology Reviewer PIN verifier prepared in temporary CI file; not printed.');
