// Read-only preflight. NEVER print any credential or PIN.
const e=process.env;
const mail=x=>/^[^\s@]{1,120}@[^\s@]{1,180}$/.test((x||'').trim());
const pin=x=>/^[0-9]{10}$/.test(x||'');
const valid=!!e.CLOUDFLARE_API_TOKEN && !!e.PRODUCTION_PASSWORD_PEPPER &&
e.PRODUCTION_PASSWORD_PEPPER.length>=40 &&
pin(e.PRODUCTION_EDITOR_PIN) && pin(e.PRODUCTION_REVIEWER_PIN) &&
e.PRODUCTION_EDITOR_PIN!==e.PRODUCTION_REVIEWER_PIN &&
mail(e.PRODUCTION_EDITOR_EMAIL) && mail(e.PRODUCTION_REVIEWER_EMAIL) &&
e.PRODUCTION_EDITOR_EMAIL.trim().toLowerCase()!==e.PRODUCTION_REVIEWER_EMAIL.trim().toLowerCase();
if(!valid){console.error('Production release blocked: independent named editor/reviewer, new Production secret and distinct PINs required. No remote changes made.');process.exit(1);}
console.log('Production operator and credential gate: PASS (values not printed).');
