import { Entity, Column, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  key: string;

  @Column({ length: 100 })
  resource: string;

  @Column({ length: 60 })
  action: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
