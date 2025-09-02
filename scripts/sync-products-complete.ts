#!/usr/bin/env tsx

/**
 * COMPLETE PRODUCT SYNCHRONIZATION SCRIPT
 * 
 * This script provides complete synchronization between Printful and your database:
 * - Creates new products
 * - Updates existing products
 * - Deletes removed products
 * - Verifies counts match
 * - Provides detailed reporting
 * 
 * Use this for both development and production environments
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables (defaults to .env.local, can be overridden)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: resolve(process.cwd(), envFile) });

console.log('🔄 COMPLETE PRODUCT SYNCHRONIZATION');
console.log('=' .repeat(60));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🎯 Database: ${process.env.DATABASE_HOST}`);
console.log('=' .repeat(60));

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
  warnings: string[];
  startTime: number;
  endTime?: number;
}

interface SyncOptions {
  dryRun?: boolean;
  forceDelete?: boolean;
  skipVerification?: boolean;
}

class CompleteProductSync {
  private stats: SyncStats;
  private options: SyncOptions;
  private printful: any;
  private productService: any;
  private syncLogId?: string;

  constructor(options: SyncOptions = {}) {
    this.options = {
      dryRun: false,
      forceDelete: false,
      skipVerification: false,
      ...options
    };

    this.stats = {
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      variantsDeleted: 0,
      errors: [],
      warnings: [],
      startTime: Date.now(),
    };
  }

  async initialize(): Promise<void> {
    console.log('\n1️⃣ Initializing synchronization...');
    
    try {
      // Import required modules
      const { PrintfulClient } = await import('printful-request');
      const { productService } = await import('../src/lib/database/services/product-service');
      
      this.printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
      this.productService = productService;

      // Test database connection
      const { db } = await import('../src/lib/database/config');
      const { sql } = await import('drizzle-orm');
      
      await db.execute(sql`SELECT 1 as test`);
      console.log('✅ Database connection successful');

      // Create sync log
      this.syncLogId = await this.createSyncLog();
      console.log('✅ Initialization complete');

    } catch (error) {
      throw new Error(`Initialization failed: ${error}`);
    }
  }

  private async createSyncLog(): Promise<string> {
    const syncLog = await this.productService.createSyncLog({
      operation: 'complete_sync',
      status: 'queued',
      currentStep: 'Starting complete product synchronization',
      progress: 0,
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      variantsDeleted: 0,
    });
    return syncLog.id;
  }

  private async updateProgress(step: string, progress: number, details?: any): Promise<void> {
    if (this.syncLogId) {
      await this.productService.updateSyncLog(this.syncLogId, {
        currentStep: step,
        progress,
        ...details
      });
    }
    console.log(`📊 ${step} (${progress}%)`);
  }

  async fetchPrintfulProducts(): Promise<any[]> {
    console.log('\n2️⃣ Fetching products from Printful...');
    await this.updateProgress('Fetching products from Printful API', 10);

    const allProducts: any[] = [];
    let offset = 0;
    const limit = 20;

    while (true) {
      console.log(`📡 Fetching batch: offset=${offset}, limit=${limit}`);
      
      const response = await this.printful.get('store/products', { offset, limit }) as any;
      
      if (!response.result || response.result.length === 0) {
        console.log(`🔍 No more products found at offset ${offset}`);
        break;
      }

      console.log(`✅ Found ${response.result.length} products in this batch`);
      allProducts.push(...response.result);
      offset += limit;

      // Respectful API delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🎉 Total Printful products: ${allProducts.length}`);
    return allProducts;
  }

  async analyzeDatabaseProducts(): Promise<any[]> {
    console.log('\n3️⃣ Analyzing database products...');
    await this.updateProgress('Analyzing existing database products', 20);

    const existingProducts = await this.productService.getAllProductsForAdmin();
    console.log(`📊 Found ${existingProducts.length} products in database`);
    
    return existingProducts;
  }

  async identifyDeletions(printfulProducts: any[], dbProducts: any[]): Promise<any[]> {
    console.log('\n4️⃣ Identifying products to delete...');
    await this.updateProgress('Identifying products that need deletion', 25);

    const printfulIds = new Set(printfulProducts.map(p => p.id.toString()));
    const productsToDelete = dbProducts.filter(dbProduct => 
      !printfulIds.has(dbProduct.printfulId)
    );

    console.log(`🗑️  Found ${productsToDelete.length} products to delete`);
    
    if (productsToDelete.length > 0) {
      console.log('Products to be deleted:');
      productsToDelete.forEach(p => console.log(`   - ${p.name} (ID: ${p.printfulId})`));
    }

    return productsToDelete;
  }

  async deleteRemovedProducts(productsToDelete: any[]): Promise<void> {
    if (productsToDelete.length === 0) {
      console.log('\n✅ No products to delete');
      return;
    }

    console.log('\n5️⃣ Deleting removed products...');
    await this.updateProgress(`Deleting ${productsToDelete.length} removed products`, 30);

    if (this.options.dryRun) {
      console.log('🔍 DRY RUN: Would delete the following products:');
      productsToDelete.forEach(p => {
        console.log(`   🗑️  ${p.name} (${p.variants.length} variants)`);
        this.stats.productsDeleted++;
        this.stats.variantsDeleted += p.variants.length;
      });
      return;
    }

    for (let i = 0; i < productsToDelete.length; i++) {
      const product = productsToDelete[i];
      const progress = 30 + Math.round((i / productsToDelete.length) * 15);
      
      console.log(`🗑️  Deleting ${i + 1}/${productsToDelete.length}: ${product.name}`);
      
      try {
        await this.updateProgress(`Deleting: ${product.name}`, progress);
        
        if (!this.options.forceDelete) {
          // Double-check the product still doesn't exist in Printful
          try {
            const checkResponse = await this.printful.get(`store/products/${product.printfulId}`);
            if (checkResponse.result) {
              console.log(`  ⚠️  Product ${product.name} still exists in Printful, skipping deletion`);
              this.stats.warnings.push(`Product ${product.name} still exists in Printful, skipping deletion`);
              continue;
            }
          } catch (error) {
            // Product doesn't exist in Printful, safe to delete
          }
        }

        await this.productService.deleteProduct(product.id);
        this.stats.productsDeleted++;
        this.stats.variantsDeleted += product.variants.length;
        
        console.log(`  ✅ Deleted: ${product.name} (${product.variants.length} variants)`);
        
      } catch (error) {
        const errorMsg = `Failed to delete ${product.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        console.log(`  ❌ Error: ${errorMsg}`);
      }

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async syncProducts(printfulProducts: any[]): Promise<void> {
    console.log('\n6️⃣ Syncing products (create/update)...');
    await this.updateProgress(`Processing ${printfulProducts.length} products`, 50);

    for (let i = 0; i < printfulProducts.length; i++) {
      const basicProduct = printfulProducts[i];
      const progress = 50 + Math.round((i / printfulProducts.length) * 35);
      
      console.log(`📦 Processing ${i + 1}/${printfulProducts.length}: ${basicProduct.name}`);
      
      try {
        await this.updateProgress(`Processing: ${basicProduct.name}`, progress);

        // Get detailed product info
        const detailResponse = await this.printful.get(`store/products/${basicProduct.id}`) as any;
        const { sync_product, sync_variants } = detailResponse.result;

        // Check if product exists
        const existingProduct = await this.productService.getProductByPrintfulId(sync_product.id);
        const isNewProduct = !existingProduct;

        // Upsert product
        const product = await this.productService.upsertProduct(sync_product);
        
        if (isNewProduct) {
          this.stats.productsCreated++;
          console.log(`  ✅ Created: ${product.name}`);
        } else {
          this.stats.productsUpdated++;
          console.log(`  ✅ Updated: ${product.name}`);
        }
        this.stats.productsProcessed++;

        // Process variants
        if (sync_variants && sync_variants.length > 0) {
          const variantResults = await this.productService.upsertVariants(product.id, sync_variants);
          this.stats.variantsProcessed += variantResults.length;
          
          // Count new vs updated variants
          const existingVariants = existingProduct?.variants || [];
          const newVariants = variantResults.filter(v => 
            !existingVariants.find(ev => ev.printfulId === v.printfulId)
          );
          
          this.stats.variantsCreated += newVariants.length;
          this.stats.variantsUpdated += variantResults.length - newVariants.length;
          
          console.log(`  📊 Variants: ${variantResults.length} total (${newVariants.length} new, ${variantResults.length - newVariants.length} updated)`);
        }

        // Auto-categorize new products
        if (isNewProduct) {
          try {
            await this.productService.autoCategorizeAndTagProduct(product);
            console.log(`  🏷️  Auto-categorized`);
          } catch (error) {
            this.stats.warnings.push(`Failed to auto-categorize ${product.name}: ${error}`);
          }
        }

        // Respectful delay
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMsg = `Failed to process ${basicProduct.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        console.log(`  ❌ Error: ${errorMsg}`);
      }
    }
  }

  async verifySynchronization(printfulProducts: any[]): Promise<void> {
    if (this.options.skipVerification) {
      console.log('\n⏭️  Skipping verification (--skip-verification flag)');
      return;
    }

    console.log('\n7️⃣ Verifying synchronization...');
    await this.updateProgress('Verifying synchronization completeness', 90);

    // Get final database count
    const finalDbProducts = await this.productService.getAllProductsForAdmin();
    const finalDbCount = finalDbProducts.length;
    const printfulCount = printfulProducts.length;

    console.log(`📊 Final counts:`);
    console.log(`   Printful: ${printfulCount} products`);
    console.log(`   Database: ${finalDbCount} products`);
    
    if (finalDbCount === printfulCount) {
      console.log(`✅ Synchronization complete! Counts match perfectly.`);
    } else {
      console.log(`⚠️  Count mismatch detected!`);
      console.log(`   Expected: ${printfulCount}, Actual: ${finalDbCount}`);
      this.stats.warnings.push(`Count mismatch: Printful has ${printfulCount} products, Database has ${finalDbCount} products`);
      
      // Show details of the mismatch
      const dbIds = new Set(finalDbProducts.map(p => p.printfulId));
      const printfulIds = new Set(printfulProducts.map(p => p.id.toString()));
      
      const missingInDb = printfulProducts.filter(p => !dbIds.has(p.id.toString()));
      const extraInDb = finalDbProducts.filter(p => !printfulIds.has(p.printfulId));
      
      if (missingInDb.length > 0) {
        console.log(`   Missing in database: ${missingInDb.length} products`);
        missingInDb.slice(0, 5).forEach(p => console.log(`     - ${p.name}`));
        if (missingInDb.length > 5) console.log(`     ... and ${missingInDb.length - 5} more`);
      }
      
      if (extraInDb.length > 0) {
        console.log(`   Extra in database: ${extraInDb.length} products`);
        extraInDb.slice(0, 5).forEach(p => console.log(`     - ${p.name}`));
        if (extraInDb.length > 5) console.log(`     ... and ${extraInDb.length - 5} more`);
      }
    }
  }

  async finalize(): Promise<void> {
    console.log('\n8️⃣ Finalizing synchronization...');
    await this.updateProgress('Finalizing synchronization', 100);

    this.stats.endTime = Date.now();
    const duration = this.stats.endTime - this.stats.startTime;

    // Update sync log
    if (this.syncLogId) {
      await this.productService.updateSyncLog(this.syncLogId, {
        status: this.stats.errors.length > 0 ? 'partial' : 'success',
        currentStep: 'Complete synchronization finished',
        progress: 100,
        duration,
        completedAt: new Date(),
        productsProcessed: this.stats.productsProcessed,
        productsCreated: this.stats.productsCreated,
        productsUpdated: this.stats.productsUpdated,
        productsDeleted: this.stats.productsDeleted,
        variantsProcessed: this.stats.variantsProcessed,
        variantsCreated: this.stats.variantsCreated,
        variantsUpdated: this.stats.variantsUpdated,
        variantsDeleted: this.stats.variantsDeleted,
      });
    }

    // Print summary
    this.printSummary(duration);
  }

  private printSummary(duration: number): void {
    console.log('\n' + '=' .repeat(60));
    console.log('🌟 COMPLETE SYNCHRONIZATION SUMMARY');
    console.log('=' .repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔍 Mode: ${this.options.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`📊 Database: ${process.env.DATABASE_HOST?.substring(0, 30)}...`);
    console.log(`📦 Products: ${this.stats.productsCreated} created, ${this.stats.productsUpdated} updated, ${this.stats.productsDeleted} deleted`);
    console.log(`🎛️  Variants: ${this.stats.variantsCreated} created, ${this.stats.variantsUpdated} updated, ${this.stats.variantsDeleted} deleted`);
    console.log(`📈 Total Products: ${this.stats.productsProcessed}`);
    console.log(`📈 Total Variants: ${this.stats.variantsProcessed}`);
    console.log(`⚠️  Warnings: ${this.stats.warnings.length}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.stats.warnings.slice(0, 5).forEach(warning => console.log(`   - ${warning}`));
      if (this.stats.warnings.length > 5) {
        console.log(`   ... and ${this.stats.warnings.length - 5} more warnings`);
      }
    }
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (this.stats.errors.length > 5) {
        console.log(`   ... and ${this.stats.errors.length - 5} more errors`);
      }
    }

    if (this.options.dryRun) {
      console.log('\n🔍 DRY RUN COMPLETED - No changes were made to the database');
      console.log('Run without --dry-run to perform actual synchronization');
    } else if (this.stats.errors.length === 0) {
      console.log('\n🎉 SYNCHRONIZATION COMPLETED SUCCESSFULLY!');
      console.log('✅ Your database is now fully synchronized with Printful');
    } else {
      console.log('\n⚠️  SYNCHRONIZATION COMPLETED WITH ERRORS');
      console.log('Some products may not have been processed correctly');
    }
    
    console.log('=' .repeat(60));
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      
      const printfulProducts = await this.fetchPrintfulProducts();
      const dbProducts = await this.analyzeDatabaseProducts();
      
      const productsToDelete = await this.identifyDeletions(printfulProducts, dbProducts);
      await this.deleteRemovedProducts(productsToDelete);
      await this.syncProducts(printfulProducts);
      await this.verifySynchronization(printfulProducts);
      await this.finalize();
      
    } catch (error) {
      console.error('\n💥 Synchronization failed:', error);
      throw error;
    }
  }
}

// Parse command line arguments
function parseArgs(): SyncOptions {
  const args = process.argv.slice(2);
  const options: SyncOptions = {};
  
  args.forEach(arg => {
    if (arg === '--dry-run') options.dryRun = true;
    if (arg === '--force-delete') options.forceDelete = true;
    if (arg === '--skip-verification') options.skipVerification = true;
  });
  
  return options;
}

// Main execution
async function main(): Promise<void> {
  const options = parseArgs();
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to the database');
  }
  
  if (options.forceDelete) {
    console.log('⚠️  FORCE DELETE MODE - Products will be deleted without double-checking');
  }
  
  const sync = new CompleteProductSync(options);
  await sync.run();
}

// Run the complete synchronization
main().catch(error => {
  console.error('💥 Fatal synchronization error:', error);
  process.exit(1);
});
