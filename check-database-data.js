const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import postgres client
const postgres = require('postgres');

async function checkDatabaseData() {
  console.log('🔍 Checking database data...');
  
  // Create connection string
  const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=${process.env.DATABASE_SSL === 'true' ? 'require' : 'disable'}`;
  
  // Create postgres client
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Check products
    console.log('\n📦 Products:');
    const products = await sql`SELECT id, printful_id, external_id, name, thumbnail_url FROM products LIMIT 3`;
    products.forEach(product => {
      console.log(`  - ${product.name} (${product.printful_id})`);
      console.log(`    External ID: ${product.external_id}`);
      console.log(`    Thumbnail: ${product.thumbnail_url ? '✅' : '❌'}`);
    });

    // Check variants with files data
    console.log('\n🎨 Variants with files:');
    const variants = await sql`
      SELECT v.id, v.printful_id, v.external_id, v.name, v.color, v.size, v.files, v.options
      FROM variants v 
      JOIN products p ON v.product_id = p.id 
      WHERE p.name LIKE '%Pufferfish%'
      LIMIT 3
    `;
    
    variants.forEach(variant => {
      console.log(`  - ${variant.name} (${variant.printful_id})`);
      console.log(`    Color: ${variant.color}, Size: ${variant.size}`);
      console.log(`    Files: ${variant.files ? JSON.stringify(variant.files).substring(0, 100) + '...' : '❌ No files'}`);
      console.log(`    Options: ${variant.options ? JSON.stringify(variant.options).substring(0, 100) + '...' : '❌ No options'}`);
    });

    // Check if we have any files with type "preview"
    console.log('\n🖼️  Preview files check:');
    const previewFiles = await sql`
      SELECT v.name, v.files
      FROM variants v 
      WHERE v.files IS NOT NULL 
      AND v.files::text LIKE '%preview%'
      LIMIT 3
    `;
    
    if (previewFiles.length > 0) {
      console.log('✅ Found variants with preview files:');
      previewFiles.forEach(variant => {
        console.log(`  - ${variant.name}: ${variant.files.length} files`);
      });
    } else {
      console.log('❌ No preview files found in database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
checkDatabaseData()
  .then(() => {
    console.log('\n🎉 Database check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database check failed:', error);
    process.exit(1);
  });
