import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CommitteeMembership } from './committee-membership.entity';

@Entity('members')
export class Member extends BaseEntity {
  @Index({ unique: true })
  @Column({ name: 'member_id', length: 50 })
  memberId: string; // e.g. RJF-000001

  @Column({ name: 'name_bn', length: 200 })
  nameBn: string;

  @Column({ name: 'name_en', length: 200 })
  nameEn: string;

  @Column({ name: 'photo_url', length: 500, nullable: true })
  photoUrl: string | null;

  @Column({ name: 'father_name', length: 150, nullable: true })
  fatherName: string | null;

  @Column({ name: 'mother_name', length: 150, nullable: true })
  motherName: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: 'phone_number', length: 50 })
  phoneNumber: string;

  @Column({ length: 150, nullable: true })
  email: string | null;

  @Column({ name: 'blood_group', length: 10, nullable: true })
  bloodGroup: string | null;

  @Column({ length: 150, nullable: true })
  village: string | null;

  @Column({ name: 'union_name', length: 150, nullable: true })
  unionName: string | null;

  @Column({ length: 100, default: 'রৌমারী' })
  upazila: string;

  @Column({ length: 100, default: 'কুড়িগ্রাম' })
  district: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ length: 150, nullable: true })
  occupation: string | null;

  @Column({ default: 'ACTIVE' })
  status: string;

  @OneToMany(() => CommitteeMembership, (m) => m.member)
  memberships: CommitteeMembership[];
}
