import { z } from 'zod';
import { passwordPolicySchema } from '@/security/password-policy';
export { passwordPolicySchema };

export const phoneRegex = /^(\+?\d{1,4}[\s-]?)?\(?\d{1,4}\)?[\s-]?\d{1,4}[\s-]?\d{1,9}$/;

export const leadSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: 'Student name must be at least 2 characters' })
      .max(100, { message: 'Name cannot exceed 100 characters' }),
    email: z
      .string()
      .trim()
      .email({ message: 'Please enter a valid email address (e.g. student@example.com)' })
      .optional()
      .or(z.literal('')),
    phone: z
      .string()
      .trim()
      .regex(phoneRegex, { message: 'Please enter a valid phone number (7-15 digits)' })
      .optional()
      .or(z.literal('')),
    college: z.string().trim().max(150).optional().or(z.literal('')),
    course: z
      .string()
      .trim()
      .min(1, { message: 'Course is required' }),
    gradYear: z
      .number()
      .int()
      .min(2020, { message: 'Graduation year must be 2020 or later' })
      .max(2035, { message: 'Graduation year cannot exceed 2035' })
      .optional()
      .nullable(),
    city: z.string().trim().max(100).optional().or(z.literal('')),
    source: z.string().trim().min(1, { message: 'Lead source is required' }),
    status: z.enum(['New', 'Contacted', 'Interested', 'Follow_up', 'Converted', 'Lost'], {
      errorMap: () => ({ message: 'Invalid lead status' }),
    }),
    assignedToId: z.string().optional().nullable().or(z.literal('')),
    nextFollowUpDate: z.string().optional().nullable().or(z.literal('')),
    notes: z.string().max(2000, { message: 'Notes cannot exceed 2000 characters' }).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      const hasEmail = Boolean(data.email && data.email.trim().length > 0);
      const hasPhone = Boolean(data.phone && data.phone.trim().length > 0);
      return hasEmail || hasPhone;
    },
    {
      message: 'At least one contact method (Email or Phone) is required',
      path: ['email'],
    }
  );

export const leadCreateSchema = leadSchema.refine(
  (data) => {
    if (!data.nextFollowUpDate || data.nextFollowUpDate.trim() === '') return true;
    const selected = new Date(data.nextFollowUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected >= today;
  },
  {
    message: 'Next follow-up date for new leads cannot be in the past',
    path: ['nextFollowUpDate'],
  }
);

export const activitySchema = z.object({
  leadId: z.string().min(1, { message: 'Lead ID is required' }),
  type: z.enum(['Call', 'Email', 'WhatsApp', 'Meeting', 'Follow_up'], {
    errorMap: () => ({ message: 'Please select a valid activity type' }),
  }),
  date: z.string().min(1, { message: 'Date and time is required' }),
  notes: z
    .string()
    .trim()
    .min(3, { message: 'Activity notes must be at least 3 characters' })
    .max(2000, { message: 'Notes cannot exceed 2000 characters' }),
  nextAction: z.string().max(500).optional().or(z.literal('')),
  nextFollowUpDate: z.string().optional().or(z.literal('')),
  updateStatusTo: z.enum(['New', 'Contacted', 'Interested', 'Follow_up', 'Converted', 'Lost']).optional().or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const userCreateSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().trim().email({ message: 'Valid email is required' }),
  password: passwordPolicySchema,
  role: z.enum(['ADMIN', 'MEMBER'], { errorMap: () => ({ message: 'Role must be ADMIN or MEMBER' }) }),
  department: z.string().trim().default('Admissions'),
  adminPassword: z.string().optional(),
});
