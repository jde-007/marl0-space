import type { APIRoute } from 'astro';

const PASSWORD = 'love';
const COOKIE_NAME = 'marl0_auth';
const COOKIE_VALUE = 'authenticated';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { password } = body;
    
    if (password === PASSWORD) {
      // Set auth cookie - expires in 30 days
      cookies.set(COOKIE_NAME, COOKIE_VALUE, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: false, // Allow http for dev
        sameSite: 'lax'
      });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ success: false }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
