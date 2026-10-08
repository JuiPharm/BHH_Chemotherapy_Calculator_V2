// One-time or rotation of DISTINCT named production PIN identities. Never logs secrets.
// Uses the isolated bhh-chemo-production database after target UUID confirmation.
import {createHmac,randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
const e=process.env,roles=[
 {email:(e.PRODUCTION_EDITOR_EMAIL||'').trim().toLowerCase(),pin:e.PRODUCTION_EDITOR_PIN,role:'regimen_editor'},
 {email:(e.PRODUCTION_REVIEWER_EMAIL||'').trim().toLowerCase(),pin:e.PRODUCTION_REVIEWER_PIN,role:'oncology_pharmacist'},
];
const secret=e.PRODUCTION_PASSWORD_PEPPER||'';
const weak=new Set(['0000000000','1111111111','1234567890','0123456789','8342719056','5739026418']);
if(!e.RUNNER_TEMP||secret.length<40||roles[0].email===roles[1].email||
 roles[0].pin===roles[1].pin||roles.some(x=>
 !/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(x.email)||x.email.endsWith('@example.invalid')||
 !/^[0-9]{10}$/.test(x.pin||'')||weak.has(x.pin)))
 throw Error('Production requires two named DIFFERENT professionals, strong distinct PINs and separate Production pepper');
const q=v=>"'"+String(v).replaceAll("'","''")+"'";
const stamp="strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const sql=roles.flatMap(x=>{
 const digest=createHmac('sha256',secret).update('bhh-editor-pin-v1:'+x.pin).digest('hex');
 return [
 `INSERT INTO users(id,email,role_code,active,created_at,created_by,updated_at,updated_by)
 VALUES(${q(randomUUID())},${q(x.email)},${q(x.role)},1,${stamp},'production-identity-enrollment',${stamp},'production-identity-enrollment')
 ON CONFLICT(email) DO NOTHING;`,
 `INSERT INTO staging_editor_pins(user_id,pin_hash,created_at,created_by)
 SELECT id,${q(digest)},${stamp},'production-identity-enrollment'
 FROM users WHERE email=${q(x.email)} AND active=1 AND role_code=${q(x.role)}
 ON CONFLICT(user_id) DO UPDATE SET pin_hash=excluded.pin_hash;`,
 `DELETE FROM staging_editor_sessions WHERE user_id IN (
 SELECT id FROM users WHERE email=${q(x.email)} AND role_code=${q(x.role)});`
 ];
}).join('\n');
writeFileSync(join(e.RUNNER_TEMP,'bhh-production-named-operators.sql'),sql+'\n',{mode:0o600,flag:'wx'});
console.log('Prepared two independent named Production operator identities and rotated sessions (no credentials logged).');
