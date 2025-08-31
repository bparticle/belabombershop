const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import postgres client
const postgres = require('postgres');

async function checkAllProducts() {
  console.log('🔍 Checking all products and their variants...');
  
  // Create connection string
  const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=${process.env.DATABASE_SSL === 'true' ? 'require' : 'disable'}`;
  
  // Create postgres client
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Get all products with variant counts
    const products = await sql`
      SELECT 
        p.id,
        p.name,
        p.external_id,
        p.printful_id,
        p.is_active,
        COUNT(v.id) as variant_count
      FROM products p
      LEFT JOIN variants v ON p.id = v.product_id
      GROUP BY p.id, p.name, p.external_id, p.printful_id, p.is_active
      ORDER BY p.name
    `;
    
    console.log(`\n📦 Products Summary (${products.length} total):`);
    products.forEach(product => {
      console.log(`  - ${product.name}`);
      console.log(`    External ID: ${product.external_id}`);
      console.log(`    Variants: ${product.variant_count}`);
      console.log(`    Active: ${product.is_active}`);
      console.log('');
    });

    // Check total variants
    const totalVariants = await sql`SELECT COUNT(*) as count FROM variants`;
    console.log(`🎨 Total variants in database: ${totalVariants[0].count}`);

    // Check if we have any variants at all
    if (totalVariants[0].count === 0) {
      console.log('\n❌ NO VARIANTS FOUND! This suggests the sync process failed to save variants.');
      console.log('💡 Solution: Run the sync script again to populate variants.');
    }

  } catch (error) {
    console.error('❌ Error checking products:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
checkAllProducts()
  .then(() => {
    console.log('\n🎉 Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Check failed:', error);
    process.exit(1);
  });
