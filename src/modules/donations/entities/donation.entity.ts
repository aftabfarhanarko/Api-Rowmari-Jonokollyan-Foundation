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
  @Column({ name: 'donor_name', length: 120, nullable: true })
  donorName: string | null;

  @Column({ name: 'donor_phone', length: 20, nullable: true })
  donorPhone: string | null;

  @Column({ name: 'donor_email', length: 150, nullable: true })
  donorEmail: string | null;

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 10, default: 'BDT' })
  currency: string;

  @Column({ name: 'payment_method', length: 50, default: 'CASH' })
  paymentMethod: string;

  @Column({ name: 'transaction_reference', length: 100, nullable: true })
  transactionReference: string | null;

  @Index()
  @Column({ name: 'campaign_id', nullable: true })
  campaignId: string | null;

  @ManyToOne(() => Campaign, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign | null;

  @Index()
  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.COMPLETED,
  })
  status: DonationStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToOne(() => Receipt, (receipt) => receipt.donation, { cascade: true })
  receipt: Receipt;
}
