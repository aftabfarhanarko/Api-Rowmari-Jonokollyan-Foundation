import { Entity, Column, Index, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { VolunteerAssignment } from './volunteer-assignment.entity';

@Entity('volunteer_profiles')
export class VolunteerProfile extends BaseEntity {
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

  @Column({ nullable: true, length: 150 })
  email: string | null;

  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Column({ type: 'text', nullable: true })
  skills: string | null;

  @Column({ name: 'availability_hours_per_week', type: 'int', default: 5 })
  availabilityHoursPerWeek: number;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => VolunteerAssignment, (assignment) => assignment.volunteer, { cascade: true })
  assignments: VolunteerAssignment[];
}
