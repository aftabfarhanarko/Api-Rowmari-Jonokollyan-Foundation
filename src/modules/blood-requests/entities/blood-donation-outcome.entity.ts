import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DonorMatch } from './donor-match.entity';

@Entity('blood_donation_outcomes')
export class BloodDonationOutcome extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'match_id' })
  matchId: string;

  @OneToOne(() => DonorMatch, (match) => match.outcome, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: DonorMatch;

  @Column({ name: 'donation_date', type: 'date' })
  donationDate: string;

  @Column({ name: 'units_donated', type: 'int', default: 1 })
  unitsDonated: number;

  @Column({ type: 'text', nullable: true })
  feedback: string | null;
}
