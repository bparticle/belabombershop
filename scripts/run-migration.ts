#!/usr/bin/env tsx

/**
 * Run Database Migration Script
 * 
 * Loads environment variables and runs Drizzle migrations
 */

import * as dotenv from 'dotenv';
import { execSync } from 'child_process';
import path from 'path';

async function runMigration() {
  console.log('🔧 Loading environment variables...');
  
  // Load environment variables in the correct order
  dotenv.config({ path: '.env.local' }); // Development overrides
  dotenv.config({ path: '.env' }); // Base/production values
  
  console.log('📋 Database Configuration:');
  console.log(`   Host: ${process.env.DATABASE_HOST || 'NOT SET'}`);
  console.log(`   Port: ${process.env.DATABASE_PORT || 'NOT SET'}`);
  console.log(`   Database: ${process.env.DATABASE_NAME || 'NOT SET'}`);
  console.log(`   Username: ${process.env.DATABASE_USERNAME || 'NOT SET'}`);
  console.log(`   SSL: ${process.env.DATABASE_SSL || 'NOT SET'}`);
  
  // Check if required variables are set
  const requiredVars = [
    'DATABASE_HOST',
    'DATABASE_PORT', 
    'DATABASE_NAME',
    'DATABASE_USERNAME',
    'DATABASE_PASSWORD'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\n💡 Make sure your .env.local file contains all database credentials');
    process.exit(1);
  }
  
  console.log('\n🚀 Running Drizzle migrations...');
  
  try {
    // Set the environment variables for the child process
    const env = {
      ...process.env,
      DATABASE_HOST: process.env.DATABASE_HOST,
      DATABASE_PORT: process.env.DATABASE_PORT,
      DATABASE_NAME: process.env.DATABASE_NAME,
      DATABASE_USERNAME: process.env.DATABASE_USERNAME,
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
      DATABASE_SSL: process.env.DATABASE_SSL,
      DATABASE_CLIENT: process.env.DATABASE_CLIENT || 'postgres',
    };
    
    // Run the migration
    execSync('npx drizzle-kit push:pg', {
      stdio: 'inherit',
      env,
      cwd: process.cwd()
    });
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Check Neon dashboard to verify tables were created');
    console.log('2. Run npm run check:db to verify the tables');
    console.log('3. Start syncing products from Printful');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify database credentials are correct');
    console.log('2. Check network connectivity to Neon');
    console.log('3. Ensure database exists in Neon dashboard');
    process.exit(1);
  }
}

if (require.main === module) {
  runMigration().catch(console.error);
}
