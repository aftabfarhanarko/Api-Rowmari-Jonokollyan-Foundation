import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('website_settings')
export class WebsiteSetting extends BaseEntity {
  @Index({ unique: true })
  @Column({ length: 100 })
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ length: 50, default: 'general' })
  group: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;
}
