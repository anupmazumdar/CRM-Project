import React from 'react';

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-pulse">
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-56" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-72" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="md:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    </div>
  );
}
