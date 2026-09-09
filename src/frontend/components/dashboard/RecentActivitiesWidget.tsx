import React from 'react';
import Link from 'next/link';
import { ActivityItem } from '@/backend/types';
import { formatDate, formatRelativeTime } from '@/frontend/utils/ui-helpers';
import { History, PhoneCall, Mail, MessageCircle, Users, CalendarCheck, ArrowRight, User } from 'lucide-react';

interface RecentActivitiesWidgetProps {
  activities: ActivityItem[];
}

export const RecentActivitiesWidget: React.FC<RecentActivitiesWidgetProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'Call':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
      case 'WhatsApp':
        return <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />;
      case 'Meeting':
        return <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
      case 'Follow_up':
      default:
        return <CalendarCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-blue-600 dark:text-blue-400">
            <History className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Team Interactions</h3>
        </div>
        <span className="text-xs text-slate-400">Live Activity Feed</span>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">No recent activities logged yet.</div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-1">
          {activities.slice(0, 6).map((act) => (
            <div
              key={act.id}
              className="py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
            >
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                {getActivityIcon(act.type)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    {act.lead ? (
                      <Link
                        href={`/leads/${act.lead.id}`}
                        className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                      >
                        {act.lead.name}
                      </Link>
                    ) : (
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">Student</span>
                    )}
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {act.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {formatRelativeTime(act.date)}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {act.notes}
                </p>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    {act.createdBy?.name || 'Counsellor'}
                  </span>
                  {act.nextAction && (
                    <>
                      <span>•</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                        Action: {act.nextAction}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
