'use client';

import React, { useState, useEffect } from 'react';
import { TeamMemberStats, UserSession } from '@/lib/types';
import { UserCheck, UserPlus, ShieldCheck, User, Mail, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMemberStats[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New member modal
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
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (data.team) {
        setTeam(data.team);
      }
    } catch (err) {
      console.error('Fetch team error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

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

        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Team Scorecard Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Active Admissions Team ({team.length} Staff Members)
          </span>
          <span className="text-slate-400">Computed from live assigned student records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                    </td>
                  </tr>
                ))
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
                          <span className="font-bold text-slate-900 dark:text-white block truncate">
                            {member.name}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
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
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {member.assignedCount}
                      </span>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal (Admin Only) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Admissions Counsellor</h2>
            <p className="text-xs text-slate-500 mt-1">Create user credentials with role assignment</p>

            {formError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sanya Kapoor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  College Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="sanya@college.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    System Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    <option value="MEMBER">Team Member</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
