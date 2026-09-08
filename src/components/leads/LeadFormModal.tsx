import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { LEAD_SOURCES, COURSES_LIST, LEAD_STATUS_ORDER } from '@/lib/utils';
import { LeadItem, UserSession } from '@/lib/types';
import { leadSchema, leadCreateSchema } from '@/lib/validation';
import { useModalFocus } from '@/components/common/useModalFocus';
import { DuplicateWarningModal } from './DuplicateWarningModal';

interface CounsellorOption {
  id: string;
  name: string;
  email: string;
}

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (lead: LeadItem) => void;
  initialLead?: LeadItem | null;
  currentUser: UserSession | null;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLead,
  currentUser,
}) => {
  const isEditing = Boolean(initialLead);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course: COURSES_LIST[0] || 'B.Tech Computer Science',
    gradYear: new Date().getFullYear() + 4,
    city: '',
    source: 'Website',
    status: 'New',
    assignedToId: '',
    nextFollowUpDate: '',
    notes: '',
  });

  const [counsellors, setCounsellors] = useState<CounsellorOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean;
    matchReason: string;
    existingLead: any;
  }>({
    show: false,
    matchReason: '',
    existingLead: null,
  });

  // Accessible focus trap and return-on-close management
  const modalRef = useModalFocus({
    isOpen,
    onClose: () => {
      if (!isSubmitting) onClose();
    },
  });

  // Fetch counsellors for assignment dropdown (if Admin)
  useEffect(() => {
    if (isOpen && currentUser?.role === 'ADMIN') {
      fetch('/api/team')
        .then((res) => {
          if (!res.ok) return { team: [] };
          return res.json();
        })
        .then((data) => {
          if (data.team) {
            setCounsellors(data.team);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser?.role]);

  // Populate initial values
  useEffect(() => {
    if (initialLead) {
      setFormData({
        name: initialLead.name || '',
        email: initialLead.email || '',
        phone: initialLead.phone || '',
        college: initialLead.college || '',
        course: initialLead.course || COURSES_LIST[0],
        gradYear: initialLead.gradYear || new Date().getFullYear() + 4,
        city: initialLead.city || '',
        source: initialLead.source || 'Website',
        status: initialLead.status || 'New',
        assignedToId: initialLead.assignedToId || initialLead.assignedTo?.id || '',
        nextFollowUpDate: initialLead.nextFollowUpDate
          ? new Date(initialLead.nextFollowUpDate).toISOString().slice(0, 16)
          : '',
        notes: initialLead.notes || '',
      });
    } else {
      // Default creation state
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      setFormData({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: COURSES_LIST[0],
        gradYear: new Date().getFullYear() + 4,
        city: '',
        source: 'Website',
        status: 'New',
        assignedToId: currentUser?.role === 'MEMBER' ? currentUser.id : '',
        nextFollowUpDate: tomorrow.toISOString().slice(0, 16),
        notes: '',
      });
    }
    setErrors({});
  }, [initialLead, isOpen, currentUser]);

  if (!isOpen) return null;

  // Build full counsellor options including existing assignee if not yet in list
  const counsellorOptions = [...counsellors];
  if (
    initialLead?.assignedTo &&
    !counsellorOptions.some((c) => c.id === (initialLead.assignedToId || initialLead.assignedTo?.id))
  ) {
    counsellorOptions.push({
      id: initialLead.assignedToId || initialLead.assignedTo.id,
      name: initialLead.assignedTo.name,
      email: initialLead.assignedTo.email,
    });
  }

  // Client-side Zod validation parity matching src/lib/validation.ts
  const validate = () => {
    const validationData = {
      ...formData,
      gradYear: formData.gradYear ? Number(formData.gradYear) : null,
      assignedToId: formData.assignedToId || null,
      nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
      email: formData.email.trim() || '',
      phone: formData.phone.trim() || '',
      college: formData.college.trim() || '',
      city: formData.city.trim() || '',
      notes: formData.notes.trim() || '',
    };

    const schema = isEditing ? leadSchema : leadCreateSchema;
    const result = schema.safeParse(validationData);

    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] ? String(issue.path[0]) : 'form';
        if (!errs[field]) {
          errs[field] = issue.message;
        }
        // If contact refinement triggered on email, also indicate on phone
        if (field === 'email' && issue.message.includes('At least one contact method')) {
          errs.phone = issue.message;
        }
      });
      setErrors(errs);
      return false;
    }

    setErrors({});
    return true;
  };

  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Check duplicate email/phone if creating or changing
    if (!isEditing || (initialLead && (initialLead.email !== formData.email || initialLead.phone !== formData.phone))) {
      try {
        const dupRes = await fetch('/api/leads/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            phone: formData.phone,
            excludeId: initialLead?.id,
          }),
        });
        const dupData = await dupRes.json();
        if (dupData.isDuplicate) {
          setDuplicateWarning({
            show: true,
            matchReason: dupData.matchReason,
            existingLead: dupData.existingLead,
          });
          return;
        }
      } catch {
        // Show visible error message to user rather than silent console.error
        setErrors({
          form: 'Warning: Duplicate contact check failed due to network error. You may submit again to proceed.',
        });
        return;
      }
    }

    // Proceed directly with submission
    await submitForm();
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/leads/${initialLead?.id}` : '/api/leads';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        gradYear: formData.gradYear ? Number(formData.gradYear) : null,
        assignedToId: formData.assignedToId || null,
        nextFollowUpDate: formData.nextFollowUpDate ? new Date(formData.nextFollowUpDate).toISOString() : null,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ form: data.error || 'Failed to save lead record' });
        setIsSubmitting(false);
        return;
      }

      onSuccess(data.lead);
      onClose();
    } catch {
      setErrors({ form: 'Network error occurred while saving record. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
          className="relative w-full max-w-3xl my-8 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 id="lead-modal-title" className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Student Record' : 'Register New Student / Lead'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEditing ? 'Update student admissions profile' : 'Add prospective student into admissions pipeline'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Alert */}
          {errors.form && (
            <div className="mt-4 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handlePreSubmit} className="mt-6 space-y-6">
            {/* Section 1: Basic Information */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Student Demographics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="lead-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="lead-name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="lead-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    id="lead-email"
                    type="email"
                    disabled={isSubmitting}
                    placeholder="e.g. rahul@gmail.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '', phone: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="lead-phone" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    id="lead-phone"
                    type="tel"
                    disabled={isSubmitting}
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value });
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: '', email: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="lead-city" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City / Location
                  </label>
                  <input
                    id="lead-city"
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Bangalore, Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="lead-college" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Previous School / College
                  </label>
                  <input
                    id="lead-college"
                    type="text"
                    disabled={isSubmitting}
                    placeholder="e.g. Delhi Public School / St. Xavier's"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Academic & Pipeline Info */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Admissions Program & Pipeline
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="lead-course" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Interested Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="lead-course"
                    disabled={isSubmitting}
                    value={formData.course}
                    onChange={(e) => {
                      setFormData({ ...formData, course: e.target.value });
                      if (errors.course) setErrors((prev) => ({ ...prev, course: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.course ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {COURSES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.course && <p className="mt-1 text-xs text-red-500">{errors.course}</p>}
                </div>

                <div>
                  <label htmlFor="lead-gradYear" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Graduation Year
                  </label>
                  <input
                    id="lead-gradYear"
                    type="number"
                    min="2020"
                    max="2035"
                    disabled={isSubmitting}
                    value={formData.gradYear}
                    onChange={(e) => {
                      setFormData({ ...formData, gradYear: parseInt(e.target.value) || 2028 });
                      if (errors.gradYear) setErrors((prev) => ({ ...prev, gradYear: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.gradYear ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.gradYear && <p className="mt-1 text-xs text-red-500">{errors.gradYear}</p>}
                </div>

                <div>
                  <label htmlFor="lead-source" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lead Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="lead-source"
                    disabled={isSubmitting}
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lead-status" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pipeline Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="lead-status"
                    disabled={isSubmitting}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium disabled:opacity-50"
                  >
                    {LEAD_STATUS_ORDER.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lead-assignedToId" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Counsellor {currentUser?.role !== 'ADMIN' && '(Fixed to you)'}
                  </label>
                  <select
                    id="lead-assignedToId"
                    disabled={currentUser?.role !== 'ADMIN' || isSubmitting}
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                  >
                    <option value="">Unassigned</option>
                    {counsellorOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="lead-nextFollowUpDate" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Next Follow-up Due
                  </label>
                  <input
                    id="lead-nextFollowUpDate"
                    type="datetime-local"
                    disabled={isSubmitting}
                    value={formData.nextFollowUpDate}
                    onChange={(e) => {
                      setFormData({ ...formData, nextFollowUpDate: e.target.value });
                      if (errors.nextFollowUpDate) setErrors((prev) => ({ ...prev, nextFollowUpDate: '' }));
                    }}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                      errors.nextFollowUpDate ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.nextFollowUpDate && (
                    <p className="mt-1 text-xs text-red-500">{errors.nextFollowUpDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Initial Notes */}
            <div>
              <label htmlFor="lead-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Admissions Notes & Remarks
              </label>
              <textarea
                id="lead-notes"
                rows={3}
                disabled={isSubmitting}
                placeholder="Details about student preferences, scholarship eligibility, parent conversation notes..."
                value={formData.notes}
                onChange={(e) => {
                  setFormData({ ...formData, notes: e.target.value });
                  if (errors.notes) setErrors((prev) => ({ ...prev, notes: '' }));
                }}
                className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none disabled:opacity-50 ${
                  errors.notes ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.notes && <p className="mt-1 text-xs text-red-500">{errors.notes}</p>}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Saving...' : isEditing ? 'Update Student Record' : 'Create Student Lead'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Duplicate warning popup */}
      <DuplicateWarningModal
        isOpen={duplicateWarning.show}
        matchReason={duplicateWarning.matchReason}
        existingLead={duplicateWarning.existingLead}
        onProceedAnyway={async () => {
          setDuplicateWarning({ show: false, matchReason: '', existingLead: null });
          await submitForm();
        }}
        onCancel={() => {
          setDuplicateWarning({ show: false, matchReason: '', existingLead: null });
        }}
      />
    </>
  );
};
