#!/usr/bin/env tsx

/**
 * SIMPLE SYNC DIAGNOSTIC
 * 
 * A simplified diagnostic that loads environment variables properly
 * and tests the core sync functionality step by step.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
config({ path: resolve(process.cwd(), '.env.local') });

console.log('🔍 SIMPLE SYNC DIAGNOSTIC');
console.log('=' .repeat(50));
console.log(`📅 Started at: ${new Date().toISOString()}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'undefined'}`);
console.log('=' .repeat(50));

async function runDiagnostic() {
  let testsRun = 0;
  let testsPassed = 0;
  
  // Test 1: Environment Variables
  console.log('\n1️⃣ Testing Environment Variables...');
  try {
    const requiredVars = [
      'PRINTFUL_API_KEY', 'DATABASE_HOST', 'DATABASE_NAME', 
      'DATABASE_USERNAME', 'DATABASE_PASSWORD'
    ];
    
    const missing = requiredVars.filter(key => !process.env[key]);
    testsRun++;
    
    if (missing.length === 0) {
      console.log('✅ All required environment variables are present');
      testsPassed++;
    } else {
      console.log(`❌ Missing variables: ${missing.join(', ')}`);
    }
  } catch (error) {
    console.log(`❌ Environment test failed: ${error}`);
  }

  // Test 2: Printful API Connection
  console.log('\n2️⃣ Testing Printful API...');
  try {
    testsRun++;
    const { PrintfulClient } = await import('printful-request');
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
    
    const response = await printful.get('store/products', { 
      offset: 0, 
      limit: 5 
    }) as any;
    
    if (response && response.result !== undefined) {
      console.log(`✅ Printful API connection successful`);
      console.log(`📦 Found ${response.result.length} products in response`);
      console.log(`📊 Total products in store: ${response.paging?.total || 'unknown'}`);
      testsPassed++;
      
      if (response.result.length === 0) {
        console.log('⚠️  Warning: No products found in store');
      }
    } else {
      console.log('❌ Invalid response from Printful API');
    }
  } catch (error: any) {
    console.log(`❌ Printful API test failed: ${error.message}`);
  }

  // Test 3: Database Connection
  console.log('\n3️⃣ Testing Database Connection...');
  try {
    testsRun++;
    // Dynamic import to avoid early loading issues
    const { db } = await import('../src/lib/database/config');
    const { sql } = await import('drizzle-orm');
    
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log('✅ Database connection successful');
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Database connection failed: ${error.message}`);
    console.log('💡 Check your database credentials and ensure database is accessible');
  }

  // Test 4: Product Service
  console.log('\n4️⃣ Testing Product Service...');
  try {
    testsRun++;
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const products = await productService.getAllProductsForAdmin();
    console.log(`✅ Product service working - found ${products.length} products in database`);
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Product service failed: ${error.message}`);
  }

  // Test 5: Sync Logs Check
  console.log('\n5️⃣ Testing Sync Logs...');
  try {
    testsRun++;
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const recentSyncs = await productService.getRecentSyncLogs(5, true);
    console.log(`✅ Sync logs accessible - found ${recentSyncs.length} recent syncs`);
    
    const activeSyncs = await productService.getActiveSyncLogs();
    if (activeSyncs.length > 0) {
      console.log(`⚠️  Found ${activeSyncs.length} active/stuck syncs:`);
      activeSyncs.forEach(sync => {
        console.log(`   - ${sync.id}: ${sync.status} - ${sync.currentStep || 'No step'} (${sync.progress || 0}%)`);
      });
    } else {
      console.log('✅ No stuck syncs found');
    }
    testsPassed++;
  } catch (error: any) {
    console.log(`❌ Sync logs test failed: ${error.message}`);
  }

  // Test 6: Quick Sync Test
  console.log('\n6️⃣ Quick Sync Test (Single Product)...');
  try {
    testsRun++;
    const { PrintfulClient } = await import('printful-request');
    const { productService } = await import('../src/lib/database/services/product-service');
    
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);
    const productsResponse = await printful.get('store/products', { 
      offset: 0, 
      limit: 1 
    }) as any;
    
    if (productsResponse.result && productsResponse.result.length > 0) {
      const firstProduct = productsResponse.result[0];
      console.log(`📦 Testing sync with product: ${firstProduct.name}`);
      
      // Get detailed product info
      const detailResponse = await printful.get(`store/products/${firstProduct.id}`) as any;
      
      if (detailResponse.result) {
        console.log(`✅ Successfully fetched product details`);
        console.log(`📊 Product has ${detailResponse.result.sync_variants?.length || 0} variants`);
        testsPassed++;
      } else {
        console.log('❌ Failed to fetch product details');
      }
    } else {
      console.log('⚠️  Cannot test sync - no products available');
      testsPassed++; // Don't fail if store is empty
    }
  } catch (error: any) {
    console.log(`❌ Quick sync test failed: ${error.message}`);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(50));
  console.log(`✅ Tests passed: ${testsPassed}/${testsRun}`);
  console.log(`📊 Success rate: ${Math.round((testsPassed / testsRun) * 100)}%`);
  
  if (testsPassed === testsRun) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Your sync system appears to be working correctly.');
    console.log('\n📋 Recommended next steps:');
    console.log('1. Try running a manual sync from your admin dashboard');
    console.log('2. If sync still hangs, the issue may be in the frontend polling');
    console.log('3. Check browser console for frontend errors');
    console.log('4. Consider using the improved sync: npm run sync:improved');
  } else {
    console.log('\n🚨 ISSUES FOUND!');
    console.log('Please fix the failed tests above before running sync.');
    
    if (testsPassed >= 3) {
      console.log('\n💡 Most core systems are working. The issue might be:');
      console.log('1. Frontend timeout/polling problems');
      console.log('2. Progress tracking issues');
      console.log('3. Specific sync logic bugs');
      console.log('\nTry running the improved sync: npm run sync:improved');
    }
  }
  
  console.log('\n🔧 If issues persist:');
  console.log('1. Check the NETLIFY_SYNC_FIX_GUIDE.md for deployment fixes');
  console.log('2. Run: npm run sync:quick-fix to cleanup stuck syncs');
  console.log('3. Use the improved sync API endpoint in your frontend');
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 DIAGNOSTIC COMPLETE');
  console.log('=' .repeat(50));
}

// Run the diagnostic
runDiagnostic().catch(error => {
  console.error('\n💥 Diagnostic script failed:', error);
  process.exit(1);
});
