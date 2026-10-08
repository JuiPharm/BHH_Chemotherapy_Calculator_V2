import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {spawnSync} from 'node:child_process';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const pepper='PRODUCTION_UNIT_TEST_PSEUDO_RANDOM_SECRET_123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
test('production provisioning creates two distinct accountable roles with different credentials',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'bhh-prod-provision-'));
 try{
  const env={...process.env,RUNNER_TEMP:tmp,
   PRODUCTION_EDITOR_EMAIL:'named.editor@hospital.example',
   PRODUCTION_REVIEWER_EMAIL:'named.reviewer@hospital.example',
   PRODUCTION_EDITOR_PIN:'2983146075',PRODUCTION_REVIEWER_PIN:'6390741528',
   PRODUCTION_PASSWORD_PEPPER:pepper};
  const res=spawnSync(process.execPath,['v3/scripts/provision-production-staff-ci.mjs'],{env,encoding:'utf8'});
  assert.equal(res.status,0,res.stderr);
  assert.doesNotMatch(res.stdout,/2983146075|6390741528|PRODUCTION_UNIT_TEST_PSEUDO_RANDOM/);
  const sql=readFileSync(join(tmp,'bhh-production-named-operators.sql'),'utf8');
  assert.doesNotMatch(sql,/BEGIN TRANSACTION|COMMIT;/i);
  const db=new DatabaseSync(':memory:');
  for(const name of ['0001_schema.sql','0004_staging_internal_auth.sql','0005_editor_pin.sql'])
   db.exec(readFileSync('v3/migrations/'+name,'utf8'));
  db.exec(sql);
  const roles=db.prepare(`SELECT u.email,u.role_code,p.pin_hash
   FROM users u JOIN staging_editor_pins p ON p.user_id=u.id ORDER BY u.email`).all();
  assert.equal(roles.length,2);
  assert.deepEqual(roles.map(x=>x.role_code),['regimen_editor','oncology_pharmacist']);
  assert.notEqual(roles[0].pin_hash,roles[1].pin_hash);
  assert.match(roles[0].pin_hash,/^[0-9a-f]{64}$/);
  db.exec(sql); // repeat is explicitly idempotent; sessions revoked on rekey
  assert.equal(db.prepare('SELECT COUNT(*) AS c FROM staging_editor_pins').get().c,2);
  db.close();
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('production provisioning refuses shared identities, weak/synthetic/reused PINs and absent secret',()=>{
 const baseline={...process.env,
  RUNNER_TEMP:mkdtempSync(join(tmpdir(),'bhh-prod-deny-')),
  PRODUCTION_EDITOR_EMAIL:'named.editor@hospital.example',
  PRODUCTION_REVIEWER_EMAIL:'named.reviewer@hospital.example',
  PRODUCTION_EDITOR_PIN:'2983146075',
  PRODUCTION_REVIEWER_PIN:'6390741528',
  PRODUCTION_PASSWORD_PEPPER:pepper};
 try{
  for(const change of [
   {PRODUCTION_EDITOR_PIN:'8342719056'},
   {PRODUCTION_EDITOR_PIN:'1234567890'},
   {PRODUCTION_REVIEWER_PIN:baseline.PRODUCTION_EDITOR_PIN},
   {PRODUCTION_REVIEWER_EMAIL:baseline.PRODUCTION_EDITOR_EMAIL},
   {PRODUCTION_PASSWORD_PEPPER:'too-short'},
  ]){
   const res=spawnSync(process.execPath,['v3/scripts/provision-production-staff-ci.mjs'],{env:{...baseline,...change},encoding:'utf8'});
   assert.notEqual(res.status,0);
  }
 }finally{rmSync(baseline.RUNNER_TEMP,{recursive:true,force:true});}
});
test('Production deploy checker permits ONLY resolved separate UUID, never placeholder',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'bhh-prod-config-'));
 try{
  mkdirSync(join(tmp,'v3'));
  const c=JSON.parse(readFileSync('v3/wrangler.jsonc','utf8'));
  const script=resolve('v3/scripts/check-deploy.mjs');
  writeFileSync(join(tmp,'v3','wrangler.jsonc'),JSON.stringify(c));
  let res=spawnSync(process.execPath,[script,'production'],{cwd:tmp,encoding:'utf8'});
  assert.notEqual(res.status,0,'Production must not deploy until D1 UUID resolved');
  c.env.production.d1_databases[0].database_id='914f8cbc-e003-4209-941a-2f98cd84b13e';
  writeFileSync(join(tmp,'v3','wrangler.jsonc'),JSON.stringify(c));
  res=spawnSync(process.execPath,[script,'production'],{cwd:tmp,encoding:'utf8'});
  assert.equal(res.status,0,res.stderr);
  c.env.production.d1_databases[0].database_id=c.env.staging.d1_databases[0].database_id;
  writeFileSync(join(tmp,'v3','wrangler.jsonc'),JSON.stringify(c));
  res=spawnSync(process.execPath,[script,'production'],{cwd:tmp,encoding:'utf8'});
  assert.notEqual(res.status,0,'Production must never use the Staging D1 UUID');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
