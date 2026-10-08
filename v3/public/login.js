const form = document.querySelector('#signin');
const error = document.querySelector('#error');
const submit = document.querySelector('#submit');
form.addEventListener('submit', async e => {
  e.preventDefault();
  error.textContent = '';
  submit.disabled = true;
  try {
    const fields = new FormData(form);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'BHH-V3' },
      body: JSON.stringify({
        email: String(fields.get('email') || '').trim(),
        password: String(fields.get('password') || ''),
        totp: String(fields.get('totp') || '').trim(),
      }),
    });
    if (!response.ok) {
      if (response.status === 429) throw Error('มีการเข้าสู่ระบบหลายครั้งเกินไป โปรดลองใหม่ภายหลัง');
      throw Error('อีเมล รหัสผ่าน หรือรหัส Authenticator ไม่ถูกต้อง');
    }
    form.reset();
    window.location.replace('/');
  } catch (cause) {
    error.textContent = cause.message || 'ไม่สามารถเชื่อมต่อระบบได้';
  } finally {
    submit.disabled = false;
  }
});
