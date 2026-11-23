import { Entity, Column, Index, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { BloodGroup } from '../../../common/constants';
import { User } from '../../users/entities/user.entity';

@Entity('donor_profiles')
export class DonorProfile extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'user_id', nullable: true })
  userId: string | null;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'full_name', length: 120 })
  fullName: string;

  @Index()
  @Column({ length: 20 })
  phone: string;

  @Index()
  @Column({
    name: 'blood_group',
    type: 'enum',
    enum: BloodGroup,
  })
  bloodGroup: BloodGroup;

  @Index()
  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Index()
  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Column({ name: 'last_donation_date', type: 'date', nullable: true })
  lastDonationDate: string | null;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'consent_to_contact', default: true })
  consentToContact: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
