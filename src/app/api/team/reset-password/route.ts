import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { getSessionUserFromRequest } from '@/security/auth';
import { hashPassword } from '@/security/password';

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

    const body = await request.json();
    const { userId, newPassword } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Target user ID is required.' },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters long.' },
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
      data: { passwordHash },
    });

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
