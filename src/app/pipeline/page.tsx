'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeadItem, LeadStatus, UserSession } from '@/backend/types';
import { LEAD_STATUS_ORDER, getStatusInfo } from '@/frontend/utils/ui-helpers';
import { FollowUpBadge } from '@/frontend/components/common/FollowUpBadge';
import { SourceBadge } from '@/frontend/components/common/SourceBadge';
import {
  Kanban,
  User,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  AlertCircle,
  X,
  RotateCcw,
} from 'lucide-react';
import { LeadFormModal } from '@/frontend/components/leads/LeadFormModal';

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [mobileStage, setMobileStage] = useState<string>('ALL');

  // Fetch current user for lead creation permissions
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const fetchPipelineLeads = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/leads?limit=150');
      if (!res.ok) {
        throw new Error('Failed to retrieve pipeline leads from server.');
      }
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err: any) {
      setFetchError(err.message || 'Unable to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineLeads();
  }, []);

  const handleMoveStatus = async (leadId: string, nextStatus: LeadStatus) => {
    setMovingLeadId(leadId);
    setActionError('');
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
        );
      } else {
        setActionError(data.error || 'Failed to update student stage.');
      }
    } catch {
      setActionError('Network error occurred while advancing student.');
    } finally {
      setMovingLeadId(null);
    }
  };

  const getNextStage = (current: string): LeadStatus | null => {
    const idx = LEAD_STATUS_ORDER.indexOf(current as LeadStatus);
    if (idx !== -1 && idx < LEAD_STATUS_ORDER.length - 1) {
      return LEAD_STATUS_ORDER[idx + 1];
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Kanban className="w-3.5 h-3.5" />
            <span>Admissions Workflow</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            Admissions Pipeline Kanban
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Progress student leads across the enrollment lifecycle from inquiry to conversion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchPipelineLeads}
            disabled={isLoading}
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-xl shadow-sm transition disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Refresh Board"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setNewLeadModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
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
          <button
            onClick={() => setActionError('')}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
            Failed to Load Admissions Pipeline
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">{fetchError}</p>
          <button
            onClick={fetchPipelineLeads}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State Banner if no leads exist anywhere */}
      {!isLoading && !fetchError && leads.length === 0 && (
        <div className="p-8 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Kanban className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Admissions Pipeline Empty
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            There are currently no active student leads in the pipeline. Add your first inquiry to start moving students through the admission funnel.
          </p>
          <button
            onClick={() => setNewLeadModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5 min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Student</span>
          </button>
        </div>
      )}

      {/* Mobile Stage Selector Tab Bar */}
      <div className="flex md:hidden overflow-x-auto pb-2 gap-1.5 -mx-2 px-2 scroll-smooth">
        <button
          type="button"
          onClick={() => setMobileStage('ALL')}
          className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] ${
            mobileStage === 'ALL'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}
        >
          All Stages ({leads.length})
        </button>
        {LEAD_STATUS_ORDER.map((st) => {
          const count = leads.filter((l) => l.status === st).length;
          return (
            <button
              type="button"
              key={st}
              onClick={() => setMobileStage(st)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition min-h-[38px] flex items-center gap-1.5 ${
                mobileStage === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>{st.replace(/_/g, ' ')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Horizontal Board */}
      <div className="overflow-x-auto pb-6 scroll-smooth touch-pan-x -mx-3 px-3 sm:mx-0 sm:px-0">
        <div
          className={`flex gap-4 ${
            mobileStage === 'ALL' ? 'min-w-[1300px]' : 'min-w-full md:min-w-[1300px]'
          }`}
        >
          {LEAD_STATUS_ORDER.map((stage) => {
            // If mobile stage filter is active and not 'ALL', hide other columns on small screens
            const isHiddenOnMobile = mobileStage !== 'ALL' && mobileStage !== stage;
            const stageLeads = leads.filter((l) => l.status === stage);
            const statusInfo = getStatusInfo(stage);
            const nextStage = getNextStage(stage);

            return (
              <div
                key={stage}
                className={`flex-1 w-full md:w-auto min-w-[260px] md:max-w-[280px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col max-h-[calc(100vh-220px)] shadow-sm ${
                  isHiddenOnMobile ? 'hidden md:flex' : 'flex'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/80 dark:border-slate-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClass}`} />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      {stage.replace(/_/g, ' ')}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 shadow-subtle">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="mt-3 space-y-3 overflow-y-auto flex-1 pr-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      No leads in {stage.replace(/_/g, ' ')}
                    </div>
                  ) : (
                    stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition space-y-2.5 group"
                      >
                        {/* Title & View Profile Link */}
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/leads/${lead.id}`}
                            title={lead.name}
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                          >
                            {lead.name}
                          </Link>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                            title="Open Student Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* Course & City */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span
                            title={lead.course}
                            className="font-semibold text-slate-700 dark:text-slate-300 block truncate"
                          >
                            {lead.course}
                          </span>
                          {lead.city && <span title={lead.city}>{lead.city}</span>}
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <SourceBadge source={lead.source} size="sm" />
                          {lead.nextFollowUpDate && (
                            <FollowUpBadge date={lead.nextFollowUpDate} size="sm" />
                          )}
                        </div>

                        {/* Footer: Counsellor & Next Action button */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1 truncate max-w-[100px]">
                            <User className="w-3 h-3 shrink-0" />
                            <span className="truncate">{lead.assignedTo?.name || 'Unassigned'}</span>
                          </span>

                          {nextStage && (
                            <button
                              onClick={() => handleMoveStatus(lead.id, nextStage)}
                              disabled={movingLeadId === lead.id}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 transition text-xs shadow-subtle disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
                              title={`Advance to ${nextStage.replace(/_/g, ' ')}`}
                            >
                              {movingLeadId === lead.id ? (
                                <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Advance</span>
                                  <ArrowRight className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Lead Modal */}
      <LeadFormModal
        isOpen={newLeadModalOpen}
        onClose={() => setNewLeadModalOpen(false)}
        onSuccess={() => fetchPipelineLeads()}
        currentUser={currentUser}
      />
    </div>
  );
}
