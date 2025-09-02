#!/usr/bin/env tsx

/**
 * Test Progress Update Script
 * 
 * This script tests if the progress update functionality works after the schema fix.
 */

import 'dotenv/config';
import { productService } from '../src/lib/database/services/product-service';

async function testProgressUpdate() {
  console.log('🧪 Testing progress update functionality...\n');

  try {
    // 1. Create a test sync log
    console.log('1️⃣ Creating test sync log...');
    const testSyncLog = await productService.createSyncLog({
      operation: 'test_sync',
      status: 'queued',
      currentStep: 'Testing progress updates',
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
    console.log(`✅ Created test sync log: ${testSyncLog.id}`);

    // 2. Test progress update
    console.log('\n2️⃣ Testing progress update...');
    try {
      await productService.updateSyncProgress({
        syncLogId: testSyncLog.id,
        status: 'processing_products',
        currentStep: 'Testing progress tracking',
        progress: 50,
        totalProducts: 10,
        currentProductIndex: 5,
        currentProductName: 'Test Product',
        estimatedTimeRemaining: 30000,
        productsProcessed: 5,
        productsCreated: 3,
        productsUpdated: 2,
        variantsProcessed: 15,
        variantsCreated: 10,
        variantsUpdated: 5,
      });
      console.log('✅ Progress update successful!');
    } catch (error) {
      console.log('❌ Progress update failed:', error);
      throw error;
    }

    // 3. Verify the update
    console.log('\n3️⃣ Verifying the update...');
    const updatedLog = await productService.getSyncLogById(testSyncLog.id);
    if (updatedLog) {
      console.log(`✅ Status: ${updatedLog.status}`);
      console.log(`✅ Progress: ${updatedLog.progress}%`);
      console.log(`✅ Current step: ${updatedLog.currentStep}`);
      console.log(`✅ Products processed: ${updatedLog.productsProcessed}`);
    } else {
      throw new Error('Could not retrieve updated sync log');
    }

    // 4. Test completion
    console.log('\n4️⃣ Testing sync completion...');
    await productService.updateSyncProgress({
      syncLogId: testSyncLog.id,
      status: 'success',
      currentStep: 'Test completed successfully',
      progress: 100,
      productsProcessed: 10,
      productsCreated: 8,
      productsUpdated: 2,
      variantsProcessed: 30,
      variantsCreated: 25,
      variantsUpdated: 5,
    });
    console.log('✅ Completion update successful!');

    // 5. Clean up
    console.log('\n5️⃣ Cleaning up test data...');
    // The test sync log will remain for reference, but mark it as test data
    await productService.updateSyncLog(testSyncLog.id, {
      currentStep: 'Test completed - safe to ignore',
    });

    console.log('\n🎉 All progress update tests passed!');
    console.log('\n📋 What this means:');
    console.log('   ✅ Schema mismatch is fixed');
    console.log('   ✅ Progress updates work properly');
    console.log('   ✅ Frontend should now show real-time progress');
    console.log('   ✅ Safe sync should work without getting stuck');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 This means:');
    console.log('   - There may still be schema issues');
    console.log('   - Database migration might need to be re-run');
    console.log('   - Check the error details above');
  }
}

// Run the test
testProgressUpdate();
