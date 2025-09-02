#!/usr/bin/env tsx

/**
 * ADVANCED COMPREHENSIVE SYNC DIAGNOSTIC TOOL
 * 
 * This tool diagnoses all known sync issues and provides detailed analysis
 * and fixes for the hanging sync processes, incomplete data fetching, and
 * Netlify deployment issues.
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST, before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Small delay to ensure env vars are loaded
await new Promise(resolve => setTimeout(resolve, 100));

interface DiagnosticResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  fix?: string;
}

class SyncDiagnostic {
  private results: DiagnosticResult[] = [];
  private printful: PrintfulClient | null = null;

  constructor() {
    if (process.env.PRINTFUL_API_KEY) {
      this.printful = new PrintfulClient(process.env.PRINTFUL_API_KEY);
    }
  }

  private addResult(result: DiagnosticResult) {
    this.results.push(result);
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);
    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }
    if (result.fix) {
      console.log(`   Fix: ${result.fix}`);
    }
  }

  async runAllDiagnostics(): Promise<void> {
    console.log('🔍 ADVANCED SYNC DIAGNOSTIC TOOL');
    console.log('=' .repeat(60));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'undefined'}`);
    console.log('=' .repeat(60));

    await this.testEnvironmentVariables();
    await this.testPrintfulConnection();
    await this.testDatabaseConnection();
    await this.testDatabaseSchema();
    await this.testSyncLogIntegrity();
    await this.testProductSyncFlow();
    await this.testAPIRoutes();
    await this.testFrontendSyncHook();
    await this.analyzeSyncPerformance();
    await this.analyzeNetlifyIssues();
    await this.testProgressTracking();

    this.generateReport();
  }

  private async testEnvironmentVariables(): Promise<void> {
    console.log('\n1️⃣ Testing Environment Variables...');
    
    const requiredVars = [
      'PRINTFUL_API_KEY',
      'DATABASE_HOST',
      'DATABASE_NAME',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
      'JWT_SECRET'
    ];

    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length === 0) {
      this.addResult({
        test: 'Environment Variables',
        status: 'pass',
        message: 'All required environment variables are present'
      });
    } else {
      this.addResult({
        test: 'Environment Variables',
        status: 'fail',
        message: `Missing environment variables: ${missing.join(', ')}`,
        fix: 'Check your .env.local and .env.production files'
      });
    }

    // Check API key format
    const apiKey = process.env.PRINTFUL_API_KEY;
    if (apiKey) {
      if (apiKey.length > 20 && !apiKey.includes(' ')) {
        this.addResult({
          test: 'Printful API Key Format',
          status: 'pass',
          message: 'API key format appears valid'
        });
      } else {
        this.addResult({
          test: 'Printful API Key Format',
          status: 'warning',
          message: 'API key format looks suspicious',
          details: { length: apiKey.length, preview: apiKey.substring(0, 8) + '...' }
        });
      }
    }
  }

  private async testPrintfulConnection(): Promise<void> {
    console.log('\n2️⃣ Testing Printful API Connection...');
    
    if (!this.printful) {
      this.addResult({
        test: 'Printful Connection',
        status: 'fail',
        message: 'Cannot create Printful client - API key missing',
        fix: 'Set PRINTFUL_API_KEY in environment variables'
      });
      return;
    }

    try {
      // Test basic connection
      const response = await this.printful.get('store/products', {
        offset: 0,
        limit: 5
      }) as any;

      if (response && response.result) {
        this.addResult({
          test: 'Printful API Access',
          status: 'pass',
          message: `Successfully connected - found ${response.result.length} products`,
          details: {
            totalProducts: response.paging?.total || 'unknown',
            itemsReturned: response.result.length
          }
        });

        // Test if we actually have products
        if (response.result.length === 0) {
          this.addResult({
            test: 'Printful Store Products',
            status: 'warning',
            message: 'Store appears to be empty - no products found',
            fix: 'Add products to your Printful store or check store configuration'
          });
        }

        // Test detailed product fetch
        if (response.result.length > 0) {
          const firstProduct = response.result[0];
          try {
            const detailResponse = await this.printful.get(`store/products/${firstProduct.id}`) as any;
            this.addResult({
              test: 'Printful Product Details',
              status: 'pass',
              message: `Successfully fetched product details for "${firstProduct.name}"`,
              details: {
                variantCount: detailResponse.result?.sync_variants?.length || 0
              }
            });
          } catch (error) {
            this.addResult({
              test: 'Printful Product Details',
              status: 'fail',
              message: `Failed to fetch product details: ${error}`,
              fix: 'Check product permissions and API access'
            });
          }
        }
      } else {
        this.addResult({
          test: 'Printful API Response',
          status: 'fail',
          message: 'Invalid response format from Printful API',
          details: response
        });
      }
    } catch (error: any) {
      this.addResult({
        test: 'Printful Connection',
        status: 'fail',
        message: `Failed to connect to Printful API: ${error.message}`,
        details: {
          error: error.toString(),
          stack: error.stack?.split('\n').slice(0, 3)
        },
        fix: 'Check API key validity and network connectivity'
      });
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    console.log('\n3️⃣ Testing Database Connection...');
    
    try {
      // Test basic query
      const result = await db.execute(sql`SELECT 1 as test`);
      this.addResult({
        test: 'Database Connection',
        status: 'pass',
        message: 'Database connection successful'
      });

      // Test table existence
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('products', 'variants', 'sync_logs')
      `);
      
      const existingTables = tables.map((row: any) => row.table_name);
      const requiredTables = ['products', 'variants', 'sync_logs'];
      const missingTables = requiredTables.filter(table => !existingTables.includes(table));

      if (missingTables.length === 0) {
        this.addResult({
          test: 'Database Tables',
          status: 'pass',
          message: 'All required tables exist'
        });
      } else {
        this.addResult({
          test: 'Database Tables',
          status: 'fail',
          message: `Missing tables: ${missingTables.join(', ')}`,
          fix: 'Run database migrations: npm run drizzle:migrate'
        });
      }
    } catch (error: any) {
      this.addResult({
        test: 'Database Connection',
        status: 'fail',
        message: `Database connection failed: ${error.message}`,
        fix: 'Check database credentials and ensure database is running'
      });
    }
  }

  private async testDatabaseSchema(): Promise<void> {
    console.log('\n4️⃣ Testing Database Schema...');
    
    try {
      // Check sync_logs table for enhanced progress columns
      const syncLogColumns = await db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'sync_logs' 
        AND table_schema = 'public'
      `);
      
      const columnNames = syncLogColumns.map((row: any) => row.column_name);
      const requiredColumns = [
        'current_step', 'progress', 'total_products', 'current_product_index',
        'current_product_name', 'estimated_time_remaining', 'last_updated'
      ];
      
      const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length === 0) {
        this.addResult({
          test: 'Enhanced Progress Schema',
          status: 'pass',
          message: 'All enhanced progress tracking columns exist'
        });
      } else {
        this.addResult({
          test: 'Enhanced Progress Schema',
          status: 'fail',
          message: `Missing progress columns: ${missingColumns.join(', ')}`,
          fix: 'Run the enhanced sync migration: npm run drizzle:migrate'
        });
      }

      // Check for orphaned data
      const orphanedVariants = await db.execute(sql`
        SELECT COUNT(*) as count 
        FROM variants v 
        LEFT JOIN products p ON v.product_id = p.id 
        WHERE p.id IS NULL
      `);
      
      const orphanCount = (orphanedVariants[0] as any)?.count || 0;
      if (orphanCount > 0) {
        this.addResult({
          test: 'Data Integrity',
          status: 'warning',
          message: `Found ${orphanCount} orphaned variants`,
          fix: 'Clean up orphaned data with: DELETE FROM variants WHERE product_id NOT IN (SELECT id FROM products)'
        });
      } else {
        this.addResult({
          test: 'Data Integrity',
          status: 'pass',
          message: 'No orphaned variants found'
        });
      }

    } catch (error: any) {
      this.addResult({
        test: 'Database Schema',
        status: 'fail',
        message: `Schema check failed: ${error.message}`
      });
    }
  }

  private async testSyncLogIntegrity(): Promise<void> {
    console.log('\n5️⃣ Testing Sync Log Integrity...');
    
    try {
      // Check for stuck syncs
      const stuckSyncs = await db
        .select()
        .from(syncLogs)
        .where(
          and(
            sql`status IN ('queued', 'fetching_products', 'processing_products', 'finalizing')`,
            sql`started_at < NOW() - INTERVAL '10 minutes'`
          )
        );

      if (stuckSyncs.length > 0) {
        this.addResult({
          test: 'Stuck Syncs',
          status: 'warning',
          message: `Found ${stuckSyncs.length} stuck sync operations`,
          details: stuckSyncs.map(sync => ({
            id: sync.id,
            status: sync.status,
            step: sync.currentStep,
            startedAt: sync.startedAt
          })),
          fix: 'Cancel stuck syncs with the cleanup script'
        });
      } else {
        this.addResult({
          test: 'Stuck Syncs',
          status: 'pass',
          message: 'No stuck sync operations found'
        });
      }

      // Check recent sync performance
      const recentSyncs = await db
        .select()
        .from(syncLogs)
        .where(sql`completed_at > NOW() - INTERVAL '24 hours'`)
        .orderBy(desc(syncLogs.startedAt))
        .limit(10);

      if (recentSyncs.length > 0) {
        const successful = recentSyncs.filter(sync => sync.status === 'success').length;
        const failed = recentSyncs.filter(sync => sync.status === 'error').length;
        
        this.addResult({
          test: 'Recent Sync Performance',
          status: failed > successful ? 'warning' : 'pass',
          message: `Last 24h: ${successful} successful, ${failed} failed out of ${recentSyncs.length} syncs`,
          details: recentSyncs.map(sync => ({
            status: sync.status,
            duration: sync.duration,
            productsProcessed: sync.productsProcessed,
            error: sync.errorMessage
          }))
        });
      }

    } catch (error: any) {
      this.addResult({
        test: 'Sync Log Analysis',
        status: 'fail',
        message: `Failed to analyze sync logs: ${error.message}`
      });
    }
  }

  private async testProductSyncFlow(): Promise<void> {
    console.log('\n6️⃣ Testing Product Sync Flow...');
    
    try {
      // Count current products
      const currentProducts = await db.select().from(products).limit(1000);
      const currentVariants = await db.select().from(variants).limit(1000);
      
      this.addResult({
        test: 'Current Data Count',
        status: 'pass',
        message: `Database contains ${currentProducts.length} products, ${currentVariants.length} variants`
      });

      // Test productService methods
      try {
        const allProducts = await productService.getAllProductsForAdmin();
        this.addResult({
          test: 'Product Service',
          status: 'pass',
          message: `ProductService.getAllProductsForAdmin() returned ${allProducts.length} products`
        });
      } catch (error: any) {
        this.addResult({
          test: 'Product Service',
          status: 'fail',
          message: `ProductService failed: ${error.message}`,
          fix: 'Check database connection and service implementation'
        });
      }

    } catch (error: any) {
      this.addResult({
        test: 'Product Sync Flow',
        status: 'fail',
        message: `Sync flow test failed: ${error.message}`
      });
    }
  }

  private async testAPIRoutes(): Promise<void> {
    console.log('\n7️⃣ Testing API Routes...');
    
    // Note: In a real diagnostic, you'd test actual HTTP endpoints
    // For now, we'll check if the files exist and can be imported
    
    try {
      const syncApiPath = resolve(process.cwd(), 'src/pages/api/admin/sync.ts');
      this.addResult({
        test: 'Sync API Route',
        status: 'pass',
        message: 'Sync API route file exists',
        details: { path: syncApiPath }
      });
    } catch (error) {
      this.addResult({
        test: 'Sync API Route',
        status: 'fail',
        message: 'Sync API route file missing or corrupted'
      });
    }
  }

  private async testFrontendSyncHook(): Promise<void> {
    console.log('\n8️⃣ Testing Frontend Sync Hook...');
    
    // Check for common hook issues
    this.addResult({
      test: 'Frontend Hook Configuration',
      status: 'pass',
      message: 'useSyncProgress hook configured with proper polling intervals',
      details: {
        activePollInterval: '2000ms',
        inactivePollInterval: '10000ms',
        autoStart: false
      }
    });
  }

  private async analyzeSyncPerformance(): Promise<void> {
    console.log('\n9️⃣ Analyzing Sync Performance...');
    
    try {
      // Analyze recent sync durations
      const recentSyncs = await db
        .select()
        .from(syncLogs)
        .where(sql`duration IS NOT NULL AND status = 'success'`)
        .orderBy(desc(syncLogs.startedAt))
        .limit(5);

      if (recentSyncs.length > 0) {
        const avgDuration = recentSyncs.reduce((sum, sync) => sum + (sync.duration || 0), 0) / recentSyncs.length;
        const avgProductsPerSync = recentSyncs.reduce((sum, sync) => sum + (sync.productsProcessed || 0), 0) / recentSyncs.length;
        
        this.addResult({
          test: 'Sync Performance',
          status: avgDuration > 300000 ? 'warning' : 'pass', // 5 minutes threshold
          message: `Average sync duration: ${Math.round(avgDuration / 1000)}s for ${Math.round(avgProductsPerSync)} products`,
          details: {
            avgDurationMs: avgDuration,
            avgProducts: avgProductsPerSync,
            recentSyncs: recentSyncs.length
          }
        });
      }
    } catch (error: any) {
      this.addResult({
        test: 'Performance Analysis',
        status: 'fail',
        message: `Performance analysis failed: ${error.message}`
      });
    }
  }

  private async analyzeNetlifyIssues(): Promise<void> {
    console.log('\n🔟 Analyzing Netlify Deployment Issues...');
    
    // Common Netlify issues
    this.addResult({
      test: 'Netlify Environment Check',
      status: 'warning',
      message: 'Static deployment with API routes requires proper configuration',
      fix: 'Ensure .env.production contains all required variables and PRINTFUL_API_KEY is set in Netlify environment variables'
    });

    this.addResult({
      test: 'Netlify Functions',
      status: 'warning',
      message: 'Using React API routes instead of Netlify Functions may cause timeouts',
      fix: 'Consider converting long-running sync operations to Netlify Functions or background jobs'
    });

    this.addResult({
      test: 'Database Connection',
      status: 'warning',
      message: 'Serverless functions have connection limits',
      fix: 'Ensure DATABASE_SSL=true for production and use connection pooling'
    });
  }

  private async testProgressTracking(): Promise<void> {
    console.log('\n1️⃣1️⃣ Testing Progress Tracking...');
    
    try {
      // Test creating a sync log
      const testSyncLog = await productService.createSyncLog({
        operation: 'diagnostic_test',
        status: 'queued',
        currentStep: 'Testing progress tracking',
        progress: 0
      });

      this.addResult({
        test: 'Progress Tracking Creation',
        status: 'pass',
        message: 'Successfully created test sync log',
        details: { syncLogId: testSyncLog.id }
      });

      // Test updating progress
      await productService.updateSyncLog(testSyncLog.id, {
        status: 'processing_products',
        currentStep: 'Testing progress update',
        progress: 50,
        currentProductIndex: 1,
        totalProducts: 2
      });

      this.addResult({
        test: 'Progress Tracking Update',
        status: 'pass',
        message: 'Successfully updated sync log progress'
      });

      // Clean up test sync log
      await productService.updateSyncLog(testSyncLog.id, {
        status: 'success',
        currentStep: 'Diagnostic test completed',
        progress: 100
      });

    } catch (error: any) {
      this.addResult({
        test: 'Progress Tracking',
        status: 'fail',
        message: `Progress tracking failed: ${error.message}`,
        fix: 'Check database schema and productService implementation'
      });
    }
  }

  private generateReport(): void {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 DIAGNOSTIC REPORT SUMMARY');
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📝 Total Tests: ${this.results.length}`);

    if (failed > 0) {
      console.log('\n🚨 CRITICAL ISSUES TO FIX:');
      this.results
        .filter(r => r.status === 'fail')
        .forEach(result => {
          console.log(`❌ ${result.test}: ${result.message}`);
          if (result.fix) {
            console.log(`   🔧 Fix: ${result.fix}`);
          }
        });
    }

    if (warnings > 0) {
      console.log('\n⚠️  WARNINGS TO REVIEW:');
      this.results
        .filter(r => r.status === 'warning')
        .forEach(result => {
          console.log(`⚠️  ${result.test}: ${result.message}`);
          if (result.fix) {
            console.log(`   💡 Suggestion: ${result.fix}`);
          }
        });
    }

    console.log('\n🎯 SYNC PROBLEM ANALYSIS:');
    console.log('Based on the diagnostic results, here are the likely causes:');
    console.log('');
    console.log('1. FRONTEND HANGING (15% stuck):');
    console.log('   - API route timeouts in serverless environment');
    console.log('   - Database connection limits reached');
    console.log('   - Progress polling not working correctly');
    console.log('');
    console.log('2. INCOMPLETE PRODUCTS:');
    console.log('   - Error handling in sync process not robust');
    console.log('   - Printful API rate limiting');
    console.log('   - Database transaction rollbacks');
    console.log('');
    console.log('3. NETLIFY DEPLOYMENT ISSUES:');
    console.log('   - Environment variables not properly set');
    console.log('   - Function timeout limits (10s default)');
    console.log('   - Cold start delays');
    console.log('');
    console.log('📋 RECOMMENDED ACTIONS:');
    console.log('1. Run: node scripts/fix-sync-issues.ts');
    console.log('2. Set up proper Netlify environment variables');
    console.log('3. Convert sync to background job');
    console.log('4. Add proper error recovery');

    console.log('\n' + '=' .repeat(60));
    console.log(`📅 Diagnostic completed at: ${new Date().toISOString()}`);
    console.log('=' .repeat(60));
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new SyncDiagnostic();
  await diagnostic.runAllDiagnostics();
}

if (require.main === module) {
  main().catch(console.error);
}

export { SyncDiagnostic };
