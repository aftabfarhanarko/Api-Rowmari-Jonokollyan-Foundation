import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log_options';

export interface AuditLogOptions {
  action?: string;
  entityType?: string;
  savePayload?: boolean;
}

export const AuditLog = (options: AuditLogOptions = {}) =>
  SetMetadata(AUDIT_LOG_KEY, options);
