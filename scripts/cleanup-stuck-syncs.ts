#!/usr/bin/env tsx

/**
 * Cleanup Stuck Sync Logs Script
 * 
 * This script identifies and cleans up any sync logs that are stuck in 
 * an incomplete state, which can cause the admin interface to show
 * perpetual sync operations.
 */

import 'dotenv/config';
import { productService } from '../src/lib/database/services/product-service';

async function cleanupStuckSyncs() {
  console.log('🧹 Starting cleanup of stuck sync logs...');

  try {
    // Get all active sync logs
    const activeSyncs = await productService.getActiveSyncLogs();
    console.log(`Found ${activeSyncs.length} active sync logs`);

    if (activeSyncs.length === 0) {
      console.log('✅ No stuck sync logs found');
      return;
    }

    // Check for syncs that are likely stuck (older than 10 minutes)
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const stuckSyncs = activeSyncs.filter(sync => {
      const startedAt = sync.startedAt ? new Date(sync.startedAt) : new Date();
      return startedAt < tenMinutesAgo;
    });

    console.log(`Found ${stuckSyncs.length} potentially stuck sync logs`);

    if (stuckSyncs.length === 0) {
      console.log('✅ No stuck sync logs found');
      return;
    }

    // Cancel stuck syncs
    for (const stuckSync of stuckSyncs) {
      console.log(`🔄 Cancelling stuck sync: ${stuckSync.id} (status: ${stuckSync.status}, started: ${stuckSync.startedAt})`);
      
      try {
        await productService.updateSyncLog(stuckSync.id, {
          status: 'cancelled',
          completedAt: now,
          errorMessage: 'Sync cancelled due to being stuck (cleanup script)',
          duration: stuckSync.startedAt ? now.getTime() - new Date(stuckSync.startedAt).getTime() : 0,
        });
        
        console.log(`✅ Successfully cancelled sync: ${stuckSync.id}`);
      } catch (error) {
        console.error(`❌ Failed to cancel sync ${stuckSync.id}:`, error);
      }
    }

    console.log(`🎉 Cleanup completed! Cancelled ${stuckSyncs.length} stuck sync logs`);

  } catch (error) {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupStuckSyncs();
