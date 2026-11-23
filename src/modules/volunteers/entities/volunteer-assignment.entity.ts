import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VolunteerProfile } from './volunteer-profile.entity';

@Entity('volunteer_assignments')
export class VolunteerAssignment extends BaseEntity {
  @Index()
  @Column({ name: 'volunteer_id' })
  volunteerId: string;

  @ManyToOne(() => VolunteerProfile, (v) => v.assignments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'volunteer_id' })
  volunteer: VolunteerProfile;

  @Column({ name: 'task_title', length: 200 })
  taskTitle: string;

  @Column({ name: 'event_or_camp_id', nullable: true })
  eventOrCampId: string | null;

  @Column({ name: 'assigned_role', length: 100 })
  assignedRole: string;

  @Column({ name: 'start_date', type: 'timestamptz' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ length: 50, default: 'ASSIGNED' })
  status: string; // ASSIGNED, COMPLETED, CANCELLED

  @Column({ type: 'text', nullable: true })
  feedback: string | null;
}
