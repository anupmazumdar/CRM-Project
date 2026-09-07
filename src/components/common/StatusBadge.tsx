import React from 'react';
import { getStatusInfo } from '@/lib/utils';
import { LeadStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: LeadStatus | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  const info = getStatusInfo(status);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-colors ${info.badgeClass} ${sizeClasses[size]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${info.dotClass}`} />
      <span>{info.label}</span>
    </span>
  );
};
