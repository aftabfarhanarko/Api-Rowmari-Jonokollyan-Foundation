import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('hero_slides')
export class HeroSlide extends BaseEntity {
  @Column({ name: 'title_bn', length: 255 })
  titleBn: string;

  @Column({ name: 'title_en', type: 'varchar', length: 255, nullable: true })
  titleEn: string | null;

  @Column({ name: 'subtitle_bn', type: 'text' })
  subtitleBn: string;

  @Column({ name: 'subtitle_en', type: 'text', nullable: true })
  subtitleEn: string | null;

  @Column({ name: 'badge_bn', type: 'varchar', length: 150, nullable: true })
  badgeBn: string | null;

  @Column({ name: 'badge_en', type: 'varchar', length: 150, nullable: true })
  badgeEn: string | null;

  @Column({ name: 'category_bn', type: 'varchar', length: 100, nullable: true })
  categoryBn: string | null;

  @Column({ name: 'category_en', type: 'varchar', length: 100, nullable: true })
  categoryEn: string | null;

  @Column({ name: 'image_url', length: 500 })
  imageUrl: string;

  @Column({ name: 'btn_primary_bn', length: 100, default: 'অনুদান দিন' })
  btnPrimaryBn: string;

  @Column({ name: 'btn_primary_en', length: 100, default: 'Donate Now' })
  btnPrimaryEn: string;

  @Column({ name: 'btn_primary_link', length: 255, default: '/donate' })
  btnPrimaryLink: string;

  @Column({ name: 'btn_secondary_bn', length: 100, default: 'কার্যক্রম দেখুন' })
  btnSecondaryBn: string;

  @Column({ name: 'btn_secondary_en', length: 100, default: 'Explore Activities' })
  btnSecondaryEn: string;

  @Column({ name: 'btn_secondary_link', length: 255, default: '/activities' })
  btnSecondaryLink: string;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
