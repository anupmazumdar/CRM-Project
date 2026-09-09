import React, { useState } from 'react';
import { X, PhoneCall, Mail, MessageCircle, Users, CalendarCheck, Save, AlertCircle } from 'lucide-react';
import { ActivityItem, ActivityType, LeadStatus } from '@/backend/types';
import { LEAD_STATUS_ORDER } from '@/frontend/utils/ui-helpers';
import { activitySchema } from '@/database/validation';
import { useModalFocus } from '@/frontend/hooks/useModalFocus';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  currentStatus: LeadStatus | string;
  onActivityCreated: (activity: ActivityItem, updatedStatus?: LeadStatus, newFollowUp?: string) => void;
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  leadId,
  leadName,
  currentStatus,
  onActivityCreated,
}) => {
  const [type, setType] = useState<ActivityType>('Call');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [updateStatusTo, setUpdateStatusTo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Accessible focus trap and return-on-close management
  const modalRef = useModalFocus({
    isOpen,
    onClose: () => {
      if (!isSubmitting) onClose();
    },
  });

  if (!isOpen) return null;

  const activityOptions: { type: ActivityType; label: string; icon: React.ReactNode; color: string }[] = [
    { type: 'Call', label: 'Phone Call', icon: <PhoneCall className="w-4 h-4" />, color: 'hover:border-blue-500 hover:text-blue-600' },
    { type: 'WhatsApp', label: 'WhatsApp Chat', icon: <MessageCircle className="w-4 h-4" />, color: 'hover:border-emerald-500 hover:text-emerald-600' },
    { type: 'Email', label: 'Email Sent', icon: <Mail className="w-4 h-4" />, color: 'hover:border-violet-500 hover:text-violet-600' },
    { type: 'Meeting', label: 'Campus / Virtual Visit', icon: <Users className="w-4 h-4" />, color: 'hover:border-amber-500 hover:text-amber-600' },
    { type: 'Follow_up', label: 'Follow-up Note', icon: <CalendarCheck className="w-4 h-4" />, color: 'hover:border-purple-500 hover:text-purple-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let isoDate = '';
    if (date) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        setError('Please select a valid date and time for this activity.');
        return;
      }
      isoDate = parsedDate.toISOString();
    } else {
      setError('Date and time is required.');
      return;
    }

    let isoFollowUp: string | null = null;
    if (nextFollowUpDate && nextFollowUpDate.trim()) {
      const parsedFollowUp = new Date(nextFollowUpDate);
      if (isNaN(parsedFollowUp.getTime())) {
        setError('Please select a valid date and time for the next follow-up.');
        return;
      }
      isoFollowUp = parsedFollowUp.toISOString();
    }

    // Client-side Zod validation parity matching src/lib/validation.ts
    const validationResult = activitySchema.safeParse({
      leadId,
      type,
      date: isoDate,
      notes: notes.trim(),
      nextAction: nextAction.trim() || undefined,
      nextFollowUpDate: isoFollowUp || undefined,
      updateStatusTo: updateStatusTo || undefined,
    });

    if (!validationResult.success) {
      setError(validationResult.error.issues[0]?.message || 'Please check the form for errors.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          type,
          date: isoDate,
          notes: notes.trim(),
          nextAction: nextAction.trim() || null,
          nextFollowUpDate: isoFollowUp,
          updateStatusTo: updateStatusTo || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to log activity.');
        setIsSubmitting(false);
        return;
      }

      onActivityCreated(
        data.activity,
        (updateStatusTo as LeadStatus) || undefined,
        nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined
      );
      onClose();
    } catch {
      setError('Network communication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-modal-title"
        className="relative w-full max-w-xl p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 id="activity-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Log Counsellor Activity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record interaction with <strong className="text-blue-600 dark:text-blue-400">{leadName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Activity Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Interaction Channel
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activityOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  disabled={isSubmitting}
                  onClick={() => setType(opt.type)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition disabled:opacity-50 min-h-[40px] ${
                    type === opt.type
                      ? 'bg-blue-50 text-blue-700 border-blue-500 dark:bg-blue-950/60 dark:text-blue-300 shadow-sm'
                      : `bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${opt.color}`
                  }`}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label htmlFor="activity-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date & Time of Interaction
            </label>
            <input
              id="activity-date"
              type="datetime-local"
              required
              disabled={isSubmitting}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Activity Notes */}
          <div>
            <label htmlFor="activity-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Discussion Summary / Interaction Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              id="activity-notes"
              required
              rows={3}
              disabled={isSubmitting}
              placeholder="Discussed fee structure, hostel facilities, student shared entrance exam score (88 percentile)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Next Action */}
          <div>
            <label htmlFor="activity-next-action" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Next Action Plan (Optional)
            </label>
            <input
              id="activity-next-action"
              type="text"
              disabled={isSubmitting}
              placeholder="e.g. Send syllabus brochure & scholarship form via WhatsApp"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Inline pipeline progression & follow-up scheduler */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Inline Pipeline & Follow-up Updates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="activity-status-update" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Update Lead Status
                </label>
                <select
                  id="activity-status-update"
                  disabled={isSubmitting}
                  value={updateStatusTo}
                  onChange={(e) => setUpdateStatusTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 min-h-[38px]"
                >
                  <option value="">Keep current ({currentStatus})</option>
                  {LEAD_STATUS_ORDER.map((st) => (
                    <option key={st} value={st}>
                      Move to {st.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="activity-next-followup" className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Schedule Next Follow-up
                </label>
                <input
                  id="activity-next-followup"
                  type="datetime-local"
                  disabled={isSubmitting}
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none disabled:opacity-50 min-h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmitting ? 'Saving Activity...' : 'Save Activity'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
