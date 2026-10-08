export async function onRequestGet(context) {
  const { env } = context;
  try {
    if (env && env.REGIMENS_KV) {
      const kvData = await env.REGIMENS_KV.get('PUBLISHED_REGIMENS', { type: 'json' });
      return new Response(JSON.stringify(kvData || []), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
