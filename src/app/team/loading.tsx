import React from 'react';

export default function TeamLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-80" />
        </div>
        <div className="h-10 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Table scorecard skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-full" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl w-full" />
        ))}
      </div>
    </div>
  );
}
