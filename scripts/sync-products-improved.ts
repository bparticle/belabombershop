#!/usr/bin/env tsx

/**
 * IMPROVED PRODUCT SYNC SCRIPT
 * 
 * This improved version addresses all known sync issues:
 * 1. Prevents hanging with timeouts and circuit breakers
 * 2. Implements robust error recovery
 * 3. Optimized for serverless environments (Netlify)
 * 4. Better progress tracking and user feedback
 * 5. Graceful degradation on failures
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

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
}

interface SyncOptions {
  maxProducts?: number;
  timeoutMs?: number;
  retryAttempts?: number;
  batchSize?: number;
}

/**
 * Circuit Breaker for API calls
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold = 5,
    private timeoutMs = 60000,
    private resetTimeMs = 300000 // 5 minutes
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeMs) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeoutMs)
        )
      ]);
      
      if (this.state === 'half-open') {
        this.reset();
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Improved ProductSync class with robust error handling
 */
class ImprovedProductSync {
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
    warnings: [],
  };

  private progressTracker: SyncProgressTracker | null = null;
  private syncLog: SyncLog | null = null;
  private circuitBreaker = new CircuitBreaker(3, 30000, 120000); // More aggressive settings
  private isServerless = process.env.NETLIFY === 'true' || process.env.VERCEL === '1';

  constructor(private options: SyncOptions = {}) {
    // Default options optimized for serverless
    this.options = {
      maxProducts: this.isServerless ? 50 : 200, // Limit products in serverless
      timeoutMs: this.isServerless ? 8 * 60 * 1000 : 15 * 60 * 1000, // 8min for serverless, 15min local
      retryAttempts: 2,
      batchSize: this.isServerless ? 5 : 10,
      ...options
    };
  }

  /**
   * Main sync function with comprehensive error handling
   */
  async syncProducts(existingSyncLogId?: string): Promise<void> {
    const startTime = Date.now();
    this.logWithIcon('🚀', `Starting IMPROVED product sync (${this.isServerless ? 'serverless' : 'local'} mode)...`);
    
    // Debug environment information
    this.logWithIcon('🔧', `Environment: ${process.env.NODE_ENV || 'undefined'}`);
    this.logWithIcon('🔧', `Serverless: ${this.isServerless}`);
    this.logWithIcon('🔧', `Timeout: ${this.options.timeoutMs}ms`);
    this.logWithIcon('🔧', `Max Products: ${this.options.maxProducts}`);

    // Set up overall timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Sync timeout after ${this.options.timeoutMs}ms`));
      }, this.options.timeoutMs);
    });

    try {
      // Race against timeout
      await Promise.race([
        this.executeSyncWithRecovery(existingSyncLogId, startTime),
        timeoutPromise
      ]);
    } catch (error) {
      this.logWithIcon('💥', `Sync failed: ${error}`);
      await this.handleSyncFailure(error, startTime);
      throw error;
    }
  }

  private async executeSyncWithRecovery(existingSyncLogId?: string, startTime?: number): Promise<void> {
    // Initialize sync log
    await this.initializeSyncLog(existingSyncLogId);

    try {
      // Phase 1: Quick environment check
      await this.updateProgress({
        status: 'queued',
        currentStep: 'Checking environment and connections...',
        progress: 1,
      });

      await this.performEnvironmentCheck();

      // Phase 2: Fetch products with circuit breaker
      await this.updateProgress({
        status: 'fetching_products',
        currentStep: 'Fetching products from Printful API...',
        progress: 5,
      });

      const printfulProducts = await this.fetchProductsWithRecovery();
      this.logWithIcon('📦', `Found ${printfulProducts.length} products from Printful`);

      // Phase 3: Initialize progress tracker
      const initUpdate = this.progressTracker!.initialize(printfulProducts.length);
      await this.updateProgress(initUpdate);

      // Phase 4: Process products in batches
      await this.updateProgress({
        status: 'processing_products',
        currentStep: `Processing ${printfulProducts.length} products in batches...`,
        progress: 15,
      });

      await this.processProductsInBatches(printfulProducts);

      // Phase 5: Cleanup (only if time allows)
      if (this.shouldPerformCleanup(startTime || Date.now())) {
        await this.performSafeCleanup(printfulProducts);
      } else {
        this.stats.warnings.push('Skipped cleanup due to time constraints');
      }

      // Phase 6: Finalize
      await this.finalizeSyncWithSuccess(startTime || Date.now());

    } catch (error) {
      // Don't re-throw here, let the outer catch handle it
      await this.handleSyncFailure(error, startTime || Date.now());
      throw error;
    }
  }

  private async initializeSyncLog(existingSyncLogId?: string): Promise<void> {
    if (existingSyncLogId) {
      this.syncLog = await productService.getSyncLogById(existingSyncLogId);
      if (!this.syncLog) {
        throw new Error(`Sync log with ID ${existingSyncLogId} not found`);
      }
      this.logWithIcon('🔄', `Using existing sync log: ${existingSyncLogId}`);
    } else {
      this.syncLog = await productService.createSyncLog({
        operation: 'improved_sync',
        status: 'queued',
        currentStep: 'Initializing improved sync process',
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
  }

  private async performEnvironmentCheck(): Promise<void> {
    this.logWithIcon('🔍', 'Performing environment check...');
    
    // Quick database connectivity check
    try {
      await productService.getAllProductsForAdmin();
      this.logWithIcon('✅', 'Database connection: OK');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }

    // Quick Printful API check
    try {
      await this.circuitBreaker.execute(async () => {
        const response = await printful.get('store/products', { offset: 0, limit: 1 }) as any;
        return response;
      });
      this.logWithIcon('✅', 'Printful API connection: OK');
    } catch (error) {
      throw new Error(`Printful API connection failed: ${error}`);
    }
  }

  private async fetchProductsWithRecovery(): Promise<PrintfulProduct[]> {
    let retryCount = 0;
    const maxRetries = this.options.retryAttempts || 2;

    while (retryCount <= maxRetries) {
      try {
        return await this.circuitBreaker.execute(async () => {
          return await this.fetchAllProductsOptimized();
        });
      } catch (error) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw new Error(`Failed to fetch products after ${maxRetries} retries: ${error}`);
        }
        
        this.logWithIcon('⚠️', `Fetch attempt ${retryCount} failed, retrying in 2s...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error('Should not reach here');
  }

  private async fetchAllProductsOptimized(): Promise<PrintfulProduct[]> {
    this.logWithIcon('🔍', 'Fetching products from Printful API...');
    
    const allProducts: PrintfulProduct[] = [];
    let offset = 0;
    const limit = 20; // Smaller batches for reliability
    const maxProducts = this.options.maxProducts || 200;

    while (allProducts.length < maxProducts) {
      this.logWithIcon('📡', `Fetching products: offset=${offset}, limit=${limit}`);
      
      const response = await printful.get('store/products', {
        offset,
        limit,
      }) as { result: any[] };

      if (!response.result || response.result.length === 0) {
        this.logWithIcon('🔍', `No more products found. Breaking at offset ${offset}`);
        break;
      }

      // Process each product to get variants
      for (const basicProduct of response.result) {
        if (allProducts.length >= maxProducts) break;

        try {
          const productResponse = await printful.get(`store/products/${basicProduct.id}`) as any;
          const fullProduct = productResponse.result;

          const printfulProduct: PrintfulProduct = {
            id: fullProduct.sync_product.id,
            external_id: fullProduct.sync_product.external_id,
            name: fullProduct.sync_product.name,
            thumbnail_url: fullProduct.sync_product.thumbnail_url,
            is_ignored: fullProduct.sync_product.is_ignored,
            variants: fullProduct.sync_variants || []
          };

          allProducts.push(printfulProduct);
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 50));
          
        } catch (error) {
          this.stats.warnings.push(`Failed to fetch details for product ${basicProduct.name}: ${error}`);
          this.logWithIcon('⚠️', `Skipped product ${basicProduct.name} due to error`);
        }
      }

      offset += limit;
      
      // Update progress during fetch
      const fetchProgress = 5 + Math.round((allProducts.length / maxProducts) * 10); // Progress 5-15%
      await this.updateProgress({
        status: 'fetching_products',
        currentStep: `Fetched ${allProducts.length} products...`,
        progress: fetchProgress,
      });
    }

    this.logWithIcon('🎉', `Total products fetched: ${allProducts.length}`);
    return allProducts;
  }

  private async processProductsInBatches(printfulProducts: PrintfulProduct[]): Promise<void> {
    const batchSize = this.options.batchSize || 5;
    const totalBatches = Math.ceil(printfulProducts.length / batchSize);

    this.logWithIcon('📦', `Processing ${printfulProducts.length} products in ${totalBatches} batches of ${batchSize}`);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, printfulProducts.length);
      const batch = printfulProducts.slice(startIndex, endIndex);

      this.logWithIcon('🔄', `Processing batch ${batchIndex + 1}/${totalBatches} (products ${startIndex + 1}-${endIndex})`);

      // Process batch with timeout per batch
      await Promise.race([
        this.processBatch(batch, startIndex),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Batch timeout')), 60000) // 1 minute per batch
        )
      ]);

      // Update overall progress
      const progress = 15 + Math.round((endIndex / printfulProducts.length) * 70); // Progress 15-85%
      await this.updateProgress({
        status: 'processing_products',
        currentStep: `Processed ${endIndex}/${printfulProducts.length} products`,
        progress,
      });

      // Brief pause between batches to avoid overwhelming the system
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async processBatch(batch: PrintfulProduct[], startIndex: number): Promise<void> {
    for (let i = 0; i < batch.length; i++) {
      const product = batch[i];
      const globalIndex = startIndex + i;
      
      try {
        // Update progress for current product
        const startUpdate = this.progressTracker!.startProduct(globalIndex, product.name);
        await this.updateProgress(startUpdate);

        // Process the product with retry logic
        const result = await this.processProductWithRetry(product);
        
        // Update statistics
        this.updateStats(result);
        
        // Complete product in tracker
        const completeUpdate = this.progressTracker!.completeProduct(result);
        await this.updateProgress(completeUpdate);
        
        this.logWithIcon('✅', `Processed: ${product.name} (${globalIndex + 1})`);
        
      } catch (error) {
        const errorMsg = `Failed to process product ${product.name}: ${error}`;
        this.stats.errors.push(errorMsg);
        this.progressTracker!.addWarning(errorMsg);
        this.logWithIcon('❌', errorMsg);
      }
    }
  }

  private async processProductWithRetry(printfulProduct: PrintfulProduct): Promise<any> {
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        return await this.processProductWithTracking(printfulProduct);
      } catch (error) {
        retryCount++;
        if (retryCount > maxRetries) {
          throw error;
        }
        
        this.logWithIcon('⚠️', `Product processing attempt ${retryCount} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  private async processProductWithTracking(printfulProduct: PrintfulProduct): Promise<any> {
    // Check if product exists
    const existingProduct = await productService.getProductByPrintfulId(printfulProduct.id);
    const isNewProduct = !existingProduct;

    // Upsert product
    const product = await productService.upsertProduct(printfulProduct);
    
    const result = {
      created: isNewProduct,
      updated: !isNewProduct,
      variantsCreated: 0,
      variantsUpdated: 0,
    };

    // Process variants if they exist
    if (printfulProduct.variants && printfulProduct.variants.length > 0) {
      const existingVariants = existingProduct?.variants || [];
      const variantResults = await productService.upsertVariants(product.id, printfulProduct.variants);
      
      // Calculate variant statistics
      result.variantsCreated = variantResults.filter(v => 
        !existingVariants.find(ev => ev.printfulId === v.printfulId)
      ).length;
      result.variantsUpdated = variantResults.length - result.variantsCreated;
    }

    // Auto-categorize if new product
    if (isNewProduct) {
      try {
        await productService.autoCategorizeAndTagProduct(product);
      } catch (error) {
        this.stats.warnings.push(`Failed to auto-categorize product ${product.name}: ${error}`);
      }
    }

    return result;
  }

  private updateStats(result: any): void {
    if (result.created) this.stats.productsCreated++;
    if (result.updated) this.stats.productsUpdated++;
    this.stats.productsProcessed++;
    this.stats.variantsCreated += result.variantsCreated || 0;
    this.stats.variantsUpdated += result.variantsUpdated || 0;
    this.stats.variantsProcessed += (result.variantsCreated || 0) + (result.variantsUpdated || 0);
  }

  private shouldPerformCleanup(startTime: number): boolean {
    const elapsed = Date.now() - startTime;
    const remainingTime = (this.options.timeoutMs || 0) - elapsed;
    return remainingTime > 30000; // Only cleanup if we have 30+ seconds left
  }

  private async performSafeCleanup(printfulProducts: PrintfulProduct[]): Promise<void> {
    await this.updateProgress({
      currentStep: 'Performing safe cleanup of obsolete data...',
      progress: 90,
    });

    try {
      // Quick cleanup of obsolete products
      const existingProducts = await productService.getAllProductsForAdmin();
      const incomingIds = new Set(printfulProducts.map(p => p.id));
      const toDelete = existingProducts.filter(p => !incomingIds.has(p.printfulId)).slice(0, 10); // Limit deletions

      for (const product of toDelete) {
        try {
          await productService.deleteProduct(product.id);
          this.stats.productsDeleted++;
        } catch (error) {
          this.stats.warnings.push(`Failed to delete obsolete product ${product.name}: ${error}`);
        }
      }

      this.logWithIcon('🧹', `Cleaned up ${toDelete.length} obsolete products`);
    } catch (error) {
      this.stats.warnings.push(`Cleanup phase failed: ${error}`);
      this.logWithIcon('⚠️', 'Cleanup failed but sync can continue');
    }
  }

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
      duration,
      completedAt: new Date(),
    });

    this.printSummary(duration);
  }

  private async handleSyncFailure(error: unknown, startTime: number): Promise<void> {
    const duration = Date.now() - startTime;
    
    await this.updateProgress({
      status: 'error',
      currentStep: 'Sync failed with error',
      errorMessage: error instanceof Error ? error.message : String(error),
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

    this.printSummary(duration);
  }

  private async updateProgress(update: any): Promise<void> {
    if (!this.syncLog) return;

    try {
      await productService.updateSyncLog(this.syncLog.id, {
        ...update,
        lastUpdated: new Date(),
      });
    } catch (error) {
      // Don't let progress updates break the sync
      this.logWithIcon('⚠️', `Failed to update progress: ${error}`);
    }
  }

  private printSummary(duration: number): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPROVED SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🏗️  Environment: ${this.isServerless ? 'Serverless' : 'Local'}`);
    console.log(`🔄 Circuit Breaker: ${this.circuitBreaker.getState()}`);
    console.log(`📦 Products: ${this.stats.productsCreated} created, ${this.stats.productsUpdated} updated, ${this.stats.productsDeleted} deleted`);
    console.log(`🎛️  Variants: ${this.stats.variantsCreated} created, ${this.stats.variantsUpdated} updated`);
    console.log(`⚠️  Warnings: ${this.stats.warnings.length}`);
    console.log(`❌ Errors: ${this.stats.errors.length}`);
    
    if (this.stats.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.stats.warnings.slice(0, 3).forEach(warning => console.log(`   - ${warning}`));
      if (this.stats.warnings.length > 3) {
        console.log(`   ... and ${this.stats.warnings.length - 3} more warnings`);
      }
    }
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.stats.errors.slice(0, 3).forEach(error => console.log(`   - ${error}`));
      if (this.stats.errors.length > 3) {
        console.log(`   ... and ${this.stats.errors.length - 3} more errors`);
      }
    } else {
      console.log('✅ Improved sync completed successfully!');
    }
    console.log('='.repeat(60) + '\n');
  }

  private logWithIcon(icon: string, message: string): void {
    console.log(`${icon} ${message}`);
  }
}

// Export the improved sync class
export { ImprovedProductSync };

// Run the sync if called directly
async function main() {
  try {
    const sync = new ImprovedProductSync({
      maxProducts: 100, // Limit for testing
      timeoutMs: 10 * 60 * 1000, // 10 minutes
      retryAttempts: 2,
      batchSize: 5
    });
    await sync.syncProducts();
  } catch (error) {
    console.error('💥 Improved Sync failed:', error);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}
