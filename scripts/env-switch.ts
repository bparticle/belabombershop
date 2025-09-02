#!/usr/bin/env tsx

/**
 * Environment Switching Utility
 * 
 * This script helps manage environment configurations and provides utilities
 * for switching between development and production setups.
 */

import { testDatabaseConnection, getDatabaseInfo } from '../src/lib/database/config-v2';
import { logEnvironmentInfo } from '../src/lib/env-validation-v2';
import { getCurrentEnvironment } from '../config/environments';

interface EnvironmentCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
}

/**
 * Check environment variables
 */
async function checkEnvironmentVariables(): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];
  const env = getCurrentEnvironment();
  
  try {
    // Try to load environment validation
    const { validateEnvironmentVariables } = await import('../src/lib/env-validation-v2');
    const envVars = validateEnvironmentVariables();
    
    checks.push({
      name: 'Environment Variables',
      status: 'pass',
      message: `All required environment variables are present for ${env}`,
      details: {
        database: envVars.database.name,
        snipcartMode: envVars.snipcart.publicKey ? 'configured' : 'missing',
      }
    });
  } catch (error) {
    checks.push({
      name: 'Environment Variables',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  
  return checks;
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection(): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];
  
  try {
    const isConnected = await testDatabaseConnection();
    const dbInfo = getDatabaseInfo();
    
    checks.push({
      name: 'Database Connection',
      status: isConnected ? 'pass' : 'fail',
      message: isConnected 
        ? `Successfully connected to ${dbInfo.database} database`
        : `Failed to connect to ${dbInfo.database} database`,
      details: dbInfo,
    });
  } catch (error) {
    checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
  
  return checks;
}

/**
 * Check Snipcart configuration
 */
async function checkSnipcartConfiguration(): Promise<EnvironmentCheck[]> {
  const checks: EnvironmentCheck[] = [];
  const env = getCurrentEnvironment();
  
  try {
    const { getSnipcartApiKey, getSnipcartSecretKey } = await import('../config/environments');
    
    const publicKey = getSnipcartApiKey();
    const secretKey = getSnipcartSecretKey();
    
    if (!publicKey) {
      checks.push({
        name: 'Snipcart Public Key',
        status: env === 'test' ? 'warning' : 'fail',
        message: `No Snipcart public key configured for ${env}`,
      });
    } else {
      const keyType = publicKey.includes('test') ? 'test' : 'live';
      const expectedType = env === 'production' ? 'live' : 'test';
      
      checks.push({
        name: 'Snipcart Public Key',
        status: keyType === expectedType ? 'pass' : 'warning',
        message: `Snipcart public key configured (${keyType} mode)`,
        details: { expected: expectedType, actual: keyType },
      });
    }
    
    if (env === 'production') {
      checks.push({
        name: 'Snipcart Secret Key',
        status: secretKey ? 'pass' : 'fail',
        message: secretKey 
          ? 'Snipcart secret key configured for production'
          : 'Snipcart secret key missing (required for production webhooks)',
      });
    }
  } catch (error) {
    checks.push({
      name: 'Snipcart Configuration',
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown Snipcart error',
    });
  }
  
  return checks;
}

/**
 * Run all environment checks
 */
async function runEnvironmentChecks(): Promise<void> {
  console.log('🔍 Running Environment Checks...\n');
  
  // Show current environment info
  logEnvironmentInfo();
  console.log('');
  
  // Run all checks
  const [envChecks, dbChecks, snipcartChecks] = await Promise.all([
    checkEnvironmentVariables(),
    checkDatabaseConnection(),
    checkSnipcartConfiguration(),
  ]);
  
  const allChecks = [...envChecks, ...dbChecks, ...snipcartChecks];
  
  // Display results
  allChecks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${check.name}: ${check.message}`);
    
    if (check.details) {
      console.log(`   Details:`, check.details);
    }
  });
  
  // Summary
  const passed = allChecks.filter(c => c.status === 'pass').length;
  const warnings = allChecks.filter(c => c.status === 'warning').length;
  const failed = allChecks.filter(c => c.status === 'fail').length;
  
  console.log(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n💡 Tip: Check your environment variables and ensure all required values are set.');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Some checks have warnings. Review the details above.');
  } else {
    console.log('\n🎉 All checks passed! Your environment is properly configured.');
  }
}

/**
 * Show environment setup guide
 */
function showSetupGuide(): void {
  const env = getCurrentEnvironment();
  
  console.log(`📚 Environment Setup Guide for ${env.toUpperCase()}\n`);
  
  if (env === 'development') {
    console.log('Development Environment Setup:');
    console.log('1. Create a separate development database');
    console.log('2. Set development-specific environment variables:');
    console.log('   DATABASE_HOST_DEV=localhost');
    console.log('   DATABASE_NAME_DEV=belabomberman_dev');
    console.log('   DATABASE_USERNAME_DEV=your_dev_user');
    console.log('   DATABASE_PASSWORD_DEV=your_dev_password');
    console.log('   DATABASE_SSL_DEV=false');
    console.log('   NEXT_PUBLIC_SNIPCART_API_KEY_DEV=your_test_key');
    console.log('   SNIPCART_SECRET_KEY_DEV=your_test_secret');
  } else if (env === 'production') {
    console.log('Production Environment Setup:');
    console.log('1. Ensure production database is properly configured');
    console.log('2. Set production-specific environment variables:');
    console.log('   DATABASE_HOST_PROD=your_prod_host');
    console.log('   DATABASE_NAME_PROD=belabomberman_prod');
    console.log('   DATABASE_USERNAME_PROD=your_prod_user');
    console.log('   DATABASE_PASSWORD_PROD=your_prod_password');
    console.log('   DATABASE_SSL_PROD=true');
    console.log('   NEXT_PUBLIC_SNIPCART_API_KEY_PROD=your_live_key');
    console.log('   SNIPCART_SECRET_KEY_PROD=your_live_secret');
  }
  
  console.log('\n🔧 Alternative: Use generic variables that work for all environments:');
  console.log('   DATABASE_HOST, DATABASE_NAME, etc.');
  console.log('   NEXT_PUBLIC_SNIPCART_API_KEY, SNIPCART_SECRET_KEY');
}

// CLI interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'check':
      await runEnvironmentChecks();
      break;
    case 'guide':
      showSetupGuide();
      break;
    default:
      console.log('Environment Management Utility\n');
      console.log('Usage:');
      console.log('  npm run env:check  - Run environment checks');
      console.log('  npm run env:guide  - Show setup guide');
      console.log('\nOr run directly:');
      console.log('  tsx scripts/env-switch.ts check');
      console.log('  tsx scripts/env-switch.ts guide');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
