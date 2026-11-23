import {
  Entity,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  BloodGroup,
  BloodRequestUrgency,
  BloodRequestStatus,
} from '../../../common/constants';
import { DonorMatch } from './donor-match.entity';

@Entity('blood_requests')
export class BloodRequest extends BaseEntity {
  @Column({ name: 'patient_name', length: 120 })
  patientName: string;

  @Index()
  @Column({
    name: 'blood_group',
    type: 'enum',
    enum: BloodGroup,
  })
  bloodGroup: BloodGroup;

  @Column({ name: 'units_needed', type: 'int', default: 1 })
  unitsNeeded: number;

  @Column({ name: 'units_fulfilled', type: 'int', default: 0 })
  unitsFulfilled: number;

  @Column({
    type: 'enum',
    enum: BloodRequestUrgency,
    default: BloodRequestUrgency.ROUTINE,
  })
  urgency: BloodRequestUrgency;

  @Column({ name: 'required_date', type: 'timestamptz' })
  requiredDate: Date;

  @Column({ name: 'hospital_name', length: 200 })
  hospitalName: string;

  @Column({ name: 'hospital_address', type: 'text', nullable: true })
  hospitalAddress: string | null;

  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Column({ name: 'contact_person', length: 120 })
  contactPerson: string;

  @Index()
  @Column({ name: 'contact_phone', length: 20 })
  contactPhone: string;

  @Column({ name: 'medical_reason', type: 'text', nullable: true })
  medicalReason: string | null;

  @Index()
  @Column({
    type: 'enum',
    enum: BloodRequestStatus,
    default: BloodRequestStatus.OPEN,
  })
  status: BloodRequestStatus;

  @OneToMany(() => DonorMatch, (match) => match.bloodRequest, { cascade: true })
  matches: DonorMatch[];
}
