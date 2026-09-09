import React from 'react';
import Link from 'next/link';
import { Clock, Phone, MessageCircle, ArrowRight, User } from 'lucide-react';
import { FollowUpBadge } from '../common/FollowUpBadge';
import { StatusBadge } from '../common/StatusBadge';
import { LeadItem, FollowUpStatus } from '@/backend/types';

interface FollowUpWidgetProps {
  urgentFollowUps: (LeadItem & { followUpStatus: FollowUpStatus; daysDiff: number })[];
}

export const FollowUpWidget: React.FC<FollowUpWidgetProps> = ({ urgentFollowUps }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            High Priority Follow-ups
          </h3>
        </div>
        <Link
          href="/follow-ups"
          className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
        >
          <span>View All Queue</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {urgentFollowUps.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          🎉 All follow-up tasks are completed! No overdue or due today leads.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-1">
          {urgentFollowUps.slice(0, 5).map((lead) => (
            <div
              key={lead.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate"
                  >
                    {lead.name}
                  </Link>
                  <StatusBadge status={lead.status} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                  <span>{lead.course}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    {lead.assignedTo?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <FollowUpBadge date={lead.nextFollowUpDate} showDate={true} size="sm" />

                {/* Quick actions */}
                <div className="flex items-center gap-1">
                  {lead.phone && (
                    <>
                      <a
                        href={`tel:${lead.phone}`}
                        title={`Call ${lead.name}`}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat on WhatsApp"
                        className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-lg transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                  <Link
                    href={`/leads/${lead.id}`}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    title="View Profile"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
