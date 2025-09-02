#!/usr/bin/env tsx

/**
 * WORKING IMPROVED SYNC SCRIPT
 * 
 * This version properly loads environment variables and uses dynamic imports
 * to avoid the environment loading issues.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🚀 WORKING IMPROVED SYNC');
console.log('=' .repeat(50));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'undefined'}`);
console.log('=' .repeat(50));

interface SyncStats {
  productsProcessed: number;
  productsCreated: number;
  productsUpdated: number;
  variantsProcessed: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: string[];
  warnings: string[];
}

async function runImprovedSync(): Promise<void> {
  const startTime = Date.now();
  const stats: SyncStats = {
    productsProcessed: 0,
    productsCreated: 0,
    productsUpdated: 0,
    variantsProcessed: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Step 1: Test environment
    console.log('\n1️⃣ Testing environment...');
    const requiredVars = ['PRINTFUL_API_KEY', 'DATABASE_HOST'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`);
    }
    console.log('✅ Environment check passed');

    // Step 2: Import modules dynamically (after env is loaded)
    console.log('\n2️⃣ Loading modules...');
    const { PrintfulClient } = await import('printful-request');
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
    console.log('✅ Modules loaded successfully');

    // Step 3: Create sync log
    console.log('\n3️⃣ Creating sync log...');
    const syncLog = await productService.createSyncLog({
      operation: 'working_improved_sync',
      status: 'queued',
      currentStep: 'Starting improved sync process',
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
    console.log(`✅ Created sync log: ${syncLog.id}`);

    // Step 4: Fetch products from Printful
    console.log('\n4️⃣ Fetching products from Printful...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'fetching_products',
      currentStep: 'Fetching products from Printful API...',
      progress: 5,
    });

    const response = await printful.get('store/products', { 
      offset: 0, 
      limit: 20 // Smaller batch for testing
    }) as any;

    if (!response.result || response.result.length === 0) {
      throw new Error('No products found in Printful store');
    }

    console.log(`✅ Found ${response.result.length} products to process`);

    // Step 5: Process products one by one
    console.log('\n5️⃣ Processing products...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'processing_products',
      currentStep: 'Processing products...',
      progress: 15,
      totalProducts: response.result.length,
    });

    for (let i = 0; i < response.result.length; i++) {
      const basicProduct = response.result[i];
      const progressPercent = 15 + Math.round((i / response.result.length) * 70); // 15-85%
      
      console.log(`📦 Processing ${i + 1}/${response.result.length}: ${basicProduct.name}`);
      
      try {
        // Update progress
        await productService.updateSyncLog(syncLog.id, {
          currentStep: `Processing product: ${basicProduct.name}`,
          progress: progressPercent,
          currentProductIndex: i,
          currentProductName: basicProduct.name,
        });

        // Get detailed product info
        const detailResponse = await printful.get(`store/products/${basicProduct.id}`) as any;
        const { sync_product, sync_variants } = detailResponse.result;

        // Check if product exists
        const existingProduct = await productService.getProductByPrintfulId(sync_product.id);
        const isNewProduct = !existingProduct;

        // Upsert product
        const product = await productService.upsertProduct(sync_product);
        
        if (isNewProduct) {
          stats.productsCreated++;
          console.log(`  ✅ Created product: ${product.name}`);
        } else {
          stats.productsUpdated++;
          console.log(`  ✅ Updated product: ${product.name}`);
        }
        stats.productsProcessed++;

        // Process variants
        if (sync_variants && sync_variants.length > 0) {
          const variantResults = await productService.upsertVariants(product.id, sync_variants);
          stats.variantsProcessed += variantResults.length;
          
          // Count new vs updated variants
          const existingVariants = existingProduct?.variants || [];
          const newVariants = variantResults.filter(v => 
            !existingVariants.find(ev => ev.printfulId === v.printfulId)
          );
          
          stats.variantsCreated += newVariants.length;
          stats.variantsUpdated += variantResults.length - newVariants.length;
          
          console.log(`  📊 Processed ${variantResults.length} variants (${newVariants.length} new)`);
        }

        // Auto-categorize if new
        if (isNewProduct) {
          try {
            await productService.autoCategorizeAndTagProduct(product);
            console.log(`  🏷️  Auto-categorized product`);
          } catch (error) {
            stats.warnings.push(`Failed to auto-categorize ${product.name}: ${error}`);
          }
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        stats.errors.push(`Failed to process ${basicProduct.name}: ${error}`);
        console.log(`  ❌ Error processing ${basicProduct.name}: ${error}`);
      }
    }

    // Step 6: Finalize
    console.log('\n6️⃣ Finalizing sync...');
    const duration = Date.now() - startTime;
    const finalStatus = stats.errors.length > 0 ? 'partial' : 'success';
    
    await productService.updateSyncLog(syncLog.id, {
      status: finalStatus,
      currentStep: 'Sync completed successfully',
      progress: 100,
      duration,
      completedAt: new Date(),
      productsProcessed: stats.productsProcessed,
      productsCreated: stats.productsCreated,
      productsUpdated: stats.productsUpdated,
      variantsProcessed: stats.variantsProcessed,
      variantsCreated: stats.variantsCreated,
      variantsUpdated: stats.variantsUpdated,
    });

    // Print summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 SYNC SUMMARY');
    console.log('=' .repeat(50));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`📦 Products: ${stats.productsCreated} created, ${stats.productsUpdated} updated`);
    console.log(`🎛️  Variants: ${stats.variantsCreated} created, ${stats.variantsUpdated} updated`);
    console.log(`⚠️  Warnings: ${stats.warnings.length}`);
    console.log(`❌ Errors: ${stats.errors.length}`);
    
    if (stats.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      stats.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.forEach(error => console.log(`   - ${error}`));
    } else {
      console.log('\n✅ Sync completed successfully!');
    }
    
    console.log('=' .repeat(50));

  } catch (error) {
    console.error('\n💥 Sync failed:', error);
    throw error;
  }
}

// Run the sync
runImprovedSync().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
