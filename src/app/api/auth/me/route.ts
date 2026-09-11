import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromRequest } from '@/security/auth';
import { prisma, withQueryTimeout } from '@/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const user = await withQueryTimeout(
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
        },
      }),
      5000,
      'api/auth/me user lookup'
    );

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Auth check error in /api/auth/me:', error);
    const isTimeout = error?.message?.includes('timed out');
    return NextResponse.json(
      { error: isTimeout ? 'Database query timed out' : 'Internal server error', user: null },
      { status: 500 }
    );
  }
}

