import React, { useState } from 'react';
import { X, PhoneCall, Mail, MessageCircle, Users, CalendarCheck, Save, AlertCircle } from 'lucide-react';
import { ActivityItem, ActivityType, LeadStatus } from '@/lib/types';
import { LEAD_STATUS_ORDER } from '@/lib/utils';

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
    if (!notes.trim() || notes.trim().length < 3) {
      setError('Activity notes must be at least 3 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          type,
          date: new Date(date).toISOString(),
          notes,
          nextAction: nextAction.trim() || null,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : null,
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
      <div className="relative w-full max-w-xl p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Log Counsellor Activity</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record interaction with <strong className="text-blue-600 dark:text-blue-400">{leadName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
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
                  onClick={() => setType(opt.type)}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition ${
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
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date & Time of Interaction
            </label>
            <input
              type="datetime-local"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Activity Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Discussion Summary / Interaction Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Discussed fee structure, hostel facilities, student shared entrance exam score (88 percentile)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Next Action */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Next Action Plan (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Send syllabus brochure & scholarship form via WhatsApp"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Inline pipeline progression & follow-up scheduler */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>Inline Pipeline & Follow-up Updates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Update Lead Status
                </label>
                <select
                  value={updateStatusTo}
                  onChange={(e) => setUpdateStatusTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
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
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Schedule Next Follow-up
                </label>
                <input
                  type="datetime-local"
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
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
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
