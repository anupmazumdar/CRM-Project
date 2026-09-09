import { FollowUpStatus } from '@/backend/types';

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
