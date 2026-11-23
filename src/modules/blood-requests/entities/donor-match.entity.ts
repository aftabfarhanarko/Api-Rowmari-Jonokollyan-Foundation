import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DonorMatchStatus } from '../../../common/constants';
import { BloodRequest } from './blood-request.entity';
import { DonorProfile } from '../../donors/entities/donor-profile.entity';
import { User } from '../../users/entities/user.entity';
import { BloodDonationOutcome } from './blood-donation-outcome.entity';

@Entity('donor_matches')
@Index(['bloodRequestId', 'donorProfileId'], { unique: true })
export class DonorMatch extends BaseEntity {
  @Index()
  @Column({ name: 'blood_request_id' })
  bloodRequestId: string;

  @ManyToOne(() => BloodRequest, (req) => req.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blood_request_id' })
  bloodRequest: BloodRequest;

  @Index()
  @Column({ name: 'donor_profile_id' })
  donorProfileId: string;

  @ManyToOne(() => DonorProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'donor_profile_id' })
  donorProfile: DonorProfile;

  @Column({
    type: 'enum',
    enum: DonorMatchStatus,
    default: DonorMatchStatus.PENDING,
  })
  status: DonorMatchStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'matched_by_user_id', type: 'uuid', nullable: true })
  matchedByUserId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'matched_by_user_id' })
  matchedByUser: User | null;

  @OneToOne(() => BloodDonationOutcome, (outcome) => outcome.match, { cascade: true })
  outcome: BloodDonationOutcome;
}
