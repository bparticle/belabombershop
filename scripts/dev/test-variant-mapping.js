#!/usr/bin/env node

/**
 * Test Variant Mapping Script
 * 
 * This script tests the updated variant mapping function to ensure it correctly
 * maps sync variant external IDs to catalog variant IDs.
 * 
 * Usage: npm run testVariantMapping
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

async function testVariantMapping() {
  console.log('🧪 Test Variant Mapping Function');
  console.log('=====================================\n');
  
  // Test with the problematic variant ID from the error
  const testItem = {
    id: '68b307c1899057', // Sync variant external ID
    name: 'Pufferfish Youth classic tee (Royal XS)',
    url: '/product/391244014',
    customFields: [
      { name: 'Color', value: 'Royal' },
      { name: 'Size', value: 'XS' }
    ]
  };
  
  console.log('Testing with item:', {
    id: testItem.id,
    name: testItem.name,
    customFields: testItem.customFields
  });
  console.log('');
  
  try {
    // Simulate the mapping function logic
    console.log('1️⃣ Getting sync variant details for external ID:', testItem.id);
    const syncVariantResponse = await printful.get(`store/variants/@${testItem.id}`);
    const syncVariant = syncVariantResponse.result;
    
    console.log('Sync variant details:', {
      id: syncVariant.id,
      external_id: syncVariant.external_id,
      variant_id: syncVariant.variant_id,
      name: syncVariant.name
    });
    console.log('');
    
    if (syncVariant.variant_id) {
      console.log('✅ SUCCESS: Found catalog variant ID:', syncVariant.variant_id);
      console.log('');
      console.log('💡 This catalog variant ID should be used in the v2 API as catalog_variant_id');
      console.log('');
      
      // Test if this catalog variant ID is valid by trying to get its details
      console.log('2️⃣ Verifying catalog variant ID is valid...');
      try {
        const catalogVariantResponse = await printful.get(`products/variant/${syncVariant.variant_id}`);
        const catalogVariant = catalogVariantResponse.result;
        
        console.log('Catalog variant details:', {
          id: catalogVariant.id,
          name: catalogVariant.name,
          color: catalogVariant.color,
          size: catalogVariant.size,
          is_discontinued: catalogVariant.is_discontinued
        });
        
        if (catalogVariant.is_discontinued) {
          console.log('⚠️  WARNING: This catalog variant is discontinued!');
        } else {
          console.log('✅ Catalog variant is active and available');
        }
        
      } catch (catalogError) {
        console.log('❌ Error getting catalog variant details:', catalogError.message);
      }
      
    } else {
      console.log('❌ ERROR: No catalog variant ID found for sync variant');
    }
    
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

testVariantMapping().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
