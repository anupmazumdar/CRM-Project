import React, { useState } from 'react';
import { Menu, Bell, LogOut, Plus, ShieldCheck, User, Settings as SettingsIcon } from 'lucide-react';
import { UserSession } from '@/lib/types';
import Link from 'next/link';

interface NavbarProps {
  currentUser: UserSession | null;
  onOpenMobileSidebar: () => void;
  onOpenNewLeadModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenMobileSidebar,
  onOpenNewLeadModal,
}) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      {/* Mobile toggle button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Admissions Management
          </span>
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {currentUser?.role === 'ADMIN' ? 'College Admissions Portal (Administrator)' : 'Counsellor Workstation'}
          </h2>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick follow-ups alert badge */}
        <Link
          href="/follow-ups"
          className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition relative"
          title="View Follow-up Queue"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        </Link>

        {/* Quick register student button */}
        <button
          onClick={onOpenNewLeadModal}
          className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Lead</span>
        </button>

        {/* User Role Pill & Logout */}
        <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800 gap-2">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
              {currentUser?.name}
            </span>
            <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1">
              {currentUser?.role === 'ADMIN' ? (
                <ShieldCheck className="w-3 h-3 text-purple-600" />
              ) : (
                <User className="w-3 h-3 text-blue-600" />
              )}
              {currentUser?.role}
            </span>
          </div>

          <Link
            href="/settings"
            className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            title="Account Settings & Password"
            aria-label="Account Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </Link>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Logout of CRM"
            aria-label="Logout of CRM"
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition disabled:opacity-50"
          >
            {isLoggingOut ? (
              <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
