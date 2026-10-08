const form = document.querySelector('#signin');
const error = document.querySelector('#error');
const submit = document.querySelector('#submit');
const encoder = new TextEncoder();
const toHex = bytes => Array.from(bytes, x => x.toString(16).padStart(2,'0')).join('');
const fromHex = hex => Uint8Array.from(hex.match(/.{2}/g).map(x => parseInt(x,16)));
async function post(path, payload) {
  return fetch(path, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {'Content-Type': 'application/json', 'X-Requested-With': 'BHH-V3'},
    body: JSON.stringify(payload),
  });
}
async function stretch(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return toHex(new Uint8Array(await crypto.subtle.deriveBits({
    name:'PBKDF2', hash:'SHA-256', salt:fromHex(salt), iterations:600000,
  }, key, 256)));
}
form.addEventListener('submit', async e => {
  e.preventDefault();
  error.textContent = '';
  submit.disabled = true;
  try {
    const fields = new FormData(form);
    const email = String(fields.get('email') || '').trim().toLowerCase();
    const password = String(fields.get('password') || '');
    const totp = String(fields.get('totp') || '').trim();
    const saltResponse = await post('/api/auth/salt',{email});
    if (!saltResponse.ok) throw Error(saltResponse.status === 429 ?
      'มีการร้องขอหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง' :
      'ไม่สามารถเริ่มต้นการยืนยันตัวตนได้');
    const {salt,iterations} = await saltResponse.json();
    if (!/^[a-f0-9]{32}$/.test(salt) || iterations !== 600000)
      throw Error('การตั้งค่าความปลอดภัยไม่ตรงกัน');
    const prehash = await stretch(password,salt);
    const response = await post('/api/auth/login',{email,prehash,totp});
    if (!response.ok) {
      if (response.status === 429) throw Error('มีการเข้าสู่ระบบหลายครั้งเกินไป โปรดลองใหม่ภายหลัง');
      throw Error('อีเมล รหัสผ่าน หรือรหัส Authenticator ไม่ถูกต้อง');
    }
    form.reset();
    window.location.replace('/');
  } catch (cause) {
    error.textContent = cause.message || 'ไม่สามารถเชื่อมต่อระบบได้';
    form.elements.password.value = '';
    form.elements.totp.value = '';
  } finally {
    submit.disabled = false;
  }
});
