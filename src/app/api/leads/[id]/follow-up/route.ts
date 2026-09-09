import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { getSessionUserFromRequest } from '@/security/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { nextFollowUpDate, note } = body;

    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (session.role === 'MEMBER' && existingLead.assignedToId !== session.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only update follow-up for your assigned leads.' },
        { status: 403 }
      );
    }

    let parsedDate: Date | null = null;
    if (nextFollowUpDate) {
      parsedDate = new Date(nextFollowUpDate);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date provided' }, { status: 400 });
      }
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        nextFollowUpDate: parsedDate,
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

    if (note || parsedDate) {
      await prisma.activity.create({
        data: {
          leadId: id,
          type: 'Follow_up',
          date: new Date(),
          notes: note || (parsedDate ? `Follow-up rescheduled to ${parsedDate.toLocaleDateString()}` : 'Follow-up date cleared'),
          nextAction: parsedDate ? 'Scheduled follow-up reminder' : null,
          createdById: session.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Follow-up date updated successfully',
    });
  } catch (error) {
    console.error('Update follow-up error:', error);
    return NextResponse.json({ error: 'Failed to update follow-up date' }, { status: 500 });
  }
}
