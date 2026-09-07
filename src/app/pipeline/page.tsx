'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeadItem, LeadStatus } from '@/lib/types';
import { LEAD_STATUS_ORDER, getStatusInfo } from '@/lib/utils';
import { FollowUpBadge } from '@/components/common/FollowUpBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import {
  Kanban,
  User,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { LeadFormModal } from '@/components/leads/LeadFormModal';

export default function PipelinePage() {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false);

  const fetchPipelineLeads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/leads?limit=150');
      const data = await res.json();
      if (data.leads) {
        setLeads(data.leads);
      }
    } catch (err) {
      console.error('Fetch pipeline error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineLeads();
  }, []);

  const handleMoveStatus = async (leadId: string, nextStatus: LeadStatus) => {
    setMovingLeadId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: nextStatus } : l))
        );
      }
    } catch (err) {
      console.error('Move status error:', err);
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
            className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 rounded-xl shadow-sm transition"
            title="Refresh Board"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setNewLeadModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Kanban Horizontal Board */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-[1300px]">
          {LEAD_STATUS_ORDER.map((stage) => {
            const stageLeads = leads.filter((l) => l.status === stage);
            const statusInfo = getStatusInfo(stage);
            const nextStage = getNextStage(stage);

            return (
              <div
                key={stage}
                className="flex-1 min-w-[250px] max-w-[280px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col max-h-[calc(100vh-220px)] shadow-sm"
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
                            className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                          >
                            {lead.name}
                          </Link>
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-slate-400 hover:text-blue-600 shrink-0"
                            title="Open Student Profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>

                        {/* Course & City */}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">
                            {lead.course}
                          </span>
                          {lead.city && <span>{lead.city}</span>}
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
                              className="px-2 py-1 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-lg font-semibold flex items-center gap-1 transition text-[10px] shadow-subtle"
                              title={`Advance to ${nextStage.replace(/_/g, ' ')}`}
                            >
                              <span>Advance</span>
                              <ArrowRight className="w-3 h-3" />
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
        currentUser={null}
      />
    </div>
  );
}
