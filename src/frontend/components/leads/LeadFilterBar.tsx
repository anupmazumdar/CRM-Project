import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Download, ChevronDown, Calendar, Users, Layers, Award } from 'lucide-react';
import { LEAD_SOURCES, COURSES_LIST, LEAD_STATUS_ORDER } from '@/frontend/utils/ui-helpers';
import { UserSession } from '@/backend/types';

interface LeadFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  source: string;
  onSourceChange: (val: string) => void;
  assignedTo: string;
  onAssignedToChange: (val: string) => void;
  course: string;
  onCourseChange: (val: string) => void;
  followUpState: string;
  onFollowUpStateChange: (val: string) => void;
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onReset: () => void;
  onExportCSV: () => void;
  isExporting?: boolean;
  exportError?: string;
  currentUser: UserSession | null;
  totalResults: number;
}

export const LeadFilterBar: React.FC<LeadFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  source,
  onSourceChange,
  assignedTo,
  onAssignedToChange,
  course,
  onCourseChange,
  followUpState,
  onFollowUpStateChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onReset,
  onExportCSV,
  isExporting = false,
  exportError = '',
  currentUser,
  totalResults,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetch('/api/team')
        .then((res) => {
          if (!res.ok) return { team: [] };
          return res.json();
        })
        .then((data) => {
          if (data.team) {
            setCounsellors(data.team);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.role]);

  const activeFilterCount = [
    status !== 'all',
    source !== 'all',
    assignedTo !== 'all',
    course !== 'all',
    followUpState !== 'all',
    Boolean(startDate),
    Boolean(endDate),
  ].filter(Boolean).length;

  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
      {exportError && (
        <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
          <span>{exportError}</span>
        </div>
      )}
      {/* Top Search & Primary Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with debouncing */}
        <div className="relative flex-1">
          <label htmlFor="lead-search-input" className="sr-only">
            Search students by name, email, phone, college, or city
          </label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="lead-search-input"
            type="text"
            placeholder="Search by student name, email, phone, city, college..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition min-h-[44px]"
          />
        </div>

        {/* Quick status dropdown & Filter Toggle */}
        <div className="flex items-center gap-2">
          {/* Quick status filter */}
          <label htmlFor="filter-status-quick" className="sr-only">
            Filter by pipeline status
          </label>
          <select
            id="filter-status-quick"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 dark:text-slate-200 min-h-[44px]"
          >
            <option value="all">All Stages</option>
            {LEAD_STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          {/* Advanced filter toggle button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border transition flex items-center gap-1.5 shrink-0 min-h-[44px] ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            disabled={isExporting}
            title="Export filtered records to CSV"
            className="px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
          >
            {isExporting ? (
              <span className="w-4 h-4 border-2 border-slate-600 dark:border-slate-300 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Advanced expandable filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
          {/* Source filter */}
          <div>
            <label htmlFor="filter-source" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Lead Source
            </label>
            <select
              id="filter-source"
              value={source}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Course filter */}
          <div>
            <label htmlFor="filter-course" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> Academic Course
            </label>
            <select
              id="filter-course"
              value={course}
              onChange={(e) => onCourseChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Courses</option>
              {COURSES_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Counsellor filter (Admin only) */}
          {currentUser?.role === 'ADMIN' && (
            <div>
              <label htmlFor="filter-counsellor" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Assigned Counsellor
              </label>
              <select
                id="filter-counsellor"
                value={assignedTo}
                onChange={(e) => onAssignedToChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Counsellors</option>
                <option value="unassigned">Unassigned Only</option>
                {counsellors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date range filter */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label htmlFor="filter-start-date" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> From Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="filter-end-date" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> To Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active filter tags & reset pill */}
      {(activeFilterCount > 0 || search) && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            Showing <strong className="text-slate-800 dark:text-white">{totalResults}</strong> matching student records
          </div>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
