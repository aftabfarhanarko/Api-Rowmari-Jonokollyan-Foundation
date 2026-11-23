import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationChannel, NotificationStatus } from '../../../common/constants';

@Entity('notifications')
export class Notification extends BaseEntity {
  @Column({ name: 'recipient_identifier', length: 150 })
  recipientIdentifier: string; // Phone or Email

  @Column({
    type: 'enum',
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ length: 200, nullable: true })
  subject: string | null;

  @Column({ type: 'text' })
  content: string;

  @Index()
  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;
}
