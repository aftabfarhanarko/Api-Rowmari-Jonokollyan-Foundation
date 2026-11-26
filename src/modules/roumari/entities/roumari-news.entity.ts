import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('roumari_news')
export class RoumariNews extends BaseEntity {
  @Column({ length: 250 })
  headline: string;

  @Index({ unique: true })
  @Column({ length: 260 })
  slug: string;

  @Index()
  @Column({ length: 100 })
  category: string; // LOCAL_NEWS, GOV_ACTIVITIES, WELFARE, EDUCATION, HEALTHCARE, TRANSPORT, COMMUNITY, DEVELOPMENT, ANNOUNCEMENT

  @Column({ type: 'text' })
  excerpt: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'featured_image', type: 'varchar', length: 500 })
  featuredImage: string;

  @Column({ name: 'content_images', type: 'jsonb', default: [] })
  contentImages: string[];

  @Column({ length: 150, default: 'রৌমারী প্রতিনিধি' })
  author: string;

  @Column({ default: 'PUBLISHED' }) // PUBLISHED, DRAFT, SCHEDULED
  status: string;

  @Column({ name: 'is_breaking', default: false })
  isBreaking: boolean;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'view_count', default: 0 })
  viewCount: number;

  @Column({ name: 'published_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  publishedAt: Date;
}
