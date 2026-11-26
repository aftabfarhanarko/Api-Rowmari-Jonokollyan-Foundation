import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CommitteeMembership } from './committee-membership.entity';

@Entity('designations')
export class Designation extends BaseEntity {
  @Column({ name: 'title_bn', length: 150 })
  titleBn: string;

  @Column({ name: 'title_en', length: 150 })
  titleEn: string;

  @Column({ length: 160, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ default: 100 })
  priority: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => CommitteeMembership, (m) => m.designation)
  memberships: CommitteeMembership[];
}
