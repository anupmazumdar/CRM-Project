import React from 'react';
import { getFollowUpStatus, getFollowUpTagInfo, formatDate } from '@/lib/utils';
import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface FollowUpBadgeProps {
  date: string | Date | null | undefined;
  showDate?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const FollowUpBadge: React.FC<FollowUpBadgeProps> = ({
  date,
  showDate = false,
  className = '',
  size = 'md',
}) => {
  const status = getFollowUpStatus(date);
  const tagInfo = getFollowUpTagInfo(status);

  if (status === 'NONE') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 ${className}`}>
        <Clock className="w-3 h-3" />
        <span>No date</span>
      </span>
    );
  }

  const getIcon = () => {
    switch (status) {
      case 'OVERDUE':
        return <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />;
      case 'DUE_TODAY':
        return <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />;
      case 'UPCOMING':
        return <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Calendar className="w-3 h-3" />;
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${tagInfo.badgeClass} ${sizeClass} ${className}`}
      title={date ? `Follow-up: ${formatDate(date, true)}` : ''}
    >
      {getIcon()}
      <span>{tagInfo.label}</span>
      {showDate && date && (
        <span className="text-[11px] opacity-80 border-l border-current/20 pl-1.5 ml-0.5">
          {formatDate(date)}
        </span>
      )}
    </span>
  );
};
