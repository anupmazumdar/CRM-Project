import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';

interface RouteContext {
  params: {
    id: string;
  };
}

const VALID_STATUSES = ['New', 'Contacted', 'Interested', 'Follow_up', 'Converted', 'Lost'];

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, note } = body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid lead status provided' }, { status: 400 });
    }

    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (session.role === 'MEMBER' && existingLead.assignedToId !== session.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only update status for assigned leads.' },
        { status: 403 }
      );
    }

    const previousStatus = existingLead.status;
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: { status },
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

    // Automatically record activity for status transition
    await prisma.activity.create({
      data: {
        leadId: id,
        type: 'Follow_up',
        date: new Date(),
        notes: note || `Status changed from ${previousStatus} to ${status}`,
        nextAction: status === 'Converted' ? 'Admissions enrolled' : null,
        createdById: session.id,
      },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: `Status updated to ${status}`,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 });
  }
}
