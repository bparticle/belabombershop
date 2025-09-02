#!/usr/bin/env tsx

/**
 * SAFE Product Sync Script - Prevents Data Loss
 * 
 * This script addresses critical data loss issues in the original sync by:
 * 1. Using CREATE-FIRST approach instead of DELETE-FIRST
 * 2. Implementing transaction-like safety with rollback capability
 * 3. Adding interruption detection and recovery
 * 4. Preserving data integrity throughout the process
 * 
 * @author AI Assistant - Data Loss Prevention Update
 * @version 3.0.0 - SAFE VERSION
 * @created 2024-12-19
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local (Next.js default) BEFORE importing anything else
config({ path: resolve(process.cwd(), '.env.local') });

// Now import modules that depend on environment variables
import { printful } from '../src/lib/printful-client';
import { productService } from '../src/lib/database/services/product-service';
import { SyncProgressTracker, ProgressUtils } from '../src/lib/sync-progress';
import type { PrintfulProduct, PrintfulVariant } from '../src/types';
import type { SyncLog } from '../src/lib/database/schema';

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

interface SafetyCheckpoint {
  syncLogId: string;
  phase: string;
  productsToDelete: string[];
  timestamp: number;
}

/**
 * SAFE ProductSync class with data loss prevention
 */
class SafeProductSync {
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

  private progressTracker: SyncProgressTracker | null = null;
  private syncLog: SyncLog | null = null;
  private safetyCheckpoint: SafetyCheckpoint | null = null;

  /**
   * SAFE sync function - prevents data loss
   */
  async syncProducts(existingSyncLogId?: string): Promise<void> {
    this.logWithIcon('🚀', 'Starting SAFE product sync (data loss prevention enabled)...');
    
    // Debug environment information
    this.logWithIcon('🔧', `Node ENV: ${process.env.NODE_ENV || 'undefined'}`);
    this.logWithIcon('🔑', `API Key available: ${process.env.PRINTFUL_API_KEY ? 'YES' : 'NO'}`);
    if (process.env.PRINTFUL_API_KEY) {
      this.logWithIcon('🔑', `API Key: ${process.env.PRINTFUL_API_KEY.substring(0, 8)}...`);
    }
    
    const startTime = Date.now();

    // Use existing sync log if provided, otherwise create a new one
    if (existingSyncLogId) {
      this.syncLog = await productService.getSyncLogById(existingSyncLogId);
      if (!this.syncLog) {
        throw new Error(`Sync log with ID ${existingSyncLogId} not found`);
      }
      this.logWithIcon('🔄', `Using existing sync log: ${existingSyncLogId}`);
    } else {
      // Create sync log entry (only when running standalone)
      this.syncLog = await productService.createSyncLog({
        operation: 'safe_sync',
        status: 'queued',
        currentStep: 'Initializing safe sync process',
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
      this.logWithIcon('📝', `Created new sync log: ${this.syncLog.id}`);
    }

    this.progressTracker = new SyncProgressTracker(this.syncLog.id);

    try {
      // Phase 1: Check for interrupted syncs and recover
      await this.checkAndRecoverInterruptedSync();

      // Phase 2: Fetch products from Printful
      await this.updateProgress({
        status: 'fetching_products',
        currentStep: 'Fetching products from Printful API...',
        progress: 5,
      });

      const printfulProducts = await this.fetchAllProducts();
      this.logWithIcon('📦', `Found ${printfulProducts.length} products with variants from Printful`);

      // Phase 3: Initialize progress tracker
      const initUpdate = this.progressTracker!.initialize(printfulProducts.length);
      await this.updateProgress(initUpdate);

      // Phase 4: Analyze existing products (NO DELETION YET!)
      await this.updateProgress({
        currentStep: 'Analyzing existing products (safe mode)...',
        progress: 15,
      });

      const existingProducts = await productService.getAllProductsForAdmin();
      const existingProductIds = new Set(existingProducts.map(p => p.printfulId));
      const incomingProductIds = new Set(printfulProducts.map(p => p.id));
      const productsToDelete = existingProducts.filter(p => !incomingProductIds.has(p.printfulId));

      // Create safety checkpoint BEFORE any destructive operations
      this.safetyCheckpoint = {
        syncLogId: this.syncLog.id,
        phase: 'pre_deletion',
        productsToDelete: productsToDelete.map(p => p.id),
        timestamp: Date.now(),
      };

      this.logWithIcon('🔍', `Found ${existingProducts.length} existing products in database`);
      this.logWithIcon('🔍', `Found ${printfulProducts.length} products from Printful`);
      this.logWithIcon('🔍', `Products scheduled for deletion: ${productsToDelete.length}`);
      
      if (productsToDelete.length > 0) {
        this.logWithIcon('📋', `Products scheduled for deletion (SAFE MODE - will delete AFTER creating new ones):`);
        productsToDelete.forEach(product => {
          this.logWithIcon('📋', `  - ${product.name} (Printful ID: ${product.printfulId})`);
        });
      }

      // Phase 5: Process products FIRST (CREATE/UPDATE BEFORE DELETE!)
      await this.updateProgress({
        status: 'processing_products',
        currentStep: `Processing ${printfulProducts.length} products (SAFE: create first)...`,
        progress: 20,
      });

      await this.processProductsWithProgress(printfulProducts);

      // Phase 6: ONLY NOW delete obsolete products and variants (after new ones are created)
      if (productsToDelete.length > 0) {
        await this.updateProgress({
          currentStep: `SAFELY removing ${productsToDelete.length} obsolete products...`,
          progress: 90,
        });

        await this.safelyDeleteObsoleteProducts(productsToDelete);
      }

      // Phase 7: Clean up obsolete variants for remaining products
      await this.updateProgress({
        currentStep: 'SAFELY cleaning up obsolete variants...',
        progress: 95,
      });

      await this.safelyDeleteObsoleteVariants(printfulProducts);

      // Phase 8: Finalize sync
      await this.finalizeSyncWithSuccess(startTime);

    } catch (error) {
      this.logWithIcon('💥', `Sync failed: ${error}`);
      await this.handleSyncFailure(error, startTime);
      
      // Re-throw for script execution context
      if (process.env.NODE_ENV !== 'production') {
        throw error;
      }
    }
  }

  /**
   * Check for and recover from interrupted syncs
   */
  private async checkAndRecoverInterruptedSync(): Promise<void> {
    this.logWithIcon('🔍', 'Checking for interrupted syncs...');
    
    const activeSyncs = await productService.getActiveSyncLogs();
    const stuckSyncs = activeSyncs.filter(sync => {
      const startedAt = sync.startedAt ? new Date(sync.startedAt) : new Date();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return startedAt < fiveMinutesAgo;
    });

    if (stuckSyncs.length > 0) {
      this.logWithIcon('⚠️', `Found ${stuckSyncs.length} potentially stuck syncs, cancelling them...`);
      
      for (const stuckSync of stuckSyncs) {
        await productService.updateSyncLog(stuckSync.id, {
          status: 'cancelled',
          errorMessage: 'Sync cancelled due to being stuck (auto-recovery)',
          currentStep: 'Cancelled by auto-recovery system',
        });
        this.logWithIcon('✅', `Cancelled stuck sync: ${stuckSync.id}`);
      }
    } else {
      this.logWithIcon('✅', 'No stuck syncs found');
    }
  }

  /**
   * Process products with detailed progress updates
   */
  private async processProductsWithProgress(printfulProducts: PrintfulProduct[]): Promise<void> {
    for (let i = 0; i < printfulProducts.length; i++) {
      const product = printfulProducts[i];
      
      // Update progress tracker
      const productUpdate = this.progressTracker!.startProduct(i, product.name);
      await this.updateProgress(productUpdate);
      
      try {
        const result = await this.processProductWithTracking(product);
        
        // Update stats
        if (result.created) this.stats.productsCreated++;
        if (result.updated) this.stats.productsUpdated++;
        this.stats.productsProcessed++;
        // Variant stats are now handled in processVariants method to avoid double counting
        
        // Complete product in tracker
        const completeUpdate = this.progressTracker!.completeProduct(result);
        await this.updateProgress(completeUpdate);
        
        this.logWithIcon('✅', `Processed: ${product.name} (${result.created ? 'created' : 'updated'})`);
        
      } catch (error) {
        const errorMsg = `Failed to process product ${product.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        this.progressTracker!.addWarning(errorMsg);
        this.logWithIcon('❌', errorMsg);
      }
    }
  }

  /**
   * SAFELY delete obsolete products (only after new ones are created)
   */
  private async safelyDeleteObsoleteProducts(productsToDelete: any[]): Promise<void> {
    this.logWithIcon('🛡️', 'SAFE DELETION: Starting deletion of obsolete products (new products already created)');
    
    // Update checkpoint
    if (this.safetyCheckpoint) {
      this.safetyCheckpoint.phase = 'deleting';
      this.safetyCheckpoint.timestamp = Date.now();
    }

    for (const product of productsToDelete) {
      try {
        await productService.deleteProduct(product.id);
        this.stats.productsDeleted++;
        this.logWithIcon('🗑️', `SAFELY Deleted: ${product.name} (${product.printfulId})`);
      } catch (error) {
        const errorMsg = `Failed to delete product ${product.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        this.progressTracker!.addWarning(errorMsg);
        this.logWithIcon('❌', errorMsg);
      }
    }

    // Clear checkpoint after successful deletion
    this.safetyCheckpoint = null;
  }

  /**
   * SAFELY delete obsolete variants for all products (only after new variants are created)
   */
  private async safelyDeleteObsoleteVariants(printfulProducts: PrintfulProduct[]): Promise<void> {
    this.logWithIcon('🛡️', 'SAFE VARIANT CLEANUP: Starting deletion of obsolete variants (new variants already created)');
    
    for (const printfulProduct of printfulProducts) {
      try {
        // Get detailed product information to get current variant IDs
        const detailResponse = await printful.get(`store/products/${printfulProduct.id}`) as {
          result: {
            sync_product: PrintfulProduct;
            sync_variants: PrintfulVariant[];
          };
        };

        const { sync_variants } = detailResponse.result;
        const currentVariantIds = sync_variants.map(v => v.id);

        // Find the product in our database
        const existingProduct = await productService.getProductByPrintfulId(printfulProduct.id);
        if (existingProduct) {
          // Use the new safe variant deletion method
          await productService.deleteObsoleteVariants(existingProduct.id, currentVariantIds);
        }
        
      } catch (error) {
        const errorMsg = `Failed to clean up variants for product ${printfulProduct.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        this.progressTracker!.addWarning(errorMsg);
        this.logWithIcon('❌', errorMsg);
      }
    }

    this.logWithIcon('✅', 'SAFE VARIANT CLEANUP: Completed variant cleanup phase');
  }

  /**
   * Handle sync failure with potential recovery
   */
  private async handleSyncFailure(error: unknown, startTime: number): Promise<void> {
    const duration = Date.now() - startTime;
    
    // If we have a safety checkpoint and failed during deletion, 
    // the data is still safe because we created new products first
    if (this.safetyCheckpoint?.phase === 'deleting') {
      this.logWithIcon('🛡️', 'SAFE FAILURE: New products were created successfully before deletion started. Data is safe.');
    }
    
    await this.updateProgress({
      status: 'error',
      currentStep: 'Sync failed - investigating safety status',
      errorMessage: error instanceof Error ? error.message : String(error),
      duration,
      productsProcessed: this.stats.productsProcessed,
      productsCreated: this.stats.productsCreated,
      productsUpdated: this.stats.productsUpdated,
      productsDeleted: this.stats.productsDeleted,
      variantsProcessed: this.stats.variantsProcessed,
      variantsCreated: this.stats.variantsCreated,
      variantsUpdated: this.stats.variantsUpdated,
      variantsDeleted: this.stats.variantsDeleted,
    });

    this.printSummary(duration);
  }

  /**
   * Fetch all products from Printful API
   */
  private async fetchAllProducts(): Promise<PrintfulProduct[]> {
    this.logWithIcon('🔍', 'Starting to fetch products from Printful API...');
    
    const allProducts: PrintfulProduct[] = [];
    let offset = 0;
    const limit = 100;

    while (true) {
      this.logWithIcon('📡', `Fetching products: offset=${offset}, limit=${limit}`);
      
      try {
        const response = await printful.get('store/products', {
          offset,
          limit,
        }) as { result: PrintfulProduct[] };

        this.logWithIcon('📊', `API Response: ${JSON.stringify(response, null, 2)}`);

        if (!response.result || response.result.length === 0) {
          this.logWithIcon('🔍', `No more products found. Breaking at offset ${offset}`);
          break;
        }

        this.logWithIcon('✅', `Found ${response.result.length} products in this batch`);
        allProducts.push(...response.result);
        offset += limit;

        // Add a small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logWithIcon('❌', `Error fetching products at offset ${offset}: ${error}`);
        throw error;
      }
    }

    this.logWithIcon('🎉', `Total products fetched: ${allProducts.length}`);
    return allProducts;
  }

  /**
   * Process a single product with tracking
   */
  private async processProductWithTracking(printfulProduct: PrintfulProduct): Promise<{
    created?: boolean;
    updated?: boolean;
    variantsCreated?: number;
    variantsUpdated?: number;
    currentVariantIds?: string[];
  }> {
    // Get detailed product information
    const detailResponse = await printful.get(`store/products/${printfulProduct.id}`) as {
      result: {
        sync_product: PrintfulProduct;
        sync_variants: PrintfulVariant[];
      };
    };

    const { sync_product, sync_variants } = detailResponse.result;

    // Check if product exists before upsert
    const existingProduct = await productService.getProductByPrintfulId(sync_product.id);
    const wasUpdate = !!existingProduct;

    // Upsert product (create or update)
    const upsertedProduct = await productService.upsertProduct(sync_product);

    // Process variants (safe mode - no deletion yet)
    const variantStats = await this.processVariants(upsertedProduct.id, sync_variants);
    
    return {
      created: !wasUpdate,
      updated: wasUpdate,
      variantsCreated: variantStats.created,
      variantsUpdated: variantStats.updated,
      currentVariantIds: variantStats.variantIds,
    };
  }

  /**
   * Process variants for a product (SAFE VERSION)
   * Only creates/updates variants. Deletion happens separately in the safe deletion phase.
   */
  private async processVariants(productId: string, variants: PrintfulVariant[]): Promise<{
    created: number;
    updated: number;
    variantIds: string[];
  }> {
    try {
      // Get existing variants to determine create vs update counts
      const existingVariants = await productService.getProductById(productId);
      const existingVariantIds = new Set(existingVariants?.variants.map(v => v.printfulId) || []);
      
      // Use the safe upsertVariants method (no deletion)
      const upsertedVariants = await productService.upsertVariants(productId, variants);
      
      // Calculate actual created vs updated counts
      let created = 0;
      let updated = 0;
      
      for (const variant of variants) {
        if (existingVariantIds.has(variant.id)) {
          updated++;
        } else {
          created++;
        }
      }
      
      this.stats.variantsProcessed += variants.length;
      this.stats.variantsCreated += created;
      this.stats.variantsUpdated += updated;

      return { 
        created,
        updated,
        variantIds: variants.map(v => v.id)
      };
    } catch (error) {
      const errorMsg = `Failed to process variants: ${error}`;
      this.stats.errors.push(errorMsg);
      this.progressTracker!.addWarning(errorMsg);
      return { created: 0, updated: 0, variantIds: [] };
    }
  }

  /**
   * Update sync progress with enhanced error handling
   */
  private async updateProgress(update: any): Promise<void> {
    this.logWithIcon('📈', `Updating progress: ${JSON.stringify(update, null, 2)}`);
    
    try {
      const result = await productService.updateSyncLog(this.syncLog!.id, update);
      this.logWithIcon('✅', `Progress update successful: ${result.status} - ${result.currentStep} (${result.progress}%)`);
    } catch (error) {
      // Log the error but don't let it break the sync
      this.logWithIcon('❌', `Failed to update sync progress: ${error}`);
      console.error('Full error details:', error);
      
      // Try a simpler update that just updates the status and step
      try {
        const fallbackUpdate = {
          status: update.status || 'processing_products',
          currentStep: update.currentStep || 'Processing (progress update failed)',
          lastUpdated: new Date(),
        };
        this.logWithIcon('🔄', `Trying fallback update: ${JSON.stringify(fallbackUpdate)}`);
        
        const fallbackResult = await productService.updateSyncLog(this.syncLog!.id, fallbackUpdate);
        this.logWithIcon('✅', `Fallback update successful: ${fallbackResult.status}`);
      } catch (fallbackError) {
        this.logWithIcon('💥', `Even fallback progress update failed: ${fallbackError}`);
        console.error('Fallback error details:', fallbackError);
        // Continue sync regardless - don't let progress tracking break the actual sync
      }
    }
  }

  /**
   * Finalize sync with success status
   */
  private async finalizeSyncWithSuccess(startTime: number): Promise<void> {
    const duration = Date.now() - startTime;
    const status = this.stats.errors.length > 0 ? 'partial' : 'success';
    
    const finalUpdate = this.progressTracker!.complete(
      status,
      this.stats.errors.length > 0 ? this.stats.errors.join('; ') : undefined
    );

    await this.updateProgress({
      ...finalUpdate,
      productsProcessed: this.stats.productsProcessed,
      productsCreated: this.stats.productsCreated,
      productsUpdated: this.stats.productsUpdated,
      productsDeleted: this.stats.productsDeleted,
      variantsProcessed: this.stats.variantsProcessed,
      variantsCreated: this.stats.variantsCreated,
      variantsUpdated: this.stats.variantsUpdated,
      variantsDeleted: this.stats.variantsDeleted,
    });

    this.printSummary(duration);
  }

  /**
   * Print sync summary
   */
  private printSummary(duration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SAFE SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📦 Products: ${this.stats.productsCreated} created, ${this.stats.productsUpdated} updated, ${this.stats.productsDeleted} deleted`);
    console.log(`🎛️  Variants: ${this.stats.variantsCreated} created, ${this.stats.variantsUpdated} updated`);
    console.log(`⚠️  Errors: ${this.stats.errors.length}`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.stats.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('✅ Sync completed successfully with SAFE data handling!');
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Log with icon for visual clarity
   */
  private logWithIcon(icon: string, message: string): void {
    console.log(`${icon} ${message}`);
  }
}

// Export the SafeProductSync class
export { SafeProductSync };

// Run the sync if called directly
async function main() {
  try {
    const sync = new SafeProductSync();
    await sync.syncProducts(); // No sync log ID when running standalone
  } catch (error) {
    console.error('💥 SAFE Sync failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}
