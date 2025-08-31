const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import postgres client
const postgres = require('postgres');

async function debugProduct() {
  console.log('🔍 Debugging product 68b2fd4bbab2e9...');
  
  // Create connection string
  const connectionString = `postgresql://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}?sslmode=${process.env.DATABASE_SSL === 'true' ? 'require' : 'disable'}`;
  
  // Create postgres client
  const sql = postgres(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  try {
    // Get the product
    const products = await sql`
      SELECT * FROM products WHERE external_id = '68b2fd4bbab2e9'
    `;
    
    if (products.length === 0) {
      console.log('❌ Product not found');
      return;
    }
    
    const product = products[0];
    console.log(`📦 Product: ${product.name}`);
    console.log(`   ID: ${product.id}`);
    console.log(`   Printful ID: ${product.printful_id}`);
    console.log(`   External ID: ${product.external_id}`);
    console.log(`   Is Active: ${product.is_active}`);
    console.log(`   Is Ignored: ${product.is_ignored}`);

    // Get variants
    const variants = await sql`
      SELECT * FROM variants WHERE product_id = ${product.id}
    `;
    
    console.log(`\n🎨 Variants (${variants.length} total):`);
    variants.forEach((variant, index) => {
      console.log(`  ${index + 1}. ${variant.name}`);
      console.log(`     ID: ${variant.id}`);
      console.log(`     Printful ID: ${variant.printful_id}`);
      console.log(`     External ID: ${variant.external_id}`);
      console.log(`     Is Enabled: ${variant.is_enabled}`);
      console.log(`     Is In Stock: ${variant.in_stock}`);
      console.log(`     Is Ignored: ${variant.is_ignored}`);
      console.log(`     Color: ${variant.color}`);
      console.log(`     Size: ${variant.size}`);
      
      // Check files
      if (variant.files) {
        const files = JSON.parse(variant.files);
        console.log(`     Files: ${files.length} total`);
        
        // Check for preview files
        const previewFiles = files.filter(f => f.type === 'preview');
        console.log(`     Preview files: ${previewFiles.length}`);
        
        if (previewFiles.length > 0) {
          console.log(`     First preview URL: ${previewFiles[0].preview_url}`);
        }
      } else {
        console.log(`     Files: null/undefined`);
      }
      
      console.log('');
    });

    // Check which variants would pass the filter
    console.log('🔍 Filter Analysis:');
    const enabledVariants = variants.filter(v => v.is_enabled);
    console.log(`  Enabled variants: ${enabledVariants.length}`);
    
    enabledVariants.forEach((variant, index) => {
      console.log(`  ${index + 1}. ${variant.name} - Enabled: ${variant.is_enabled}`);
      
      if (variant.files) {
        const files = JSON.parse(variant.files);
        const previewFiles = files.filter(f => 
          f && 
          f.type === "preview" && 
          f.preview_url && 
          typeof f.preview_url === 'string' && 
          f.preview_url.trim() !== '' && 
          f.preview_url.startsWith('http')
        );
        console.log(`     Preview files after filtering: ${previewFiles.length}`);
      }
    });

  } catch (error) {
    console.error('❌ Error debugging product:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the script
debugProduct()
  .then(() => {
    console.log('\n🎉 Debug complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Debug failed:', error);
    process.exit(1);
  });
