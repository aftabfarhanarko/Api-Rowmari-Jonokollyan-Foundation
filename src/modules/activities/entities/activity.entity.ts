import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('activities')
export class Activity extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'cover_image_url', type: 'varchar', length: 500, nullable: true })
  coverImageUrl: string | null;

  @Column({ name: 'activity_date', type: 'date' })
  activityDate: string;

  @Column({ length: 150 })
  location: string;

  @Column({ name: 'beneficiaries_count', type: 'int', default: 0 })
  beneficiariesCount: number;

  @Column({ name: 'is_published', default: true })
  isPublished: boolean;
}
