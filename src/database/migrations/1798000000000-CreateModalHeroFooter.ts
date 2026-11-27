import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateModalHeroFooter1798000000000 implements MigrationInterface {
  name = 'CreateModalHeroFooter1798000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. notice_modals table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notice_modals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "header_title" VARCHAR(200) NOT NULL DEFAULT 'জরুরি জনকল্যাণ নোটিশ ও ঘোষণা',
        "badge" VARCHAR(150) NOT NULL DEFAULT 'শীতবস্ত্র ও জরুরি মানবিক ত্রাণ ঘোষণা',
        "title" VARCHAR(255) NOT NULL,
        "description" TEXT NOT NULL,
        "hotline" VARCHAR(50) NOT NULL DEFAULT '+880 1712-345678',
        "address" VARCHAR(255) NOT NULL DEFAULT 'ভোলামোড়, রৌমারী উপজেলা, রংপুর, বাংলাদেশ (৫৬৪০)',
        "primary_btn_text" VARCHAR(100) NOT NULL DEFAULT 'অনুদান দিন',
        "primary_btn_link" VARCHAR(255) NOT NULL DEFAULT '/donate',
        "secondary_btn_text" VARCHAR(100) NOT NULL DEFAULT 'স্বেচ্ছাসেবক হন',
        "secondary_btn_link" VARCHAR(255) NOT NULL DEFAULT '/volunteer',
        "image_url" VARCHAR(500),
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "start_date" TIMESTAMPTZ,
        "end_date" TIMESTAMPTZ,
        "display_frequency" VARCHAR(50) NOT NULL DEFAULT 'ONCE_PER_DAY'
      );
    `);

    // 2. hero_slides table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hero_slides" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title_bn" VARCHAR(255) NOT NULL,
        "title_en" VARCHAR(255),
        "subtitle_bn" TEXT NOT NULL,
        "subtitle_en" TEXT,
        "badge_bn" VARCHAR(150),
        "badge_en" VARCHAR(150),
        "category_bn" VARCHAR(100),
        "category_en" VARCHAR(100),
        "image_url" VARCHAR(500) NOT NULL,
        "btn_primary_bn" VARCHAR(100) NOT NULL DEFAULT 'অনুদান দিন',
        "btn_primary_en" VARCHAR(100) NOT NULL DEFAULT 'Donate Now',
        "btn_primary_link" VARCHAR(255) NOT NULL DEFAULT '/donate',
        "btn_secondary_bn" VARCHAR(100) NOT NULL DEFAULT 'কার্যক্রম দেখুন',
        "btn_secondary_en" VARCHAR(100) NOT NULL DEFAULT 'Explore Activities',
        "btn_secondary_link" VARCHAR(255) NOT NULL DEFAULT '/activities',
        "display_order" INT NOT NULL DEFAULT 0,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      );
    `);

    // 3. footer_configs table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "footer_configs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "about_summary_bn" TEXT NOT NULL,
        "about_summary_en" TEXT,
        "address_bn" VARCHAR(255) NOT NULL,
        "address_en" VARCHAR(255),
        "hotline" VARCHAR(50) NOT NULL,
        "phone_primary" VARCHAR(50) NOT NULL,
        "phone_secondary" VARCHAR(50),
        "emergency_hotline" VARCHAR(50),
        "email_primary" VARCHAR(100) NOT NULL,
        "email_support" VARCHAR(100),
        "registration_no_bn" VARCHAR(200),
        "registration_no_en" VARCHAR(200),
        "facebook_page_url" VARCHAR(255),
        "facebook_group_url" VARCHAR(255),
        "youtube_url" VARCHAR(255),
        "linkedin_url" VARCHAR(255),
        "copyright_text_bn" VARCHAR(255) NOT NULL,
        "copyright_text_en" VARCHAR(255),
        "quick_links" JSONB
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "footer_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "hero_slides"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notice_modals"`);
  }
}
