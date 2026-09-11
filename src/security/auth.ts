import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserSession } from '@/backend/types';
import { prisma, withQueryTimeout } from '@/database/prisma';

export const AUTH_COOKIE_NAME = 'xyz_crm_token';

function getSecretKey(): Uint8Array {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length === 0) {
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return new TextEncoder().encode('build-phase-placeholder-secret-not-used-at-runtime');
    }
    throw new Error('FATAL: JWT_SECRET environment variable is missing or empty. A secure secret is required.');
  }
  return new TextEncoder().encode(jwtSecret);
}

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    tokenVersion: user.tokenVersion ?? 0,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'MEMBER',
      department: (payload.department as string) || null,
      tokenVersion: typeof payload.tokenVersion === 'number' ? payload.tokenVersion : 0,
    };
  } catch {
    return null;
  }
}

async function validateUserSession(session: UserSession | null): Promise<UserSession | null> {
  if (!session) return null;
  try {
    const user = await withQueryTimeout(
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          tokenVersion: true,
        },
      }),
      5000,
      'validateUserSession'
    );

    if (!user) return null;
    if (user.tokenVersion !== (session.tokenVersion ?? 0)) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'MEMBER',
      department: user.department,
      tokenVersion: user.tokenVersion,
    };
  } catch (error) {
    console.error('[Auth Service] Failed to validate user session against database:', error);
    return null;
  }
}

export async function getSessionUser(): Promise<UserSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return validateUserSession(session);
}

export async function getSessionUserFromRequest(request: NextRequest): Promise<UserSession | null> {
  // VULN-11: Authentication is strictly cookie-based. Do not accept Authorization: Bearer headers.
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  return validateUserSession(session);
}
