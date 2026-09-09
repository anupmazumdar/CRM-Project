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
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admissions Administrators can reset user passwords.' },
        { status: 403 }
      );
    }

    // VULN-13: Rate limit admin password resets (10 attempts per 15 minutes per admin)
    const rateLimit = await checkAccountActionRateLimit(session.id);
    if (!rateLimit.success) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        userId: session.id,
        email: session.email,
        details: 'Admin password reset rate limit exceeded (10 attempts per 15 minutes)',
      });

      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please try again later.' },
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
    const { userId, newPassword, adminPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Target user ID is required.' },
        { status: 400 }
      );
    }

    // VULN-21: Step-up authentication required to reset team member passwords
    if (!adminPassword || typeof adminPassword !== 'string') {
      return NextResponse.json(
        { error: 'Admin password confirmation is required to reset user passwords.' },
        { status: 401 }
      );
    }

    const actingAdmin = await prisma.user.findUnique({
      where: { id: session.id },
    });

    if (!actingAdmin || !(await comparePassword(adminPassword, actingAdmin.passwordHash))) {
      return NextResponse.json(
        { error: 'Invalid admin password. Step-up authentication failed.' },
        { status: 401 }
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

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Team member account not found.' },
        { status: 404 }
      );
    }

    const passwordHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        tokenVersion: { increment: 1 },
      } as any,
    });

    logSecurityEvent({
      type: 'PASSWORD_CHANGED',
      userId: targetUser.id,
      email: targetUser.email,
      adminId: session.id,
      adminEmail: session.email,
      targetUserId: targetUser.id,
      targetEmail: targetUser.email,
      details: `Password administratively reset for user ${targetUser.email} (${targetUser.id}) by Admin ${session.email} (${session.id})`,
    });

    // TODO: [VULN-14] Integrate transactional notification service (e.g. Resend, SendGrid, or AWS SES).
    // When an administrator resets a user's password, dispatch a security alert to the affected user's
    // email (targetUser.email) alerting them that their credentials were reset by an administrator.
    // CRITICAL REQUIREMENT: Never include the new password, reset links, or tokens in the notification body.

    return NextResponse.json({
      success: true,
      message: `Password successfully reset for ${targetUser.name} (${targetUser.email}).`,
    });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset team member password.' },
      { status: 500 }
    );
  }
}
