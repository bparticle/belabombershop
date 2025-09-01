import { pgTable, index, unique, text, jsonb, boolean, timestamp, foreignKey, integer, bigint, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const products = pgTable("products", {
	id: text("id").primaryKey().notNull(),
	printfulId: text("printful_id").notNull(),
	externalId: text("external_id").notNull(),
	name: text("name").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	description: text("description"),
	tags: jsonb("tags"),
	metadata: jsonb("metadata"),
	isIgnored: boolean("is_ignored").default(false),
	isActive: boolean("is_active").default(true),
	syncedAt: timestamp("synced_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxProductsPrintfulId: index("idx_products_printful_id").on(table.printfulId),
		idxProductsExternalId: index("idx_products_external_id").on(table.externalId),
		idxProductsIsActive: index("idx_products_is_active").on(table.isActive),
		productsPrintfulIdKey: unique("products_printful_id_key").on(table.printfulId),
		productsExternalIdKey: unique("products_external_id_key").on(table.externalId),
	}
});

export const categories = pgTable("categories", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	description: text("description"),
	slug: text("slug").notNull(),
	color: text("color"),
	icon: text("icon"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	parentId: text("parent_id"),
	sortOrder: integer("sort_order").default(0),
	isSystem: boolean("is_system").default(false),
},
(table) => {
	return {
		parentIdIdx: index("categories_parent_id_idx").on(table.parentId),
		sortOrderIdx: index("categories_sort_order_idx").on(table.sortOrder),
		categoriesParentIdFkey: foreignKey({
			columns: [table.parentId],
			foreignColumns: [table.id],
			name: "categories_parent_id_fkey"
		}).onDelete("set null"),
		categoriesSlugKey: unique("categories_slug_key").on(table.slug),
	}
});

export const productEnhancements = pgTable("product_enhancements", {
	id: text("id").primaryKey().notNull(),
	productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" } ),
	description: text("description"),
	shortDescription: text("short_description"),
	features: jsonb("features"),
	specifications: jsonb("specifications"),
	additionalImages: jsonb("additional_images"),
	seo: jsonb("seo"),
	defaultVariantId: text("default_variant_id"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxProductEnhancementsProductId: index("idx_product_enhancements_product_id").on(table.productId),
	}
});

export const syncLogs = pgTable("sync_logs", {
	id: text("id").primaryKey().notNull(),
	operation: text("operation").notNull(),
	status: text("status").notNull(),
	productsProcessed: integer("products_processed").default(0),
	productsCreated: integer("products_created").default(0),
	productsUpdated: integer("products_updated").default(0),
	productsDeleted: integer("products_deleted").default(0),
	variantsProcessed: integer("variants_processed").default(0),
	variantsCreated: integer("variants_created").default(0),
	variantsUpdated: integer("variants_updated").default(0),
	variantsDeleted: integer("variants_deleted").default(0),
	errorMessage: text("error_message"),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	duration: integer("duration"),
},
(table) => {
	return {
		idxSyncLogsStartedAt: index("idx_sync_logs_started_at").on(table.startedAt),
	}
});

export const variants = pgTable("variants", {
	id: text("id").primaryKey().notNull(),
	productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" } ),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	printfulId: bigint("printful_id", { mode: "number" }).notNull(),
	externalId: text("external_id").notNull(),
	name: text("name").notNull(),
	retailPrice: text("retail_price").notNull(),
	currency: text("currency").notNull(),
	size: text("size"),
	color: text("color"),
	isEnabled: boolean("is_enabled").default(true),
	inStock: boolean("in_stock").default(true),
	isIgnored: boolean("is_ignored").default(false),
	files: jsonb("files"),
	options: jsonb("options"),
	syncedAt: timestamp("synced_at", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		idxVariantsProductId: index("idx_variants_product_id").on(table.productId),
		idxVariantsPrintfulId: index("idx_variants_printful_id").on(table.printfulId),
	}
});

export const categoryMappingRules = pgTable("category_mapping_rules", {
	id: text("id").primaryKey().notNull(),
	categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" } ),
	ruleType: text("rule_type").notNull(),
	ruleValue: text("rule_value").notNull(),
	priority: integer("priority").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		categoryIdIdx: index("category_mapping_rules_category_id_idx").on(table.categoryId),
		ruleTypeIdx: index("category_mapping_rules_rule_type_idx").on(table.ruleType),
		priorityIdx: index("category_mapping_rules_priority_idx").on(table.priority),
		isActiveIdx: index("category_mapping_rules_is_active_idx").on(table.isActive),
	}
});

export const tags = pgTable("tags", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	slug: text("slug").notNull(),
	description: text("description"),
	color: text("color"),
	isActive: boolean("is_active").default(true),
	usageCount: integer("usage_count").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		slugIdx: index("tags_slug_idx").on(table.slug),
		isActiveIdx: index("tags_is_active_idx").on(table.isActive),
		usageCountIdx: index("tags_usage_count_idx").on(table.usageCount),
		tagsNameKey: unique("tags_name_key").on(table.name),
		tagsSlugKey: unique("tags_slug_key").on(table.slug),
	}
});

export const productTags = pgTable("product_tags", {
	productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" } ),
	tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" } ),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		productIdIdx: index("product_tags_product_id_idx").on(table.productId),
		tagIdIdx: index("product_tags_tag_id_idx").on(table.tagId),
		productTagsPkey: primaryKey({ columns: [table.productId, table.tagId], name: "product_tags_pkey"})
	}
});

export const productCategories = pgTable("product_categories", {
	productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" } ),
	categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" } ),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
},
(table) => {
	return {
		productCategoriesPkey: primaryKey({ columns: [table.productId, table.categoryId], name: "product_categories_pkey"})
	}
});