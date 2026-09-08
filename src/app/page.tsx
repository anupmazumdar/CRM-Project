'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StatCards } from '@/components/dashboard/StatCards';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { FollowUpWidget } from '@/components/dashboard/FollowUpWidget';
import { RecentActivitiesWidget } from '@/components/dashboard/RecentActivitiesWidget';
import { DashboardMetrics } from '@/lib/types';
import { RefreshCw, Sparkles, TrendingUp, AlertCircle, GraduationCap, UserPlus } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics');
      }
      const metrics: DashboardMetrics = await res.json();
      setData(metrics);
      setLastRefreshed(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-base font-bold text-red-700 dark:text-red-300">Failed to Load Dashboard</h3>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-blue-950/30 relative overflow-hidden">
        {/* Background visual accents */}
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admissions Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1 text-white">
            XYZ College Executive CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Live student inquiries, conversions, counsellor workloads, and pending follow-ups.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl backdrop-blur-sm transition flex items-center gap-1.5"
            title="Refresh live metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{lastRefreshed ? `Refreshed ${lastRefreshed}` : 'Refresh Data'}</span>
          </button>
        </div>
      </div>

      {/* First-Time Setup / Empty Database Onboarding Banner */}
      {data.counts.total === 0 && (
        <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-4 shadow-sm animate-fadeIn">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 flex items-center justify-center shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Welcome to XYZ College Admissions CRM
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Your admissions database is currently ready for its first inquiries. Register student leads or configure your counsellor team to start populating live analytics.
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/leads"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20 inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <span>+ Register First Student Lead</span>
            </Link>
            <Link
              href="/team"
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition inline-flex items-center gap-1.5 min-h-[40px]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Configure Counsellors</span>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <StatCards counts={data.counts} />

      {/* Interactive Analytics Visualizations */}
      <AnalyticsCharts
        leadsBySource={data.leadsBySource}
        leadsByStatus={data.leadsByStatus}
        monthlyRegistrations={data.monthlyRegistrations}
        teamPerformance={data.teamPerformance}
      />

      {/* Two Column Section: Priority Follow-ups & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FollowUpWidget urgentFollowUps={data.urgentFollowUps} />
        <RecentActivitiesWidget activities={data.recentActivities} />
      </div>
    </div>
  );
}
