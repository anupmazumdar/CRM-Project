import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/auth';
import { getFollowUpStatus } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (session.role === 'MEMBER') {
      where.assignedToId = session.id;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const requestedLimit = parseInt(searchParams.get('limit') || '200', 10);
    const leadCap = Math.min(Math.max(1, requestedLimit), 500);

    // NOTE (Scalability): When lead volume exceeds thousands, in-memory aggregation
    // will cause high latency and memory spikes. Full pagination, scheduled materialized rollups,
    // and database-level aggregations (e.g. prisma.lead.groupBy) should be added as admissions grow.
    // Query is capped at `leadCap` (default 200) with total count tracked separately.
    const [totalLeadCount, leads, users, activities] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        take: leadCap,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.user.findMany({
        where: session.role === 'MEMBER' ? { id: session.id } : {},
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.activity.findMany({
        where: session.role === 'MEMBER' ? { lead: { assignedToId: session.id } } : {},
        take: 500,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          type: true,
          date: true,
        },
      }),
    ]);

    const totalLeads = leads.length;
    const convertedLeads = leads.filter((l) => l.status === 'Converted').length;
    const lostLeads = leads.filter((l) => l.status === 'Lost').length;
    const overallConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100 * 10) / 10 : 0;

    // Source Performance
    const sourceMap: Record<string, { total: number; converted: number; lost: number }> = {};
    leads.forEach((l) => {
      const src = (l.source || 'Other').replace(/_/g, ' ');
      if (!sourceMap[src]) sourceMap[src] = { total: 0, converted: 0, lost: 0 };
      sourceMap[src].total += 1;
      if (l.status === 'Converted') sourceMap[src].converted += 1;
      if (l.status === 'Lost') sourceMap[src].lost += 1;
    });

    const sourcePerformance = Object.entries(sourceMap)
      .map(([source, data]) => ({
        source,
        total: data.total,
        converted: data.converted,
        lost: data.lost,
        conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Course Performance
    const courseMap: Record<string, { total: number; converted: number }> = {};
    leads.forEach((l) => {
      const c = l.course || 'Unspecified';
      if (!courseMap[c]) courseMap[c] = { total: 0, converted: 0 };
      courseMap[c].total += 1;
      if (l.status === 'Converted') courseMap[c].converted += 1;
    });

    const coursePerformance = Object.entries(courseMap)
      .map(([course, data]) => ({
        course,
        total: data.total,
        converted: data.converted,
        conversionRate: data.total > 0 ? Math.round((data.converted / data.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Follow-up SLA & Status Health
    let overdueCount = 0;
    let dueTodayCount = 0;
    let upcomingCount = 0;
    let noFollowUpCount = 0;

    leads.forEach((l) => {
      const status = getFollowUpStatus(l.nextFollowUpDate);
      if (status === 'OVERDUE') overdueCount += 1;
      else if (status === 'DUE_TODAY') dueTodayCount += 1;
      else if (status === 'UPCOMING') upcomingCount += 1;
      else noFollowUpCount += 1;
    });

    // Activities breakdown by channel
    const activityMap: Record<string, number> = {};
    activities.forEach((a) => {
      const type = a.type || 'Other';
      activityMap[type] = (activityMap[type] || 0) + 1;
    });

    const activityBreakdown = Object.entries(activityMap).map(([type, count]) => ({
      type,
      count,
    }));

    // Counsellor Performance
    const counsellorMap: Record<string, { total: number; converted: number; contacted: number }> = {};
    users.forEach((u) => {
      counsellorMap[u.id] = { total: 0, converted: 0, contacted: 0 };
    });

    leads.forEach((l) => {
      if (l.assignedToId && counsellorMap[l.assignedToId]) {
        counsellorMap[l.assignedToId].total += 1;
        if (l.status === 'Converted') counsellorMap[l.assignedToId].converted += 1;
        if (l.status === 'Contacted' || l.status === 'Interested') counsellorMap[l.assignedToId].contacted += 1;
      }
    });

    const teamPerformance = users.map((u) => {
      const stats = counsellorMap[u.id] || { total: 0, converted: 0, contacted: 0 };
      return {
        id: u.id,
        name: u.name,
        total: stats.total,
        contacted: stats.contacted,
        converted: stats.converted,
        conversionRate: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
      };
    }).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      summary: {
        totalLeads: totalLeadCount,
        analyzedLeads: totalLeads,
        isCapped: totalLeadCount > totalLeads,
        sampleCap: leadCap,
        convertedLeads,
        lostLeads,
        overallConversionRate,
        totalActivities: activities.length,
      },
      sourcePerformance,
      coursePerformance,
      followUpHealth: {
        overdue: overdueCount,
        dueToday: dueTodayCount,
        upcoming: upcomingCount,
        noFollowUp: noFollowUpCount,
        onTimeRate: (totalLeads - overdueCount) > 0 ? Math.round(((totalLeads - overdueCount) / totalLeads) * 100) : 0,
      },
      activityBreakdown,
      teamPerformance,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Failed to generate reports' }, { status: 500 });
  }
}
