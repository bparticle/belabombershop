-- Enhanced Sync Progress Migration
-- This migration adds enhanced progress tracking fields to the sync_logs table
-- Generated: 2024-12-19

-- Add new columns for enhanced progress tracking
ALTER TABLE "sync_logs" ADD COLUMN "current_step" text;
ALTER TABLE "sync_logs" ADD COLUMN "progress" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN "total_products" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN "current_product_index" integer DEFAULT 0;
ALTER TABLE "sync_logs" ADD COLUMN "current_product_name" text;
ALTER TABLE "sync_logs" ADD COLUMN "estimated_time_remaining" integer;
ALTER TABLE "sync_logs" ADD COLUMN "warnings" text;
ALTER TABLE "sync_logs" ADD COLUMN "last_updated" timestamp DEFAULT now();

-- Update existing status values to match new enhanced statuses
-- Note: This preserves existing data while updating to new status schema
UPDATE "sync_logs" SET "status" = 'success' WHERE "status" = 'success';
UPDATE "sync_logs" SET "status" = 'error' WHERE "status" = 'error';
UPDATE "sync_logs" SET "status" = 'partial' WHERE "status" = 'partial';
UPDATE "sync_logs" SET "status" = 'processing_products' WHERE "status" = 'running';

-- Create new indexes for improved query performance
CREATE INDEX "sync_logs_last_updated_idx" ON "sync_logs" ("last_updated");

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
