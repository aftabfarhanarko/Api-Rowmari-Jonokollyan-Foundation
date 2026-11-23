import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Donation } from './donation.entity';

@Entity('receipts')
export class Receipt extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'receipt_number', length: 60 })
  receiptNumber: string;

  @Index({ unique: true })
  @Column({ name: 'donation_id' })
  donationId: string;

  @OneToOne(() => Donation, (d) => d.receipt, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'donation_id' })
  donation: Donation;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt: Date;

  @Column({ name: 'download_url', length: 500, nullable: true })
  downloadUrl: string | null;
}
