'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeadItem, ActivityItem, LeadStatus } from '@/lib/types';
import { formatDate, getFollowUpStatus } from '@/lib/utils';
import { FollowUpBadge } from '@/components/common/FollowUpBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ActivityLogModal } from '@/components/activities/ActivityLogModal';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Phone,
  MessageCircle,
  ExternalLink,
  PlusCircle,
  User,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

export default function FollowUpsPage() {
  const [activeTab, setActiveTab] = useState<'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'ALL'>('ALL');
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Quick activity log modal
  const [selectedLeadForActivity, setSelectedLeadForActivity] = useState<LeadItem | null>(null);

  const fetchFollowUps = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads?limit=200');
      if (!res.ok) {
        throw new Error('Failed to load scheduled follow-up queue.');
      }
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads.filter((l: LeadItem) => l.nextFollowUpDate));
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the follow-ups server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const overdueLeads = leads.filter((l) => getFollowUpStatus(l.nextFollowUpDate) === 'OVERDUE');
  const dueTodayLeads = leads.filter((l) => getFollowUpStatus(l.nextFollowUpDate) === 'DUE_TODAY');
  const upcomingLeads = leads.filter((l) => getFollowUpStatus(l.nextFollowUpDate) === 'UPCOMING');

  const getFilteredLeads = () => {
    switch (activeTab) {
      case 'OVERDUE':
        return overdueLeads;
      case 'DUE_TODAY':
        return dueTodayLeads;
      case 'UPCOMING':
        return upcomingLeads;
      case 'ALL':
      default:
        return leads;
    }
  };

  const filteredLeads = getFilteredLeads();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Follow-up SLA & Reminders</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            Follow-ups Task Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Prioritize pending outreach, complete due reminders, and keep student conversations active.
          </p>
        </div>

        <button
          onClick={fetchFollowUps}
          disabled={isLoading}
          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition disabled:opacity-50 self-start sm:self-center"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
            Failed to Load Follow-ups
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchFollowUps}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Tabs / Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setActiveTab('OVERDUE')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'OVERDUE'
              ? 'bg-red-50 dark:bg-red-950/60 border-red-500 ring-2 ring-red-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
              🔴 Overdue
            </span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {overdueLeads.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Missed target date</p>
        </button>

        <button
          onClick={() => setActiveTab('DUE_TODAY')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'DUE_TODAY'
              ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              🟡 Due Today
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {dueTodayLeads.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Scheduled for today</p>
        </button>

        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'UPCOMING'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              🟢 Upcoming
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {upcomingLeads.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Future scheduled calls</p>
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeTab === 'ALL'
              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              All Scheduled
            </span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {leads.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Complete queue</p>
        </button>
      </div>

      {/* Leads List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300">
            Showing {filteredLeads.length} follow-up tasks
          </span>
          <span className="text-slate-400">Sorted by urgency</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading follow-ups...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="font-bold text-slate-800 dark:text-white">No tasks in this category</p>
              <p className="text-xs text-slate-500 mt-1">All scheduled actions are up to date.</p>
            </div>
          ) : (
            filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
              >
                {/* Lead Summary */}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-black text-slate-900 dark:text-white text-base hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      {lead.name}
                    </Link>
                    <StatusBadge status={lead.status} size="sm" />
                    <FollowUpBadge date={lead.nextFollowUpDate} showDate={true} size="sm" />
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.course}</span>
                    {lead.city && <span>• {lead.city}</span>}
                    <span className="flex items-center gap-1 text-slate-500">
                      <User className="w-3 h-3 text-slate-400" />
                      {lead.assignedTo?.name || 'Unassigned'}
                    </span>
                  </div>

                  {lead.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-1 line-clamp-1 italic">
                      "{lead.notes}"
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  {lead.phone && (
                    <>
                      <a
                        href={`tel:${lead.phone}`}
                        className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </>
                  )}

                  <button
                    onClick={() => setSelectedLeadForActivity(lead)}
                    className="px-3 py-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Log Call</span>
                  </button>

                  <Link
                    href={`/leads/${lead.id}`}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                    title="Open Profile"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Activity Modal */}
      {selectedLeadForActivity && (
        <ActivityLogModal
          isOpen={Boolean(selectedLeadForActivity)}
          onClose={() => setSelectedLeadForActivity(null)}
          leadId={selectedLeadForActivity.id}
          leadName={selectedLeadForActivity.name}
          currentStatus={selectedLeadForActivity.status}
          onActivityCreated={() => {
            fetchFollowUps();
          }}
        />
      )}
    </div>
  );
}
