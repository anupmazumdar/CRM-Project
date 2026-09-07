import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Kanban,
  Clock,
  UserCheck,
  BarChart3,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { UserSession } from '@/lib/types';

interface SidebarProps {
  currentUser: UserSession | null;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, isOpen, onCloseMobile }) => {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Student Leads', href: '/leads', icon: Users },
    { name: 'Admissions Pipeline', href: '/pipeline', icon: Kanban },
    { name: 'Follow-ups Queue', href: '/follow-ups', icon: Clock },
    { name: 'Team Performance', href: '/team', icon: UserCheck },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>XYZ College</span>
            </h1>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Admissions CRM
            </p>
          </div>
        </div>

        {/* User profile capsule in sidebar */}
        <div className="p-4 mx-3 my-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {currentUser?.name || 'Admissions User'}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                  currentUser?.role === 'ADMIN'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                }`}
              >
                {currentUser?.role || 'MEMBER'}
              </span>
              <span className="text-[10px] text-slate-400 truncate">
                {currentUser?.department || 'Admissions'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Banner */}
        <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Admissions 2026 Batch</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Centralized CRM replacing Excel & WhatsApp leads.
          </p>
        </div>
      </aside>
    </>
  );
};
