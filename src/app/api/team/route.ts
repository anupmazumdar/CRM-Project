import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { userCreateSchema } from '@/lib/validation';
import { getFollowUpStatus } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admins can view team performance details.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    // Sane cap: limit up to 200 per page to safeguard database memory
    const requestedLimit = parseInt(searchParams.get('limit') || '100', 10);
    const limit = Math.min(Math.max(1, requestedLimit), 200);
    const skip = (page - 1) * limit;

    // NOTE (Scalability): For large institutions with hundreds of counsellors, full cursor-based
    // or offset pagination should be used here. Default limit is capped at 100 users (max 200 per query).
    const [totalUsers, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          createdAt: true,
          assignedLeads: {
            select: {
              id: true,
              status: true,
              nextFollowUpDate: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    const teamStats = users.map((u: any) => {
      const leads = u.assignedLeads || [];
      const assignedCount = leads.length;
      const contactedCount = leads.filter((l: any) => l.status === 'Contacted').length;
      const interestedCount = leads.filter((l: any) => l.status === 'Interested').length;
      const convertedCount = leads.filter((l: any) => l.status === 'Converted').length;
      const lostCount = leads.filter((l: any) => l.status === 'Lost').length;
      const conversionRate = assignedCount > 0 ? Math.round((convertedCount / assignedCount) * 100) : 0;

      const overdueFollowUps = leads.filter((l: any) => {
        if (!l.nextFollowUpDate) return false;
        return getFollowUpStatus(l.nextFollowUpDate) === 'OVERDUE';
      }).length;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
        assignedCount,
        contactedCount,
        interestedCount,
        convertedCount,
        lostCount,
        conversionRate,
        overdueFollowUps,
        createdAt: u.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      team: teamStats,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
        isCapped: totalUsers > limit,
      },
    });
  } catch (error) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ error: 'Failed to fetch team details' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Admins can add team members.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = userCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid user data' },
        { status: 400 }
      );
    }

    const { name, email, password, role, department } = result.data;

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email address already exists.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        department: department || 'Admissions',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `Team member ${name} created successfully`,
    });
  } catch (error) {
    console.error('Create team member error:', error);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
