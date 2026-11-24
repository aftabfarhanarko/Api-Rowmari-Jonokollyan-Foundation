import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactMessages1796000000000 implements MigrationInterface {
  name = 'CreateContactMessages1796000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "contact_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" VARCHAR(120) NOT NULL,
        "contact_info" VARCHAR(254) NOT NULL,
        "message" TEXT NOT NULL
      )
    `);
    await queryRunner.query('CREATE INDEX "idx_contact_messages_created_at" ON "contact_messages" ("created_at")');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_contact_messages_created_at"');
    await queryRunner.query('DROP TABLE "contact_messages"');
  }
}
