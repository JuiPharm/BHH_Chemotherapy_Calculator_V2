import { test, expect } from '@playwright/test';
import {createHmac} from 'node:crypto';
const users=JSON.parse(process.env.TEST_STAGING_FIXTURES||'[]').slice(4);
const password=process.env.TEST_STAGING_PASSWORD;
if(users.length!==4)throw Error('Four browser-only synthetic fixture identities required');
const decode=value=>{
 const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
 let b=0,n=0,bytes=[];
 for(const char of value){b=(b<<5)|alpha.indexOf(char);n+=5;if(n>=8){bytes.push((b>>>(n-8))&255);n-=8;}}
 return Buffer.from(bytes);
};
function totp(secret) {
 const buf=Buffer.alloc(8);
 buf.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
 const h=createHmac('sha1',decode(secret)).update(buf).digest();
 const off=h[19]&15;
 return String((h.readUInt32BE(off)&0x7fffffff)%1000000).padStart(6,'0');
}
async function login(page,user) {
 await page.goto('/');
 await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
 await expect(page.locator('#signin')).toBeVisible();
 await page.locator('[name=email]').fill(user.email);
 await page.locator('[name=password]').fill(password);
 await page.locator('[name=totp]').fill(totp(user.secret));
 await page.locator('#submit').click();
 await expect(page.locator('#connection')).toContainText('Central protocols',{timeout:20000});
 await expect(page.locator('#account')).toContainText(user.email);
 await expect(page.locator('#account')).toContainText(user.role);
 await expect(page.locator('#local-user')).toHaveCount(0);
}
test('staging browser: unauthenticated assets blocked and real password/TOTP login, logout',async({page})=>{
 const errors=[];
 page.on('pageerror',err=>errors.push(err.message));
 await expect.poll(async()=> (await page.request.get('/api/catalog')).status()).toBe(401);
 await login(page,users[0]);
 await expect(page.locator('#library-count')).toContainText('142 records');
 await page.locator('#cancer').selectOption('Breast');
 await page.locator('#regimen-search').fill('TCH');
 await page.locator('#matches [data-select="BHH-BREAST-TCH-EVIQ53:1"]').click();
 for(const [name,v] of Object.entries({ageYears:'50',heightCm:'180',weightKg:'90',cycle:'1'}))
  await page.locator(`[name=${name}]`).fill(v);
 await page.locator('[name=sex]').selectOption('female');
 await page.locator('#kidney-method').selectOption('measured_gfr');
 if(await page.locator('[name=kidneyValue]').isVisible())await page.locator('[name=kidneyValue]').fill('90');
 await page.locator('#calculate').click();
 await expect(page.locator('#result')).toContainText('690 mg');
 await page.locator('#staging-logout').click();
 await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
 const res=await page.request.get('/api/session');
 expect(res.status()).toBe(401);
 expect(errors).toEqual([]);
});
test('staging browser: independent roles see correct editor/reviewer/admin access',async({browser})=>{
 const contexts=[];
 try{
  for(const user of users.slice(1)){
   const ctx=await browser.newContext();contexts.push(ctx);
   const page=await ctx.newPage();
   await login(page,user);
   if(user.role==='regimen_editor'){
    await expect(page.locator('#new-draft')).toBeEnabled();
    await expect(page.locator('#audit-tab')).toBeHidden();
   }else if(user.role==='oncology_pharmacist'){
    await expect(page.locator('#new-draft')).toBeEnabled();
    await expect(page.locator('#audit-tab')).toBeHidden();
   }else if(user.role==='clinical_admin'){
    await expect(page.locator('#audit-tab')).toBeVisible();
    await page.locator('[data-page=audit]').click();
    await expect(page.locator('#audit-list')).toBeVisible();
   }
  }
 }finally{await Promise.all(contexts.map(c=>c.close()));}
});
