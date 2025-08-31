import { pgTable, text, integer, bigint, boolean, timestamp, jsonb, primaryKey } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Products table - stores Printful product data
export const products = pgTable('products', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  printfulId: text('printful_id').notNull().unique(),
  externalId: text('external_id').notNull().unique(),
  name: text('name').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  description: text('description'),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  isIgnored: boolean('is_ignored').default(false),
  isActive: boolean('is_active').default(true),
  syncedAt: timestamp('synced_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
});

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
});

// Product categories table - for better organization
export const categories = pgTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  color: text('color'),
  icon: text('icon'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Product-category relationships (many-to-many)
export const productCategories = pgTable('product_categories', {
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.productId, table.categoryId] }),
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
});

// Types for TypeScript
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Variant = typeof variants.$inferSelect;
export type NewVariant = typeof variants.$inferInsert;
export type ProductEnhancement = typeof productEnhancements.$inferSelect;
export type NewProductEnhancement = typeof productEnhancements.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type SyncLog = typeof syncLogs.$inferSelect;
export type NewSyncLog = typeof syncLogs.$inferInsert;
