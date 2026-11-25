import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCMSAndSettings1797000000000 implements MigrationInterface {
  name = 'CreateCMSAndSettings1797000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add CMS columns to pages table
    await queryRunner.query(`
      ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "subtitle" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "description" TEXT,
      ADD COLUMN IF NOT EXISTS "banner_image_url" VARCHAR(500),
      ADD COLUMN IF NOT EXISTS "sections" JSONB,
      ADD COLUMN IF NOT EXISTS "seo_title" VARCHAR(200),
      ADD COLUMN IF NOT EXISTS "seo_description" TEXT,
      ADD COLUMN IF NOT EXISTS "display_order" INT NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "is_system_page" BOOLEAN NOT NULL DEFAULT false;
    `);

    // 2. Create website_settings table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "website_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "key" VARCHAR(100) NOT NULL,
        "value" TEXT NOT NULL,
        "group" VARCHAR(50) NOT NULL DEFAULT 'general',
        "description" VARCHAR(255)
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_website_settings_key" ON "website_settings" ("key");
    `);

    // 3. Create media_files table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "media_files" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "original_name" VARCHAR(255) NOT NULL,
        "file_name" VARCHAR(255) NOT NULL,
        "mime_type" VARCHAR(100) NOT NULL,
        "size_bytes" BIGINT NOT NULL,
        "url" VARCHAR(500) NOT NULL,
        "category" VARCHAR(50) NOT NULL DEFAULT 'general',
        "uploaded_by" uuid
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_media_files_file_name" ON "media_files" ("file_name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_media_files_file_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "media_files"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_website_settings_key"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "website_settings"`);
    await queryRunner.query(`
      ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "subtitle",
      DROP COLUMN IF EXISTS "description",
      DROP COLUMN IF EXISTS "banner_image_url",
      DROP COLUMN IF EXISTS "sections",
      DROP COLUMN IF EXISTS "seo_title",
      DROP COLUMN IF EXISTS "seo_description",
      DROP COLUMN IF EXISTS "display_order",
      DROP COLUMN IF EXISTS "is_system_page";
    `);
  }
}
