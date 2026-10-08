// Run on an operator-owned machine only. Never paste passwords, TOTP keys or output SQL into chat.
// Usage: node v3/scripts/provision-staging.mjs tester@example.org regimen_editor
import { randomBytes, pbkdf2Sync, randomUUID, createHash, createHmac } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stdin, stdout } from 'node:process';
const email = process.argv[2]?.toLowerCase();
const role = process.argv[3];
const allowed = ['calculator_user','regimen_editor','oncology_pharmacist','clinical_admin'];
if (!email || !/^[^\s@]{1,120}@[^\s@]{1,180}$/.test(email) || !allowed.includes(role) || !stdin.isTTY) {
  console.error('Usage (interactive terminal only): node v3/scripts/provision-staging.mjs email@example.org calculator_user|regimen_editor|oncology_pharmacist|clinical_admin');
  process.exit(1);
}
async function hidden(prompt) {
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  let text = '';
  try {
    return await new Promise((resolve, reject) => {
      function onKey(key) {
        const input = String(key);
        if (input === '\u0003') { stdin.off('data', onKey); reject(Error('Cancelled')); return; }
        if (input === '\r' || input === '\n') {
          stdin.off('data', onKey); stdout.write('\n'); resolve(text); return;
        }
        if (input === '\u007f') { text = text.slice(0,-1); return; }
        if (!/[\u0000-\u001f]/.test(input)) text += input;
      }
      stdin.on('data', onKey);
    });
  } finally { stdin.setRawMode(false); stdin.pause(); }
}
const password = await hidden('New individual password (at least 14 characters): ');
const verify = await hidden('Repeat password: ');
if (password.length < 14 || password.length > 128 || password !== verify) {
  throw Error('Password confirmation mismatch or not 14–128 characters');
}
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(bytes) {
  let value=0,bits=0,out='';
  for (const b of bytes) {
    value=(value<<8)|b;bits+=8;
    while(bits>=5){out+=alphabet[(value >>> (bits-5))&31];bits-=5;}
  }
  if(bits)out+=alphabet[(value << (5-bits))&31];
  return out;
}
if (!process.env.STAGING_PASSWORD_PEPPER || process.env.STAGING_PASSWORD_PEPPER.length < 32) throw Error('Set STAGING_PASSWORD_PEPPER locally (not in source code)');
const secret = base32(randomBytes(20));
const salt = randomBytes(16);
const derived = pbkdf2Sync(password, salt, 600000, 32, 'sha256');
const passwordHash = createHmac('sha256', process.env.STAGING_PASSWORD_PEPPER).update(derived).digest('hex');
const id = randomUUID();
const auditId = randomUUID();
const q = v => "'" + String(v).replaceAll("'", "''") + "'";
const actor = 'staging-security-provisioning';
const stamp = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
const sql = `-- STAGING D1 ONLY. CONFIDENTIAL: contains a TOTP seed; securely delete after import.
-- Do not run on production or commit to GitHub.
BEGIN TRANSACTION;
INSERT INTO users(id,email,role_code,active,created_at,created_by,updated_at,updated_by)
VALUES(${q(id)},${q(email)},${q(role)},1,${stamp},${q(actor)},${stamp},${q(actor)});
INSERT INTO staging_auth_credentials(user_id,salt,password_hash,totp_secret,created_at)
VALUES(${q(id)},${q(salt.toString('hex'))},${q(passwordHash)},${q(secret)},${stamp});
INSERT INTO audit_logs(id,entity,entity_id,version,action,previous_value,new_value,user_id,timestamp,reason,created_at,created_by,updated_at,updated_by)
VALUES(${q(auditId)},'user',${q(id)},NULL,'provision',NULL,
${q(JSON.stringify({ role, active:true, method:'staging-password-totp' }))},
${q(actor)},${stamp},'Reviewed staging tester provision',
${stamp},${q(actor)},${stamp},${q(actor)});
COMMIT;
`;
const dir = 'v3/.staging-secrets';
mkdirSync(dir,{recursive:true,mode:0o700});
const output=join(dir,createHash('sha256').update(email).digest('hex').slice(0,16)+'.sql');
writeFileSync(output,sql,{flag:'wx',mode:0o600});
console.log('\nD1 staging SQL created: '+output);
console.log('Authenticator app: add time-based (TOTP), SHA1, 6 digits, 30 second period.');
console.log('Account: '+email);
console.log('Authenticator manual setup secret (PRIVATE): '+secret);
console.log('After provisioning with wrangler --env staging --remote --file '+output+', securely delete the SQL file.');
console.log('Never share the TOTP secret, password, SQL or QR with ChatGPT or store them in Git.');
