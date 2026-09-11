import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from '@/security/auth';
import { isValidSameOrigin } from '@/security/csrf';
import { logSecurityEvent } from '@/security/audit';
import { getClientIp } from '@/security/rate-limit';

const PUBLIC_PATHS = ['/login', '/api/auth/login'];

function generateCspHeader(nonce: string): string {
  const isProd = process.env.NODE_ENV === 'production';
  // VULN-07: In production, preserve nonce along with 'self' and 'unsafe-inline'.
  // We omit 'strict-dynamic' because Next.js App Router pre-rendered static chunks
  // are built ahead of time and do not include dynamic request nonces in their script tags.
  const scriptSrc = isProd
    ? `'self' 'unsafe-inline' 'nonce-${nonce}'`
    : `'self' 'unsafe-eval' 'unsafe-inline' 'nonce-${nonce}'`;

  return `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    connect-src 'self' https:;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Generate cryptographically secure nonce per request
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = generateCspHeader(nonce);

  // Prepare sanitized request headers
  const requestHeaders = new Headers(request.headers);

  // VULN-06: Strip any incoming client-supplied x-user-* identity headers to prevent spoofing
  requestHeaders.delete('x-user-id');
  requestHeaders.delete('x-user-role');
  requestHeaders.delete('x-user-email');

  // VULN-07: Inject x-nonce and Content-Security-Policy for Next.js App Router inline script handling
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // Helper to apply security headers to any outgoing response
  const applySecurityHeaders = (response: NextResponse) => {
    response.headers.set('Content-Security-Policy', cspHeader);
    return response;
  };

  // INFO-03: Validate Same-Origin for state-changing API mutations
  if (pathname.startsWith('/api/') && !isValidSameOrigin(request)) {
    logSecurityEvent({
      type: 'CSRF_BLOCKED',
      ip: getClientIp(request),
      path: pathname,
      details: `Cross-origin mutation rejected. Origin: ${request.headers.get('origin') || 'none'}`,
    });
    return applySecurityHeaders(
      NextResponse.json(
        { error: 'Forbidden. Cross-origin requests are not allowed.' },
        { status: 403 }
      )
    );
  }

  // Allow public paths, next static assets, and images
  if (
    PUBLIC_PATHS.some((path) => pathname.startsWith(path)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return applySecurityHeaders(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    );
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    // If requesting an API route, return 401 Unauthorized
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
      );
    }
    // Redirect web user to login page
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // VULN-20 / VULN-08: Token Revocation Architectural Boundary
  // Middleware operates as a high-throughput, low-latency perimeter guard (Edge / Proxy runtime).
  // It performs stateless cryptographic verification of the JWT signature and expiration via `jose`.
  // State-based session revocation (`tokenVersion` check against PostgreSQL) is deliberately deferred
  // to Node.js route handlers via `getSessionUserFromRequest(request)` / `getSessionUser()`.
  //
  // Rationale:
  // 1. Prevents database connection pool exhaustion and latency degradation at the edge.
  // 2. Guarantees fail-safe database queries in full Node.js runtime with pooled Prisma client.
  // 3. All 15 sensitive API routes have been audited to confirm mandatory invocation of
  //    `getSessionUserFromRequest()` rather than relying on request headers or middleware state.
  const user = await verifySessionToken(token);

  if (!user) {
    // Invalid or expired token
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Session expired. Please login again.' }, { status: 401 })
      );
    }
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(AUTH_COOKIE_NAME);
    return applySecurityHeaders(response);
  }

  // VULN-06: Authorization is strictly verified downstream via verified JWT session;
  // do not inject trusted user identity headers into the request.
  return applySecurityHeaders(
    NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  );
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
