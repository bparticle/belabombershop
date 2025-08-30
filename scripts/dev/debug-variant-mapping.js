#!/usr/bin/env node

/**
 * Debug Variant Mapping Script
 * 
 * This script helps debug the relationship between sync variant IDs and catalog variant IDs
 * to understand why the webhook is failing with "item is discontinued" error.
 * 
 * Usage: npm run debugVariants
 */

const { PrintfulClient } = require("printful-request");
require('dotenv').config({ path: '.env' });

// Validate environment
if (!process.env.PRINTFUL_API_KEY) {
  console.error('❌ PRINTFUL_API_KEY environment variable is required');
  console.error('Please add it to your .env file');
  process.exit(1);
}

const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY);

async function debugVariantMapping() {
  console.log('🔍 Debug Variant Mapping Tool');
  console.log('=====================================\n');
  
  // The problematic variant ID from the error
  const problematicVariantId = '68b2fd4bbab7b4'; // Fireskull Gold L variant
  
  console.log(`🔍 Analyzing problematic variant ID: ${problematicVariantId}\n`);
  
  try {
    // First, try to get the sync variant details
    console.log('1️⃣ Getting sync variant details...');
    const syncVariantResponse = await printful.get(`store/variants/@${problematicVariantId}`);
    const syncVariant = syncVariantResponse.result;
    
    console.log('Sync Variant Details:');
    console.log('  ID:', syncVariant.id);
    console.log('  External ID:', syncVariant.external_id);
    console.log('  Name:', syncVariant.name);
    console.log('  Variant ID:', syncVariant.variant_id);
    console.log('  Product ID:', syncVariant.product_id);
    console.log('  Color:', syncVariant.color);
    console.log('  Size:', syncVariant.size);
    console.log('  Retail Price:', syncVariant.retail_price);
    console.log('  Is Enabled:', syncVariant.is_enabled);
    console.log('  In Stock:', syncVariant.in_stock);
    console.log('  Is Ignored:', syncVariant.is_ignored);
    console.log('');
    
    // Check if there are files/designs
    if (syncVariant.files && syncVariant.files.length > 0) {
      console.log('📁 Design Files:');
      syncVariant.files.forEach((file, index) => {
        console.log(`  File ${index + 1}:`);
        console.log('    ID:', file.id);
        console.log('    Type:', file.type);
        console.log('    URL:', file.url);
        console.log('    Preview URL:', file.preview_url);
        console.log('');
      });
    } else {
      console.log('❌ No design files found in sync variant');
      console.log('');
    }
    
    // Now get the product details to see all variants
    console.log('2️⃣ Getting product details...');
    const productResponse = await printful.get(`sync/products/${syncVariant.product_id}`);
    const product = productResponse.result;
    
    console.log('Product Details:');
    console.log('  Product ID:', product.id);
    console.log('  External ID:', product.external_id);
    console.log('  Name:', product.name);
    console.log('  Variants Count:', product.variants?.length || 0);
    console.log('');
    
    // Show all variants for this product
    if (product.variants && product.variants.length > 0) {
      console.log('3️⃣ All Variants for this Product:');
      product.variants.forEach((variant, index) => {
        console.log(`  Variant ${index + 1}:`);
        console.log('    Sync Variant ID:', variant.id);
        console.log('    External ID:', variant.external_id);
        console.log('    Variant ID (catalog):', variant.variant_id);
        console.log('    Name:', variant.name);
        console.log('    Color:', variant.color);
        console.log('    Size:', variant.size);
        console.log('    Is Enabled:', variant.is_enabled);
        console.log('    In Stock:', variant.in_stock);
        console.log('    Is Ignored:', variant.is_ignored);
        
        // Check files for this variant
        if (variant.files && variant.files.length > 0) {
          console.log('    Files:', variant.files.length);
          variant.files.forEach((file, fileIndex) => {
            console.log(`      File ${fileIndex + 1}: ${file.type} - ${file.url}`);
          });
        } else {
          console.log('    Files: None');
        }
        console.log('');
      });
    }
    
    // Try to get catalog variant details using the variant_id
    if (syncVariant.variant_id) {
      console.log('4️⃣ Getting catalog variant details...');
      try {
        const catalogVariantResponse = await printful.get(`products/variant/${syncVariant.variant_id}`);
        const catalogVariant = catalogVariantResponse.result;
        
        console.log('Catalog Variant Details:');
        console.log('  Catalog Variant ID:', catalogVariant.id);
        console.log('  Name:', catalogVariant.name);
        console.log('  Color:', catalogVariant.color);
        console.log('  Size:', catalogVariant.size);
        console.log('  Is Discontinued:', catalogVariant.is_discontinued);
        console.log('');
      } catch (catalogError) {
        console.log('❌ Error getting catalog variant details:', catalogError.message);
        console.log('');
      }
    }
    
    // Test the v2 API with the catalog variant ID
    if (syncVariant.variant_id) {
      console.log('5️⃣ Testing v2 API with catalog variant ID...');
      console.log('  Catalog Variant ID to test:', syncVariant.variant_id);
      console.log('  This should be used as catalog_variant_id in v2 API');
      console.log('');
    }
    
    console.log('💡 Analysis:');
    console.log('  - Sync Variant ID (what we get from Snipcart):', syncVariant.id);
    console.log('  - External ID (what we use in Snipcart):', syncVariant.external_id);
    console.log('  - Catalog Variant ID (what v2 API needs):', syncVariant.variant_id);
    console.log('');
    console.log('  The issue is that we need to use the catalog_variant_id in the v2 API,');
    console.log('  not the sync variant ID or external ID.');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.result && error.error) {
      console.error('❌ Printful API Error:', error.result);
      console.error('❌ Error Code:', error.code, 'Reason:', error.error.reason);
    }
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

debugVariantMapping().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
