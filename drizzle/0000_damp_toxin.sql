CREATE TABLE IF NOT EXISTS "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"color" text,
	"icon" text,
	"parent_id" text,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_system" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "category_mapping_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"rule_type" text NOT NULL,
	"rule_value" text NOT NULL,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_categories" (
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_enhancements" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"description" text,
	"short_description" text,
	"features" jsonb,
	"specifications" jsonb,
	"additional_images" jsonb,
	"seo" jsonb,
	"default_variant_id" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_tags" (
	"product_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" text PRIMARY KEY NOT NULL,
	"printful_id" text NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"thumbnail_url" text,
	"description" text,
	"tags" jsonb,
	"metadata" jsonb,
	"is_ignored" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "products_printful_id_unique" UNIQUE("printful_id"),
	CONSTRAINT "products_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sync_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"operation" text NOT NULL,
	"status" text NOT NULL,
	"products_processed" integer DEFAULT 0,
	"products_created" integer DEFAULT 0,
	"products_updated" integer DEFAULT 0,
	"products_deleted" integer DEFAULT 0,
	"variants_processed" integer DEFAULT 0,
	"variants_created" integer DEFAULT 0,
	"variants_updated" integer DEFAULT 0,
	"variants_deleted" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"duration" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_name_unique" UNIQUE("name"),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"printful_id" bigint NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"retail_price" text NOT NULL,
	"currency" text NOT NULL,
	"size" text,
	"color" text,
	"is_enabled" boolean DEFAULT true,
	"in_stock" boolean DEFAULT true,
	"is_ignored" boolean DEFAULT false,
	"files" jsonb,
	"options" jsonb,
	"synced_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_is_active_idx" ON "categories" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_parent_id_idx" ON "categories" ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "categories_sort_order_idx" ON "categories" ("sort_order");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_mapping_rules_category_id_idx" ON "category_mapping_rules" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_mapping_rules_rule_type_idx" ON "category_mapping_rules" ("rule_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_mapping_rules_priority_idx" ON "category_mapping_rules" ("priority");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "category_mapping_rules_is_active_idx" ON "category_mapping_rules" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_categories_product_id_idx" ON "product_categories" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_categories_category_id_idx" ON "product_categories" ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_categories_is_primary_idx" ON "product_categories" ("is_primary");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_enhancements_product_id_idx" ON "product_enhancements" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tags_product_id_idx" ON "product_tags" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_tags_tag_id_idx" ON "product_tags" ("tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products" ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_is_active_idx" ON "products" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_synced_at_idx" ON "products" ("synced_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_logs_operation_idx" ON "sync_logs" ("operation");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_logs_status_idx" ON "sync_logs" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sync_logs_started_at_idx" ON "sync_logs" ("started_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_slug_idx" ON "tags" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_is_active_idx" ON "tags" ("is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tags_usage_count_idx" ON "tags" ("usage_count");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_product_id_idx" ON "variants" ("product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "variants_is_enabled_idx" ON "variants" ("is_enabled");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "category_mapping_rules" ADD CONSTRAINT "category_mapping_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_enhancements" ADD CONSTRAINT "product_enhancements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variants" ADD CONSTRAINT "variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
