import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Index()
  @Column({ name: 'actor_id', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_name', length: 120, nullable: true })
  actorName: string | null;

  @Index()
  @Column({ length: 100 })
  action: string; // e.g. APPLICATION_APPROVED, EXPENSE_REVIEWED, USER_ROLE_ASSIGNED, POST /api/v1/...

  @Column({ name: 'entity_type', length: 100 })
  entityType: string; // e.g. HelpApplication, Expense, User, Campaign, HTTP_REQUEST

  @Index()
  @Column({ name: 'entity_id', length: 100, nullable: true })
  entityId: string | null;

  @Column({ length: 10, nullable: true })
  method: string | null; // GET, POST, PATCH, PUT, DELETE

  @Column({ length: 255, nullable: true })
  route: string | null;

  @Column({ name: 'status_code', type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Index()
  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;
}
