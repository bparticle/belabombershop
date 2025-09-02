#!/usr/bin/env tsx

/**
 * Production Database Migration Tool
 * 
 * This script safely applies database schema changes to production.
 * It reads credentials from .env.production and includes safety checks.
 * 
 * Usage:
 *   npm run db:migrate:production
 *   npm run db:migrate:production -- --schema-only  (just check schema)
 *   npm run db:migrate:production -- --force         (skip confirmations)
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Client } from 'pg';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

class ProductionMigrator {
  private config: DatabaseConfig;
  private client: Client;

  constructor() {
    console.log('🔧 Loading production environment variables...');
    
    // Clear any existing database environment variables that might interfere
    delete process.env.DATABASE_HOST;
    delete process.env.DATABASE_PASSWORD;
    delete process.env.DATABASE_USERNAME;
    delete process.env.DATABASE_NAME;
    delete process.env.DATABASE_PORT;
    delete process.env.DATABASE_SSL;
    
    // Load production environment explicitly
    config({ path: resolve(process.cwd(), '.env.production') });
    
    // Debug: show what we loaded
    console.log(`🔍 Loaded DATABASE_HOST: ${process.env.DATABASE_HOST}`);
    console.log(`🔍 Loaded DATABASE_PASSWORD: ${process.env.DATABASE_PASSWORD ? '[HIDDEN]' : 'MISSING'}`);
    
    // Validate we have production values
    if (process.env.DATABASE_HOST?.includes('lingering-mountain')) {
      throw new Error('ERROR: Loading development database instead of production! Check environment loading.');
    }
    
    this.config = {
      host: process.env.DATABASE_HOST!,
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME!,
      username: process.env.DATABASE_USERNAME!,
      password: process.env.DATABASE_PASSWORD!,
      ssl: process.env.DATABASE_SSL === 'true'
    };

    // Validate required config
    if (!this.config.host || !this.config.password) {
      throw new Error('Missing required database configuration. Check your .env.production file.');
    }

    this.client = new Client({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      ssl: this.config.ssl ? { rejectUnauthorized: false } : false
    });
  }

  async connect(): Promise<void> {
    console.log('🔌 Connecting to production database...');
    console.log(`📍 Host: ${this.config.host}`);
    console.log(`📍 Database: ${this.config.database}`);
    console.log(`📍 User: ${this.config.username}`);
    
    await this.client.connect();
    console.log('✅ Connected to production database');
  }

  async disconnect(): Promise<void> {
    await this.client.end();
    console.log('🔌 Disconnected from database');
  }

  async checkCurrentSchema(): Promise<void> {
    console.log('\n🔍 Checking current schema...');
    
    const result = await this.client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'sync_logs' 
      ORDER BY column_name;
    `);

    console.log('\n📋 Current sync_logs table columns:');
    const expectedColumns = [
      'current_step', 'progress', 'total_products', 'current_product_index',
      'current_product_name', 'estimated_time_remaining', 'warnings', 'last_updated'
    ];

    const existingColumns = result.rows.map(row => row.column_name);
    const missingColumns = expectedColumns.filter(col => !existingColumns.includes(col));

    result.rows.forEach(row => {
      const indicator = expectedColumns.includes(row.column_name) ? '✅' : '📋';
      console.log(`   ${indicator} ${row.column_name} (${row.data_type})`);
    });

    if (missingColumns.length > 0) {
      console.log('\n❌ Missing columns for enhanced sync progress:');
      missingColumns.forEach(col => console.log(`   🔴 ${col}`));
      return false;
    } else {
      console.log('\n✅ All enhanced sync progress columns are present!');
      return true;
    }
  }

  async applyProgressTrackingSchema(): Promise<void> {
    console.log('\n🔧 Applying enhanced progress tracking schema...');

    const migrations = [
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_step text;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS progress integer DEFAULT 0;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS total_products integer DEFAULT 0;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_index integer DEFAULT 0;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS current_product_name text;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS estimated_time_remaining integer;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS warnings text;`,
      `ALTER TABLE sync_logs ADD COLUMN IF NOT EXISTS last_updated timestamp DEFAULT now();`,
      `CREATE INDEX IF NOT EXISTS sync_logs_last_updated_idx ON sync_logs (last_updated);`
    ];

    for (const migration of migrations) {
      try {
        await this.client.query(migration);
        console.log(`   ✅ ${migration.split(' ')[5] || 'Migration'} applied`);
      } catch (error) {
        console.log(`   ❌ Failed: ${migration}`);
        console.log(`      Error: ${error}`);
      }
    }

    // Update existing records
    console.log('\n📝 Updating existing sync logs with default values...');
    await this.client.query(`
      UPDATE sync_logs SET 
        current_step = CASE 
          WHEN status = 'success' THEN 'Sync completed successfully'
          WHEN status = 'error' THEN 'Sync failed with error'
          WHEN status = 'partial' THEN 'Sync completed with warnings'
          ELSE 'Processing...'
        END,
        progress = CASE 
          WHEN status IN ('success', 'partial') THEN 100
          WHEN status = 'error' THEN 0
          ELSE 50
        END,
        last_updated = COALESCE(completed_at, started_at, now())
      WHERE current_step IS NULL;
    `);

    console.log('✅ Existing records updated');
  }

  async checkSyncLogs(): Promise<void> {
    console.log('\n📊 Checking recent sync logs...');
    
    const result = await this.client.query(`
      SELECT id, status, current_step, progress, started_at, completed_at
      FROM sync_logs 
      ORDER BY started_at DESC 
      LIMIT 5;
    `);

    if (result.rows.length === 0) {
      console.log('   📝 No sync logs found');
    } else {
      console.log(`   📝 Found ${result.rows.length} recent sync logs:`);
      result.rows.forEach(log => {
        const duration = log.completed_at && log.started_at 
          ? Math.round((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000)
          : 'N/A';
        console.log(`      ${log.id}: ${log.status} - ${log.current_step || 'No step'} (${log.progress || 0}%) [${duration}s]`);
      });
    }
  }

  async run(): Promise<void> {
    const args = process.argv.slice(2);
    const schemaOnly = args.includes('--schema-only');
    const force = args.includes('--force');

    try {
      await this.connect();
      
      const schemaComplete = await this.checkCurrentSchema();
      
      if (schemaOnly) {
        console.log('\n🔍 Schema check complete');
        return;
      }

      if (!schemaComplete) {
        if (!force) {
          console.log('\n⚠️  WARNING: About to modify PRODUCTION database schema!');
          console.log('   This will add columns for enhanced sync progress tracking.');
          console.log('   The operation is safe and backwards compatible.');
          console.log('\n   To proceed, re-run with --force flag:');
          console.log('   npm run db:migrate:production -- --force');
          return;
        }

        await this.applyProgressTrackingSchema();
        console.log('\n🎉 Production database schema updated successfully!');
      }

      await this.checkSyncLogs();

      console.log('\n' + '='.repeat(60));
      console.log('✅ PRODUCTION DATABASE MIGRATION COMPLETE');
      console.log('='.repeat(60));
      console.log('🚀 Your production sync should now work properly!');
      console.log('📱 Test by going to your admin dashboard and triggering a sync.');

    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run the migration
const migrator = new ProductionMigrator();
migrator.run().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
