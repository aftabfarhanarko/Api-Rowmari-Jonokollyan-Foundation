import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('notice_modals')
export class NoticeModal extends BaseEntity {
  @Column({ name: 'header_title', length: 200, default: 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা' })
  headerTitle: string;

  @Column({ length: 150, default: 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা' })
  badge: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 50, default: '+880 1712-345678' })
  hotline: string;

  @Column({ length: 255, default: 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)' })
  address: string;

  @Column({ name: 'primary_btn_text', length: 100, default: 'অনুদান দিন' })
  primaryBtnText: string;

  @Column({ name: 'primary_btn_link', length: 255, default: '/donate' })
  primaryBtnLink: string;

  @Column({ name: 'secondary_btn_text', length: 100, default: 'স্বেচ্ছাসেবক হন' })
  secondaryBtnText: string;

  @Column({ name: 'secondary_btn_link', length: 255, default: '/volunteer' })
  secondaryBtnLink: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  @Column({ name: 'display_frequency', length: 50, default: 'ONCE_PER_DAY' })
  displayFrequency: string;
}
