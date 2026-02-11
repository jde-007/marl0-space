import { defineMiddleware } from 'astro:middleware';

const COOKIE_NAME = 'marl0_auth';
const COOKIE_VALUE = 'authenticated';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Allow login page and auth API
  if (pathname === '/login' || pathname === '/api/auth') {
    return next();
  }
  
  // Allow static assets
  if (pathname.startsWith('/_astro/') || pathname.match(/\.(css|js|png|jpg|svg|ico|woff|woff2)$/)) {
    return next();
  }
  
  // Check auth cookie
  const authCookie = context.cookies.get(COOKIE_NAME);
  
  if (authCookie?.value !== COOKIE_VALUE) {
    // Redirect to login
    return context.redirect('/login');
  }
  
  return next();
});
