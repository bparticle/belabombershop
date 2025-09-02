ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "current_step" text;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "total_products" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "current_product_index" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "current_product_name" text;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "estimated_time_remaining" integer;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "warnings" text;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD COLUMN "last_updated" timestamp DEFAULT now();--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_logs_last_updated_idx" ON "sync_logs" ("last_updated");