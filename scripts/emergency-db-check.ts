#!/usr/bin/env tsx

/**
 * Emergency Database State Check
 * 
 * This script quickly checks your database state to assess any data loss
 * and provides immediate diagnostics about your current product situation.
 */

import 'dotenv/config';
import { productService } from '../src/lib/database/services/product-service';

async function emergencyCheck() {
  console.log('🚨 EMERGENCY DATABASE STATE CHECK');
  console.log('================================\n');

  try {
    // 1. Check total products
    const allProducts = await productService.getAllProductsForAdmin();
    console.log(`📦 Total products in database: ${allProducts.length}`);

    if (allProducts.length === 0) {
      console.log('🚨 CRITICAL: NO PRODUCTS IN DATABASE - DATA LOSS DETECTED!');
      console.log('   This confirms the sync deletion issue occurred.');
      console.log('   You need to run a recovery sync immediately.\n');
    } else {
      console.log('✅ Products found in database\n');
    }

    // 2. Check active vs inactive products
    const activeProducts = allProducts.filter(p => p.isActive);
    const inactiveProducts = allProducts.filter(p => !p.isActive);
    
    console.log(`✅ Active products: ${activeProducts.length}`);
    console.log(`⚠️  Inactive products: ${inactiveProducts.length}`);

    // 3. Check recent sync logs
    console.log('\n📋 Recent sync operations:');
    const recentSyncs = await productService.getRecentSyncLogs(10);
    
    if (recentSyncs.length === 0) {
      console.log('   No sync logs found');
    } else {
      recentSyncs.forEach((sync, index) => {
        const status = sync.status;
        const icon = status === 'success' ? '✅' : 
                    status === 'error' ? '❌' : 
                    status === 'partial' ? '⚠️' : '🔄';
        
        console.log(`   ${icon} ${sync.operation} - ${status} (${sync.startedAt})`);
        console.log(`      Products: ${sync.productsCreated} created, ${sync.productsUpdated} updated, ${sync.productsDeleted} deleted`);
        
        if (sync.errorMessage) {
          console.log(`      Error: ${sync.errorMessage}`);
        }
        
        if (index === 0) { // Most recent sync
          if (sync.productsDeleted > 0 && sync.productsCreated === 0) {
            console.log('      🚨 DANGER: This sync deleted products but created none!');
          }
        }
      });
    }

    // 4. Check for stuck syncs
    console.log('\n🔍 Checking for stuck syncs...');
    const activeSyncs = await productService.getActiveSyncLogs();
    
    if (activeSyncs.length > 0) {
      console.log(`⚠️  Found ${activeSyncs.length} active syncs:`);
      activeSyncs.forEach(sync => {
        const startedAt = sync.startedAt ? new Date(sync.startedAt) : new Date();
        const minutesAgo = Math.round((Date.now() - startedAt.getTime()) / (1000 * 60));
        console.log(`   - ${sync.id} (${sync.status}) - started ${minutesAgo} minutes ago`);
        
        if (minutesAgo > 10) {
          console.log(`     🚨 This sync appears stuck! Consider cancelling it.`);
        }
      });
    } else {
      console.log('✅ No active syncs found');
    }

    // 5. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    
    if (allProducts.length === 0) {
      console.log('🚨 IMMEDIATE ACTION REQUIRED:');
      console.log('   1. Run: npm run sync:safe  (uses the new safe sync script)');
      console.log('   2. Monitor the process carefully');
      console.log('   3. Do NOT refresh the page during sync');
      console.log('   4. Consider running sync during low-traffic hours');
    } else {
      console.log('✅ Your database has products, but consider:');
      console.log('   1. Switch to the safe sync script: npm run sync:safe');
      console.log('   2. Avoid refreshing during sync operations');
      console.log('   3. Monitor sync completion before navigating away');
    }

    // 6. Check variants
    const totalVariants = allProducts.reduce((sum, product) => sum + product.variants.length, 0);
    console.log(`\n🎛️  Total variants: ${totalVariants}`);

    if (totalVariants === 0 && allProducts.length > 0) {
      console.log('⚠️  Products exist but no variants found - potential data issue');
    }

  } catch (error) {
    console.error('❌ Emergency check failed:', error);
    console.log('\n🔍 TROUBLESHOOTING:');
    console.log('   1. Check your database connection');
    console.log('   2. Verify environment variables are set');
    console.log('   3. Ensure the database migration has run');
  }

  console.log('\n================================');
  console.log('🚨 END EMERGENCY CHECK');
}

// Run the emergency check
emergencyCheck();
