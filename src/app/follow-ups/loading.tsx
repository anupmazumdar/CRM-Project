import React from 'react';

export default function FollowUpsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-80" />
      </div>

      {/* Tabs / metric counters skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        ))}
      </div>

      {/* List skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 dark:bg-slate-850 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
