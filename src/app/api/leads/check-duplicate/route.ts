import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, phone, excludeId } = body;

    if (!email && !phone) {
      return NextResponse.json({ isDuplicate: false });
    }

    const conditions: any[] = [];
    if (email && email.trim().length > 0) {
      conditions.push({ email: { equals: email.trim() } });
    }
    if (phone && phone.trim().length > 0) {
      conditions.push({ phone: { equals: phone.trim() } });
    }

    if (conditions.length === 0) {
      return NextResponse.json({ isDuplicate: false });
    }

    const existingLeads = await prisma.lead.findMany({
      where: {
        OR: conditions,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        course: true,
        status: true,
        assignedTo: {
          select: {
            name: true,
          },
        },
      },
    });

    if (existingLeads.length > 0) {
      const match = existingLeads[0];
      const reasons: string[] = [];
      if (email && match.email?.toLowerCase() === email.trim().toLowerCase()) {
        reasons.push(`Email (${email})`);
      }
      if (phone && match.phone === phone.trim()) {
        reasons.push(`Phone (${phone})`);
      }

      return NextResponse.json({
        isDuplicate: true,
        matchReason: reasons.join(' and '),
        existingLead: match,
      });
    }

    return NextResponse.json({ isDuplicate: false });
  } catch (error) {
    console.error('Duplicate check error:', error);
    return NextResponse.json({ error: 'Failed to verify duplicate records' }, { status: 500 });
  }
}
