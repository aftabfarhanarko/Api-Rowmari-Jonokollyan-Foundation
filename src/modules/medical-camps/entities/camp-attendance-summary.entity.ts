import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MedicalCamp } from './medical-camp.entity';

@Entity('camp_attendance_summaries')
export class CampAttendanceSummary extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'medical_camp_id' })
  medicalCampId: string;

  @OneToOne(() => MedicalCamp, (camp) => camp.attendanceSummary, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medical_camp_id' })
  medicalCamp: MedicalCamp;

  @Column({ name: 'total_patients', type: 'int', default: 0 })
  totalPatients: number;

  @Column({ name: 'male_count', type: 'int', default: 0 })
  maleCount: number;

  @Column({ name: 'female_count', type: 'int', default: 0 })
  femaleCount: number;

  @Column({ name: 'child_count', type: 'int', default: 0 })
  childCount: number;

  @Column({ name: 'prescriptions_given', type: 'int', default: 0 })
  prescriptionsGiven: number;

  @Column({ name: 'free_medicine_distributed_value', type: 'numeric', precision: 12, scale: 2, default: 0 })
  freeMedicineDistributedValue: number;

  @Column({ type: 'text', nullable: true })
  summaryNotes: string | null;
}
