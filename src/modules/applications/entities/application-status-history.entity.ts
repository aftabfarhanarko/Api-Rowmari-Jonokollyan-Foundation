import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApplicationStatus } from '../../../common/constants';
import { HelpApplication } from './help-application.entity';
import { User } from '../../users/entities/user.entity';

@Entity('application_status_history')
export class ApplicationStatusHistory extends BaseEntity {
  @Index()
  @Column({ name: 'application_id' })
  applicationId: string;

  @ManyToOne(() => HelpApplication, (app) => app.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: HelpApplication;

  @Column({
    name: 'from_status',
    type: 'enum',
    enum: ApplicationStatus,
    nullable: true,
  })
  fromStatus: ApplicationStatus | null;

  @Column({
    name: 'to_status',
    type: 'enum',
    enum: ApplicationStatus,
  })
  toStatus: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ name: 'changed_by_user_id', nullable: true })
  changedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by_user_id' })
  changedByUser: User | null;
}
