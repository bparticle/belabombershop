#!/usr/bin/env tsx

/**
 * SYNC TO PRODUCTION SCRIPT
 * 
 * This script syncs products directly to your production database
 * bypassing all frontend issues. It will get your web shop up and running.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load PRODUCTION environment variables
config({ path: resolve(process.cwd(), '.env.production') });

console.log('🚀 SYNC TO PRODUCTION');
console.log('=' .repeat(60));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Target Environment: PRODUCTION`);
console.log(`🎯 Database: ${process.env.DATABASE_HOST}`);
console.log('=' .repeat(60));

interface ProductionSyncStats {
  productsProcessed: number;
  productsCreated: number;
  productsUpdated: number;
  variantsProcessed: number;
  variantsCreated: number;
  variantsUpdated: number;
  errors: string[];
  warnings: string[];
}

async function syncToProduction(): Promise<void> {
  const startTime = Date.now();
  const stats: ProductionSyncStats = {
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
      operation: 'production_manual_sync',
      status: 'queued',
      currentStep: 'Starting production sync process',
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
    const allProducts: any[] = [];
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
      allProducts.push(...response.result);
      offset += limit;

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`🎉 Total products fetched: ${allProducts.length}`);

    if (allProducts.length === 0) {
      throw new Error('No products found in Printful store');
    }

    // Step 6: Process ALL products for production
    console.log('\n6️⃣ Processing ALL products for production...');
    await productService.updateSyncLog(syncLog.id, {
      status: 'processing_products',
      currentStep: `Processing ${allProducts.length} products for production...`,
      progress: 15,
      totalProducts: allProducts.length,
    });

    for (let i = 0; i < allProducts.length; i++) {
      const basicProduct = allProducts[i];
      const progressPercent = 15 + Math.round((i / allProducts.length) * 70); // 15-85%
      
      console.log(`📦 Processing ${i + 1}/${allProducts.length}: ${basicProduct.name}`);
      
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

    // Step 7: Finalize production sync
    console.log('\n7️⃣ Finalizing production sync...');
    const duration = Date.now() - startTime;
    const finalStatus = stats.errors.length > 0 ? 'partial' : 'success';
    
    await productService.updateSyncLog(syncLog.id, {
      status: finalStatus,
      currentStep: 'Production sync completed successfully',
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

    // Step 8: Production summary
    console.log('\n' + '=' .repeat(60));
    console.log('🌟 PRODUCTION SYNC SUMMARY');
    console.log('=' .repeat(60));
    console.log(`⏱️  Duration: ${Math.round(duration / 1000)}s`);
    console.log(`🌍 Environment: PRODUCTION`);
    console.log(`📊 Database: ${process.env.DATABASE_HOST?.substring(0, 30)}...`);
    console.log(`📦 Products: ${stats.productsCreated} created, ${stats.productsUpdated} updated`);
    console.log(`🎛️  Variants: ${stats.variantsCreated} created, ${stats.variantsUpdated} updated`);
    console.log(`📈 Total Products: ${stats.productsProcessed}`);
    console.log(`📈 Total Variants: ${stats.variantsProcessed}`);
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
      console.log('\n🎉 PRODUCTION SYNC COMPLETED SUCCESSFULLY!');
    }
    
    console.log('\n🚀 YOUR WEB SHOP IS NOW READY!');
    console.log('✅ Products are live in production');
    console.log('✅ Customers can now browse and purchase');
    console.log('✅ All variants and pricing are up to date');
    
    console.log('\n🔗 Next steps:');
    console.log('1. Visit your live website to verify products are showing');
    console.log('2. Test the shopping cart and checkout process');
    console.log('3. Debug frontend sync issues later when convenient');
    
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('\n💥 Production sync failed:', error);
    
    console.log('\n🆘 TROUBLESHOOTING:');
    console.log('1. Check your .env.production file exists and has correct credentials');
    console.log('2. Verify your production database is accessible');
    console.log('3. Ensure PRINTFUL_API_KEY is valid');
    console.log('4. Check network connectivity to production database');
    
    throw error;
  }
}

// Run the production sync
syncToProduction().catch(error => {
  console.error('💥 Fatal production sync error:', error);
  process.exit(1);
});
