#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/database/config';

async function checkSyncLogsSchema() {
  try {
    console.log('🔍 Checking sync_logs table schema...');
    
    // Check if the new columns exist by trying to query them
    const result = await db.execute(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sync_logs' 
      ORDER BY column_name;
    `);
    
    console.log('\n📋 sync_logs table columns:');
    const rows = result.rows as any[];
    
    const expectedColumns = [
      'current_step', 'progress', 'total_products', 'current_product_index',
      'current_product_name', 'estimated_time_remaining', 'warnings', 'last_updated'
    ];
    
    const existingColumns = rows.map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));
    
    rows.forEach(row => {
      const indicator = expectedColumns.includes(row.column_name) ? '✅' : '📋';
      console.log(`   ${indicator} ${row.column_name} (${row.data_type})`);
    });
    
    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns for enhanced sync progress:');
      missingColumns.forEach(col => console.log(`   🔴 ${col}`));
      console.log('\n🔧 Run the migration: npm run migrate:run');
    } else {
      console.log('\n✅ All enhanced sync progress columns are present!');
    }
    
    // Check recent sync logs
    console.log('\n📊 Recent sync logs:');
    const recentLogs = await db.execute(`
      SELECT id, status, current_step, progress, started_at, completed_at
      FROM sync_logs 
      ORDER BY started_at DESC 
      LIMIT 5;
    `);
    
    const logRows = recentLogs.rows as any[];
    if (logRows.length === 0) {
      console.log('   📝 No sync logs found');
    } else {
      logRows.forEach(log => {
        console.log(`   📝 ${log.id}: ${log.status} - ${log.current_step || 'No step'} (${log.progress || 0}%)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    process.exit(0);
  }
}

checkSyncLogsSchema();
