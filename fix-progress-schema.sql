-- Fix Progress Tracking Schema
-- Run this directly in your Neon database console

-- Add missing progress tracking columns to sync_logs table
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_step text;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS total_products integer DEFAULT 0;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_index integer DEFAULT 0;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_name text;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS estimated_time_remaining integer;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS warnings text;
ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS last_updated timestamp DEFAULT now();

-- Add index for performance
CREATE INDEX IF NOT EXISTS sync_logs_last_updated_idx ON sync_logs (last_updated);

-- Update existing sync logs with default values
UPDATE sync_logs SET 
  current_step = CASE 
    WHEN status = 'success' THEN 'Sync completed successfully'
    WHEN status = 'error' THEN 'Sync failed with error'
    WHEN status = 'partial' THEN 'Sync completed with warnings'
    ELSE 'Processing...'
  END,
  progress = CASE 
    WHEN status IN ('success', 'partial') THEN 100
    WHEN status = 'error' THEN 0
    ELSE 50
  END,
  last_updated = COALESCE(completed_at, started_at, now())
WHERE current_step IS NULL;
