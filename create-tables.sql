-- Create database tables for Bela Bomberman Store
-- This script creates all the tables needed for the product management system

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    printful_id TEXT NOT NULL UNIQUE,
    external_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    thumbnail_url TEXT,
    description TEXT,
    category TEXT,
    tags JSONB,
    metadata JSONB,
    is_ignored BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Variants table
CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    printful_id BIGINT NOT NULL,
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    retail_price TEXT NOT NULL,
    currency TEXT NOT NULL,
    size TEXT,
    color TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    in_stock BOOLEAN DEFAULT TRUE,
    is_ignored BOOLEAN DEFAULT FALSE,
    files JSONB,
    options JSONB,
    synced_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product enhancements table
CREATE TABLE IF NOT EXISTS product_enhancements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    description TEXT,
    short_description TEXT,
    features JSONB,
    specifications JSONB,
    additional_images JSONB,
    seo JSONB,
    default_variant_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    color TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product categories junction table
CREATE TABLE IF NOT EXISTS product_categories (
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
    id TEXT PRIMARY KEY,
    operation TEXT NOT NULL,
    status TEXT NOT NULL,
    products_processed INTEGER DEFAULT 0,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_deleted INTEGER DEFAULT 0,
    variants_processed INTEGER DEFAULT 0,
    variants_created INTEGER DEFAULT 0,
    variants_updated INTEGER DEFAULT 0,
    variants_deleted INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_printful_id ON products(printful_id);
CREATE INDEX IF NOT EXISTS idx_products_external_id ON products(external_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_printful_id ON variants(printful_id);
CREATE INDEX IF NOT EXISTS idx_product_enhancements_product_id ON product_enhancements(product_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at);
