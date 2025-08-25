import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['en', 'es'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  const headers = { 'accept-language': request.headers.get('accept-language') || '' };
  const languages = new Negotiator({ headers }).languages();
  return match(languages, locales, defaultLocale);
}

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
  // Add locale variants for public routes
  '/:locale',
  '/:locale/sign-in(.*)',
  '/:locale/sign-up(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Skip middleware for API routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    // Still apply auth protection for non-public API routes
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  
  // Check if pathname has locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    // Apply auth protection for protected routes with locale
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
    return NextResponse.next();
  }

  // Redirect to locale-specific path
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  
  return NextResponse.redirect(newUrl);
})

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};