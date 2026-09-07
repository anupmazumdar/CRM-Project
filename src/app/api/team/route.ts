import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { userCreateSchema } from '@/lib/validation';
import { getFollowUpStatus } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
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
    });

    const teamStats = users.map((u) => {
      const leads = u.assignedLeads || [];
      const assignedCount = leads.length;
      const contactedCount = leads.filter((l) => l.status === 'Contacted').length;
      const interestedCount = leads.filter((l) => l.status === 'Interested').length;
      const convertedCount = leads.filter((l) => l.status === 'Converted').length;
      const lostCount = leads.filter((l) => l.status === 'Lost').length;
      const conversionRate = assignedCount > 0 ? Math.round((convertedCount / assignedCount) * 100) : 0;

      const overdueFollowUps = leads.filter((l) => {
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

    return NextResponse.json({ team: teamStats });
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
