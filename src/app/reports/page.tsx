'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  Download,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error('Fetch reports error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (isLoading && !reportData) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const { summary, sourcePerformance, coursePerformance, followUpHealth, activityBreakdown, teamPerformance } =
    reportData || {};

  return (
    <div className="space-y-6">
      {/* Header & Date Range */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Admissions Intelligence</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            Admissions Analytics & SLA Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Conversion funnels, lead-source ROI, program interest, and follow-up compliance.
          </p>
        </div>

        {/* Date Filter Bar */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-1.5 px-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-transparent outline-none text-slate-700 dark:text-slate-300"
            />
          </div>
          <span className="text-slate-300">to</span>
          <div className="flex items-center gap-1.5 px-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-transparent outline-none text-slate-700 dark:text-slate-300"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-2 py-1 text-xs text-rose-600 font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Inquiries
          </span>
          <div className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
            {summary?.totalLeads || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total registered leads</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Enrolled / Converted
          </span>
          <div className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {summary?.convertedLeads || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Official admissions secured</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Overall Conversion Rate
          </span>
          <div className="mt-2 text-3xl font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <span>{summary?.overallConversionRate || 0}%</span>
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Converted / Total ratio</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Follow-up SLA On-Time Rate
          </span>
          <div className="mt-2 text-3xl font-black text-purple-600 dark:text-purple-400">
            {followUpHealth?.onTimeRate || 0}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {followUpHealth?.overdue || 0} overdue tasks pending
          </p>
        </div>
      </div>

      {/* Grid: Source Performance & Program Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Performance Table & Bar */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lead Source Conversion ROI</h3>
            </div>
            <span className="text-xs text-slate-400">Ranked by volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2">Source Channel</th>
                  <th className="py-2 text-center">Total Inquiries</th>
                  <th className="py-2 text-center">Converted</th>
                  <th className="py-2 text-right">Conversion %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {sourcePerformance?.map((item: any) => (
                  <tr key={item.source} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{item.source}</td>
                    <td className="py-2.5 text-center font-medium text-slate-600 dark:text-slate-400">
                      {item.total}
                    </td>
                    <td className="py-2.5 text-center font-bold text-emerald-600">{item.converted}</td>
                    <td className="py-2.5 text-right font-black text-blue-600 dark:text-blue-400">
                      {item.conversionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Course Popularity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Course Demand & Enrollment</h3>
            </div>
            <span className="text-xs text-slate-400">Inquiry vs Conversion</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coursePerformance?.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="course" tick={{ fontSize: 9 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="total" name="Total Inquiries" fill="#818cf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="converted" name="Enrolled Students" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Column: Activity Channel Breakdown & Follow-Up Health Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Team Outreach by Channel ({summary?.totalActivities || 0} Interactions)
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {activityBreakdown?.map((act: any) => (
              <div
                key={act.type}
                className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60"
              >
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                  {act.type.replace(/_/g, ' ')}
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {act.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up SLA Compliance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Follow-up SLA Compliance</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                Upcoming & On-Time
              </span>
              <div className="text-2xl font-black text-emerald-800 dark:text-emerald-200 mt-1">
                {followUpHealth?.upcoming || 0}
              </div>
              <p className="text-[10px] text-emerald-600 mt-0.5">Healthy communication pipeline</p>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800">
              <span className="text-xs font-bold text-red-700 dark:text-red-300 uppercase">
                Overdue Targets
              </span>
              <div className="text-2xl font-black text-red-800 dark:text-red-200 mt-1">
                {followUpHealth?.overdue || 0}
              </div>
              <p className="text-[10px] text-red-600 mt-0.5">Requires immediate counsellor call</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
