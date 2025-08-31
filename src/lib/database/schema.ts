import { pgTable, text, integer, bigint, boolean, timestamp, jsonb, primaryKey, index } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Products table - stores Printful product data
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  printfulId: text('printful_id').notNull().unique(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  // Remove the old category field as we'll use the many-to-many relationship
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  isIgnored: boolean('is_ignored').default(false),
  isActive: boolean('is_active').default(true),
  syncedAt: timestamp('synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: index('products_name_idx').on(table.name),
  isActiveIdx: index('products_is_active_idx').on(table.isActive),
  syncedAtIdx: index('products_synced_at_idx').on(table.syncedAt),
}));

// Variants table - stores Printful variant data
export const variants = pgTable('variants', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  printfulId: bigint('printful_id', { mode: 'number' }).notNull(),
  externalId: text('external_id').notNull(),
  name: text('name').notNull(),
  retailPrice: text('retail_price').notNull(),
  currency: text('currency').notNull(),
  size: text('size'),
  color: text('color'),
  isEnabled: boolean('is_enabled').default(true),
  inStock: boolean('in_stock').default(true),
  isIgnored: boolean('is_ignored').default(false),
  files: jsonb('files').$type<Array<{
    id: number;
    type: string;
    url: string;
    preview_url: string;
  }>>(),
  options: jsonb('options').$type<Array<{
    id: string;
    value: string;
  }>>(),
  syncedAt: timestamp('synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('variants_product_id_idx').on(table.productId),
  isEnabledIdx: index('variants_is_enabled_idx').on(table.isEnabled),
}));

// Product enhancements table - stores our custom enhancements
export const productEnhancements = pgTable('product_enhancements', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  description: text('description'),
  shortDescription: text('short_description'),
  features: jsonb('features').$type<string[]>(),
  specifications: jsonb('specifications').$type<Record<string, string>>(),
  additionalImages: jsonb('additional_images').$type<Array<{
    url: string;
    alt: string;
    caption?: string;
  }>>(),
  seo: jsonb('seo').$type<{
    keywords: string[];
    metaDescription: string;
  }>(),
  defaultVariantId: text('default_variant_id'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  productIdIdx: index('product_enhancements_product_id_idx').on(table.productId),
}));

// Enhanced categories table - for better organization
export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  color: text('color'),
  icon: text('icon'),
  parentId: text('parent_id').references(() => categories.id, { onDelete: 'set null' }), // For hierarchical categories
  sortOrder: integer('sort_order').default(0), // For custom ordering
  isActive: boolean('is_active').default(true),
  isSystem: boolean('is_system').default(false), // System categories cannot be deleted
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: index('categories_slug_idx').on(table.slug),
  isActiveIdx: index('categories_is_active_idx').on(table.isActive),
  parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
  sortOrderIdx: index('categories_sort_order_idx').on(table.sortOrder),
}));

// Product-category relationships (many-to-many)
export const productCategories = pgTable('product_categories', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').default(false), // Primary category for the product
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.categoryId] }),
  productIdIdx: index('product_categories_product_id_idx').on(table.productId),
  categoryIdIdx: index('product_categories_category_id_idx').on(table.categoryId),
  isPrimaryIdx: index('product_categories_is_primary_idx').on(table.isPrimary),
}));

// Tags table - for flexible tagging system
export const tags = pgTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color'),
  isActive: boolean('is_active').default(true),
  usageCount: integer('usage_count').default(0), // Track how many products use this tag
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  slugIdx: index('tags_slug_idx').on(table.slug),
  isActiveIdx: index('tags_is_active_idx').on(table.isActive),
  usageCountIdx: index('tags_usage_count_idx').on(table.usageCount),
}));

// Product-tag relationships (many-to-many)
export const productTags = pgTable('product_tags', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.tagId] }),
  productIdIdx: index('product_tags_product_id_idx').on(table.productId),
  tagIdIdx: index('product_tags_tag_id_idx').on(table.tagId),
}));

// Category mapping rules - for automatic categorization during sync
export const categoryMappingRules = pgTable('category_mapping_rules', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  ruleType: text('rule_type').notNull(), // 'name_keyword', 'tag_keyword', 'metadata_key'
  ruleValue: text('rule_value').notNull(), // The actual keyword or key to match
  priority: integer('priority').default(0), // Higher priority rules are checked first
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  categoryIdIdx: index('category_mapping_rules_category_id_idx').on(table.categoryId),
  ruleTypeIdx: index('category_mapping_rules_rule_type_idx').on(table.ruleType),
  priorityIdx: index('category_mapping_rules_priority_idx').on(table.priority),
  isActiveIdx: index('category_mapping_rules_is_active_idx').on(table.isActive),
}));

// Sync logs table - for tracking sync operations
export const syncLogs = pgTable('sync_logs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  operation: text('operation').notNull(), // 'full_sync', 'product_update', etc.
  status: text('status').notNull(), // 'success', 'error', 'partial'
  productsProcessed: integer('products_processed').default(0),
  productsCreated: integer('products_created').default(0),
  productsUpdated: integer('products_updated').default(0),
  productsDeleted: integer('products_deleted').default(0),
  variantsProcessed: integer('variants_processed').default(0),
  variantsCreated: integer('variants_created').default(0),
  variantsUpdated: integer('variants_updated').default(0),
  variantsDeleted: integer('variants_deleted').default(0),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  duration: integer('duration'), // in milliseconds
}, (table) => ({
  operationIdx: index('sync_logs_operation_idx').on(table.operation),
  statusIdx: index('sync_logs_status_idx').on(table.status),
  startedAtIdx: index('sync_logs_started_at_idx').on(table.startedAt),
}));

// Types for TypeScript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Variant = typeof variants.$inferSelect;
export type NewVariant = typeof variants.$inferInsert;
export type ProductEnhancement = typeof productEnhancements.$inferSelect;
export type NewProductEnhancement = typeof productEnhancements.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type CategoryMappingRule = typeof categoryMappingRules.$inferSelect;
export type NewCategoryMappingRule = typeof categoryMappingRules.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
