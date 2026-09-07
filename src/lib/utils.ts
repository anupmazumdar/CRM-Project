import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FollowUpStatus, LeadStatus, LeadSource, ActivityType } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFollowUpStatus(followUpDate: string | Date | null | undefined): FollowUpStatus {
  if (!followUpDate) return 'NONE';

  const date = new Date(followUpDate);
  if (isNaN(date.getTime())) return 'NONE';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays === 0) return 'DUE_TODAY';
  return 'UPCOMING';
}

export function getFollowUpTagInfo(status: FollowUpStatus) {
  switch (status) {
    case 'OVERDUE':
      return {
        label: 'Overdue',
        badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 font-medium',
        dotClass: 'bg-red-500 animate-pulse',
      };
    case 'DUE_TODAY':
      return {
        label: 'Due Today',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium',
        dotClass: 'bg-amber-500',
      };
    case 'UPCOMING':
      return {
        label: 'Upcoming',
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium',
        dotClass: 'bg-emerald-500',
      };
    default:
      return {
        label: 'No Follow-up',
        badgeClass: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getStatusInfo(status: LeadStatus | string) {
  switch (status) {
    case 'New':
      return {
        label: 'New',
        color: 'blue',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
        dotClass: 'bg-sky-500',
      };
    case 'Contacted':
      return {
        label: 'Contacted',
        color: 'indigo',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
        dotClass: 'bg-indigo-500',
      };
    case 'Interested':
      return {
        label: 'Interested',
        color: 'amber',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
        dotClass: 'bg-amber-500',
      };
    case 'Follow_up':
      return {
        label: 'Follow Up',
        color: 'purple',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
        dotClass: 'bg-purple-500',
      };
    case 'Converted':
      return {
        label: 'Converted',
        color: 'emerald',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        dotClass: 'bg-emerald-500',
      };
    case 'Lost':
      return {
        label: 'Lost / Rejected',
        color: 'rose',
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        dotClass: 'bg-rose-500',
      };
    default:
      return {
        label: status || 'Unknown',
        color: 'slate',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300',
        dotClass: 'bg-slate-400',
      };
  }
}

export function getSourceInfo(source: LeadSource | string) {
  const normalized = (source || '').replace(/_/g, ' ');
  switch (source) {
    case 'Website':
      return { label: 'Website', icon: 'Globe', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200' };
    case 'WhatsApp':
      return { label: 'WhatsApp', icon: 'MessageCircle', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200' };
    case 'Referral':
      return { label: 'Referral', icon: 'Users', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 border-violet-200' };
    case 'Walk_in':
    case 'Walk-in':
      return { label: 'Walk-in', icon: 'Footprints', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200' };
    case 'Social_Media':
    case 'Social Media':
      return { label: 'Social Media', icon: 'Share2', color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200' };
    case 'Email_Campaign':
    case 'Email Campaign':
      return { label: 'Email Campaign', icon: 'Mail', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200' };
    case 'Education_Fair':
    case 'Education Fair':
      return { label: 'Education Fair', icon: 'Award', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200' };
    default:
      return { label: normalized || 'Other', icon: 'HelpCircle', color: 'text-slate-600 bg-slate-50 dark:bg-slate-900 border-slate-200' };
  }
}

export function formatDate(dateStr: string | Date | null | undefined, includeTime = false): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  };
  return d.toLocaleDateString('en-US', options);
}

export function formatRelativeTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Follow_up',
  'Converted',
  'Lost',
];

export const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: 'Website', label: 'Website' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Walk_in', label: 'Walk-in' },
  { value: 'Social_Media', label: 'Social Media' },
  { value: 'Email_Campaign', label: 'Email Campaign' },
  { value: 'Education_Fair', label: 'Education Fair' },
  { value: 'Other', label: 'Other' },
];

export const COURSES_LIST = [
  'B.Tech Computer Science',
  'B.Tech AI & Data Science',
  'B.Tech Electronics & Comm',
  'B.Tech Mechanical Engg',
  'BCA (Cloud Computing)',
  'BBA (Marketing & Finance)',
  'MBA (Business Analytics)',
  'MBA (HR & Operations)',
  'B.Des (UI/UX & Product)',
  'MCA (Full Stack & Cloud)',
];
