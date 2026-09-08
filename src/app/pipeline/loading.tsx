import React from 'react';

export default function PipelineLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" />
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-80" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-[1300px]">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex-1 min-w-[250px] max-w-[280px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col space-y-3 min-h-[450px]"
            >
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-28" />
              <div className="h-28 bg-white dark:bg-slate-800 rounded-xl" />
              <div className="h-28 bg-white dark:bg-slate-800 rounded-xl" />
              <div className="h-28 bg-white dark:bg-slate-800 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
