import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('roumari_tourist_places')
export class RoumariTouristPlace extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 220 })
  slug: string;

  @Column({ name: 'featured_image', type: 'varchar', length: 500 })
  featuredImage: string;

  @Column({ name: 'gallery_images', type: 'jsonb', default: [] })
  galleryImages: string[];

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ name: 'map_url', type: 'varchar', length: 500, nullable: true })
  mapUrl: string | null;

  @Column({ name: 'travel_guide', type: 'text', nullable: true })
  travelGuide: string | null;

  @Column({ name: 'best_time_to_visit', length: 150, nullable: true })
  bestTimeToVisit: string | null;

  @Column({ default: 'PUBLISHED' }) // PUBLISHED, DRAFT
  status: string;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;
}
