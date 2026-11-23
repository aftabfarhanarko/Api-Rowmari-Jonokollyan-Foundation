import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Indexes derived from current authentication and paginated list query patterns.
 * Concurrent builds keep normal reads and writes available while indexes are built.
 */
export class AddQueryIndexes1795460276333 implements MigrationInterface {
  name = 'AddQueryIndexes1795460276333';

  // PostgreSQL does not allow CREATE INDEX CONCURRENTLY inside a transaction.
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      `CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "idx_refresh_tokens_token_hash"
        ON "refresh_tokens" ("token_hash")`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email_lower"
        ON "users" (LOWER("email"))`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_created_at"
        ON "users" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_help_apps_status_created_at"
        ON "help_applications" ("status", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_donors_public_last_donation"
        ON "donor_profiles" ("last_donation_date" ASC NULLS FIRST)
        WHERE "is_available" = true AND "consent_to_contact" = true`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_donors_public_group_donation"
        ON "donor_profiles" ("blood_group", "last_donation_date" ASC NULLS FIRST)
        WHERE "is_available" = true AND "consent_to_contact" = true`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_donors_created_at"
        ON "donor_profiles" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_blood_requests_created_at"
        ON "blood_requests" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_blood_requests_status_created_at"
        ON "blood_requests" ("status", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_campaigns_public_order"
        ON "campaigns" ("status", "is_featured" DESC, "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_activities_published_date"
        ON "activities" ("activity_date" DESC)
        WHERE "is_published" = true`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_medical_camps_date"
        ON "medical_camps" ("camp_date" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_news_events_status_created_at"
        ON "news_events" ("status", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_announcements_active_created_at"
        ON "announcements" ("created_at" DESC)
        WHERE "is_active" = true`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_donations_created_at"
        ON "donations" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_donations_campaign_created_at"
        ON "donations" ("campaign_id", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_expenses_created_at"
        ON "expenses" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_expenses_status_created_at"
        ON "expenses" ("status", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_volunteers_created_at"
        ON "volunteer_profiles" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_volunteers_approval_created_at"
        ON "volunteer_profiles" ("is_approved", "created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_gallery_created_at"
        ON "gallery_items" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_created_at"
        ON "notifications" ("created_at" DESC)`,
      `CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_audit_logs_ip_address"
        ON "audit_logs" ("ip_address")`,
    ];

    for (const indexSql of indexes) {
      await queryRunner.query(indexSql);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexNames = [
      'idx_refresh_tokens_token_hash',
      'idx_users_email_lower',
      'idx_users_created_at',
      'idx_help_apps_status_created_at',
      'idx_donors_public_last_donation',
      'idx_donors_public_group_donation',
      'idx_donors_created_at',
      'idx_blood_requests_created_at',
      'idx_blood_requests_status_created_at',
      'idx_campaigns_public_order',
      'idx_activities_published_date',
      'idx_medical_camps_date',
      'idx_news_events_status_created_at',
      'idx_announcements_active_created_at',
      'idx_donations_created_at',
      'idx_donations_campaign_created_at',
      'idx_expenses_created_at',
      'idx_expenses_status_created_at',
      'idx_volunteers_created_at',
      'idx_volunteers_approval_created_at',
      'idx_gallery_created_at',
      'idx_notifications_created_at',
      'idx_audit_logs_ip_address',
    ];

    for (const indexName of indexNames) {
      await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "${indexName}"`);
    }
  }
}
