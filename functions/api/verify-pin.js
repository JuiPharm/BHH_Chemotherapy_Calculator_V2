export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { pin } = body;

    const CORRECT_PIN = (env && env.APPROVE_PIN) ? String(env.APPROVE_PIN).trim() : null;
    if (!CORRECT_PIN) {
      return new Response(JSON.stringify({
        success: false,
        message: 'ระบบ Cloudflare ยังไม่ได้ตั้งค่าตัวแปร APPROVE_PIN ใน Environment variables'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!pin || String(pin).trim() !== CORRECT_PIN) {
      return new Response(JSON.stringify({
        success: false,
        valid: false,
        message: 'รหัส PIN สำหรับอนุมัติไม่ถูกต้อง'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      valid: true,
      message: 'รหัส PIN ถูกต้อง'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
