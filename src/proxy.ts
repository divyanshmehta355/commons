import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = [
  '/dashboard',
  '/requests',
  '/transactions',
  '/profile',
  '/resources/new',
  '/onboarding',
  '/communities/new',
  '/wishlist',
  '/notifications',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  const allCookies = request.cookies.getAll();

  // Appwrite session cookies can be named:
  // - appwrite-session-${projectId} (from @appwrite.io/react SSR handlers)
  // - a_session_${projectId} (from Appwrite client SDK)
  // - a_session_${projectId}_legacy
  // - any cookie starting with 'appwrite-session' or 'a_session'
  const sessionCookie =
    (projectId && request.cookies.get(`appwrite-session-${projectId}`)?.value) ||
    (projectId && request.cookies.get(`a_session_${projectId}`)?.value) ||
    allCookies.find(
      (c) =>
        c.name.startsWith('appwrite-session') ||
        c.name.startsWith('a_session')
    )?.value;

  const isAuthenticated = Boolean(sessionCookie && sessionCookie.length > 0);

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - api/ routes (handled separately)
     * - public/ files
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
