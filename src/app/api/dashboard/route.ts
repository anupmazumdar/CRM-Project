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

    const where: any = {};
    if (session.role === 'MEMBER') {
      where.assignedToId = session.id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch live counts in parallel
    const [
      total,
      newCount,
      contactedCount,
      interestedCount,
      followUpCount,
      convertedCount,
      lostCount,
      dueTodayOrOverdueCount,
      leadsList,
      usersList,
      recentActivities,
    ] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({ where: { ...where, status: 'New' } }),
      prisma.lead.count({ where: { ...where, status: 'Contacted' } }),
      prisma.lead.count({ where: { ...where, status: 'Interested' } }),
      prisma.lead.count({ where: { ...where, status: 'Follow_up' } }),
      prisma.lead.count({ where: { ...where, status: 'Converted' } }),
      prisma.lead.count({ where: { ...where, status: 'Lost' } }),
      prisma.lead.count({
        where: {
          ...where,
          nextFollowUpDate: {
            lt: tomorrow,
            not: null,
          },
        },
      }),
      // Fetch all relevant leads for detailed aggregation (charts & stats)
      prisma.lead.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          course: true,
          city: true,
          source: true,
          status: true,
          nextFollowUpDate: true,
          assignedToId: true,
          createdAt: true,
          assignedTo: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      // Fetch users for team performance (for Admin, all members; for Member, just self)
      prisma.user.findMany({
        where: session.role === 'MEMBER' ? { id: session.id } : {},
        select: {
          id: true,
          name: true,
          role: true,
        },
      }),
      // Fetch recent activities
      prisma.activity.findMany({
        where: session.role === 'MEMBER' ? { lead: { assignedToId: session.id } } : {},
        include: {
          createdBy: {
            select: {
              name: true,
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
        take: 8,
      }),
    ]);

    // Compute conversion rate
    const conversionRate = total > 0 ? Math.round((convertedCount / total) * 100 * 10) / 10 : 0;

    // Aggregate Leads by Source
    const sourceMap: Record<string, number> = {};
    leadsList.forEach((l: any) => {
      const src = l.source || 'Other';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });

    const leadsBySource = Object.entries(sourceMap)
      .map(([source, count]) => ({
        source: source.replace(/_/g, ' '),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.count - a.count);

    // Aggregate Leads by Status
    const statusColors: Record<string, string> = {
      New: '#38bdf8',
      Contacted: '#818cf8',
      Interested: '#fbbf24',
      Follow_up: '#c084fc',
      Converted: '#34d399',
      Lost: '#f87171',
    };

    const statusMap: Record<string, number> = {
      New: newCount,
      Contacted: contactedCount,
      Interested: interestedCount,
      Follow_up: followUpCount,
      Converted: convertedCount,
      Lost: lostCount,
    };

    const leadsByStatus = Object.entries(statusMap).map(([status, count]) => ({
      status: status.replace(/_/g, ' '),
      count,
      color: statusColors[status] || '#94a3b8',
    }));

    // Aggregate Monthly Registrations (Last 6 months)
    const monthlyMap: Record<string, { leads: number; converted: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyMap[key] = { leads: 0, converted: 0 };
    }

    leadsList.forEach((l: any) => {
      const d = new Date(l.createdAt);
      const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
      if (monthlyMap[key]) {
        monthlyMap[key].leads += 1;
        if (l.status === 'Converted') {
          monthlyMap[key].converted += 1;
        }
      }
    });

    const monthlyRegistrations = Object.entries(monthlyMap).map(([month, val]) => ({
      month,
      leads: val.leads,
      converted: val.converted,
    }));

    // Team Performance computation
    const userStatsMap: Record<string, { assigned: number; contacted: number; interested: number; converted: number }> = {};
    usersList.forEach((u: any) => {
      userStatsMap[u.id] = { assigned: 0, contacted: 0, interested: 0, converted: 0 };
    });

    leadsList.forEach((l: any) => {
      if (l.assignedToId && userStatsMap[l.assignedToId]) {
        userStatsMap[l.assignedToId].assigned += 1;
        if (l.status === 'Contacted') userStatsMap[l.assignedToId].contacted += 1;
        if (l.status === 'Interested') userStatsMap[l.assignedToId].interested += 1;
        if (l.status === 'Converted') userStatsMap[l.assignedToId].converted += 1;
      }
    });

    const teamPerformance = usersList
      .filter((u: any) => session.role === 'ADMIN' || u.id === session.id)
      .map((u: any) => {
        const stats = userStatsMap[u.id] || { assigned: 0, contacted: 0, interested: 0, converted: 0 };
        const convRate = stats.assigned > 0 ? Math.round((stats.converted / stats.assigned) * 100) : 0;
        return {
          counsellorId: u.id,
          counsellorName: u.name,
          assigned: stats.assigned,
          contacted: stats.contacted,
          interested: stats.interested,
          converted: stats.converted,
          conversionRate: convRate,
        };
      })
      .sort((a: any, b: any) => b.assigned - a.assigned);

    // Urgent Follow-ups (Overdue + Due Today)
    const urgentFollowUps = leadsList
      .filter((l: any) => {
        if (!l.nextFollowUpDate) return false;
        const s = getFollowUpStatus(l.nextFollowUpDate);
        return s === 'OVERDUE' || s === 'DUE_TODAY';
      })
      .map((l: any) => {
        const fStatus = getFollowUpStatus(l.nextFollowUpDate);
        const target = new Date(l.nextFollowUpDate!);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          ...l,
          createdAt: l.createdAt.toISOString(),
          nextFollowUpDate: l.nextFollowUpDate ? l.nextFollowUpDate.toISOString() : null,
          followUpStatus: fStatus,
          daysDiff: diffDays,
        };
      })
      .sort((a: any, b: any) => a.daysDiff - b.daysDiff)
      .slice(0, 10);

    return NextResponse.json({
      counts: {
        total,
        new: newCount,
        contacted: contactedCount,
        interested: interestedCount,
        followUpDue: dueTodayOrOverdueCount || followUpCount,
        converted: convertedCount,
        lost: lostCount,
        conversionRate,
      },
      leadsBySource,
      leadsByStatus,
      monthlyRegistrations,
      teamPerformance,
      urgentFollowUps,
      recentActivities,
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json({ error: 'Failed to compute dashboard metrics' }, { status: 500 });
  }
}
