#!/usr/bin/env tsx

import { PrintfulClient } from "printful-request";

async function testPrintfulAPI() {
  // Use the API key directly to avoid environment issues
  const PRINTFUL_API_KEY = "rl9X3zsZhZAACtl22OWc6p5JvfIPkkomDjnmFaXG";
  
  console.log('🔍 Testing Printful API connection...');
  console.log(`🔑 Using API Key: ${PRINTFUL_API_KEY.substring(0, 8)}...`);
  
  const printful = new PrintfulClient(PRINTFUL_API_KEY);
  
  try {
    // Skip store info test due to permission issues
    console.log('\n⚠️ Skipping store info (permission issue)');
    
    // Test products endpoint directly
    console.log('\n📦 Testing products endpoint...');
    const productsResponse = await printful.get('store/products', {
      offset: 0,
      limit: 10,
    }) as any;
    
    console.log(`✅ Products Response:`, JSON.stringify(productsResponse, null, 2));
    
    if (productsResponse.result && productsResponse.result.length > 0) {
      console.log(`\n🎉 Found ${productsResponse.result.length} products!`);
      
      // Test detailed product info
      const firstProduct = productsResponse.result[0];
      console.log(`\n🔍 Testing detailed info for product: ${firstProduct.name}`);
      
      const detailResponse = await printful.get(`store/products/${firstProduct.id}`) as any;
      console.log('✅ Product Detail:', JSON.stringify(detailResponse, null, 2));
      
    } else {
      console.log('\n❌ No products found in store!');
      console.log('🔍 This explains why syncs are completing with 0 products.');
    }
    
  } catch (error) {
    console.error('❌ Printful API Error:', error);
  }
}

testPrintfulAPI();
