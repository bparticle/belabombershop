const { printful } = require('./src/lib/printful-client');

async function debugExternalIds() {
  try {
    console.log('🔍 Fetching product data from Printful...\n');
    
    const { result: productIds } = await printful.get("sync/products");
    
    console.log('📋 Found products:');
    console.log('==================\n');
    
    for (const { id } of productIds) {
      try {
        const { result: { sync_product, sync_variants } } = await printful.get(`sync/products/${id}`);
        
        console.log(`Product ID: ${id}`);
        console.log(`Name: ${sync_product.name}`);
        console.log(`External ID: ${sync_product.external_id || 'NOT SET'}`);
        console.log(`URL: http://localhost:3001/product/${id}`);
        console.log('---');
        
        // Check if this product has an enhancement
        const { hasProductEnhancement } = require('./src/lib/product-enhancements');
        const hasEnhancement = hasProductEnhancement(sync_product.external_id);
        console.log(`Has Enhancement: ${hasEnhancement ? '✅ YES' : '❌ NO'}`);
        console.log('\n');
        
      } catch (error) {
        console.log(`Error fetching product ${id}:`, error.message);
      }
    }
    
    console.log('💡 To add enhancements:');
    console.log('1. Copy the External ID from above');
    console.log('2. Add it to src/lib/product-enhancements.ts');
    console.log('3. Restart the development server');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugExternalIds();
