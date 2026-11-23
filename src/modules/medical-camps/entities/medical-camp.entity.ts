import { Entity, Column, Index, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CampStaff } from './camp-staff.entity';
import { CampAttendanceSummary } from './camp-attendance-summary.entity';

@Entity('medical_camps')
export class MedicalCamp extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'camp_date', type: 'date' })
  campDate: string;

  @Column({ length: 200 })
  venue: string;

  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Index()
  @Column({ length: 50, default: 'PLANNED' })
  status: string; // PLANNED, ACTIVE, COMPLETED, CANCELLED

  @OneToMany(() => CampStaff, (staff) => staff.medicalCamp, { cascade: true })
  staffList: CampStaff[];

  @OneToOne(() => CampAttendanceSummary, (summary) => summary.medicalCamp, { cascade: true })
  attendanceSummary: CampAttendanceSummary;
}
