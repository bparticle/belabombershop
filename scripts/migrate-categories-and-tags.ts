#!/usr/bin/env tsx

// Load environment variables first
import 'dotenv/config';

import { db } from '../src/lib/database/config';
import { categoryService } from '../src/lib/database/services/category-service';
import { tagService } from '../src/lib/database/services/tag-service';
import { productService } from '../src/lib/database/services/product-service';
import { products, productCategories, productTags } from '../src/lib/database/schema';
import { eq } from 'drizzle-orm';

async function migrateCategoriesAndTags() {
  console.log('🚀 Starting category and tag migration...');

  try {
    // Step 1: Initialize default categories
    console.log('📂 Initializing default categories...');
    await categoryService.initializeDefaultCategories();
    console.log('✅ Default categories initialized');

    // Step 2: Initialize default tags
    console.log('🏷️ Initializing default tags...');
    const defaultTags = [
      { name: 'New', slug: 'new', description: 'Newly added products', color: '#10B981' },
      { name: 'Trending', slug: 'trending', description: 'Trending products', color: '#F59E0B' },
      { name: 'Popular', slug: 'popular', description: 'Popular products', color: '#EF4444' },
      { name: 'Best Seller', slug: 'best-seller', description: 'Best selling products', color: '#8B5CF6' },
      { name: 'Featured', slug: 'featured', description: 'Featured products', color: '#06B6D4' },
    ];

    for (const tagData of defaultTags) {
      await tagService.createTagIfNotExists(tagData);
    }
    console.log('✅ Default tags initialized');

    // Step 3: Migrate existing products to use the new category system
    console.log('🔄 Migrating existing products...');
    const existingProducts = await db.select().from(products);
    
    let migratedCount = 0;
    for (const product of existingProducts) {
      try {
        // Auto-categorize and auto-tag the product
        await productService.autoCategorizeAndTagProduct(product);
        migratedCount++;
        
        if (migratedCount % 10 === 0) {
          console.log(`📦 Migrated ${migratedCount}/${existingProducts.length} products...`);
        }
      } catch (error) {
        console.error(`❌ Error migrating product ${product.id}:`, error);
      }
    }
    
    console.log(`✅ Successfully migrated ${migratedCount} products`);

    // Step 4: Update tag usage counts
    console.log('📊 Updating tag usage counts...');
    await tagService.updateAllTagUsageCounts();
    console.log('✅ Tag usage counts updated');

    // Step 5: Generate migration report
    console.log('📋 Generating migration report...');
    
    console.log('\n📊 Migration Report:');
    console.log(`- Total products: ${existingProducts.length}`);
    console.log(`- Products with categories: ${migratedCount}`);
    console.log(`- Default categories created: 4`);
    console.log(`- Default tags created: ${defaultTags.length}`);

    console.log('\n🎉 Category and tag migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateCategoriesAndTags()
  .then(() => {
    console.log('✅ Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
