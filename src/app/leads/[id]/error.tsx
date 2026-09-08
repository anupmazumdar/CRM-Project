'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';

export default function StudentDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Student profile page error:', error);
  }, [error]);

  return (
    <div className="p-8 sm:p-12 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8 shadow-lg shadow-red-950/5 animate-fadeIn">
      <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Failed to Load Student Profile
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          We encountered an issue loading this student&apos;s profile and communication history.
        </p>
      </div>
      {error?.message && (
        <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-2.5 rounded-xl">
          {error.message}
        </p>
      )}
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
        <Link
          href="/leads"
          className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold rounded-xl transition inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Leads</span>
        </Link>
      </div>
    </div>
  );
}
