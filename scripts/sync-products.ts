#!/usr/bin/env tsx

/**
 * Product Sync Script
 * 
 * This script synchronizes products from Printful to our local database.
 * It handles:
 * - Fetching all products from Printful
 * - Creating/updating products in our database
 * - Creating/updating variants
 * - Removing products that no longer exist in Printful
 * - Preserving product enhancements
 * - Logging sync operations
 */

import 'dotenv/config';
import { printful } from '../src/lib/printful-client';
import { productService } from '../src/lib/database/services/product-service';
import { getProductEnhancement } from '../src/lib/product-enhancements';
import type { PrintfulProduct, PrintfulVariant } from '../src/types';

interface SyncStats {
  productsProcessed: number;
  productsCreated: number;
  productsUpdated: number;
  productsDeleted: number;
  variantsProcessed: number;
  variantsCreated: number;
  variantsUpdated: number;
  variantsDeleted: number;
  errors: string[];
}

class ProductSync {
  private stats: SyncStats = {
    productsProcessed: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsDeleted: 0,
    variantsProcessed: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    variantsDeleted: 0,
    errors: [],
  };

  /**
   * Main sync function
   */
  async syncProducts(): Promise<void> {
    console.log('🚀 Starting product sync...');
    const startTime = Date.now();

    // Create sync log entry
    const syncLog = await productService.createSyncLog({
      operation: 'full_sync',
      status: 'running',
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      variantsDeleted: 0,
    });

    try {
      // Fetch all products from Printful
      console.log('📡 Fetching products from Printful...');
      const printfulProducts = await this.fetchAllProducts();
      console.log(`📦 Found ${printfulProducts.length} products in Printful`);

      // Get existing products from database
      const existingProducts = await productService.getAllProducts();
      const existingProductIds = new Set(existingProducts.map(p => p.printfulId));
      const incomingProductIds = new Set(printfulProducts.map(p => p.id));

      // Find products to delete (exist in DB but not in Printful)
      const productsToDelete = existingProducts.filter(p => !incomingProductIds.has(p.printfulId));
      
      // Delete products that no longer exist in Printful
      for (const product of productsToDelete) {
        try {
          await productService.deleteProduct(product.id);
          this.stats.productsDeleted++;
          console.log(`🗑️  Deleted product: ${product.name} (${product.printfulId})`);
        } catch (error) {
          const errorMsg = `Failed to delete product ${product.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Process each product from Printful
      for (const printfulProduct of printfulProducts) {
        try {
          await this.processProduct(printfulProduct);
          this.stats.productsProcessed++;
        } catch (error) {
          const errorMsg = `Failed to process product ${printfulProduct.name}: ${error}`;
          this.stats.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Update sync log with final stats
      const duration = Date.now() - startTime;
      await productService.updateSyncLog(syncLog.id, {
        status: this.stats.errors.length > 0 ? 'partial' : 'success',
        productsProcessed: this.stats.productsProcessed,
        productsCreated: this.stats.productsCreated,
        productsUpdated: this.stats.productsUpdated,
        productsDeleted: this.stats.productsDeleted,
        variantsProcessed: this.stats.variantsProcessed,
        variantsCreated: this.stats.variantsCreated,
        variantsUpdated: this.stats.variantsUpdated,
        variantsDeleted: this.stats.variantsDeleted,
        errorMessage: this.stats.errors.length > 0 ? this.stats.errors.join('; ') : null,
        duration,
      });

      // Print final summary
      this.printSummary(duration);

    } catch (error) {
      console.error('💥 Sync failed:', error);
      
      // Update sync log with error
      await productService.updateSyncLog(syncLog.id, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      });

      process.exit(1);
    }
  }

  /**
   * Fetch all products from Printful
   */
  private async fetchAllProducts(): Promise<PrintfulProduct[]> {
    try {
      console.log('📡 Fetching products from Printful store...');
      const response = await printful.get('store/products');
      const products = response.result as PrintfulProduct[];
      console.log(`📦 Found ${products.length} products in store`);
      return products;
    } catch (error) {
      console.error(`❌ Failed to fetch products:`, error);
      throw error;
    }
  }

  /**
   * Process a single product
   */
  private async processProduct(printfulProduct: PrintfulProduct): Promise<void> {
    console.log(`🔄 Processing: ${printfulProduct.name} (${printfulProduct.id})`);

    // Check if product exists in database
    const existingProduct = await productService.getProductByPrintfulId(printfulProduct.id);
    const isNewProduct = !existingProduct;

    // Upsert product
    const product = await productService.upsertProduct(printfulProduct);
    
    if (isNewProduct) {
      this.stats.productsCreated++;
      console.log(`✅ Created product: ${product.name}`);
    } else {
      this.stats.productsUpdated++;
      console.log(`🔄 Updated product: ${product.name}`);
    }

    // Fetch product details from Printful to get variants
    try {
      const productDetails = await printful.get(`store/products/${printfulProduct.id}`);
      const { sync_product, sync_variants } = productDetails.result;
      const variants = sync_variants as PrintfulVariant[] | undefined;
      
      // Process variants
      await this.processVariants(product.id, variants);

      // Check if we have existing enhancements and preserve them
      if (isNewProduct) {
        const existingEnhancement = getProductEnhancement(printfulProduct.external_id);
        if (existingEnhancement) {
          await productService.upsertEnhancement(product.id, {
            description: existingEnhancement.description,
            shortDescription: existingEnhancement.shortDescription,
            features: existingEnhancement.features,
            specifications: existingEnhancement.specifications,
            additionalImages: existingEnhancement.additionalImages,
            seo: existingEnhancement.seo,
            defaultVariant: existingEnhancement.defaultVariant,
          });
          console.log(`📝 Preserved enhancement for: ${product.name}`);
        }
      }

    } catch (error) {
      console.error(`❌ Failed to fetch details for product ${printfulProduct.name}:`, error);
      throw error;
    }
  }

  /**
   * Process variants for a product
   */
  private async processVariants(productId: string, printfulVariants: PrintfulVariant[] | undefined): Promise<void> {
    if (!printfulVariants || !Array.isArray(printfulVariants)) {
      console.log(`  ⚠️  No variants found for product ${productId}`);
      return;
    }

    console.log(`  📦 Processing ${printfulVariants.length} variants...`);

    // Get existing variants to track changes
    const existingVariants = await productService.getProductById(productId);
    const existingVariantCount = existingVariants?.variants.length || 0;

    // Upsert variants
    const upsertedVariants = await productService.upsertVariants(productId, printfulVariants);
    
    this.stats.variantsProcessed += printfulVariants.length;
    
    // Calculate variant changes (this is a simplified approach)
    if (existingVariantCount < upsertedVariants.length) {
      this.stats.variantsCreated += upsertedVariants.length - existingVariantCount;
    } else if (existingVariantCount > upsertedVariants.length) {
      this.stats.variantsDeleted += existingVariantCount - upsertedVariants.length;
    } else {
      this.stats.variantsUpdated += upsertedVariants.length;
    }

    console.log(`  ✅ Processed ${upsertedVariants.length} variants`);
  }

  /**
   * Print sync summary
   */
  private printSummary(duration: number): void {
    console.log('\n📊 Sync Summary:');
    console.log('================');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📦 Products processed: ${this.stats.productsProcessed}`);
    console.log(`✅ Products created: ${this.stats.productsCreated}`);
    console.log(`🔄 Products updated: ${this.stats.productsUpdated}`);
    console.log(`🗑️  Products deleted: ${this.stats.productsDeleted}`);
    console.log(`📦 Variants processed: ${this.stats.variantsProcessed}`);
    console.log(`✅ Variants created: ${this.stats.variantsCreated}`);
    console.log(`🔄 Variants updated: ${this.stats.variantsUpdated}`);
    console.log(`🗑️  Variants deleted: ${this.stats.variantsDeleted}`);

    if (this.stats.errors.length > 0) {
      console.log(`❌ Errors: ${this.stats.errors.length}`);
      this.stats.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log('🎉 Sync completed successfully!');
    }
  }
}

// Run the sync
async function main() {
  try {
    const sync = new ProductSync();
    await sync.syncProducts();
  } catch (error) {
    console.error('💥 Sync failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}
