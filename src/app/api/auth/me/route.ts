import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserFromRequest } from '@/security/auth';
import { prisma } from '@/database/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found.' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
