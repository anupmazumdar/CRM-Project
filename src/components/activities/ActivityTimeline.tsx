import React from 'react';
import { ActivityItem, ActivityType } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { PhoneCall, Mail, MessageCircle, Users, CalendarCheck, Clock, ArrowRight, User } from 'lucide-react';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  onAddActivityClick?: () => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities, onAddActivityClick }) => {
  const getActivityIcon = (type: ActivityType | string) => {
    switch (type) {
      case 'Call':
        return <PhoneCall className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'WhatsApp':
        return <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-violet-600 dark:text-violet-400" />;
      case 'Meeting':
        return <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'Follow_up':
      default:
        return <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getIconBackground = (type: ActivityType | string) => {
    switch (type) {
      case 'Call':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/60 dark:border-blue-800';
      case 'WhatsApp':
        return 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/60 dark:border-emerald-800';
      case 'Email':
        return 'bg-violet-50 border-violet-200 dark:bg-violet-950/60 dark:border-violet-800';
      case 'Meeting':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/60 dark:border-amber-800';
      case 'Follow_up':
      default:
        return 'bg-purple-50 border-purple-200 dark:bg-purple-950/60 dark:border-purple-800';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No interaction history recorded</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Log phone calls, WhatsApp messages, emails, or campus visits to maintain complete lead communication audit.
        </p>
        {onAddActivityClick && (
          <button
            onClick={onAddActivityClick}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl transition"
          >
            + Record First Interaction
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
      {activities.map((act) => (
        <div key={act.id} className="relative group">
          {/* Timeline node icon */}
          <div
            className={`absolute -left-6 top-0 w-6 h-6 rounded-full border flex items-center justify-center shadow-sm ${getIconBackground(
              act.type
            )}`}
          >
            {getActivityIcon(act.type)}
          </div>

          {/* Activity card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {act.type.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {act.createdBy?.name || 'Counsellor'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span title={formatDate(act.date, true)}>{formatRelativeTime(act.date)}</span>
                <span>({formatDate(act.date, false)})</span>
              </div>
            </div>

            {/* Notes */}
            <p className="mt-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {act.notes}
            </p>

            {/* Next Action Pill */}
            {act.nextAction && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl text-xs text-blue-700 dark:text-blue-300 font-medium">
                <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                <span>Next Action: {act.nextAction}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
