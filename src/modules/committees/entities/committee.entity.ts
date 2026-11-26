import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CommitteeMembership } from './committee-membership.entity';

@Entity('committees')
export class Committee extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ length: 50 })
  year: string;

  @Column({ length: 100, default: 'EXECUTIVE' })
  type: string;

  @Column({ name: 'term_title', length: 150, nullable: true })
  termTitle: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'featured_image', length: 500, nullable: true })
  featuredImage: string | null;

  @Column({ name: 'is_current', default: false })
  isCurrent: boolean;

  @Column({ default: 'PUBLISHED' })
  status: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @OneToMany(() => CommitteeMembership, (m) => m.committee)
  memberships: CommitteeMembership[];
}
