import assert from 'node:assert/strict';
import fs from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/rounding.js';

const profiles=JSON.parse(fs.readFileSync(new URL('../data/rounding-profiles.json',import.meta.url),'utf8'));
const request=(pin,data)=>new Request('https://test/api/rounding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pin,profiles:data,expectedRevision:0})});

const noDB=await onRequestGet({env:{}});
assert.equal(noDB.status,503);
console.log('ROUNDING_PASS 01: missing central D1 fails closed');

const wrong=await onRequestPost({request:request('bad',profiles),env:{APPROVE_PIN:'correct'}});
assert.equal(wrong.status,401);
console.log('ROUNDING_PASS 02: invalid PIN rejected');

const db={prepare(){return {bind(){return {async run(){return {meta:{changes:1}};}}}}}};
const broken=structuredClone(profiles);broken[0].increment=0;
const invalid=await onRequestPost({request:request('correct',broken),env:{APPROVE_PIN:'correct',REGIMENS_DB:db}});
assert.equal(invalid.status,422);
console.log('ROUNDING_PASS 03: invalid profile rejected');

const valid=await onRequestPost({request:request('correct',profiles),env:{APPROVE_PIN:'correct',REGIMENS_DB:db}});
assert.equal(valid.status,200);
assert.equal((await valid.json()).revision,1);
console.log('ROUNDING_PASS 04: versioned central rounding policy accepted');

const app=fs.readFileSync(new URL('../app.bundle.js',import.meta.url),'utf8');
assert(app.includes('syncCentralRounding'));
assert(app.includes("roundingDraft=null"));
assert(!app.includes("localStorage.setItem(ROUNDING_KEY"));
console.log('ROUNDING_PASS 05: browser overrides cannot mutate clinical policy');
console.log('ROUNDING_SECURITY_PASS');
