import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Member } from './member.entity';
import { Committee } from './committee.entity';
import { Designation } from './designation.entity';

@Entity('committee_memberships')
export class CommitteeMembership extends BaseEntity {
  @Column({ name: 'member_id', type: 'uuid' })
  memberId: string;

  @Column({ name: 'committee_id', type: 'uuid' })
  committeeId: string;

  @Column({ name: 'designation_id', type: 'uuid' })
  designationId: string;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Member, (m) => m.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => Committee, (c) => c.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'committee_id' })
  committee: Committee;

  @ManyToOne(() => Designation, (d) => d.memberships, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'designation_id' })
  designation: Designation;
}
