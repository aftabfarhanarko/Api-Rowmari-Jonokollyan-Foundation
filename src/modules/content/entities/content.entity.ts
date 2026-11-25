import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContentStatus } from '../../../common/constants';

@Entity('pages')
export class Page extends BaseEntity {
  @Column({ length: 150 })
  title: string;

  @Index({ unique: true })
  @Column({ length: 180 })
  slug: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'banner_image_url', type: 'varchar', length: 500, nullable: true })
  bannerImageUrl: string | null;

  @Column({ type: 'jsonb', nullable: true })
  sections: any[] | null;

  @Column({ name: 'seo_title', type: 'varchar', length: 200, nullable: true })
  seoTitle: string | null;

  @Column({ name: 'seo_description', type: 'text', nullable: true })
  seoDescription: string | null;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_system_page', type: 'boolean', default: false })
  isSystemPage: boolean;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.PUBLISHED,
  })
  status: ContentStatus;
}

@Entity('news_events')
export class NewsEvent extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Index({ unique: true })
  @Column({ length: 220 })
  slug: string;

  @Column({ length: 50, default: 'NEWS' }) // NEWS, EVENT
  type: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'event_date', type: 'timestamptz', nullable: true })
  eventDate: Date | null;

  @Column({
    type: 'enum',
    enum: ContentStatus,
    default: ContentStatus.PUBLISHED,
  })
  status: ContentStatus;
}

@Entity('gallery_items')
export class GalleryItem extends BaseEntity {
  @Column({ length: 150 })
  title: string;

  @Column({ length: 100, default: 'General' })
  category: string;

  @Column({ name: 'media_url', length: 500 })
  mediaUrl: string;

  @Column({ length: 20, default: 'IMAGE' }) // IMAGE, VIDEO
  mediaType: string;

  @Column({ type: 'text', nullable: true })
  caption: string | null;
}

@Entity('announcements')
export class Announcement extends BaseEntity {
  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ length: 50, default: 'INFO' }) // INFO, WARNING, URGENT
  severity: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt: Date | null;
}
