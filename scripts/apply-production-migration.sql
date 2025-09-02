-- Production Migration: Enhanced Sync Progress
-- Apply this to your production database

-- Add new columns for enhanced progress tracking
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "current_step" text;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "progress" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "total_products" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "current_product_index" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "current_product_name" text;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "estimated_time_remaining" integer;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "warnings" text;
ALTER TABLE "sync_logs" ADD COLUMN IF NOT EXISTS "last_updated" timestamp DEFAULT now();

-- Create new indexes for improved query performance
CREATE INDEX IF NOT EXISTS "sync_logs_last_updated_idx" ON "sync_logs" ("last_updated");

-- Update existing records with default progress values
UPDATE "sync_logs" SET 
  "current_step" = CASE 
    WHEN "status" = 'success' THEN 'Sync completed successfully'
    WHEN "status" = 'error' THEN 'Sync failed with error'
    WHEN "status" = 'partial' THEN 'Sync completed with warnings'
    ELSE 'Processing...'
  END,
  "progress" = CASE 
    WHEN "status" IN ('success', 'partial') THEN 100
    WHEN "status" = 'error' THEN 0
    ELSE 50
  END,
  "last_updated" = COALESCE("completed_at", "started_at", now())
WHERE "current_step" IS NULL;
