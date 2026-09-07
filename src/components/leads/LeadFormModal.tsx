import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';
import { LEAD_SOURCES, COURSES_LIST, LEAD_STATUS_ORDER } from '@/lib/utils';
import { LeadItem, UserSession } from '@/lib/types';
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

  // Fetch counsellors for assignment dropdown (if Admin)
  useEffect(() => {
    if (isOpen) {
      fetch('/api/team')
        .then((res) => res.json())
        .then((data) => {
          if (data.team) {
            setCounsellors(data.team);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

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
        assignedToId: initialLead.assignedToId || '',
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

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errs.name = 'Full name is required (at least 2 characters)';
    }

    const hasEmail = formData.email.trim().length > 0;
    const hasPhone = formData.phone.trim().length > 0;

    if (!hasEmail && !hasPhone) {
      errs.email = 'At least one contact method (Email or Phone) is required';
      errs.phone = 'At least one contact method (Email or Phone) is required';
    }

    if (hasEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        errs.email = 'Please provide a valid email address (e.g. name@example.com)';
      }
    }

    if (hasPhone) {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 15) {
        errs.phone = 'Please enter a valid phone number (7-15 digits)';
      }
    }

    if (!formData.course) {
      errs.course = 'Please select an academic course';
    }

    if (!isEditing && formData.nextFollowUpDate) {
      const selected = new Date(formData.nextFollowUpDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errs.nextFollowUpDate = 'Follow-up date for a new lead cannot be in the past';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      } catch (err) {
        console.error('Error during duplicate check:', err);
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
        gradYear: Number(formData.gradYear),
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
      setErrors({ form: 'Network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
        <div className="relative w-full max-w-3xl my-8 p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {isEditing ? 'Edit Student Record' : 'Register New Student / Lead'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEditing ? 'Update student admissions profile' : 'Add prospective student into admissions pipeline'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Student Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                      errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Mumbai"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Previous School / College
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi Public School / St. Xavier's"
                    value={formData.college}
                    onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Interested Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    {COURSES_LIST.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Target Graduation Year
                  </label>
                  <input
                    type="number"
                    min="2022"
                    max="2035"
                    value={formData.gradYear}
                    onChange={(e) => setFormData({ ...formData, gradYear: parseInt(e.target.value) || 2028 })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lead Source <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    {LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pipeline Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                  >
                    {LEAD_STATUS_ORDER.map((st) => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Counsellor {currentUser?.role !== 'ADMIN' && '(Fixed to you)'}
                  </label>
                  <select
                    disabled={currentUser?.role !== 'ADMIN'}
                    value={formData.assignedToId}
                    onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-60"
                  >
                    <option value="">Unassigned</option>
                    {counsellors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Next Follow-up Due
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                    className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Admissions Notes & Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Details about student preferences, scholarship eligibility, parent conversation notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isEditing ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isEditing ? 'Update Student Record' : 'Create Student Lead'}</span>
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
