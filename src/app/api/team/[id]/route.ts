import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';
import { getSessionUserFromRequest } from '@/security/auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admissions Administrators can access team member details.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const user = await prisma.user.findUnique({
      where: { id },
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
      return NextResponse.json({ error: 'Team member record not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Fetch team member error:', error);
    return NextResponse.json({ error: 'Failed to fetch team member details' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admissions Administrators can modify team members.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Team member record not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, department, role } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Valid full name is required (minimum 2 characters).' },
        { status: 400 }
      );
    }

    if (role && role !== 'ADMIN' && role !== 'MEMBER') {
      return NextResponse.json(
        { error: 'Role must be either ADMIN or MEMBER.' },
        { status: 400 }
      );
    }

    // Guard against self-demotion if it's the current session user
    if (session.id === id && role === 'MEMBER' && session.role === 'ADMIN') {
      return NextResponse.json(
        { error: 'You cannot revoke your own Administrator privileges.' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name.trim(),
        department: department?.trim() || 'Admissions',
        ...(role ? { role } : {}),
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
      user: updatedUser,
      message: `Team member ${updatedUser.name} updated successfully`,
    });
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden. Only Admissions Administrators can remove team members.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Prevent self-deletion
    if (session.id === id) {
      return NextResponse.json(
        { error: 'Administrators cannot remove their own account.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Team member record not found' }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Team member ${targetUser.name} removed successfully`,
    });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 });
  }
}
