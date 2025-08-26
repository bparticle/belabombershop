// Simple test to check enhancement system
const { PRODUCT_ENHANCEMENTS, hasProductEnhancement } = require('./src/lib/product-enhancements.ts');

console.log('🔍 Testing Product Enhancement System\n');

console.log('📋 Current enhancements:');
console.log('========================');
Object.keys(PRODUCT_ENHANCEMENTS).forEach(key => {
  console.log(`- ${key}: ${PRODUCT_ENHANCEMENTS[key].description.substring(0, 50)}...`);
});

console.log('\n🧪 Testing specific IDs:');
console.log('========================');
const testIds = ['390878639', 'example-product-1', 'example-product-2'];

testIds.forEach(id => {
  const hasEnhancement = hasProductEnhancement(id);
  console.log(`${id}: ${hasEnhancement ? '✅ Found' : '❌ Not found'}`);
});

console.log('\n💡 Troubleshooting:');
console.log('1. Make sure you restarted the dev server after editing product-enhancements.ts');
console.log('2. Check that the external_id matches exactly (case-sensitive)');
console.log('3. The external_id is NOT the same as the product ID from the URL');
console.log('4. You can find the external_id in your Printful dashboard');
