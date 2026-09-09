'use client';

import React, { useState, useEffect } from 'react';
import { TeamMemberStats, UserSession } from '@/backend/types';
import { userCreateSchema } from '@/database/validation';
import { useModalFocus } from '@/frontend/hooks/useModalFocus';
import {
  UserCheck,
  UserPlus,
  ShieldAlert,
  Mail,
  AlertCircle,
  X,
  RotateCcw,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  Edit2,
  UserX,
} from 'lucide-react';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMemberStats[]>([]);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    isCapped?: boolean;
  }>({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isForbidden, setIsForbidden] = useState(false);
  const [error, setError] = useState('');

  // Reset Password Modal states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TeamMemberStats | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // New member modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
    department: 'Admissions',
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit member modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMemberStats | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    department: 'Admissions',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
  });
  const [editError, setEditError] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  // Deactivate/Remove member modal states
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivateMember, setDeactivateMember] = useState<TeamMemberStats | null>(null);
  const [deactivateError, setDeactivateError] = useState('');
  const [isDeactivateSubmitting, setIsDeactivateSubmitting] = useState(false);

  // Accessible focus management for each modal
  const addModalRef = useModalFocus({
    isOpen: isModalOpen,
    onClose: () => {
      if (!isSubmitting) setIsModalOpen(false);
    },
  });

  const resetModalRef = useModalFocus({
    isOpen: isResetModalOpen,
    onClose: () => {
      if (!isResetSubmitting) setIsResetModalOpen(false);
    },
  });

  const editModalRef = useModalFocus({
    isOpen: isEditModalOpen,
    onClose: () => {
      if (!isEditSubmitting) setIsEditModalOpen(false);
    },
  });

  const deactivateModalRef = useModalFocus({
    isOpen: isDeactivateModalOpen,
    onClose: () => {
      if (!isDeactivateSubmitting) setIsDeactivateModalOpen(false);
    },
  });

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchTeam = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/team');
      if (res.status === 403) {
        setIsForbidden(true);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load admissions team scorecard.');
      }
      const data = await res.json();
      if (data.team) {
        setTeam(data.team);
      }
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the team directory server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetMember) return;
    setResetError('');
    setResetSuccess('');

    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      setResetError('New password must be at least 6 characters.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/team/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: resetMember.id,
          newPassword: resetPasswordValue,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || 'Failed to reset staff password.');
      } else {
        setResetSuccess(data.message || 'Staff password successfully updated.');
        setResetPasswordValue('');
      }
    } catch {
      setResetError('Network error occurred while resetting password.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side Zod validation parity matching src/lib/validation.ts
    const validationResult = userCreateSchema.safeParse(formData);
    if (!validationResult.success) {
      setFormError(validationResult.error.issues[0]?.message || 'Please check form for errors.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to add member');
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'MEMBER',
        department: 'Admissions',
      });
      fetchTeam();
    } catch {
      setFormError('Network communication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMember) return;
    setIsEditSubmitting(true);
    setEditError('');

    try {
      const res = await fetch(`/api/team/${editMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405) {
        setEditError('Endpoint PUT /api/team/[id] is not yet implemented on the server (needs backend support).');
        return;
      }

      if (!res.ok) {
        setEditError(data.error || 'Failed to update team member details.');
        return;
      }

      setIsEditModalOpen(false);
      fetchTeam();
    } catch {
      setEditError('Network communication error while updating member profile.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeactivateMember = async () => {
    if (!deactivateMember) return;
    setIsDeactivateSubmitting(true);
    setDeactivateError('');

    try {
      const res = await fetch(`/api/team/${deactivateMember.id}`, {
        method: 'DELETE',
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 404 || res.status === 405) {
        setDeactivateError('Endpoint DELETE /api/team/[id] is not yet implemented on the server (needs backend support).');
        return;
      }

      if (!res.ok) {
        setDeactivateError(data.error || 'Failed to deactivate staff member.');
        return;
      }

      setIsDeactivateModalOpen(false);
      fetchTeam();
    } catch {
      setDeactivateError('Network communication error while requesting member deactivation.');
    } finally {
      setIsDeactivateSubmitting(false);
    }
  };

  if (isForbidden || (currentUser && currentUser.role !== 'ADMIN')) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Access Required</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Team performance scorecards and staff management are restricted to Admissions Administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Admissions Staff Performance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            Team Management & Scorecard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time conversion metrics grouped by assigned admissions counsellor.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchTeam}
            disabled={isLoading}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Scorecard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {currentUser?.role === 'ADMIN' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0 min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
            Failed to Load Team Scorecard
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchTeam}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Team Scorecard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Active Admissions Team ({team.length} Staff Members)
            </span>
            {pagination?.isCapped && (
              <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold text-[11px] rounded-md">
                Showing top {pagination.limit} (capped)
              </span>
            )}
          </div>
          <span className="text-slate-400">Computed from live assigned student records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Team Member</th>
                <th className="py-3.5 px-3">Role / Dept</th>
                <th className="py-3.5 px-3 text-center">Assigned Leads</th>
                <th className="py-3.5 px-3 text-center">Contacted</th>
                <th className="py-3.5 px-3 text-center">Interested</th>
                <th className="py-3.5 px-3 text-center">Converted</th>
                <th className="py-3.5 px-3 text-center">Overdue Follow-ups</th>
                <th className="py-3.5 px-4 text-right">Conversion Rate</th>
                {currentUser?.role === 'ADMIN' && (
                  <th className="py-3.5 px-4 text-right min-w-[200px]">Admin Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={currentUser?.role === 'ADMIN' ? 9 : 8} className="py-4 px-4">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : team.length === 0 ? (
                <tr>
                  <td
                    colSpan={currentUser?.role === 'ADMIN' ? 9 : 8}
                    className="py-12 text-center text-slate-400"
                  >
                    <UserCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      No team members found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Onboard your first admissions counsellor to start distributing student leads.
                    </p>
                    {currentUser?.role === 'ADMIN' && (
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 min-h-[38px]"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add First Team Member</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                team.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                  >
                    {/* Name & Avatar */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <span
                            className="font-bold text-slate-900 dark:text-white block truncate max-w-[180px]"
                            title={member.name}
                          >
                            {member.name}
                          </span>
                          <span
                            className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[200px]"
                            title={member.email}
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role & Dept */}
                    <td className="py-4 px-3">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${
                            member.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}
                        >
                          {member.role}
                        </span>
                        <div className="text-[11px] text-slate-500">{member.department || 'Admissions'}</div>
                      </div>
                    </td>

                    {/* Assigned Leads */}
                    <td className="py-4 px-3 text-center">
                      {member.assignedCount === 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          0 assigned
                        </span>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white text-sm">
                          {member.assignedCount}
                        </span>
                      )}
                    </td>

                    {/* Contacted */}
                    <td className="py-4 px-3 text-center">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {member.contactedCount}
                      </span>
                    </td>

                    {/* Interested */}
                    <td className="py-4 px-3 text-center">
                      <span className="font-medium text-amber-600 dark:text-amber-400 font-semibold">
                        {member.interestedCount}
                      </span>
                    </td>

                    {/* Converted */}
                    <td className="py-4 px-3 text-center">
                      <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                        {member.convertedCount}
                      </span>
                    </td>

                    {/* Overdue */}
                    <td className="py-4 px-3 text-center">
                      {member.overdueFollowUps > 0 ? (
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-md font-bold text-xs">
                          {member.overdueFollowUps} overdue
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-4 px-4 text-right">
                      <div className="inline-flex items-baseline gap-1">
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {member.conversionRate}%
                        </span>
                      </div>
                    </td>

                    {/* Admin Actions: Edit, Reset Password, Deactivate */}
                    {currentUser?.role === 'ADMIN' && (
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Member */}
                          <button
                            onClick={() => {
                              setEditMember(member);
                              setEditFormData({
                                name: member.name,
                                department: member.department || 'Admissions',
                                role: (member.role as 'ADMIN' | 'MEMBER') || 'MEMBER',
                              });
                              setEditError('');
                              setIsEditModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition inline-flex items-center gap-1 min-h-[36px]"
                            title={`Edit details for ${member.name}`}
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetMember(member);
                              setResetPasswordValue('');
                              setResetError('');
                              setResetSuccess('');
                              setIsResetModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-amber-600 dark:text-slate-300 dark:hover:text-amber-400 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg transition inline-flex items-center gap-1 min-h-[36px]"
                            title={`Reset password for ${member.name}`}
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="hidden sm:inline">Password</span>
                          </button>

                          {/* Deactivate/Remove */}
                          <button
                            onClick={() => {
                              setDeactivateMember(member);
                              setDeactivateError('');
                              setIsDeactivateModalOpen(true);
                            }}
                            disabled={currentUser?.id === member.id}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition inline-flex items-center gap-1 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
                            title={currentUser?.id === member.id ? 'Cannot deactivate yourself' : `Deactivate ${member.name}`}
                          >
                            <UserX className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Member Modal (Admin Only) */}
      {isEditModalOpen && editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            ref={editModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-team-modal-title"
            className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              disabled={isEditSubmitting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h2 id="edit-team-modal-title" className="text-base font-bold">
                  Edit Team Member
                </h2>
                <p className="text-xs text-slate-500">
                  Update staff profile details and administrative permissions
                </p>
              </div>
            </div>

            {editError && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditMember} className="space-y-3.5">
              <div>
                <label htmlFor="edit-team-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-team-name"
                  type="text"
                  required
                  disabled={isEditSubmitting}
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="edit-team-email" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  College Email Address (Account ID)
                </label>
                <input
                  id="edit-team-email"
                  type="email"
                  disabled
                  value={editMember.email}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-team-role" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    id="edit-team-role"
                    disabled={isEditSubmitting}
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  >
                    <option value="MEMBER">Team Member</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-team-department" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <input
                    id="edit-team-department"
                    type="text"
                    disabled={isEditSubmitting}
                    value={editFormData.department}
                    onChange={(e) => setEditFormData({ ...editFormData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isEditSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[38px]"
                >
                  {isEditSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{isEditSubmitting ? 'Saving...' : 'Update Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate / Remove Member Modal (Admin Only) */}
      {isDeactivateModalOpen && deactivateMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            ref={deactivateModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-team-modal-title"
            className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-red-200 dark:border-red-900/50 space-y-4"
          >
            <button
              onClick={() => setIsDeactivateModalOpen(false)}
              disabled={isDeactivateSubmitting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h2 id="deactivate-team-modal-title" className="text-base font-bold">
                  Deactivate Staff Member
                </h2>
                <p className="text-xs text-slate-500">
                  Revoke admissions workspace access and permissions
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                {deactivateMember.name}
              </div>
              <div className="text-slate-500 flex items-center gap-1.5">
                <span>{deactivateMember.email}</span>
                <span>•</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{deactivateMember.role}</span>
              </div>
            </div>

            {deactivateMember.assignedCount > 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">⚠️ Active Lead Assignment Warning</p>
                <p>
                  This team member is currently managing <strong>{deactivateMember.assignedCount}</strong> student leads. Please reassign their leads to other counsellors.
                </p>
              </div>
            )}

            {deactivateError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{deactivateError}</span>
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Are you sure you want to remove or deactivate <strong>{deactivateMember.name}</strong> from the admissions team?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeactivateModalOpen(false)}
                disabled={isDeactivateSubmitting}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 min-h-[38px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateMember}
                disabled={isDeactivateSubmitting}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60 min-h-[38px]"
              >
                {isDeactivateSubmitting && (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{isDeactivateSubmitting ? 'Removing...' : 'Confirm Deactivation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal (Admin Only) */}
      {isResetModalOpen && resetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            ref={resetModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-modal-title"
            className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
          >
            <button
              onClick={() => setIsResetModalOpen(false)}
              disabled={isResetSubmitting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-slate-900 dark:text-white">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 id="reset-modal-title" className="text-base font-bold">
                  Reset Staff Password
                </h2>
                <p className="text-xs text-slate-500">
                  Admissions administrative credential override
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {resetMember.name}
              </div>
              <div className="text-slate-500 flex items-center gap-1.5">
                <span>{resetMember.email}</span>
                <span>•</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">{resetMember.role}</span>
              </div>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-semibold text-slate-600 dark:text-slate-400"
                  >
                    New Temporary Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const temp = 'Pass' + Math.random().toString(36).substring(2, 8) + '!';
                      setResetPasswordValue(temp);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  id="reset-new-password"
                  type="text"
                  required
                  disabled={isResetSubmitting}
                  placeholder="At least 6 characters"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 min-h-[38px]"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60 min-h-[38px]"
                >
                  {isResetSubmitting && (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Save Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal (Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div
            ref={addModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
            className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 disabled:opacity-50 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="team-modal-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Add New Admissions Counsellor
            </h2>
            <p className="text-xs text-slate-500 mt-1">Create user credentials with role assignment</p>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="mt-4 space-y-3.5">
              <div>
                <label htmlFor="team-name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="team-name"
                  type="text"
                  required
                  disabled={isSubmitting}
                  placeholder="e.g. Sanya Kapoor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="team-email" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  College Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="team-email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  placeholder="sanya@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="team-password" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="team-password"
                  type="password"
                  required
                  disabled={isSubmitting}
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="team-role" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    id="team-role"
                    disabled={isSubmitting}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  >
                    <option value="MEMBER">Team Member</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="team-department" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <input
                    id="team-department"
                    type="text"
                    disabled={isSubmitting}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl disabled:opacity-50 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-h-[38px]"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
