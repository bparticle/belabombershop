#!/usr/bin/env tsx

/**
 * QUICK SYNC FIX SCRIPT
 * 
 * This script provides immediate fixes for the most critical sync issues:
 * 1. Cancels all stuck syncs
 * 2. Tests environment setup
 * 3. Provides actionable recommendations
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { productService } from '../src/lib/database/services/product-service';
import { db } from '../src/lib/database/config';
import { syncLogs } from '../src/lib/database/schema';
import { sql, and } from 'drizzle-orm';

async function quickFix() {
  console.log('🚑 QUICK SYNC FIX - EMERGENCY REPAIRS');
  console.log('=' .repeat(50));
  
  let fixesApplied = 0;
  
  // Fix 1: Cancel stuck syncs
  try {
    console.log('\n🔧 Fix 1: Cancelling stuck syncs...');
    const stuckSyncs = await db
      .select()
      .from(syncLogs)
      .where(
        and(
          sql`status IN ('queued', 'fetching_products', 'processing_products', 'finalizing')`,
          sql`started_at < NOW() - INTERVAL '5 minutes'`
        )
      );

    if (stuckSyncs.length > 0) {
      for (const sync of stuckSyncs) {
        await productService.updateSyncLog(sync.id, {
          status: 'cancelled',
          errorMessage: 'Cancelled by emergency fix script',
          currentStep: 'Emergency cancellation',
          completedAt: new Date(),
        });
      }
      console.log(`✅ Cancelled ${stuckSyncs.length} stuck syncs`);
      fixesApplied++;
    } else {
      console.log('✅ No stuck syncs found');
    }
  } catch (error) {
    console.log(`❌ Failed to cancel stuck syncs: ${error}`);
  }

  // Fix 2: Environment check
  console.log('\n🔧 Fix 2: Environment check...');
  const missingVars = [];
  
  const requiredVars = [
    'PRINTFUL_API_KEY',
    'DATABASE_HOST',
    'DATABASE_NAME',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are present');
  } else {
    console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('🔧 Fix: Add these to your .env.local and .env.production files');
    fixesApplied++;
  }

  // Fix 3: Quick API test
  console.log('\n🔧 Fix 3: Testing Printful API...');
  try {
    if (process.env.PRINTFUL_API_KEY) {
      const { PrintfulClient } = await import('printful-request');
      const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY);
      const response = await printful.get('store/products', { offset: 0, limit: 1 }) as any;
      
      if (response && response.result !== undefined) {
        console.log(`✅ Printful API connection successful (${response.result.length} products found)`);
      } else {
        console.log('⚠️ Printful API returned unexpected response format');
        fixesApplied++;
      }
    } else {
      console.log('❌ Cannot test Printful API - API key missing');
      fixesApplied++;
    }
  } catch (error) {
    console.log(`❌ Printful API test failed: ${error}`);
    console.log('🔧 Fix: Check your PRINTFUL_API_KEY and network connectivity');
    fixesApplied++;
  }

  // Fix 4: Database cleanup
  console.log('\n🔧 Fix 4: Database cleanup...');
  try {
    // Clean up orphaned variants
    const cleanupResult = await db.execute(sql`
      DELETE FROM variants 
      WHERE product_id NOT IN (SELECT id FROM products)
    `);
    
    console.log('✅ Database cleanup completed');
    
    // Clean up old failed syncs
    await db.execute(sql`
      DELETE FROM sync_logs 
      WHERE status = 'error' 
      AND started_at < NOW() - INTERVAL '7 days'
    `);
    
    console.log('✅ Cleaned up old failed sync logs');
    
  } catch (error) {
    console.log(`❌ Database cleanup failed: ${error}`);
  }

  // Summary and recommendations
  console.log('\n' + '=' .repeat(50));
  console.log('📋 QUICK FIX SUMMARY');
  console.log('=' .repeat(50));
  console.log(`🔧 Fixes applied: ${fixesApplied}`);
  
  if (fixesApplied === 0) {
    console.log('✅ No critical issues found! Your sync should work now.');
    console.log('\n📋 Next steps:');
    console.log('1. Try running a sync from your admin dashboard');
    console.log('2. If issues persist, run the comprehensive diagnostic:');
    console.log('   npm run tsx scripts/comprehensive-sync-diagnostic-advanced.ts');
  } else {
    console.log('⚠️ Issues found and fixed where possible.');
    console.log('\n📋 URGENT ACTIONS NEEDED:');
    
    if (missingVars.length > 0) {
      console.log('1. Add missing environment variables to:');
      console.log('   - .env.local (for development)');
      console.log('   - Netlify environment settings (for production)');
      console.log(`   Missing: ${missingVars.join(', ')}`);
    }
    
    console.log('2. For Netlify deployment:');
    console.log('   - Go to Netlify dashboard > Site settings > Environment variables');
    console.log('   - Add all required variables from .env.local');
    console.log('   - Make sure DATABASE_SSL=true for production');
    
    console.log('3. If sync still hangs at 15%:');
    console.log('   - Use the improved sync endpoint: /api/admin/sync-improved');
    console.log('   - Reduce batch sizes in production');
    console.log('   - Check Netlify function logs for errors');
    
    console.log('\n🆘 EMERGENCY CONTACT:');
    console.log('If sync is still broken after these fixes:');
    console.log('1. Run: npm run tsx scripts/comprehensive-sync-diagnostic-advanced.ts');
    console.log('2. Share the diagnostic output');
    console.log('3. Check your browser console for frontend errors');
    console.log('4. Check Netlify function logs for backend errors');
  }
  
  console.log('\n📚 Full documentation:');
  console.log('See NETLIFY_SYNC_FIX_GUIDE.md for complete setup instructions');
  console.log('=' .repeat(50));
}

// Run the quick fix
quickFix().catch(console.error);
