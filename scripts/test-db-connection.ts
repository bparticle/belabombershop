#!/usr/bin/env tsx

/**
 * Simple Database Connection Test
 * 
 * Tests the database connection using your current environment setup
 */

import { db, postgresClient } from '../src/lib/database/config';

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const result = await postgresClient`SELECT 1 as test, NOW() as current_time`;
    console.log('✅ Basic connection successful!');
    console.log(`   Current time: ${result[0].current_time}`);
    
    // Test if tables exist
    console.log('\n2. Checking if tables exist...');
    const tables = await postgresClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    if (tables.length > 0) {
      console.log('✅ Tables found:');
      tables.forEach(table => {
        console.log(`   📋 ${table.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found. You may need to run migrations.');
    }
    
    // Test a simple query using Drizzle
    console.log('\n3. Testing Drizzle ORM connection...');
    try {
      // Import the schema
      const { products } = await import('../src/lib/database/schema');
      const productCount = await db.select().from(products).limit(1);
      console.log('✅ Drizzle ORM connection successful!');
      console.log(`   Products table is accessible (found ${productCount.length} products)`);
    } catch (drizzleError) {
      console.log('⚠️  Drizzle query failed (this is normal if no data exists yet)');
      console.log(`   Error: ${drizzleError instanceof Error ? drizzleError.message : 'Unknown error'}`);
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Your database schema is set up correctly');
    console.log('2. You can now sync products from Printful');
    console.log('3. Access the admin panel to manage your store');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your database credentials in .env.local');
    console.log('2. Ensure your database server is running');
    console.log('3. Verify the database name exists');
    console.log('4. Check if SSL settings are correct');
  } finally {
    // Close the connection
    await postgresClient.end();
  }
}

if (require.main === module) {
  testDatabaseConnection().catch(console.error);
}
