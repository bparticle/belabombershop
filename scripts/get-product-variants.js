#!/usr/bin/env node

/**
 * Product Variants Debugging Script
 * 
 * This script fetches all products from Printful and displays their variants
 * with external IDs, colors, and sizes. Use this to set up product enhancements.
 * 
 * Usage: npm run getVariants
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

async function getAllProducts() {
  try {
    console.log('🔄 Fetching products from Printful...');
    const { result } = await printful.get('store/products');
    return result;
  } catch (error) {
    console.error('❌ Error fetching products:', error.message);
    process.exit(1);
  }
}

async function getProductDetails(productId) {
  try {
    const response = await printful.get(`store/products/${productId}`);
    const { sync_product, sync_variants } = response.result;
    
    // Combine product info with variants
    return {
      ...sync_product,
      variants: sync_variants
    };
  } catch (error) {
    console.error(`❌ Error fetching product ${productId}:`, error);
    
    // Handle Printful API errors specifically
    if (error.result && error.error) {
      console.error(`❌ Printful API Error: ${error.result}`);
      console.error(`❌ Error Code: ${error.code}, Reason: ${error.error.reason}`);
    } else {
      console.error(`❌ Error details:`, {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        response: error.response?.data
      });
    }
    
    console.error(`💡 Suggestion: Check this product in your Printful dashboard or try again later.`);
    return null;
  }
}

function debugProductVariants(product) {
  console.log(`\n📦 Product: ${product.name} (${product.external_id})`);
  console.log('Available variants:');
  
  // Check if variants exist and is an array
  if (!product.variants || !Array.isArray(product.variants)) {
    console.log('  No variants found or invalid variant structure');
    return;
  }
  
  product.variants.forEach((variant, index) => {
    const color = variant.color || 'N/A';
    const size = variant.size || 'N/A';
    console.log(`  ${index + 1}. ${variant.name} - Color: ${color} - Size: ${size} - External ID: ${variant.external_id}`);
  });
  
  console.log('---');
}

function generateEnhancementTemplate(product) {
  const defaultVariantId = product.variants && Array.isArray(product.variants) && product.variants[0] 
    ? product.variants[0].external_id 
    : '';
    
  const template = `  '${product.external_id}': {
    description: '${product.name} - Add your custom description here',
    shortDescription: '${product.name} - Add your short description here',
    defaultVariant: '${defaultVariantId}', // TODO: Set your preferred default variant
    features: [
      'Feature 1',
      'Feature 2'
    ],
    specifications: {
      material: 'Material info',
      weight: 'Weight info',
      fit: 'Fit info',
      printMethod: 'Print method info'
    },
    additionalImages: [
      // Add your additional image URLs here
    ],
    seo: {
      keywords: ['keyword1', 'keyword2'],
      metaDescription: 'SEO meta description'
    }
  },`;
  
  return template;
}

async function main() {
  console.log('🔍 Product Variants Debugging Tool');
  console.log('=====================================\n');
  
  const products = await getAllProducts();
  
  if (!products || products.length === 0) {
    console.log('❌ No products found in your Printful store');
    return;
  }
  
  console.log(`✅ Found ${products.length} products\n`);
  
  // Fetch detailed product information for each product
  const detailedProducts = [];
  for (const product of products) {
    console.log(`🔄 Fetching details for: ${product.name}`);
    const detailedProduct = await getProductDetails(product.id);
    if (detailedProduct) {
      detailedProducts.push(detailedProduct);
    }
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Display all variants for each product
  detailedProducts.forEach(product => {
    debugProductVariants(product);
  });
  
  // Generate enhancement templates
  console.log('\n📝 Enhancement Templates');
  console.log('========================');
  console.log('Copy these templates to src/lib/product-enhancements.ts:');
  console.log('');
  
  detailedProducts.forEach(product => {
    console.log(generateEnhancementTemplate(product));
  });
  
  console.log('\n💡 Tips:');
  console.log('1. Copy the external_id values to use as keys in PRODUCT_ENHANCEMENTS');
  console.log('2. Set defaultVariant to your preferred variant external_id');
  console.log('3. Add your custom descriptions, features, and specifications');
  console.log('4. Add additional image URLs to additionalImages array');
  console.log('5. Customize SEO keywords and meta descriptions');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

main().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
