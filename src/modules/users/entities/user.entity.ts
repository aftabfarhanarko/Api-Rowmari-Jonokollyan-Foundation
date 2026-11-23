import {
  Entity,
  Column,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserStatus } from '../../../common/constants';
import { Role } from '../../access-control/entities/role.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column({ name: 'full_name', length: 120 })
  fullName: string;

  @Index({ unique: true })
  @Column({ length: 150 })
  email: string;

  @Index({ unique: true })
  @Column({ length: 20 })
  phone: string;

  @Column({ name: 'password_hash', select: false, nullable: true })
  passwordHash: string | null;

  @Column({ length: 100, default: 'Kurigram' })
  district: string;

  @Column({ length: 100, default: 'Roumari' })
  upazila: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ name: 'is_email_verified', default: false })
  isEmailVerified: boolean;

  @Column({ name: 'is_phone_verified', default: false })
  isPhoneVerified: boolean;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'registration_ip', length: 50, nullable: true })
  registrationIp: string | null;

  @Column({ name: 'last_login_ip', length: 50, nullable: true })
  lastLoginIp: string | null;

  @Column({ name: 'last_login_at', type: 'timestamp with time zone', nullable: true })
  lastLoginAt: Date | null;

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
