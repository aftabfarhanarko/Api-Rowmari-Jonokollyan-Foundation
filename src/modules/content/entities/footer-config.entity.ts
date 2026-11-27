import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('footer_configs')
export class FooterConfig extends BaseEntity {
  @Column({ name: 'about_summary_bn', type: 'text' })
  aboutSummaryBn: string;

  @Column({ name: 'about_summary_en', type: 'text', nullable: true })
  aboutSummaryEn: string | null;

  @Column({ name: 'address_bn', length: 255 })
  addressBn: string;

  @Column({ name: 'address_en', length: 255, nullable: true })
  addressEn: string | null;

  @Column({ length: 50 })
  hotline: string;

  @Column({ name: 'phone_primary', length: 50 })
  phonePrimary: string;

  @Column({ name: 'phone_secondary', length: 50, nullable: true })
  phoneSecondary: string | null;

  @Column({ name: 'emergency_hotline', length: 50, nullable: true })
  emergencyHotline: string | null;

  @Column({ name: 'email_primary', length: 100 })
  emailPrimary: string;

  @Column({ name: 'email_support', length: 100, nullable: true })
  emailSupport: string | null;

  @Column({ name: 'registration_no_bn', length: 200, nullable: true })
  registrationNoBn: string | null;

  @Column({ name: 'registration_no_en', length: 200, nullable: true })
  registrationNoEn: string | null;

  @Column({ name: 'facebook_page_url', length: 255, nullable: true })
  facebookPageUrl: string | null;

  @Column({ name: 'facebook_group_url', length: 255, nullable: true })
  facebookGroupUrl: string | null;

  @Column({ name: 'youtube_url', length: 255, nullable: true })
  youtubeUrl: string | null;

  @Column({ name: 'linkedin_url', length: 255, nullable: true })
  linkedinUrl: string | null;

  @Column({ name: 'copyright_text_bn', length: 255 })
  copyrightTextBn: string;

  @Column({ name: 'copyright_text_en', length: 255, nullable: true })
  copyrightTextEn: string | null;

  @Column({ name: 'quick_links', type: 'jsonb', nullable: true })
  quickLinks: any;
}
