import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationQueryDto, createPaginationResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CreateAuditLogParams {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  method?: string | null;
  route?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async record(params: CreateAuditLogParams): Promise<AuditLog> {
    try {
      const log = this.auditRepo.create({
        actorId: params.actorId || null,
        actorName: params.actorName || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        method: params.method || null,
        route: params.route || null,
        statusCode: params.statusCode || null,
        durationMs: params.durationMs || null,
        metadata: params.metadata || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      });

      const saved = await this.auditRepo.save(log);
      this.logger.log(
        `[AUDIT] Action: ${params.action} | Entity: ${params.entityType}:${params.entityId || 'N/A'} | Actor: ${params.actorName || 'Anonymous/System'} | IP: ${params.ipAddress || 'unknown'}`,
      );
      return saved;
    } catch (err: any) {
      // Audit recording should not throw or disrupt the business process
      this.logger.error(`Failed to record audit log: ${err.message}`, err.stack);
      return null as any;
    }
  }

  async findAll(
    query: PaginationQueryDto,
    filters?: { entityType?: string; action?: string; actorId?: string; ipAddress?: string },
  ): Promise<PaginatedResult<AuditLog>> {
    const qb = this.auditRepo.createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip(query.skip)
      .take(query.limit);

    if (filters?.entityType) {
      qb.andWhere('a.entityType = :entityType', { entityType: filters.entityType });
    }
    if (filters?.action) {
      qb.andWhere('a.action = :action', { action: filters.action });
    }
    if (filters?.actorId) {
      qb.andWhere('a.actorId = :actorId', { actorId: filters.actorId });
    }
    if (filters?.ipAddress) {
      qb.andWhere('a.ipAddress = :ipAddress', { ipAddress: filters.ipAddress });
    }

    const [items, total] = await qb.getManyAndCount();
    return createPaginationResult(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<AuditLog | null> {
    return this.auditRepo.findOne({ where: { id } });
  }
}
