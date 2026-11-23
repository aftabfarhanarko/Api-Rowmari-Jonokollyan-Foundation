import {
  Entity,
  Column,
  Index,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ApplicationStatus, ApplicationCategory } from '../../../common/constants';
import { ApplicationDocument } from './application-document.entity';
import { ApplicationStatusHistory } from './application-status-history.entity';
import { User } from '../../users/entities/user.entity';

@Entity('help_applications')
export class HelpApplication extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'reference_code', length: 32 })
  referenceCode: string;

  @Column({ name: 'applicant_user_id', nullable: true })
  applicantUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'applicant_user_id' })
  applicantUser: User | null;

  @Column({ name: 'applicant_name', length: 120 })
  applicantName: string;

  @Index()
  @Column({ name: 'applicant_phone', length: 20 })
  applicantPhone: string;

  @Column({ name: 'applicant_email', nullable: true, length: 150 })
  applicantEmail: string | null;

  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'enum',
    enum: ApplicationCategory,
    default: ApplicationCategory.MEDICAL,
  })
  category: ApplicationCategory;

  @Column({
    name: 'requested_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  requestedAmount: number | null;

  @Column({
    name: 'approved_amount',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  approvedAmount: number | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'privacy_accepted', default: true })
  privacyAccepted: boolean;

  @Column({ name: 'contact_allowed', default: true })
  contactAllowed: boolean;

  @Index()
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
  })
  status: ApplicationStatus;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User | null;

  @OneToMany(() => ApplicationDocument, (doc) => doc.application, { cascade: true })
  documents: ApplicationDocument[];

  @OneToMany(() => ApplicationStatusHistory, (history) => history.application, {
    cascade: true,
  })
  statusHistory: ApplicationStatusHistory[];
}
