'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Settings error:', error);
  }, [error]);

  return (
    <div className="p-8 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-8 shadow-sm">
      <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
      <h3 className="text-base font-bold text-red-700 dark:text-red-300">
        Unable to Load Account Settings
      </h3>
      <p className="text-xs text-red-600 dark:text-red-400">
        {error?.message || 'An unexpected error occurred while loading your profile settings.'}
      </p>
      <div className="flex items-center justify-center gap-3 pt-2">
        <button
          onClick={() => reset()}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
        <Link
          href="/"
          className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition flex items-center gap-1.5"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
