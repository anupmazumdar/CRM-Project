'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LeadItem, UserSession } from '@/backend/types';
import { formatDate } from '@/frontend/utils/ui-helpers';
import { StatusBadge } from '@/frontend/components/common/StatusBadge';
import { FollowUpBadge } from '@/frontend/components/common/FollowUpBadge';
import { SourceBadge } from '@/frontend/components/common/SourceBadge';
import { LeadFilterBar } from '@/frontend/components/leads/LeadFilterBar';
import { LeadFormModal } from '@/frontend/components/leads/LeadFormModal';
import { ConfirmModal } from '@/frontend/components/common/ConfirmModal';
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
  AlertCircle,
  RotateCcw,
  X,
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
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');
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
    setError('');
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
      if (!res.ok) {
        throw new Error('Failed to load leads from server.');
      }
      const data = await res.json();

      if (data.leads) {
        setLeads(data.leads);
        setPagination(data.pagination);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading student leads.');
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

  const handleExportCSV = async () => {
    setIsExporting(true);
    setExportError('');
    try {
      const exportParams = new URLSearchParams();
      if (search) exportParams.set('search', search);
      if (status !== 'all') exportParams.set('status', status);
      if (source !== 'all') exportParams.set('source', source);
      if (assignedTo !== 'all') exportParams.set('assignedTo', assignedTo);
      if (course !== 'all') exportParams.set('course', course);
      if (followUpState !== 'all') exportParams.set('followUpState', followUpState);
      if (startDate) exportParams.set('startDate', startDate);
      if (endDate) exportParams.set('endDate', endDate);
      exportParams.set('page', '1');
      exportParams.set('limit', '5000');

      const res = await fetch(`/api/leads?${exportParams.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve full student records for export.');
      }
      const data = await res.json();
      const exportRecords: LeadItem[] = data.leads || leads;

      if (exportRecords.length === 0) {
        setExportError('No matching student inquiries to export.');
        return;
      }

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

      const rows = exportRecords.map((l) => [
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
    } catch (err: any) {
      setExportError(err.message || 'Error occurred during CSV file generation.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!deletingLead) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/leads/${deletingLead.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== deletingLead.id));
        setPagination((prev) => ({ ...prev, total: prev.total - 1 }));
        setDeletingLead(null);
      } else {
        setDeleteError(data.error || 'Failed to delete student lead.');
      }
    } catch {
      setDeleteError('Network error occurred while attempting to delete lead.');
    } finally {
      setIsDeleting(false);
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
        isExporting={isExporting}
        exportError={exportError}
        currentUser={currentUser}
        totalResults={pagination.total}
      />

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="p-4 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{deleteError}</span>
          </div>
          <button onClick={() => setDeleteError('')} className="text-red-500 hover:text-red-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
            Failed to Load Student Records
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchLeads}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition shadow-sm inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs sm:text-sm">
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
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {search || status !== 'all' || source !== 'all' || assignedTo !== 'all' || course !== 'all' || followUpState !== 'all' || startDate || endDate
                        ? 'No student records match your filter criteria'
                        : 'No student inquiries registered yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {search || status !== 'all' || source !== 'all' || assignedTo !== 'all' || course !== 'all' || followUpState !== 'all' || startDate || endDate
                        ? 'Try clearing active filters or modifying your search query to see other admissions leads.'
                        : 'Get started by creating your first student record or importing from admissions campaigns.'}
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      {search || status !== 'all' || source !== 'all' || assignedTo !== 'all' || course !== 'all' || followUpState !== 'all' || startDate || endDate ? (
                        <button
                          onClick={handleResetFilters}
                          className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 rounded-xl transition"
                        >
                          Clear All Filters
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingLead(null);
                            setFormModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
                        >
                          + Register First Student
                        </button>
                      )}
                    </div>
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
                            title={lead.name}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 block truncate max-w-[180px]"
                          >
                            {lead.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                            {lead.city && <span title={lead.city}>{lead.city}</span>}
                            {lead.college && (
                              <>
                                <span>•</span>
                                <span title={lead.college} className="truncate max-w-[140px]">{lead.college}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td className="py-3.5 px-3">
                      <span title={lead.course} className="font-semibold text-slate-800 dark:text-slate-200 block truncate max-w-[160px]">
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
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              title="WhatsApp Chat"
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          </>
                        )}
                        {lead.email && (
                          <a
                            href={`mailto:${lead.email}`}
                            title={`Email ${lead.email}`}
                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/60 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Mail className="w-4 h-4" />
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
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setFormModalOpen(true);
                          }}
                          title="Edit Student Record"
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'ADMIN' && (
                          <button
                            onClick={() => setDeletingLead(lead)}
                            title="Delete Lead (Admin Only)"
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
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
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-medium min-h-[38px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-40 flex items-center gap-1 font-medium min-h-[38px]"
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
