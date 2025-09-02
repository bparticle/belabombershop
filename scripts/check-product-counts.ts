#!/usr/bin/env tsx

/**
 * PRODUCT COUNT CHECKER
 * 
 * This script quickly checks the product counts in both Printful and your database
 * to help verify synchronization status.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local';
config({ path: resolve(process.cwd(), envFile) });

console.log('🔍 PRODUCT COUNT CHECKER');
console.log('=' .repeat(50));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('=' .repeat(50));

async function checkProductCounts(): Promise<void> {
  try {
    // Import required modules
    const { PrintfulClient } = await import('printful-request');
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
    
    console.log('\n1️⃣ Checking Printful products...');
    
    // Fetch all products from Printful
    const allPrintfulProducts: any[] = [];
    let offset = 0;
    const limit = 20;

    while (true) {
      const response = await printful.get('store/products', { offset, limit }) as any;
      
      if (!response.result || response.result.length === 0) {
        break;
      }

      allPrintfulProducts.push(...response.result);
      offset += limit;
      
      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Printful products: ${allPrintfulProducts.length}`);
    
    // Get database products
    console.log('\n2️⃣ Checking database products...');
    const dbProducts = await productService.getAllProductsForAdmin();
    console.log(`✅ Database products: ${dbProducts.length}`);
    
    // Compare counts
    console.log('\n3️⃣ Comparison Results:');
    console.log('=' .repeat(30));
    
    if (dbProducts.length === allPrintfulProducts.length) {
      console.log('✅ COUNTS MATCH!');
      console.log(`   Both have ${dbProducts.length} products`);
    } else {
      console.log('⚠️  COUNT MISMATCH DETECTED!');
      console.log(`   Printful: ${allPrintfulProducts.length} products`);
      console.log(`   Database: ${dbProducts.length} products`);
      console.log(`   Difference: ${Math.abs(dbProducts.length - allPrintfulProducts.length)} products`);
    }
    
    // Show detailed breakdown
    console.log('\n4️⃣ Detailed Breakdown:');
    console.log('=' .repeat(30));
    
    const printfulIds = new Set(allPrintfulProducts.map(p => p.id.toString()));
    const dbIds = new Set(dbProducts.map(p => p.printfulId));
    
    // Products in Printful but not in DB
    const missingInDb = allPrintfulProducts.filter(p => !dbIds.has(p.id.toString()));
    if (missingInDb.length > 0) {
      console.log(`\n❌ Missing in database (${missingInDb.length}):`);
      missingInDb.forEach(p => console.log(`   - ${p.name} (ID: ${p.id})`));
    }
    
    // Products in DB but not in Printful
    const extraInDb = dbProducts.filter(p => !printfulIds.has(p.printfulId));
    if (extraInDb.length > 0) {
      console.log(`\n🗑️  Extra in database (${extraInDb.length}):`);
      extraInDb.forEach(p => console.log(`   - ${p.name} (Printful ID: ${p.printfulId})`));
    }
    
    // Products that exist in both
    const commonProducts = dbProducts.filter(p => printfulIds.has(p.printfulId));
    if (commonProducts.length > 0) {
      console.log(`\n✅ Common products (${commonProducts.length}):`);
      console.log('   (These are properly synchronized)');
    }
    
    // Summary
    console.log('\n5️⃣ Summary:');
    console.log('=' .repeat(30));
    console.log(`📊 Total Printful products: ${allPrintfulProducts.length}`);
    console.log(`📊 Total Database products: ${dbProducts.length}`);
    console.log(`✅ Synchronized: ${commonProducts.length}`);
    console.log(`❌ Missing in DB: ${missingInDb.length}`);
    console.log(`🗑️  Extra in DB: ${extraInDb.length}`);
    
    if (missingInDb.length > 0 || extraInDb.length > 0) {
      console.log('\n💡 Recommendation:');
      console.log('   Run a complete synchronization to fix the mismatches:');
      console.log('   - npm run sync:complete:dry (to see what would change)');
      console.log('   - npm run sync:complete (to apply changes)');
    } else {
      console.log('\n🎉 All products are properly synchronized!');
    }
    
  } catch (error) {
    console.error('\n💥 Error checking product counts:', error);
    throw error;
  }
}

// Run the check
checkProductCounts().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
