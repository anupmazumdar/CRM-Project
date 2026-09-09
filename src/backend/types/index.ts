export type Role = 'ADMIN' | 'MEMBER';

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow_up'
  | 'Converted'
  | 'Lost';

export type LeadSource =
  | 'Website'
  | 'WhatsApp'
  | 'Referral'
  | 'Walk_in'
  | 'Social_Media'
  | 'Email_Campaign'
  | 'Education_Fair'
  | 'Other';

export type ActivityType =
  | 'Call'
  | 'Email'
  | 'WhatsApp'
  | 'Meeting'
  | 'Follow_up';

export type FollowUpStatus = 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING' | 'NONE';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string | null;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  course: string;
  gradYear: number | null;
  city: string | null;
  source: string;
  status: LeadStatus;
  nextFollowUpDate: string | null;
  notes: string | null;
  assignedToId: string | null;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  activities?: ActivityItem[];
  _count?: {
    activities: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  leadId: string;
  type: ActivityType;
  date: string;
  notes: string;
  nextAction: string | null;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role?: string;
  } | null;
  lead?: {
    id: string;
    name: string;
    course: string;
    status: LeadStatus;
  } | null;
  createdAt: string;
}

export interface DashboardMetrics {
  counts: {
    total: number;
    new: number;
    contacted: number;
    interested: number;
    followUpDue: number;
    converted: number;
    lost: number;
    conversionRate: number; // percentage
  };
  leadsBySource: { source: string; count: number; percentage: number }[];
  leadsByStatus: { status: string; count: number; color: string }[];
  monthlyRegistrations: { month: string; leads: number; converted: number }[];
  teamPerformance: {
    counsellorId: string;
    counsellorName: string;
    assigned: number;
    contacted: number;
    interested: number;
    converted: number;
    conversionRate: number;
  }[];
  urgentFollowUps: (LeadItem & { followUpStatus: FollowUpStatus; daysDiff: number })[];
  recentActivities: ActivityItem[];
}

export interface TeamMemberStats {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  assignedCount: number;
  contactedCount: number;
  interestedCount: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number;
  overdueFollowUps: number;
  createdAt: string;
}
