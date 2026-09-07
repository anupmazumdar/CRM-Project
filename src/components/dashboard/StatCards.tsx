import React from 'react';
import { Users, UserPlus, PhoneIncoming, HeartHandshake, Clock, Award, XCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface StatCardsProps {
  counts: {
    total: number;
    new: number;
    contacted: number;
    interested: number;
    followUpDue: number;
    converted: number;
    lost: number;
    conversionRate: number;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ counts }) => {
  const cards = [
    {
      title: 'Total Inquiries',
      value: counts.total,
      subtext: 'All registered prospective students',
      icon: Users,
      color: 'blue',
      href: '/leads',
      bgClass: 'from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50',
    },
    {
      title: 'New Untouched',
      value: counts.new,
      subtext: 'Awaiting initial outreach',
      icon: UserPlus,
      color: 'sky',
      href: '/leads?status=New',
      bgClass: 'from-sky-500/10 to-cyan-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/50',
    },
    {
      title: 'Contacted',
      value: counts.contacted,
      subtext: 'Initial call/chat completed',
      icon: PhoneIncoming,
      color: 'indigo',
      href: '/leads?status=Contacted',
      bgClass: 'from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50',
    },
    {
      title: 'Interested',
      value: counts.interested,
      subtext: 'Active admission prospects',
      icon: HeartHandshake,
      color: 'amber',
      href: '/leads?status=Interested',
      bgClass: 'from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
    },
    {
      title: 'Follow-ups Due',
      value: counts.followUpDue,
      subtext: 'Urgent action required today',
      icon: Clock,
      color: 'purple',
      href: '/follow-ups',
      bgClass: 'from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50',
    },
    {
      title: 'Enrolled / Converted',
      value: counts.converted,
      subtext: `${counts.conversionRate}% conversion rate`,
      icon: Award,
      color: 'emerald',
      href: '/leads?status=Converted',
      bgClass: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
    },
    {
      title: 'Lost / Dropped',
      value: counts.lost,
      subtext: 'Ineligible or opted out',
      icon: XCircle,
      color: 'rose',
      href: '/leads?status=Lost',
      bgClass: 'from-rose-500/10 to-red-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50',
    },
    {
      title: 'Conversion Ratio',
      value: `${counts.conversionRate}%`,
      subtext: 'Total converted / Total leads',
      icon: TrendingUp,
      color: 'cyan',
      href: '/reports',
      bgClass: 'from-cyan-500/10 to-blue-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.title}
            href={card.href}
            className="group relative p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.title}
              </span>
              <div
                className={`p-2 rounded-xl bg-gradient-to-br border ${card.bgClass} transition group-hover:scale-110`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {card.value}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {card.subtext}
            </p>
          </Link>
        );
      })}
    </div>
  );
};
