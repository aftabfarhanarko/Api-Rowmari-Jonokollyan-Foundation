import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MedicalCamp } from './medical-camp.entity';
import { User } from '../../users/entities/user.entity';

@Entity('camp_staff')
export class CampStaff extends BaseEntity {
  @Index()
  @Column({ name: 'medical_camp_id' })
  medicalCampId: string;

  @ManyToOne(() => MedicalCamp, (camp) => camp.staffList, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_camp_id' })
  medicalCamp: MedicalCamp;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'staff_name', length: 120 })
  staffName: string;

  @Column({ length: 50 })
  role: string; // DOCTOR, NURSE, PHARMACIST, VOLUNTEER_LEAD, REGISTRATION

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization: string | null;
}
