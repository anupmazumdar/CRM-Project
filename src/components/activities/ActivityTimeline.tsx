import React, { useState } from 'react';
import { ActivityItem, ActivityType, UserSession } from '@/lib/types';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import {
  PhoneCall,
  Mail,
  MessageCircle,
  Users,
  CalendarCheck,
  Clock,
  ArrowRight,
  User,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';

interface ActivityTimelineProps {
  activities: ActivityItem[];
  currentUser?: UserSession | null;
  onAddActivityClick?: () => void;
  onActivityDeleted?: (activityId: string) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activities,
  currentUser,
  onAddActivityClick,
  onActivityDeleted,
}) => {
  const [deletingActivity, setDeletingActivity] = useState<ActivityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

  const handleDeleteActivity = async () => {
    if (!deletingActivity) return;
    setIsDeleting(true);
    setDeleteError('');

    try {
      const res = await fetch(`/api/activities/${deletingActivity.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405 || res.status === 501) {
        setDeleteError(
          'Activity deletion endpoint is not yet available on the backend (DELETE /api/activities/[id]).'
        );
        return;
      }

      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete activity log.');
        return;
      }

      const deletedId = deletingActivity.id;
      setDeletingActivity(null);
      setToastMessage('Activity entry removed successfully.');
      setTimeout(() => setToastMessage(''), 3500);
      onActivityDeleted?.(deletedId);
    } catch {
      setDeleteError('Network communication error while requesting activity deletion.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No interaction history recorded
        </h4>
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
      {/* Informational Toast if activity deleted */}
      {toastMessage && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage('')} className="p-1 text-emerald-500 hover:text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {activities.map((act) => {
        // Can delete if current user is ADMIN or the author of the activity
        const canDelete = Boolean(
          currentUser &&
            (currentUser.role === 'ADMIN' ||
              currentUser.id === act.createdById ||
              currentUser.id === act.createdBy?.id)
        );

        return (
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

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <span title={formatDate(act.date, true)}>{formatRelativeTime(act.date)}</span>
                    <span className="hidden sm:inline">({formatDate(act.date, false)})</span>
                  </div>

                  {/* Delete Option (Visible to Author or Admin) */}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setDeletingActivity(act);
                        setDeleteError('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition opacity-80 group-hover:opacity-100 min-h-[32px] min-w-[32px] flex items-center justify-center"
                      title="Delete activity entry"
                      aria-label={`Delete ${act.type} entry logged on ${formatDate(act.date, false)}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
        );
      })}

      {/* Confirmation Modal for Activity Deletion */}
      {deletingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-activity-title"
            className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/50 space-y-4"
          >
            <button
              onClick={() => {
                if (!isDeleting) setDeletingActivity(null);
              }}
              disabled={isDeleting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 rounded-lg"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h2 id="delete-activity-title" className="text-base font-bold">
                  Delete Interaction Entry
                </h2>
                <p className="text-xs text-slate-500">
                  Remove activity record from lead communication timeline
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>{deletingActivity.type.replace(/_/g, ' ')} Interaction</span>
                <span className="text-slate-400">•</span>
                <span className="font-normal text-slate-500">{formatDate(deletingActivity.date, true)}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                &ldquo;{deletingActivity.notes}&rdquo;
              </p>
            </div>

            {deleteError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this record? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingActivity(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteActivity}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60 min-h-[38px]"
              >
                {isDeleting && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
