import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';
import { leadCreateSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignedTo = searchParams.get('assignedTo');
    const course = searchParams.get('course');
    const followUpState = searchParams.get('followUpState');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const where: any = {};

    // Strict Role-Based Access Control
    if (session.role === 'MEMBER') {
      where.assignedToId = session.id;
    } else if (assignedTo && assignedTo !== 'all') {
      if (assignedTo === 'unassigned') {
        where.assignedToId = null;
      } else {
        where.assignedToId = assignedTo;
      }
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Source filter
    if (source && source !== 'all') {
      where.source = source;
    }

    // Course filter
    if (course && course !== 'all') {
      where.course = course;
    }

    // Date range filter on createdAt
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Follow-up state filter
    if (followUpState && followUpState !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      if (followUpState === 'OVERDUE') {
        where.nextFollowUpDate = {
          lt: today,
          not: null,
        };
      } else if (followUpState === 'DUE_TODAY') {
        where.nextFollowUpDate = {
          gte: today,
          lt: tomorrow,
        };
      } else if (followUpState === 'UPCOMING') {
        where.nextFollowUpDate = {
          gte: tomorrow,
        };
      } else if (followUpState === 'NONE') {
        where.nextFollowUpDate = null;
      }
    }

    // Global Search across name, phone, email, college
    if (search && search.length > 0) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { college: { contains: search } },
        { course: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [total, leads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              activities: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads records' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = leadCreateSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Validation failed. Please check form fields.' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Determine assignee based on role
    let assignedToId = data.assignedToId || null;
    if (session.role === 'MEMBER') {
      // Member can only create and assign to themselves
      assignedToId = session.id;
    }

    const newLead = await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        college: data.college || null,
        course: data.course,
        gradYear: data.gradYear ? Number(data.gradYear) : null,
        city: data.city || null,
        source: data.source,
        status: data.status,
        assignedToId: assignedToId,
        nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
        notes: data.notes || null,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Auto-create initial activity log
    await prisma.activity.create({
      data: {
        leadId: newLead.id,
        type: 'Follow_up',
        date: new Date(),
        notes: data.notes ? `Lead created. Initial notes: ${data.notes}` : 'Lead record created in CRM',
        nextAction: data.nextFollowUpDate ? 'Follow up scheduled' : null,
        createdById: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      lead: newLead,
      message: 'Student lead created successfully',
    });
  } catch (error) {
    console.error('Create lead error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating lead record' },
      { status: 500 }
    );
  }
}
