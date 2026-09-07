'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LeadItem, UserSession } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/common/StatusBadge';
import { FollowUpBadge } from '@/components/common/FollowUpBadge';
import { SourceBadge } from '@/components/common/SourceBadge';
import { LeadFilterBar } from '@/components/leads/LeadFilterBar';
import { LeadFormModal } from '@/components/leads/LeadFormModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import {
  Users,
  Plus,
  Phone,
  MessageCircle,
  Mail,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  GraduationCap,
} from 'lucide-react';

function LeadsContent() {
  const urlSearchParams = useSearchParams();

  // Filter and search states
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(urlSearchParams.get('status') || 'all');
  const [source, setSource] = useState('all');
  const [assignedTo, setAssignedTo] = useState('all');
  const [course, setCourse] = useState('all');
  const [followUpState, setFollowUpState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Data states
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Modal states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadItem | null>(null);
  const [deletingLead, setDeletingLead] = useState<LeadItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current user
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Fetch leads with debouncing on search
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (status !== 'all') params.set('status', status);
      if (source !== 'all') params.set('source', source);
      if (assignedTo !== 'all') params.set('assignedTo', assignedTo);
      if (course !== 'all') params.set('course', course);
      if (followUpState !== 'all') params.set('followUpState', followUpState);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', page.toString());
      params.set('limit', '25');

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Fetch leads error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [search, status, source, assignedTo, course, followUpState, startDate, endDate, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setSource('all');
    setAssignedTo('all');
    setCourse('all');
    setFollowUpState('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleExportCSV = () => {
    if (leads.length === 0) return;

    const headers = [
      'ID',
      'Name',
      'Email',
      'Phone',
      'Course',
      'Grad Year',
      'College',
      'City',
      'Source',
      'Status',
      'Assigned To',
      'Next Follow-up',
      'Date Added',
    ];

    const rows = leads.map((l) => [
      l.id,
      `"${(l.name || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      `"${l.course || ''}"`,
      l.gradYear || '',
      `"${(l.college || '').replace(/"/g, '""')}"`,
      `"${l.city || ''}"`,
      l.source || '',
      l.status || '',
      `"${l.assignedTo?.name || 'Unassigned'}"`,
      l.nextFollowUpDate ? formatDate(l.nextFollowUpDate, true) : '',
      formatDate(l.createdAt),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `xyz_college_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/leads/${deletingLead.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
      }
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setDeletingLead(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Admissions Records</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
            Student Leads Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Search, filter, assign, and track all incoming admissions inquiries.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingLead(null);
            setFormModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Student</span>
        </button>
      </div>

      {/* Combinable Filters Toolbar */}
      <LeadFilterBar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        source={source}
        onSourceChange={(v) => {
          setSource(v);
          setPage(1);
        }}
        assignedTo={assignedTo}
        onAssignedToChange={(v) => {
          setAssignedTo(v);
          setPage(1);
        }}
        course={course}
        onCourseChange={(v) => {
          setCourse(v);
          setPage(1);
        }}
        followUpState={followUpState}
        onFollowUpStateChange={(v) => {
          setFollowUpState(v);
          setPage(1);
        }}
        startDate={startDate}
        onStartDateChange={(v) => {
          setStartDate(v);
          setPage(1);
        }}
        endDate={endDate}
        onEndDateChange={(v) => {
          setEndDate(v);
          setPage(1);
        }}
        onReset={handleResetFilters}
        onExportCSV={handleExportCSV}
        currentUser={currentUser}
        totalResults={pagination.total}
      />

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student Demographics</th>
                <th className="py-3.5 px-3">Course / Target</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Next Follow-up</th>
                <th className="py-3.5 px-3">Channel Source</th>
                <th className="py-3.5 px-3">Counsellor</th>
                <th className="py-3.5 px-3">Quick Contact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {isLoading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-md w-full" />
                    </td>
                  </tr>
                ))
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No student records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Try relaxing your search terms or filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                  >
                    {/* Student name & contact */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {lead.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate"
                          >
                            {lead.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            {lead.city && <span>{lead.city}</span>}
                            {lead.college && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px]">{lead.college}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
                        {lead.course}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {lead.gradYear ? `Batch of ${lead.gradYear}` : 'General'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <StatusBadge status={lead.status} size="sm" />
                    </td>

                    {/* Next Follow-up */}
                    <td className="py-3.5 px-3">
                      <FollowUpBadge date={lead.nextFollowUpDate} showDate={true} size="sm" />
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-3">
                      <SourceBadge source={lead.source} size="sm" />
                    </td>

                    {/* Assigned Counsellor */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[120px]">
                          {lead.assignedTo?.name || <span className="text-slate-400 italic">Unassigned</span>}
                        </span>
                      </div>
                    </td>

                    {/* Quick Contact Icons */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1">
                        {lead.phone && (
                          <>
                            <a
                              href={`tel:${lead.phone}`}
                              title={`Call ${lead.phone}`}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp Chat"
                              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            title={`Email ${lead.email}`}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 rounded-lg transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/leads/${lead.id}`}
                          title="View Full Profile & Timeline"
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setFormModalOpen(true);
                          }}
                          title="Edit Student Record"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Delete Lead (Admin Only)"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.total} total)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-medium"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Create / Edit Modal */}
      <LeadFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingLead(null);
        }}
        onSuccess={() => {
          fetchLeads();
        }}
        initialLead={editingLead}
        currentUser={currentUser}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingLead)}
        title="Delete Student Lead"
        message={`Are you sure you want to permanently delete "${deletingLead?.name}"? All associated interaction history and timeline records will also be erased.`}
        confirmText="Delete Record"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteLead}
        onCancel={() => setDeletingLead(null)}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Student Database...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
