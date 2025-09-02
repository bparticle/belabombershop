#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/database/config';

async function checkSyncLogsSchema() {
  try {
    console.log('🔍 Connecting to database to check sync_logs schema...');
    
    // Check if the enhanced progress columns exist
    const columns = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sync_logs' 
      ORDER BY column_name;
    `);
    
    console.log('\n📋 sync_logs table columns:');
    const expectedColumns = [
      'current_step', 'progress', 'total_products', 'current_product_index',
      'current_product_name', 'estimated_time_remaining', 'warnings', 'last_updated'
    ];
    
    const columnRows = columns.rows as any[];
    const existingColumns = columnRows.map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    columnRows.forEach(row => {
      const indicator = expectedColumns.includes(row.column_name) ? '✅' : '📋';
      console.log(`   ${indicator} ${row.column_name} (${row.data_type})`);
    });
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns for enhanced sync progress:');
      missingColumns.forEach(col => console.log(`   🔴 ${col}`));
      
      console.log('\n🔧 Adding missing columns...');
      
      // Add missing columns
      if (missingColumns.includes('current_step')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_step text`);
        console.log('   ✅ Added current_step');
      }
      if (missingColumns.includes('progress')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0`);
        console.log('   ✅ Added progress');
      }
      if (missingColumns.includes('total_products')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS total_products integer DEFAULT 0`);
        console.log('   ✅ Added total_products');
      }
      if (missingColumns.includes('current_product_index')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_index integer DEFAULT 0`);
        console.log('   ✅ Added current_product_index');
      }
      if (missingColumns.includes('current_product_name')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_name text`);
        console.log('   ✅ Added current_product_name');
      }
      if (missingColumns.includes('estimated_time_remaining')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS estimated_time_remaining integer`);
        console.log('   ✅ Added estimated_time_remaining');
      }
      if (missingColumns.includes('warnings')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS warnings text`);
        console.log('   ✅ Added warnings');
      }
      if (missingColumns.includes('last_updated')) {
        await db.execute(`ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS last_updated timestamp DEFAULT now()`);
        console.log('   ✅ Added last_updated');
      }
      
      // Add index
      await db.execute(`CREATE INDEX IF NOT EXISTS sync_logs_last_updated_idx ON sync_logs (last_updated)`);
      console.log('   ✅ Added index on last_updated');
      
      console.log('\n🎉 Database schema updated successfully!');
    } else {
      console.log('\n✅ All enhanced sync progress columns are present!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSyncLogsSchema();
