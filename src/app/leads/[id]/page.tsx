'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LeadItem, UserSession, ActivityItem, LeadStatus } from '@/lib/types';
import { formatDate, LEAD_STATUS_ORDER } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FollowUpBadge } from '@/components/common/FollowUpBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { ActivityLogModal } from '@/components/activities/ActivityLogModal';
import { LeadFormModal } from '@/components/leads/LeadFormModal';
import {
  ArrowLeft,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  School,
  Calendar,
  User,
  PlusCircle,
  Edit2,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  X,
} from 'lucide-react';

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [lead, setLead] = useState<LeadItem | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  // Modals
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Quick inline state updaters
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingStatusTo, setUpdatingStatusTo] = useState<string | null>(null);
  const [updatingFollowUp, setUpdatingFollowUp] = useState(false);
  const [inlineFollowUpDate, setInlineFollowUpDate] = useState('');

  // Fetch current user and lead
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchLeadDetail = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/leads/${id}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to load student profile');
        return;
      }

      setLead(data.lead);
      if (data.lead.nextFollowUpDate) {
        setInlineFollowUpDate(new Date(data.lead.nextFollowUpDate).toISOString().slice(0, 16));
      }
    } catch {
      setError('Network communication failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchLeadDetail();
    }
  }, [id]);

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!lead || updatingStatus) return;
    setUpdatingStatus(true);
    setUpdatingStatusTo(newStatus);
    setActionError('');
    try {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchLeadDetail();
      } else {
        setActionError(data.error || 'Failed to update status');
      }
    } catch {
      setActionError('Network error while updating status');
    } finally {
      setUpdatingStatus(false);
      setUpdatingStatusTo(null);
    }
  };

  const handleQuickFollowUpSave = async () => {
    if (!lead || updatingFollowUp) return;
    setUpdatingFollowUp(true);
    setActionError('');
    try {
      const res = await fetch(`/api/leads/${id}/follow-up`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpDate: inlineFollowUpDate ? new Date(inlineFollowUpDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchLeadDetail();
      } else {
        setActionError(data.error || 'Failed to update follow up');
      }
    } catch {
      setActionError('Network error while updating follow-up schedule');
    } finally {
      setUpdatingFollowUp(false);
    }
  };

  const handleActivityLogged = (newAct: ActivityItem, updatedStatus?: LeadStatus, newFollowUp?: string) => {
    fetchLeadDetail();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse" />
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-96 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-3xl text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Access Restricted / Not Found</h3>
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        <div className="pt-2">
          <Link
            href="/leads"
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Student List</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top back navigation & quick edit */}
      <div className="flex items-center justify-between">
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Students</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-1.5 shadow-sm"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setActivityModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Interaction</span>
          </button>
        </div>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-red-500 hover:text-red-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Student Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight break-words max-w-md">
                  {lead.name}
                </h1>
                <StatusBadge status={lead.status} size="md" />
                <SourceBadge source={lead.source} size="md" />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  <span title={lead.course} className="truncate max-w-[220px]">{lead.course}</span>
                </span>
                {lead.gradYear && (
                  <span>Target Class of {lead.gradYear}</span>
                )}
                {lead.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span title={lead.city} className="truncate max-w-[150px]">{lead.city}</span>
                  </span>
                )}
                {lead.college && (
                  <span className="flex items-center gap-1">
                    <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span title={lead.college} className="truncate max-w-[200px]">{lead.college}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Counsellor Assigned Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold">
              {lead.assignedTo?.name ? lead.assignedTo.name.charAt(0) : <User className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Assigned Counsellor
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                {lead.assignedTo?.name || 'Unassigned'}
              </span>
              <span className="text-[11px] text-slate-400">
                {lead.assignedTo?.email || 'Assign via Admin'}
              </span>
            </div>
          </div>
        </div>

        {/* Sequential Pipeline Stepper */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Admissions Stage Progression
            </span>
            <span className="text-xs text-slate-400">Click any stage to fast-forward status</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {LEAD_STATUS_ORDER.map((stage, idx) => {
              const currentIdx = LEAD_STATUS_ORDER.indexOf(lead.status as any);
              const isCurrent = lead.status === stage;
              const isPast = currentIdx >= idx;

              return (
                <button
                  key={stage}
                  onClick={() => handleQuickStatusChange(stage)}
                  disabled={updatingStatus}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition min-h-[44px] ${
                    isCurrent
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : isPast
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:bg-slate-100'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  <span className="truncate">{stage.replace(/_/g, ' ')}</span>
                  {updatingStatusTo === stage ? (
                    <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : isPast ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid: Contact Information & Follow-Up box (Left) vs Activity Timeline (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact & Metadata */}
        <div className="space-y-6">
          {/* Quick Contact Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Direct Student Channels
            </h3>

            {/* Phone */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Phone Number</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {lead.phone || 'Not provided'}
                </span>
              </div>
              {lead.phone && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${lead.phone}`}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Email Address</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                  {lead.email || 'Not provided'}
                </span>
              </div>
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="w-full py-2 px-3 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/50 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Follow-up Scheduler Box */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Next Follow-up Due</span>
              </h3>
              <FollowUpBadge date={lead.nextFollowUpDate} size="sm" />
            </div>

            <div className="space-y-2 pt-1">
              <input
                id="student-followup-input"
                aria-label="Student next follow-up date and time"
                type="datetime-local"
                disabled={updatingFollowUp}
                value={inlineFollowUpDate}
                onChange={(e) => setInlineFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleQuickFollowUpSave}
                disabled={updatingFollowUp}
                className="w-full py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {updatingFollowUp ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Calendar className="w-3.5 h-3.5" />
                )}
                <span>Update Follow-up Schedule</span>
              </button>
            </div>
          </div>

          {/* Remarks & System Dates */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2.5 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Profile Notes & Remarks
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 break-words">
              {lead.notes || 'No notes added for this student.'}
            </p>
            <div className="pt-2 text-[11px] text-slate-400 space-y-1">
              <div>Registered on: {formatDate(lead.createdAt, true)}</div>
              <div>Last modified: {formatDate(lead.updatedAt, true)}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Chronological Interaction Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Communication History
                </h3>
                <p className="text-xs text-slate-400">
                  Chronological activity timeline of phone calls, chats, emails, and meetings
                </p>
              </div>

              <button
                onClick={() => setActivityModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl transition flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Entry</span>
              </button>
            </div>

            <ActivityTimeline
              activities={lead.activities || []}
              onAddActivityClick={() => setActivityModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Activity Log Modal */}
      <ActivityLogModal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        leadId={lead.id}
        leadName={lead.name}
        currentStatus={lead.status}
        onActivityCreated={handleActivityLogged}
      />

      {/* Edit Lead Modal */}
      <LeadFormModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={() => fetchLeadDetail()}
        initialLead={lead}
        currentUser={currentUser}
      />
    </div>
  );
}
