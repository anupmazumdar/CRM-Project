'use client';

import React, { useState, useEffect } from 'react';
import { UserSession } from '@/backend/types';
import {
  Settings,
  KeyRound,
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Status & error states
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {})
      .finally(() => setIsLoadingUser(false));
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 10) {
      errors.newPassword = 'New password must be at least 10 characters.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirmation password is required.';
    } else if (confirmPassword !== newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to change password.');
        return;
      }

      setSuccessMessage(data.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setFieldErrors({});
    } catch {
      setFormError('Network communication error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" />
          <span>Account Settings</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
          Profile & Security
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your admissions CRM credentials, security settings, and active session details.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: User Profile Card */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {currentUser?.name || 'Admissions User'}
                </h3>
                <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Security Role</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    currentUser?.role === 'ADMIN'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  }`}
                >
                  {currentUser?.role === 'ADMIN' ? (
                    <ShieldCheck className="w-3 h-3" />
                  ) : (
                    <User className="w-3 h-3" />
                  )}
                  {currentUser?.role || 'MEMBER'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {currentUser?.department || 'Admissions'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Account Status</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-500 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Password Guidelines</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use a secure password with at least 10 characters. Changing your password updates your account immediately across all active admissions portal sessions.
            </p>
          </div>
        </div>

        {/* Right: Change Password Card */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Change Account Password
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 font-medium"
              >
                {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPasswords ? 'Hide characters' : 'Show characters'}</span>
              </button>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success Banner */}
            {successMessage && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-300 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label
                  htmlFor="settings-current-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Current Password *
                </label>
                <input
                  id="settings-current-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (fieldErrors.currentPassword) {
                      setFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Enter your existing password"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition disabled:opacity-50 ${
                    fieldErrors.currentPassword
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.currentPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.currentPassword}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label
                  htmlFor="settings-new-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  New Password *
                </label>
                <input
                  id="settings-new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (fieldErrors.newPassword) {
                      setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Minimum 10 characters"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition disabled:opacity-50 ${
                    fieldErrors.newPassword
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.newPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.newPassword}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label
                  htmlFor="settings-confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
                >
                  Confirm New Password *
                </label>
                <input
                  id="settings-confirm-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                    }
                  }}
                  disabled={isSubmitting}
                  placeholder="Re-type your new password"
                  className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl outline-none transition disabled:opacity-50 ${
                    fieldErrors.confirmPassword
                      ? 'border-rose-300 focus:ring-2 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
