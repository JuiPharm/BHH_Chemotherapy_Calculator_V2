export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { pin } = body;

    if (!pin || String(pin).trim() === '1234') {
      return new Response(JSON.stringify({
        success: false,
        valid: false,
        message: 'รหัส PIN 1234 ถูกยกเลิกแล้ว กรุณาใช้รหัส PIN ใหม่ที่ตั้งค่าไว้ใน Cloudflare (APPROVE_PIN)'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    if (CORRECT_PIN === '1234') {
      return new Response(JSON.stringify({
        success: false,
        message: 'ตัวแปร APPROVE_PIN ใน Cloudflare ถูกตั้งเป็นรหัส 1234 ซึ่งถูกยกเลิกแล้ว กรุณาเปลี่ยนเป็นรหัสอื่นใน Environment variables'
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

