#!/usr/bin/env tsx

/**
 * Check Database Tables Script
 * 
 * Directly checks what tables exist in the database
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function checkDatabase() {
  console.log('🔍 Checking Database Connection and Tables...\n');
  
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
    return;
  }
  
  console.log('📋 Database Configuration:');
  console.log(`   Host: ${process.env.DATABASE_HOST}`);
  console.log(`   Port: ${process.env.DATABASE_PORT}`);
  console.log(`   Database: ${process.env.DATABASE_NAME}`);
  console.log(`   Username: ${process.env.DATABASE_USERNAME}`);
  console.log(`   SSL: ${process.env.DATABASE_SSL || 'undefined'}`);
  
  const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=${process.env.DATABASE_SSL === 'true' ? 'require' : 'disable'}`;
  
  console.log('\n🔗 Connecting to database...');
  
  let client;
  try {
    client = postgres(connectionString, {
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 1, // Only one connection for this test
    });
    
    // Test basic connection
    const testResult = await client`SELECT NOW() as current_time`;
    console.log('✅ Connection successful!');
    console.log(`   Current time: ${testResult[0].current_time}`);
    
    // Check for tables
    console.log('\n📋 Checking for tables...');
    const tables = await client`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in the public schema.');
      console.log('\nThis means the migration may not have run successfully.');
      console.log('Let\'s check what schemas exist:');
      
      const schemas = await client`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      `;
      
      console.log('📂 Available schemas:');
      schemas.forEach(schema => {
        console.log(`   ${schema.schema_name}`);
      });
      
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   📋 ${table.table_name} (${table.table_type})`);
      });
      
      // Check for our specific tables
      const expectedTables = [
        'categories', 'products', 'variants', 'tags', 
        'product_categories', 'product_tags', 'product_enhancements', 'sync_logs'
      ];
      
      const foundTables = tables.map(t => t.table_name);
      const missingTables = expectedTables.filter(table => !foundTables.includes(table));
      
      if (missingTables.length === 0) {
        console.log('\n🎉 All expected tables are present!');
      } else {
        console.log('\n⚠️  Missing expected tables:', missingTables.join(', '));
      }
    }
    
    // Check if we can insert a test record
    console.log('\n🧪 Testing write permissions...');
    try {
      await client`
        CREATE TABLE IF NOT EXISTS _test_table (
          id SERIAL PRIMARY KEY,
          test_data TEXT
        )
      `;
      await client`INSERT INTO _test_table (test_data) VALUES ('test')`;
      await client`DROP TABLE _test_table`;
      console.log('✅ Write permissions confirmed!');
    } catch (writeError) {
      console.log('❌ Write test failed:', writeError instanceof Error ? writeError.message : writeError);
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log('\n💡 Troubleshooting: Host not found');
        console.log('   - Check if DATABASE_HOST is correct');
        console.log('   - Verify network connectivity');
      } else if (error.message.includes('authentication')) {
        console.log('\n💡 Troubleshooting: Authentication failed');
        console.log('   - Check DATABASE_USERNAME and DATABASE_PASSWORD');
        console.log('   - Verify user permissions in Neon dashboard');
      } else if (error.message.includes('database') && error.message.includes('does not exist')) {
        console.log('\n💡 Troubleshooting: Database not found');
        console.log('   - Check if DATABASE_NAME exists in Neon');
        console.log('   - Create the database if it doesn\'t exist');
      }
    }
  } finally {
    if (client) {
      await client.end();
    }
  }
}

if (require.main === module) {
  checkDatabase().catch(console.error);
}
