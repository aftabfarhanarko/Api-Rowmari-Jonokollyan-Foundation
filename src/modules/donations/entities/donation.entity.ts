import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DonationStatus } from '../../../common/constants';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { Receipt } from './receipt.entity';

@Entity('donations')
export class Donation extends BaseEntity {
  @Column({ name: 'donor_name', type: 'varchar', length: 120, nullable: true })
  donorName: string | null;

  @Column({ name: 'donor_phone', type: 'varchar', length: 20, nullable: true })
  donorPhone: string | null;

  @Column({ name: 'donor_email', type: 'varchar', length: 150, nullable: true })
  donorEmail: string | null;

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'BDT' })
  currency: string;

  @Column({ name: 'payment_method', length: 50, default: 'CASH' })
  paymentMethod: string;

  @Column({ name: 'sender_phone', type: 'varchar', length: 20, nullable: true })
  senderPhone: string | null;

  @Column({ name: 'transaction_reference', type: 'varchar', length: 100, nullable: true })
  transactionReference: string | null;

  @Column({ name: 'payment_proof_url', type: 'varchar', length: 500, nullable: true })
  paymentProofUrl: string | null;

  @Index()
  @Column({ name: 'campaign_id', type: 'uuid', nullable: true })
  campaignId: string | null;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign | null;

  @Index()
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.PENDING,
  })
  status: DonationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'admin_note', type: 'text', nullable: true })
  adminNote: string | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string | null;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt: Date | null;

  @OneToOne(() => Receipt, (receipt) => receipt.donation, { cascade: true })
  receipt: Receipt;
}
