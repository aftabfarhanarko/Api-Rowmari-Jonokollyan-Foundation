import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseSchema1700000000000 implements MigrationInterface {
  name = 'InitialDatabaseSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Create PostgreSQL ENUM types
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_status_enum" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "application_status_enum" AS ENUM ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'APPROVED', 'REJECTED', 'DISBURSED', 'COMPLETED', 'CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "application_category_enum" AS ENUM ('MEDICAL', 'EDUCATION', 'DISASTER_RELIEF', 'WIDOW_ORPHAN', 'HOUSING', 'FOOD_AID', 'OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "blood_group_enum" AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "blood_request_urgency_enum" AS ENUM ('ROUTINE', 'URGENT', 'CRITICAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "blood_request_status_enum" AS ENUM ('OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED', 'EXPIRED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "donor_match_status_enum" AS ENUM ('PENDING', 'CONTACTED', 'AGREED', 'DECLINED', 'DONATED', 'UNAVAILABLE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "campaign_status_enum" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "donation_status_enum" AS ENUM ('INITIATED', 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "expense_status_enum" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PAID');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "content_status_enum" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "notification_channel_enum" AS ENUM ('SMS', 'EMAIL', 'IN_APP');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE TYPE "notification_status_enum" AS ENUM ('PENDING', 'SENT', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // 2. Identity and Access Control
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "name" VARCHAR(60) NOT NULL UNIQUE,
        "description" TEXT
      );

      CREATE TABLE IF NOT EXISTS "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "key" VARCHAR(100) NOT NULL UNIQUE,
        "resource" VARCHAR(100) NOT NULL,
        "action" VARCHAR(60) NOT NULL,
        "description" TEXT
      );

      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "full_name" VARCHAR(120) NOT NULL,
        "phone" VARCHAR(20) NOT NULL UNIQUE,
        "email" VARCHAR(150) UNIQUE,
        "password_hash" VARCHAR(255),
        "status" "user_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
        "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
        "avatar_url" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users"("phone");

      CREATE TABLE IF NOT EXISTS "user_roles" (
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        PRIMARY KEY ("user_id", "role_id")
      );

      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" VARCHAR(128) NOT NULL,
        "expires_at" TIMESTAMPTZ NOT NULL,
        "revoked_at" TIMESTAMPTZ,
        "user_agent" TEXT,
        "ip_address" VARCHAR(50)
      );
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens"("user_id");
    `);

    // 3. Assistance Applications Domain
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "help_applications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "reference_code" VARCHAR(32) NOT NULL UNIQUE,
        "applicant_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "applicant_name" VARCHAR(120) NOT NULL,
        "applicant_phone" VARCHAR(20) NOT NULL,
        "applicant_email" VARCHAR(150),
        "district" VARCHAR(100) NOT NULL DEFAULT 'Kurigram',
        "upazila" VARCHAR(100) NOT NULL DEFAULT 'Roumari',
        "address" TEXT,
        "category" "application_category_enum" NOT NULL DEFAULT 'MEDICAL',
        "requested_amount" NUMERIC(12, 2),
        "approved_amount" NUMERIC(12, 2),
        "description" TEXT NOT NULL,
        "privacy_accepted" BOOLEAN NOT NULL DEFAULT true,
        "contact_allowed" BOOLEAN NOT NULL DEFAULT true,
        "status" "application_status_enum" NOT NULL DEFAULT 'PENDING',
        "assigned_to_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_applications_phone" ON "help_applications"("applicant_phone");
      CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "help_applications"("status");

      CREATE TABLE IF NOT EXISTS "application_documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "application_id" uuid NOT NULL REFERENCES "help_applications"("id") ON DELETE CASCADE,
        "document_type" VARCHAR(60) NOT NULL,
        "file_name" VARCHAR(255) NOT NULL,
        "file_url" VARCHAR(500) NOT NULL,
        "file_size_bytes" BIGINT,
        "mime_type" VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS "idx_app_docs_app_id" ON "application_documents"("application_id");

      CREATE TABLE IF NOT EXISTS "application_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "application_id" uuid NOT NULL REFERENCES "help_applications"("id") ON DELETE CASCADE,
        "from_status" "application_status_enum",
        "to_status" "application_status_enum" NOT NULL,
        "remarks" TEXT,
        "changed_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_app_history_app_id" ON "application_status_history"("application_id");
    `);

    // 4. Blood Donors & Requests Domain
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donor_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
        "full_name" VARCHAR(120) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "blood_group" "blood_group_enum" NOT NULL,
        "district" VARCHAR(100) NOT NULL DEFAULT 'Kurigram',
        "upazila" VARCHAR(100) NOT NULL DEFAULT 'Roumari',
        "last_donation_date" DATE,
        "is_available" BOOLEAN NOT NULL DEFAULT true,
        "is_verified" BOOLEAN NOT NULL DEFAULT false,
        "consent_to_contact" BOOLEAN NOT NULL DEFAULT true,
        "notes" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_donors_phone" ON "donor_profiles"("phone");
      CREATE INDEX IF NOT EXISTS "idx_donors_group" ON "donor_profiles"("blood_group");
      CREATE INDEX IF NOT EXISTS "idx_donors_location" ON "donor_profiles"("district", "upazila");

      CREATE TABLE IF NOT EXISTS "blood_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "patient_name" VARCHAR(120) NOT NULL,
        "blood_group" "blood_group_enum" NOT NULL,
        "units_needed" INT NOT NULL DEFAULT 1,
        "units_fulfilled" INT NOT NULL DEFAULT 0,
        "urgency" "blood_request_urgency_enum" NOT NULL DEFAULT 'ROUTINE',
        "required_date" TIMESTAMPTZ NOT NULL,
        "hospital_name" VARCHAR(200) NOT NULL,
        "hospital_address" TEXT,
        "district" VARCHAR(100) NOT NULL DEFAULT 'Kurigram',
        "upazila" VARCHAR(100) NOT NULL DEFAULT 'Roumari',
        "contact_person" VARCHAR(120) NOT NULL,
        "contact_phone" VARCHAR(20) NOT NULL,
        "medical_reason" TEXT,
        "status" "blood_request_status_enum" NOT NULL DEFAULT 'OPEN'
      );
      CREATE INDEX IF NOT EXISTS "idx_blood_requests_group" ON "blood_requests"("blood_group");
      CREATE INDEX IF NOT EXISTS "idx_blood_requests_status" ON "blood_requests"("status");

      CREATE TABLE IF NOT EXISTS "donor_matches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "blood_request_id" uuid NOT NULL REFERENCES "blood_requests"("id") ON DELETE CASCADE,
        "donor_profile_id" uuid NOT NULL REFERENCES "donor_profiles"("id") ON DELETE CASCADE,
        "status" "donor_match_status_enum" NOT NULL DEFAULT 'PENDING',
        "notes" TEXT,
        "matched_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_request_donor_match" UNIQUE ("blood_request_id", "donor_profile_id")
      );

      CREATE TABLE IF NOT EXISTS "blood_donation_outcomes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "match_id" uuid NOT NULL UNIQUE REFERENCES "donor_matches"("id") ON DELETE CASCADE,
        "donation_date" DATE NOT NULL,
        "units_donated" INT NOT NULL DEFAULT 1,
        "feedback" TEXT
      );
    `);

    // 5. Volunteers Domain
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "volunteer_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "user_id" uuid UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
        "full_name" VARCHAR(120) NOT NULL,
        "phone" VARCHAR(20) NOT NULL,
        "email" VARCHAR(150),
        "district" VARCHAR(100) NOT NULL DEFAULT 'Kurigram',
        "upazila" VARCHAR(100) NOT NULL DEFAULT 'Roumari',
        "skills" TEXT,
        "availability_hours_per_week" INT NOT NULL DEFAULT 5,
        "is_approved" BOOLEAN NOT NULL DEFAULT false,
        "is_active" BOOLEAN NOT NULL DEFAULT true
      );
      CREATE INDEX IF NOT EXISTS "idx_volunteers_phone" ON "volunteer_profiles"("phone");

      CREATE TABLE IF NOT EXISTS "volunteer_assignments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "volunteer_id" uuid NOT NULL REFERENCES "volunteer_profiles"("id") ON DELETE CASCADE,
        "task_title" VARCHAR(200) NOT NULL,
        "event_or_camp_id" VARCHAR(100),
        "assigned_role" VARCHAR(100) NOT NULL,
        "start_date" TIMESTAMPTZ NOT NULL,
        "end_date" TIMESTAMPTZ,
        "status" VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
        "feedback" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_assignments_volunteer_id" ON "volunteer_assignments"("volunteer_id");
    `);

    // 6. Campaigns, Activities & Medical Camps
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "description" TEXT NOT NULL,
        "category" VARCHAR(100) NOT NULL DEFAULT 'General',
        "target_amount" NUMERIC(12, 2) NOT NULL,
        "raised_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0,
        "start_date" TIMESTAMPTZ NOT NULL,
        "end_date" TIMESTAMPTZ,
        "banner_image_url" VARCHAR(500),
        "status" "campaign_status_enum" NOT NULL DEFAULT 'DRAFT',
        "is_featured" BOOLEAN NOT NULL DEFAULT false
      );
      CREATE INDEX IF NOT EXISTS "idx_campaigns_status" ON "campaigns"("status");

      CREATE TABLE IF NOT EXISTS "campaign_updates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "campaign_id" uuid NOT NULL REFERENCES "campaigns"("id") ON DELETE CASCADE,
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "image_url" VARCHAR(500)
      );
      CREATE INDEX IF NOT EXISTS "idx_updates_campaign_id" ON "campaign_updates"("campaign_id");

      CREATE TABLE IF NOT EXISTS "activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "summary" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "cover_image_url" VARCHAR(500),
        "activity_date" DATE NOT NULL,
        "location" VARCHAR(150) NOT NULL,
        "beneficiaries_count" INT NOT NULL DEFAULT 0,
        "is_published" BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS "medical_camps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "description" TEXT NOT NULL,
        "camp_date" DATE NOT NULL,
        "venue" VARCHAR(200) NOT NULL,
        "district" VARCHAR(100) NOT NULL DEFAULT 'Kurigram',
        "upazila" VARCHAR(100) NOT NULL DEFAULT 'Roumari',
        "status" VARCHAR(50) NOT NULL DEFAULT 'PLANNED'
      );
      CREATE INDEX IF NOT EXISTS "idx_camps_status" ON "medical_camps"("status");

      CREATE TABLE IF NOT EXISTS "camp_staff" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "medical_camp_id" uuid NOT NULL REFERENCES "medical_camps"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "staff_name" VARCHAR(120) NOT NULL,
        "role" VARCHAR(50) NOT NULL,
        "specialization" VARCHAR(100)
      );
      CREATE INDEX IF NOT EXISTS "idx_camp_staff_camp_id" ON "camp_staff"("medical_camp_id");

      CREATE TABLE IF NOT EXISTS "camp_attendance_summaries" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "medical_camp_id" uuid NOT NULL UNIQUE REFERENCES "medical_camps"("id") ON DELETE CASCADE,
        "total_patients" INT NOT NULL DEFAULT 0,
        "male_count" INT NOT NULL DEFAULT 0,
        "female_count" INT NOT NULL DEFAULT 0,
        "child_count" INT NOT NULL DEFAULT 0,
        "prescriptions_given" INT NOT NULL DEFAULT 0,
        "free_medicine_distributed_value" NUMERIC(12, 2) NOT NULL DEFAULT 0,
        "summary_notes" TEXT
      );
    `);

    // 7. Finance: Donations, Receipts, Expenses
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "donations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "donor_name" VARCHAR(120),
        "donor_phone" VARCHAR(20),
        "donor_email" VARCHAR(150),
        "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
        "amount" NUMERIC(12, 2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
        "payment_method" VARCHAR(50) NOT NULL DEFAULT 'CASH',
        "transaction_reference" VARCHAR(100),
        "campaign_id" uuid REFERENCES "campaigns"("id") ON DELETE SET NULL,
        "status" "donation_status_enum" NOT NULL DEFAULT 'COMPLETED',
        "notes" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_donations_campaign_id" ON "donations"("campaign_id");
      CREATE INDEX IF NOT EXISTS "idx_donations_status" ON "donations"("status");

      CREATE TABLE IF NOT EXISTS "receipts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "receipt_number" VARCHAR(60) NOT NULL UNIQUE,
        "donation_id" uuid NOT NULL UNIQUE REFERENCES "donations"("id") ON DELETE CASCADE,
        "issued_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "download_url" VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS "expenses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "category" VARCHAR(100) NOT NULL,
        "amount" NUMERIC(12, 2) NOT NULL,
        "currency" VARCHAR(10) NOT NULL DEFAULT 'BDT',
        "expense_date" DATE NOT NULL,
        "paid_to" VARCHAR(150) NOT NULL,
        "receipt_url" VARCHAR(500),
        "description" TEXT,
        "status" "expense_status_enum" NOT NULL DEFAULT 'PENDING_APPROVAL',
        "created_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_expenses_status" ON "expenses"("status");

      CREATE TABLE IF NOT EXISTS "expense_approvals" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "expense_id" uuid NOT NULL REFERENCES "expenses"("id") ON DELETE CASCADE,
        "reviewed_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
        "decision" "expense_status_enum" NOT NULL,
        "remarks" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_expense_approvals_expense_id" ON "expense_approvals"("expense_id");
    `);

    // 8. Content (CMS) & Platform Infrastructure
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "pages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(150) NOT NULL,
        "slug" VARCHAR(180) NOT NULL UNIQUE,
        "content" TEXT NOT NULL,
        "status" "content_status_enum" NOT NULL DEFAULT 'PUBLISHED'
      );

      CREATE TABLE IF NOT EXISTS "news_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "slug" VARCHAR(220) NOT NULL UNIQUE,
        "type" VARCHAR(50) NOT NULL DEFAULT 'NEWS',
        "summary" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "image_url" VARCHAR(500),
        "event_date" TIMESTAMPTZ,
        "status" "content_status_enum" NOT NULL DEFAULT 'PUBLISHED'
      );

      CREATE TABLE IF NOT EXISTS "gallery_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(150) NOT NULL,
        "category" VARCHAR(100) NOT NULL DEFAULT 'General',
        "media_url" VARCHAR(500) NOT NULL,
        "media_type" VARCHAR(20) NOT NULL DEFAULT 'IMAGE',
        "caption" TEXT
      );

      CREATE TABLE IF NOT EXISTS "announcements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "title" VARCHAR(200) NOT NULL,
        "message" TEXT NOT NULL,
        "severity" VARCHAR(50) NOT NULL DEFAULT 'INFO',
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "expires_at" TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "recipient_identifier" VARCHAR(150) NOT NULL,
        "channel" "notification_channel_enum" NOT NULL,
        "subject" VARCHAR(200),
        "content" TEXT NOT NULL,
        "status" "notification_status_enum" NOT NULL DEFAULT 'PENDING',
        "sent_at" TIMESTAMPTZ,
        "error_message" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_notifications_status" ON "notifications"("status");

      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "actor_id" uuid,
        "actor_name" VARCHAR(120),
        "action" VARCHAR(100) NOT NULL,
        "entity_type" VARCHAR(100) NOT NULL,
        "entity_id" VARCHAR(100),
        "method" VARCHAR(10),
        "route" VARCHAR(255),
        "status_code" INT,
        "duration_ms" INT,
        "metadata" JSONB,
        "ip_address" VARCHAR(50),
        "user_agent" TEXT
      );
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_actor" ON "audit_logs"("actor_id");
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_action" ON "audit_logs"("action");
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_entity" ON "audit_logs"("entity_type", "entity_id");
      CREATE INDEX IF NOT EXISTS "idx_audit_logs_created_at" ON "audit_logs"("created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS "audit_logs" CASCADE;
      DROP TABLE IF EXISTS "notifications" CASCADE;
      DROP TABLE IF EXISTS "announcements" CASCADE;
      DROP TABLE IF EXISTS "gallery_items" CASCADE;
      DROP TABLE IF EXISTS "news_events" CASCADE;
      DROP TABLE IF EXISTS "pages" CASCADE;
      DROP TABLE IF EXISTS "expense_approvals" CASCADE;
      DROP TABLE IF EXISTS "expenses" CASCADE;
      DROP TABLE IF EXISTS "receipts" CASCADE;
      DROP TABLE IF EXISTS "donations" CASCADE;
      DROP TABLE IF EXISTS "camp_attendance_summaries" CASCADE;
      DROP TABLE IF EXISTS "camp_staff" CASCADE;
      DROP TABLE IF EXISTS "medical_camps" CASCADE;
      DROP TABLE IF EXISTS "activities" CASCADE;
      DROP TABLE IF EXISTS "campaign_updates" CASCADE;
      DROP TABLE IF EXISTS "campaigns" CASCADE;
      DROP TABLE IF EXISTS "volunteer_assignments" CASCADE;
      DROP TABLE IF EXISTS "volunteer_profiles" CASCADE;
      DROP TABLE IF EXISTS "blood_donation_outcomes" CASCADE;
      DROP TABLE IF EXISTS "donor_matches" CASCADE;
      DROP TABLE IF EXISTS "blood_requests" CASCADE;
      DROP TABLE IF EXISTS "donor_profiles" CASCADE;
      DROP TABLE IF EXISTS "application_status_history" CASCADE;
      DROP TABLE IF EXISTS "application_documents" CASCADE;
      DROP TABLE IF EXISTS "help_applications" CASCADE;
      DROP TABLE IF EXISTS "refresh_tokens" CASCADE;
      DROP TABLE IF EXISTS "user_roles" CASCADE;
      DROP TABLE IF EXISTS "users" CASCADE;
      DROP TABLE IF EXISTS "role_permissions" CASCADE;
      DROP TABLE IF EXISTS "permissions" CASCADE;
      DROP TABLE IF EXISTS "roles" CASCADE;

      DROP TYPE IF EXISTS "notification_status_enum";
      DROP TYPE IF EXISTS "notification_channel_enum";
      DROP TYPE IF EXISTS "content_status_enum";
      DROP TYPE IF EXISTS "expense_status_enum";
      DROP TYPE IF EXISTS "donation_status_enum";
      DROP TYPE IF EXISTS "campaign_status_enum";
      DROP TYPE IF EXISTS "donor_match_status_enum";
      DROP TYPE IF EXISTS "blood_request_status_enum";
      DROP TYPE IF EXISTS "blood_request_urgency_enum";
      DROP TYPE IF EXISTS "blood_group_enum";
      DROP TYPE IF EXISTS "application_category_enum";
      DROP TYPE IF EXISTS "application_status_enum";
      DROP TYPE IF EXISTS "user_status_enum";
    `);
  }
}
