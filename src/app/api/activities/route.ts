import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { getSessionUserFromRequest } from '@/security/auth';
import { activitySchema } from '@/database/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = {};

    if (leadId) {
      where.leadId = leadId;
    }

    // Role check: If member, only get activities for leads assigned to them or created by them
    if (session.role === 'MEMBER') {
      where.OR = [
        { lead: { assignedToId: session.id } },
        { createdById: session.id },
      ];
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
            course: true,
            status: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Fetch activities error:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = activitySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Invalid activity payload' },
        { status: 400 }
      );
    }

    const { leadId, type, date, notes, nextAction, nextFollowUpDate, updateStatusTo } = result.data;

    // Check if lead exists and permissions
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (session.role === 'MEMBER' && lead.assignedToId !== session.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only log activities for your assigned leads.' },
        { status: 403 }
      );
    }

    // Create activity record
    const newActivity = await prisma.activity.create({
      data: {
        leadId,
        type,
        date: new Date(date),
        notes,
        nextAction: nextAction || null,
        createdById: session.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Handle optional inline updates: nextFollowUpDate and updateStatusTo
    const leadUpdateData: any = {};

    if (nextFollowUpDate && nextFollowUpDate.trim() !== '') {
      leadUpdateData.nextFollowUpDate = new Date(nextFollowUpDate);
    }

    if (updateStatusTo && updateStatusTo.trim() !== '') {
      leadUpdateData.status = updateStatusTo;
    }

    if (Object.keys(leadUpdateData).length > 0) {
      await prisma.lead.update({
        where: { id: leadId },
        data: leadUpdateData,
      });
    }

    return NextResponse.json({
      success: true,
      activity: newActivity,
      message: 'Activity logged successfully',
    });
  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json({ error: 'Failed to record activity' }, { status: 500 });
  }
}
