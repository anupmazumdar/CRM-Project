import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { createSessionToken, AUTH_COOKIE_NAME } from '@/security/auth';
import { comparePassword } from '@/security/password';
import { loginSchema } from '@/database/validation';
import { checkLoginRateLimit, getClientIp } from '@/security/rate-limit';
import { logSecurityEvent } from '@/security/audit';

export const dynamic = 'force-dynamic';

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
    const clientIp = getClientIp(request);

    // VULN-01: Persistent/distributed sliding-window rate limit (5 attempts per 15 minutes)
    const rateLimit = await checkLoginRateLimit(request, email);

    if (!rateLimit.success) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        email,
        ip: clientIp,
        details: 'Login rate limit exceeded (5 attempts per 15 minutes)',
      });

      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      logSecurityEvent({
        type: 'LOGIN_FAILURE',
        email,
        ip: clientIp,
        details: 'Invalid email or password',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      logSecurityEvent({
        type: 'LOGIN_FAILURE',
        email,
        ip: clientIp,
        details: 'Invalid email or password',
      });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    logSecurityEvent({
      type: 'LOGIN_SUCCESS',
      email: user.email,
      userId: user.id,
      ip: clientIp,
    });

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'ADMIN' | 'MEMBER',
      department: user.department,
      tokenVersion: user.tokenVersion,
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
    // VULN-02: Server-side logging only; never expose infrastructure details or stack traces to clients
    console.error('[Auth Service] Login internal error:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { error: 'Login failed. Please try again later.' },
      { status: 500 }
    );
  }
}
