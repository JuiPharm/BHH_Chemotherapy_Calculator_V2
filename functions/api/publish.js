export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { pin, regimen } = body;

    const CORRECT_PIN = (env && env.APPROVE_PIN) ? String(env.APPROVE_PIN).trim() : null;
    if (!CORRECT_PIN) {
      return new Response(JSON.stringify({ success: false, message: 'ระบบ Cloudflare ยังไม่ได้ตั้งค่าตัวแปร APPROVE_PIN ใน Environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!pin || String(pin).trim() !== CORRECT_PIN) {
      return new Response(JSON.stringify({ success: false, message: 'รหัส PIN สำหรับอนุมัติไม่ถูกต้อง' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!regimen || !regimen.catalog_id) {
      return new Response(JSON.stringify({ success: false, message: 'ข้อมูลสูตรยาไม่ครบถ้วน' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (env && env.REGIMENS_KV) {
      let currentRegimens = (await env.REGIMENS_KV.get('PUBLISHED_REGIMENS', { type: 'json' })) || [];
      const existingIndex = currentRegimens.findIndex(r => r.id === regimen.catalog_id || r.catalog_id === regimen.catalog_id);
      if (existingIndex >= 0) {
        currentRegimens[existingIndex] = regimen;
      } else {
        currentRegimens.push(regimen);
      }
      await env.REGIMENS_KV.put('PUBLISHED_REGIMENS', JSON.stringify(currentRegimens));
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'อนุมัติและ Publish สำเร็จ ข้อมูลพร้อมใช้งานบนทุกเครื่องแล้ว',
      regimen
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

