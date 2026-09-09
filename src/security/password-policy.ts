import { z } from 'zod';

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 128;

// Common easily-guessable passwords, default passwords, and predictable patterns to reject
const COMMON_PASSWORDS = new Set([
  'password123',
  'password1234',
  'admin123456',
  'adminpassword',
  'counsellor123',
  'admissions123',
  'college12345',
  'welcome1234',
  'changeme123',
  '1234567890',
  '123456789012',
  'qwerty12345',
  'letmein12345',
  'iloveyou1234',
]);

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validates a password against centralized security requirements:
 * - Minimum 10 characters, maximum 128 characters
 * - Rejection of common, leaked, or easily guessable passwords
 * - Prevention of trivial single-character repeats or simple numeric sequences
 */
export function validatePassword(password: unknown): PasswordValidationResult {
  if (typeof password !== 'string') {
    return { valid: false, message: 'Password must be a valid string.' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`,
    };
  }

  const normalized = password.toLowerCase().trim();

  // Check against common/weak password list
  if (COMMON_PASSWORDS.has(normalized)) {
    return {
      valid: false,
      message: 'This password is too common or easily guessable. Please choose a stronger passphrase.',
    };
  }

  // Reject passwords consisting solely of a single repeated character (e.g. 'aaaaaaaaaa')
  if (/^(.)\1+$/.test(password)) {
    return {
      valid: false,
      message: 'Password cannot consist of a single repeated character.',
    };
  }

  // Reject simple ascending sequential digits
  if (/^(0123456789|1234567890|2345678901)/.test(password)) {
    return {
      valid: false,
      message: 'Password cannot be a simple numeric sequence.',
    };
  }

  return { valid: true };
}

/**
 * Reusable Zod schema enforcing the centralized password security policy.
 */
export const passwordPolicySchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, {
    message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
  })
  .max(MAX_PASSWORD_LENGTH, {
    message: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`,
  })
  .refine((val) => validatePassword(val).valid, {
    message: 'Password is too common or easily guessable. Please choose a stronger passphrase.',
  });
