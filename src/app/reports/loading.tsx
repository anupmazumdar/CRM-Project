import React from 'react';

export default function ReportsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-80" />
        </div>
        <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    </div>
  );
}
