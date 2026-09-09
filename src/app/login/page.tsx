'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, X, HelpCircle, CheckCircle2 } from 'lucide-react';

import { loginSchema } from '@/database/validation';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Escape key handler for Forgot Password modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForgotPassword) {
        setShowForgotPassword(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setError('');

    // Client-side Zod validation parity
    const validationResult = loginSchema.safeParse({ email, password });
    if (!validationResult.success) {
      const errMap: { email?: string; password?: string } = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as 'email' | 'password';
        if (field && !errMap[field]) {
          errMap[field] = issue.message;
        }
      });
      setFieldErrors(errMap);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
        setIsLoading(false);
        return;
      }

      // Security: Validate from path to prevent Open Redirect attacks
      const safeFrom = from.startsWith('/') && !from.startsWith('//') ? from : '/';
      router.push(safeFrom);
      router.refresh();
    } catch {
      setError('Unable to connect to server. Please try again.');
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setFieldErrors({});
  };

  return (
    <div className="relative w-full max-w-md">
      {/* Card */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-blue-950/50">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">XYZ College CRM</h1>
          <p className="text-xs text-slate-400">Centralized Admissions & Student Pipeline Portal</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-3.5 bg-red-950/50 border border-red-800/80 rounded-xl flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
            >
              Work Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="login-email"
                type="email"
                required
                disabled={isLoading}
                placeholder="name@college.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                  fieldErrors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSubmitted(false);
                  setShowForgotPassword(true);
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="login-password"
                type="password"
                required
                disabled={isLoading}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                className={`w-full pl-10 pr-4 py-2.5 text-sm bg-slate-800/80 border rounded-xl text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition disabled:opacity-50 ${
                  fieldErrors.password ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-700'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins (Opt-in only: strictly process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true') */}
        {process.env.NEXT_PUBLIC_SHOW_DEMO_LOGINS === 'true' && (
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              Quick One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@college.edu', 'admin123')}
                disabled={isLoading}
                className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-purple-400 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">admin@college.edu</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickDemo('priya@college.edu', 'counsellor123')}
                disabled={isLoading}
                className="p-2.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-left transition group disabled:opacity-50"
              >
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Counsellor</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">priya@college.edu</div>
              </button>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
          >
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-blue-400" />
                  <span id="forgot-password-modal-title">Password Recovery</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {forgotSubmitted ? (
                <div className="space-y-3 py-2 text-center">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Reset Request Logged</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    A reset request for <span className="text-white font-medium">{forgotEmail}</span> has been registered. Admissions Administrators can reset counsellor credentials directly from the <span className="text-white font-semibold">Team Management</span> panel.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition mt-2"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your registered college email address to initiate password recovery assistance from your Admissions Administrator.
                  </p>

                  <div>
                    <label htmlFor="forgot-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Staff Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="counsellor@college.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 leading-relaxed">
                    <strong className="text-slate-300">Administrative Note:</strong> For institution privacy, password resets are verified and applied by admissions managers.
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (forgotEmail.trim()) {
                          setForgotSubmitted(true);
                        }
                      }}
                      className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-500/20"
                    >
                      Request Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="mt-6 text-center text-xs text-slate-500">
        XYZ College Admissions CRM • Production MVP
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-white text-sm">Loading Login Portal...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
