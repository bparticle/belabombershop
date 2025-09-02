#!/usr/bin/env tsx

/**
 * Test Cancel Flow Script
 * 
 * This script tests the cancel functionality to ensure it works properly.
 */

import 'dotenv/config';
import { productService } from '../src/lib/database/services/product-service';

async function testCancelFlow() {
  console.log('🧪 Testing cancel flow...\n');

  try {
    // 1. Check current active syncs
    console.log('1️⃣ Checking for active syncs...');
    const activeSyncs = await productService.getActiveSyncLogs();
    console.log(`Found ${activeSyncs.length} active syncs`);

    if (activeSyncs.length > 0) {
      console.log('Active syncs:');
      activeSyncs.forEach(sync => {
        console.log(`   - ${sync.id}: ${sync.status} (started: ${sync.startedAt})`);
      });

      // 2. Cancel all active syncs
      console.log('\n2️⃣ Cancelling all active syncs...');
      for (const sync of activeSyncs) {
        try {
          await productService.cancelSync(sync.id);
          console.log(`✅ Cancelled sync: ${sync.id}`);
        } catch (error) {
          console.log(`❌ Failed to cancel sync ${sync.id}:`, error);
        }
      }
    } else {
      console.log('✅ No active syncs to cancel');
    }

    // 3. Verify all are cancelled
    console.log('\n3️⃣ Verifying cancellation...');
    const remainingActiveSyncs = await productService.getActiveSyncLogs();
    console.log(`Remaining active syncs: ${remainingActiveSyncs.length}`);

    if (remainingActiveSyncs.length === 0) {
      console.log('✅ All syncs successfully cancelled');
    } else {
      console.log('⚠️ Some syncs are still active:');
      remainingActiveSyncs.forEach(sync => {
        console.log(`   - ${sync.id}: ${sync.status}`);
      });
    }

    // 4. Show recent sync history
    console.log('\n4️⃣ Recent sync history:');
    const recentSyncs = await productService.getRecentSyncLogs(5);
    recentSyncs.forEach((sync, index) => {
      const status = sync.status;
      const icon = status === 'success' ? '✅' : 
                  status === 'error' ? '❌' : 
                  status === 'partial' ? '⚠️' : 
                  status === 'cancelled' ? '🚫' : '🔄';
      
      console.log(`   ${icon} ${sync.operation} - ${status}`);
      if (index === 0) console.log(`      Most recent sync`);
    });

    console.log('\n🎉 Cancel flow test completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Try triggering a new sync from the admin interface');
    console.log('   2. The frontend should now properly handle cancellation');
    console.log('   3. Use the fixed safe sync: npm run sync:safe');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCancelFlow();
