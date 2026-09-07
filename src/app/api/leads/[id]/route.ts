import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';
import { leadSchema } from '@/lib/validation';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
          },
        },
        activities: {
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
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead record not found' }, { status: 404 });
    }

    // Role-based check: Member can only view assigned leads
    if (session.role === 'MEMBER' && lead.assignedToId !== session.id) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to view this student lead.' },
        { status: 403 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Fetch lead detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch lead profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead record not found' }, { status: 404 });
    }

    // Role check: Member can only edit their own assigned lead
    if (session.role === 'MEMBER' && existingLead.assignedToId !== session.id) {
      return NextResponse.json(
        { error: 'Access denied. You can only edit leads assigned to you.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const data = result.data;

    // Assignment handling: Only Admin can reassign to someone else
    let assignedToId = existingLead.assignedToId;
    if (session.role === 'ADMIN') {
      assignedToId = data.assignedToId || null;
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
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
        assignedToId,
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

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: 'Lead updated successfully',
    });
  } catch (error) {
    console.error('Update lead error:', error);
    return NextResponse.json({ error: 'Failed to update lead record' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead record not found' }, { status: 404 });
    }

    // Role check: Only Admin can delete leads
    if (session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permission denied. Only Administrators can delete lead records.' },
        { status: 403 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Lead record deleted successfully',
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ error: 'Failed to delete lead record' }, { status: 500 });
  }
}
