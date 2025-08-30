#!/usr/bin/env node

/**
 * Test File Structure Script
 * 
 * This script tests how to get the actual design files from sync variants
 * to use in the v2 API placements.
 * 
 * Usage: npm run testFileStructure
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

async function testFileStructure() {
  console.log('🔍 Test File Structure');
  console.log('=====================================\n');
  
  const variantId = '68b2fd4bbab7b4'; // Fireskull Gold L variant
  
  try {
    // Get sync variant details
    console.log('1️⃣ Getting sync variant details...');
    const syncVariantResponse = await printful.get(`store/variants/@${variantId}`);
    const syncVariant = syncVariantResponse.result;
    
    console.log('Sync variant files:');
    console.log(JSON.stringify(syncVariant.files, null, 2));
    console.log('');
    
    // Try to get individual file details
    if (syncVariant.files && syncVariant.files.length > 0) {
      console.log('2️⃣ Testing individual file access...');
      
      for (const file of syncVariant.files) {
        console.log(`Testing file ID: ${file.id}, Type: ${file.type}`);
        
        try {
          // Try to get file details
          const fileResponse = await printful.get(`store/files/${file.id}`);
          console.log('File details:', JSON.stringify(fileResponse.result, null, 2));
        } catch (fileError) {
          console.log('❌ Error getting file details:', fileError.message);
        }
        console.log('');
      }
    }
    
    // Check if we can get the sync product to see if files are there
    console.log('3️⃣ Trying to get sync product...');
    try {
      const productResponse = await printful.get(`store/products/${syncVariant.product_id}`);
      const product = productResponse.result;
      
      console.log('Product sync_variants:');
      if (product.sync_variants && product.sync_variants.length > 0) {
        const matchingVariant = product.sync_variants.find(v => v.external_id === variantId);
        if (matchingVariant) {
          console.log('Matching variant files:');
          console.log(JSON.stringify(matchingVariant.files, null, 2));
        }
      }
    } catch (productError) {
      console.log('❌ Error getting product:', productError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

testFileStructure().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
