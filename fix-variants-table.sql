-- Fix variants table - change printful_id from INTEGER to BIGINT
-- This is needed because Printful variant IDs are larger than PostgreSQL INTEGER can handle

-- Drop the existing variants table (this will cascade to any foreign keys)
DROP TABLE IF EXISTS variants CASCADE;

-- Recreate the variants table with BIGINT for printful_id
CREATE TABLE variants (
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

-- Recreate the index
CREATE INDEX idx_variants_product_id ON variants(product_id);
CREATE INDEX idx_variants_printful_id ON variants(printful_id);
