import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuditService } from '../../modules/audit/audit.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';
import { extractClientIp } from '../utils/client-ip.util';

@Injectable()
export class AuditLoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLoggerInterceptor.name);

  // Sensitive keys that must NEVER be written to audit logs
  private readonly SENSITIVE_KEYS = new Set([
    'password',
    'passwordhash',
    'refreshtoken',
    'accesstoken',
    'token',
    'code',
    'secret',
    'authorization',
  ]);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const auditOptions = this.reflector.getAllAndOverride<AuditLogOptions>(
      AUDIT_LOG_KEY,
      [context.getHandler(), context.getClass()],
    );

    const method = req.method.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    // Only audit mutations or endpoints explicitly annotated with @AuditLog
    if (!auditOptions && !isMutation) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (responseData) => {
          this.saveAuditRecord(req, res, startTime, auditOptions, responseData);
        },
        error: (err) => {
          this.saveAuditRecord(req, res, startTime, auditOptions, null, err);
        },
      }),
    );
  }

  private async saveAuditRecord(
    req: Request,
    res: Response,
    startTime: number,
    auditOptions?: AuditLogOptions,
    responseData?: any,
    error?: any,
  ) {
    try {
      const durationMs = Date.now() - startTime;
      const user = (req as any).user;
      const actorId = user?.id || null;
      const actorName = user?.fullName || (actorId ? 'User' : 'Guest/Anonymous');
      const ipAddress = extractClientIp(req);
      const userAgent = req.headers['user-agent'] || null;
      const statusCode = error ? (error.status || 500) : res.statusCode;

      // Determine entity type and ID
      const entityType =
        auditOptions?.entityType || this.inferEntityType(req.path);
      const entityId =
        req.params?.id ||
        responseData?.id ||
        responseData?.data?.id ||
        null;

      // Determine action name
      const action =
        auditOptions?.action || `${req.method.toUpperCase()} ${req.route?.path || req.path}`;

      // Sanitize request body if payload saving is allowed
      let sanitizedPayload: Record<string, any> | null = null;
      // Mutation payloads commonly contain PII and financial details. Persist
      // them only when a handler explicitly opts in.
      if (auditOptions?.savePayload === true && req.body && typeof req.body === 'object') {
        sanitizedPayload = this.sanitizePayload(req.body);
      }

      await this.auditService.record({
        actorId,
        actorName,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        method: req.method,
        route: req.route?.path || req.path,
        statusCode,
        durationMs,
        metadata: {
          body: sanitizedPayload,
        },
        ipAddress,
        userAgent,
      });
    } catch (err: any) {
      this.logger.warn(`Failed persisting audit record: ${err.message}`);
    }
  }

  private inferEntityType(path: string): string {
    if (path.includes('assistance-applications')) return 'HelpApplication';
    if (path.includes('donors')) return 'DonorProfile';
    if (path.includes('blood')) return 'BloodRequest';
    if (path.includes('volunteers')) return 'VolunteerProfile';
    if (path.includes('campaigns')) return 'Campaign';
    if (path.includes('medical-camps')) return 'MedicalCamp';
    if (path.includes('donations')) return 'Donation';
    if (path.includes('expenses')) return 'Expense';
    if (path.includes('users')) return 'User';
    if (path.includes('auth')) return 'Auth';
    if (path.includes('content')) return 'Content';
    return 'RESOURCE';
  }

  private sanitizePayload(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (this.SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = '***REDACTED***';
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.sanitizePayload(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
