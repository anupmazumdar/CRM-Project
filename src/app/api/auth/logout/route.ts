import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, getSessionUserFromRequest } from '@/security/auth';
import { prisma } from '@/database/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (session) {
      await prisma.user.update({
        where: { id: session.id },
        data: { tokenVersion: { increment: 1 } } as any,
      });
    }
  } catch (error) {
    console.error('[Auth Service] Logout error:', error);
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
