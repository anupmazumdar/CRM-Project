'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function FollowUpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Follow-ups page error:', error);
  }, [error]);

  return (
    <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8 shadow-lg shadow-red-950/5 animate-fadeIn">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Failed to Load Follow-ups Queue
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We encountered an issue retrieving scheduled follow-up tasks and reminders.
        </p>
      </div>
      {error?.message && (
        <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl">
          {error.message}
        </p>
      )}
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
