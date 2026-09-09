import { NextRequest } from 'next/server';

/**
 * Validates that state-changing requests (POST, PUT, PATCH, DELETE) originate from the same host,
 * protecting cookie-authenticated API endpoints from cross-site request forgery (CSRF).
 */
export function isValidSameOrigin(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // Safe read-only HTTP methods do not require CSRF origin validation
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return true;
  }

  const hostHeader = request.headers.get('host') || request.nextUrl.host;
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');

  // If Origin header is provided by browser, verify it matches the request host
  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      if (originUrl.host.toLowerCase() !== hostHeader.toLowerCase()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // Fallback to Referer header if Origin is absent
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      if (refererUrl.host.toLowerCase() !== hostHeader.toLowerCase()) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  // VULN-09: Deny by default when both Origin and Referer headers are absent.
  // Cookie-authenticated mutating requests must provide a valid same-origin header.
  return false;
}
