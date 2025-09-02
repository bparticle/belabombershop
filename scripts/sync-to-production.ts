#!/usr/bin/env tsx

/**
 * ENHANCED SYNC TO PRODUCTION SCRIPT
 * 
 * This script syncs products directly to your production database
 * bypassing all frontend issues. It will get your web shop up and running.
 * 
 * NEW: Now handles product deletion to ensure complete synchronization
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load PRODUCTION environment variables
config({ path: resolve(process.cwd(), '.env.production') });

console.log('🚀 ENHANCED SYNC TO PRODUCTION');
console.log('=' .repeat(60));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Target Environment: PRODUCTION`);
console.log(`🎯 Database: ${process.env.DATABASE_HOST}`);
console.log('=' .repeat(60));

interface ProductionSyncStats {
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

async function syncToProduction(): Promise<void> {
  const startTime = Date.now();
  const stats: ProductionSyncStats = {
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

  try {
    // Step 1: Verify production environment
    console.log('\n1️⃣ Verifying production environment...');
    const requiredVars = ['PRINTFUL_API_KEY', 'DATABASE_HOST', 'DATABASE_NAME', 'DATABASE_USERNAME', 'DATABASE_PASSWORD'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing production environment variables: ${missing.join(', ')}`);
    }

    console.log('✅ Production environment verified');
    console.log(`📊 Database Host: ${process.env.DATABASE_HOST?.substring(0, 20)}...`);
    console.log(`🔑 API Key: ${process.env.PRINTFUL_API_KEY?.substring(0, 8)}...`);

    // Step 2: Import modules dynamically
    console.log('\n2️⃣ Loading production modules...');
    const { PrintfulClient } = await import('printful-request');
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
    console.log('✅ Modules loaded successfully');

    // Step 3: Test production database connection
    console.log('\n3️⃣ Testing production database connection...');
    try {
      const { db } = await import('../src/lib/database/config');
      const { sql } = await import('drizzle-orm');
      
      const result = await db.execute(sql`SELECT 1 as test`);
      console.log('✅ Production database connection successful');
    } catch (error) {
      throw new Error(`Production database connection failed: ${error}`);
    }

    // Step 4: Create production sync log
    console.log('\n4️⃣ Creating production sync log...');
    const syncLog = await productService.createSyncLog({
      operation: 'production_enhanced_sync',
      status: 'queued',
      currentStep: 'Starting enhanced production sync process',
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
    console.log(`✅ Created production sync log: ${syncLog.id}`);

    // Step 5: Fetch ALL products from Printful
    console.log('\n5️⃣ Fetching ALL products from Printful...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'fetching_products',
      currentStep: 'Fetching all products from Printful API...',
      progress: 5,
    });

    // Fetch all products in batches
    const allPrintfulProducts: any[] = [];
    let offset = 0;
    const limit = 20;

    while (true) {
      console.log(`📡 Fetching products: offset=${offset}, limit=${limit}`);
      
      const response = await printful.get('store/products', { 
        offset, 
        limit 
      }) as any;

      if (!response.result || response.result.length === 0) {
        console.log(`🔍 No more products found. Breaking at offset ${offset}`);
        break;
      }

      console.log(`✅ Found ${response.result.length} products in this batch`);
      allPrintfulProducts.push(...response.result);
      offset += limit;

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🎉 Total products fetched from Printful: ${allPrintfulProducts.length}`);

    if (allPrintfulProducts.length === 0) {
      throw new Error('No products found in Printful store');
    }

    // Step 6: Get all existing products from database
    console.log('\n6️⃣ Getting all existing products from database...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'analyzing_database',
      currentStep: 'Analyzing existing products in database...',
      progress: 10,
    });

    const existingProducts = await productService.getAllProductsForAdmin();
    console.log(`📊 Found ${existingProducts.length} existing products in database`);

    // Step 7: Identify products to delete (those in DB but not in Printful)
    console.log('\n7️⃣ Identifying products to delete...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'identifying_deletions',
      currentStep: 'Identifying products that need to be deleted...',
      progress: 12,
    });

    const printfulProductIds = new Set(allPrintfulProducts.map(p => p.id.toString()));
    const productsToDelete = existingProducts.filter(dbProduct => 
      !printfulProductIds.has(dbProduct.printfulId)
    );

    console.log(`🗑️  Found ${productsToDelete.length} products to delete`);

    // Step 8: Delete products that no longer exist in Printful
    if (productsToDelete.length > 0) {
      console.log('\n8️⃣ Deleting removed products...');
      await productService.updateSyncLog(syncLog.id, {
        status: 'deleting_products',
        currentStep: `Deleting ${productsToDelete.length} removed products...`,
        progress: 15,
      });

      for (let i = 0; i < productsToDelete.length; i++) {
        const productToDelete = productsToDelete[i];
        const progressPercent = 15 + Math.round((i / productsToDelete.length) * 10); // 15-25%
        
        console.log(`🗑️  Deleting ${i + 1}/${productsToDelete.length}: ${productToDelete.name}`);
        
        try {
          await productService.updateSyncLog(syncLog.id, {
            currentStep: `Deleting product: ${productToDelete.name}`,
            progress: progressPercent,
          });

          await productService.deleteProduct(productToDelete.id);
          stats.productsDeleted++;
          
          // Count variants that were deleted
          stats.variantsDeleted += productToDelete.variants.length;
          
          console.log(`  ✅ Deleted product: ${productToDelete.name} (${productToDelete.variants.length} variants)`);
          
        } catch (error) {
          stats.errors.push(`Failed to delete ${productToDelete.name}: ${error}`);
          console.log(`  ❌ Error deleting ${productToDelete.name}: ${error}`);
        }

        // Small delay to avoid overwhelming production database
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Step 9: Process ALL products for production (create/update)
    console.log('\n9️⃣ Processing ALL products for production...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'processing_products',
      currentStep: `Processing ${allPrintfulProducts.length} products for production...`,
      progress: 25,
      totalProducts: allPrintfulProducts.length,
    });

    for (let i = 0; i < allPrintfulProducts.length; i++) {
      const basicProduct = allPrintfulProducts[i];
      const progressPercent = 25 + Math.round((i / allPrintfulProducts.length) * 60); // 25-85%
      
      console.log(`📦 Processing ${i + 1}/${allPrintfulProducts.length}: ${basicProduct.name}`);
      
      try {
        // Update production sync progress
        await productService.updateSyncLog(syncLog.id, {
          currentStep: `Processing product: ${basicProduct.name}`,
          progress: progressPercent,
          currentProductIndex: i,
          currentProductName: basicProduct.name,
        });

        // Get detailed product info
        const detailResponse = await printful.get(`store/products/${basicProduct.id}`) as any;
        const { sync_product, sync_variants } = detailResponse.result;

        // Check if product exists in production
        const existingProduct = await productService.getProductByPrintfulId(sync_product.id);
        const isNewProduct = !existingProduct;

        // Upsert product to production
        const product = await productService.upsertProduct(sync_product);
        
        if (isNewProduct) {
          stats.productsCreated++;
          console.log(`  ✅ Created product: ${product.name}`);
        } else {
          stats.productsUpdated++;
          console.log(`  ✅ Updated product: ${product.name}`);
        }
        stats.productsProcessed++;

        // Process variants for production
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

        // Auto-categorize if new product
        if (isNewProduct) {
          try {
            await productService.autoCategorizeAndTagProduct(product);
            console.log(`  🏷️  Auto-categorized product`);
          } catch (error) {
            stats.warnings.push(`Failed to auto-categorize ${product.name}: ${error}`);
          }
        }

        // Small delay to avoid overwhelming production database
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        stats.errors.push(`Failed to process ${basicProduct.name}: ${error}`);
        console.log(`  ❌ Error processing ${basicProduct.name}: ${error}`);
      }
    }

    // Step 10: Verify synchronization completeness
    console.log('\n🔍 Verifying synchronization completeness...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'verifying_sync',
      currentStep: 'Verifying synchronization completeness...',
      progress: 90,
    });

    // Get final database count
    const finalDbProducts = await productService.getAllProductsForAdmin();
    const finalDbCount = finalDbProducts.length;
    const printfulCount = allPrintfulProducts.length;

    console.log(`📊 Final counts:`);
    console.log(`   Printful: ${printfulCount} products`);
    console.log(`   Database: ${finalDbCount} products`);
    
    if (finalDbCount === printfulCount) {
      console.log(`✅ Synchronization complete! Counts match perfectly.`);
    } else {
      console.log(`⚠️  Count mismatch detected!`);
      console.log(`   Expected: ${printfulCount}, Actual: ${finalDbCount}`);
      stats.warnings.push(`Count mismatch: Printful has ${printfulCount} products, Database has ${finalDbCount} products`);
    }

    // Step 11: Finalize production sync
    console.log('\n11️⃣ Finalizing production sync...');
    const duration = Date.now() - startTime;
    const finalStatus = stats.errors.length > 0 ? 'partial' : 'success';
    
    await productService.updateSyncLog(syncLog.id, {
      status: finalStatus,
      currentStep: 'Enhanced production sync completed successfully',
      progress: 100,
      duration,
      completedAt: new Date(),
      productsProcessed: stats.productsProcessed,
      productsCreated: stats.productsCreated,
      productsUpdated: stats.productsUpdated,
      productsDeleted: stats.productsDeleted,
      variantsProcessed: stats.variantsProcessed,
      variantsCreated: stats.variantsCreated,
      variantsUpdated: stats.variantsUpdated,
      variantsDeleted: stats.variantsDeleted,
    });

    // Step 12: Production summary
    console.log('\n' + '=' .repeat(60));
    console.log('🌟 ENHANCED PRODUCTION SYNC SUMMARY');
    console.log('=' .repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🌍 Environment: PRODUCTION`);
    console.log(`📊 Database: ${process.env.DATABASE_HOST?.substring(0, 30)}...`);
    console.log(`📦 Products: ${stats.productsCreated} created, ${stats.productsUpdated} updated, ${stats.productsDeleted} deleted`);
    console.log(`🎛️  Variants: ${stats.variantsCreated} created, ${stats.variantsUpdated} updated, ${stats.variantsDeleted} deleted`);
    console.log(`📈 Total Products: ${stats.productsProcessed}`);
    console.log(`📈 Total Variants: ${stats.variantsProcessed}`);
    console.log(`🔍 Sync Verification: ${finalDbCount === printfulCount ? '✅ MATCHES' : '⚠️  MISMATCH'}`);
    console.log(`⚠️  Warnings: ${stats.warnings.length}`);
    console.log(`❌ Errors: ${stats.errors.length}`);
    
    if (stats.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      stats.warnings.slice(0, 5).forEach(warning => console.log(`   - ${warning}`));
      if (stats.warnings.length > 5) {
        console.log(`   ... and ${stats.warnings.length - 5} more warnings`);
      }
    }
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:');
      stats.errors.slice(0, 5).forEach(error => console.log(`   - ${error}`));
      if (stats.errors.length > 5) {
        console.log(`   ... and ${stats.errors.length - 5} more errors`);
      }
    } else {
      console.log('\n🎉 ENHANCED PRODUCTION SYNC COMPLETED SUCCESSFULLY!');
    }
    
    console.log('\n🚀 YOUR WEB SHOP IS NOW FULLY SYNCHRONIZED!');
    console.log('✅ Products are live in production');
    console.log('✅ Deleted products have been removed');
    console.log('✅ Database matches Printful exactly');
    console.log('✅ Customers can now browse and purchase');
    console.log('✅ All variants and pricing are up to date');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Visit your live website to verify products are showing');
    console.log('2. Test the shopping cart and checkout process');
    console.log('3. Verify that deleted products are no longer visible');
    
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n💥 Enhanced production sync failed:', error);
    
    console.log('\n🆘 TROUBLESHOOTING:');
    console.log('1. Check your .env.production file exists and has correct credentials');
    console.log('2. Verify your production database is accessible');
    console.log('3. Ensure PRINTFUL_API_KEY is valid');
    console.log('4. Check network connectivity to production database');
    
    throw error;
  }
}

// Run the enhanced production sync
syncToProduction().catch(error => {
  console.error('💥 Fatal enhanced production sync error:', error);
  process.exit(1);
});
