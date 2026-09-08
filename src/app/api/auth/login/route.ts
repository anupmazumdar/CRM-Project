import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { comparePassword } from '@/lib/password';
import { loginSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

type LoginAttempt = {
  firstAttemptAt: number;
  failedAttempts: number;
  lockedUntil: number | null;
};

const loginAttempts = new Map<string, LoginAttempt>();

function getAttemptKey(request: NextRequest, email: string): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return `${email.toLowerCase()}:${ip}`;
}

function isLocked(key: string, now: number): boolean {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;

  if (attempt.lockedUntil && attempt.lockedUntil > now) return true;
  if (attempt.lockedUntil || now - attempt.firstAttemptAt > FAILURE_WINDOW_MS) {
    loginAttempts.delete(key);
  }

  return false;
}

function recordFailedAttempt(key: string, now: number): void {
  const existing = loginAttempts.get(key);
  const attempt = !existing || now - existing.firstAttemptAt > FAILURE_WINDOW_MS
    ? { firstAttemptAt: now, failedAttempts: 0, lockedUntil: null }
    : existing;

  attempt.failedAttempts += 1;
  if (attempt.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    attempt.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(key, attempt);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid email or password' },
        { status: 400 }
      );
    }

    const { email, password } = result.data;
    const attemptKey = getAttemptKey(request, email);
    const now = Date.now();

    if (isLocked(attemptKey, now)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      recordFailedAttempt(attemptKey, now);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      recordFailedAttempt(attemptKey, now);
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    loginAttempts.delete(attemptKey);

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'MEMBER',
      department: user.department,
    };

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
      message: 'Login successful',
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during login. Please try again.' },
      { status: 500 }
    );
  }
}
