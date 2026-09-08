import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { UserSession } from './types';

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.trim().length === 0) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing or empty. A secure secret is required.');
}

const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export const AUTH_COOKIE_NAME = 'xyz_crm_token';

export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as 'ADMIN' | 'MEMBER',
      department: (payload.department as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<UserSession | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSessionUserFromRequest(request: NextRequest): Promise<UserSession | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.substring(7);
      return verifySessionToken(bearerToken);
    }
    return null;
  }
  return verifySessionToken(token);
}
