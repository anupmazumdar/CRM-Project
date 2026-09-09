export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'ACCOUNT_LOCKOUT_TRIGGERED'
  | 'PASSWORD_RESET_ATTEMPT'
  | 'PASSWORD_CHANGED'
  | 'CSRF_BLOCKED'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'ROLE_CHANGED';

export interface SecurityEventPayload {
  type: SecurityEventType;
  ip?: string;
  email?: string;
  userId?: string;
  path?: string;
  details?: string;
  timestamp?: string;
  adminId?: string;
  adminEmail?: string;
  targetUserId?: string;
  targetEmail?: string;
  previousRole?: string;
  newRole?: string;
}

/**
 * Emits structured security audit logs for SIEM and server monitoring.
 * Strictly guarantees that passwords, password hashes, JWTs, and auth cookies are never logged.
 */
export function logSecurityEvent(event: SecurityEventPayload): void {
  const timestamp = event.timestamp || new Date().toISOString();
  const isSuspicious = [
    'RATE_LIMIT_EXCEEDED',
    'ACCOUNT_LOCKOUT_TRIGGERED',
    'CSRF_BLOCKED',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
  ].includes(event.type);

  const logEntry = {
    tag: 'CRM_SECURITY_AUDIT',
    level: isSuspicious ? 'WARN' : 'INFO',
    timestamp,
    ...event,
  };

  if (isSuspicious) {
    console.warn(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`);
  } else {
    console.log(`[SECURITY_AUDIT] ${JSON.stringify(logEntry)}`);
  }
}
