import React from 'react';
import { AlertCircle, UserCheck, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '../common/StatusBadge';
import { useModalFocus } from '@/frontend/hooks/useModalFocus';

interface DuplicateWarningModalProps {
  isOpen: boolean;
  matchReason: string;
  existingLead: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    course: string;
    status: string;
    assignedTo?: { name: string } | null;
  } | null;
  onProceedAnyway: () => void;
  onCancel: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  isOpen,
  matchReason,
  existingLead,
  onProceedAnyway,
  onCancel,
}) => {
  // Accessible focus trap and restore-on-close management
  const modalRef = useModalFocus({
    isOpen,
    onClose: onCancel,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-warning-title"
        className="relative w-full max-w-lg p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/50"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-950/60 rounded-xl text-amber-700 dark:text-amber-400 shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 id="duplicate-warning-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Potential Duplicate Lead Found
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              A student with matching <strong className="text-amber-700 dark:text-amber-400">{matchReason}</strong> already exists in the system.
            </p>

            {existingLead ? (
              /* Existing lead summary card when authorized */
              <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-white text-base">
                    {existingLead.name}
                  </span>
                  <StatusBadge status={existingLead.status} size="sm" />
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400">Course:</span> {existingLead.course}
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned to:</span>{' '}
                    {existingLead.assignedTo?.name || 'Unassigned'}
                  </div>
                  {existingLead.email && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Email:</span> {existingLead.email}
                    </div>
                  )}
                  {existingLead.phone && (
                    <div className="col-span-2">
                      <span className="text-slate-400">Phone:</span> {existingLead.phone}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    href={`/leads/${existingLead.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium min-h-[36px]"
                  >
                    <span>Open Existing Record in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Privacy alert when student record belongs to another counsellor */
              <div className="mt-4 p-3.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 rounded-xl text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                A student record with this contact information is already registered and assigned to another admissions counsellor. Detailed student profile information is restricted for privacy.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition min-h-[44px]"
          >
            Cancel & Review Form
          </button>
          <button
            type="button"
            onClick={onProceedAnyway}
            className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-sm flex items-center justify-center gap-2 min-h-[44px]"
          >
            <UserCheck className="w-4 h-4" />
            <span>Proceed & Create Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
