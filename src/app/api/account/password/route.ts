import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { getSessionUserFromRequest } from '@/security/auth';
import { hashPassword, comparePassword } from '@/security/password';
import { validatePassword } from '@/security/password-policy';
import { logSecurityEvent } from '@/security/audit';
import { checkAccountActionRateLimit } from '@/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // VULN-13: Rate limit password changes (10 attempts per 15 minutes per user)
    const rateLimit = await checkAccountActionRateLimit(session.id);
    if (!rateLimit.success) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        userId: session.id,
        email: session.email,
        details: 'Account password change rate limit exceeded (10 attempts per 15 minutes)',
      });

      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many password change attempts. Please try again later.' },
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

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Current password is required.' },
        { status: 400 }
      );
    }

    // VULN-03: Centralized password policy validation
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message || 'Password does not meet security requirements.' },
        { status: 400 }
      );
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'New password and confirmation do not match.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 404 });
    }

    const isValidCurrent = await comparePassword(currentPassword, user.passwordHash);
    if (!isValidCurrent) {
      return NextResponse.json(
        { error: 'Incorrect current password. Please try again.' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: 'New password must be different from current password.' },
        { status: 400 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: session.id },
      data: {
        passwordHash: newPasswordHash,
        tokenVersion: { increment: 1 },
      } as any,
    });

    logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      userId: user.id,
      email: user.email,
      details: 'User successfully changed account password',
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Failed to update password. Please try again later.' },
      { status: 500 }
    );
  }
}
