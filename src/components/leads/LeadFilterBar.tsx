import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, Download, ChevronDown, Calendar, Users, Layers, Award } from 'lucide-react';
import { LEAD_SOURCES, COURSES_LIST, LEAD_STATUS_ORDER } from '@/lib/utils';
import { UserSession } from '@/lib/types';

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
  currentUser,
  totalResults,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [counsellors, setCounsellors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.team) {
          setCounsellors(data.team);
        }
      })
      .catch(() => {});
  }, []);

  const activeFilterCount = [
    status !== 'all' ? 1 : 0,
    source !== 'all' ? 1 : 0,
    assignedTo !== 'all' ? 1 : 0,
    course !== 'all' ? 1 : 0,
    followUpState !== 'all' ? 1 : 0,
    startDate ? 1 : 0,
    endDate ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
      {/* Primary search row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search box */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, phone, email, college, city..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick status filter */}
        <div className="w-full md:w-44">
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Pipeline Statuses</option>
            {LEAD_STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {st.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Quick follow-up tag filter */}
        <div className="w-full md:w-44">
          <select
            value={followUpState}
            onChange={(e) => onFollowUpStateChange(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Follow-ups</option>
            <option value="OVERDUE">🔴 Overdue</option>
            <option value="DUE_TODAY">🟡 Due Today</option>
            <option value="UPCOMING">🟢 Upcoming</option>
            <option value="NONE">⚪ No Follow-up</option>
          </select>
        </div>

        {/* Toggle Filters & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3.5 py-2.5 text-sm font-medium rounded-xl border transition flex items-center gap-2 shrink-0 ${
              showAdvanced || activeFilterCount > 0
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
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
            title="Export filtered records to CSV"
            className="px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl transition flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Advanced expandable filters */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-fadeIn">
          {/* Source filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Lead Source
            </label>
            <select
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
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> Academic Course
            </label>
            <select
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Assigned Counsellor
              </label>
              <select
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
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> From Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> To Date
              </label>
              <input
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
