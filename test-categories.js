// Simple test script for category detection
const { determineProductCategory } = require('./src/lib/category-config.ts');

console.log('Testing category detection...\n');

const testCases = [
  {
    name: 'Kids T-Shirt',
    tags: ['kids', 'children'],
    metadata: {},
    expected: 'children'
  },
  {
    name: 'Adult Hoodie',
    tags: ['adult', 'men'],
    metadata: {},
    expected: 'adults'
  },
  {
    name: 'Home Decor Pillow',
    tags: ['home', 'decor'],
    metadata: {},
    expected: 'home-living'
  },
  {
    name: 'Generic T-Shirt',
    tags: [],
    metadata: {},
    expected: 'adults' // Now defaults to adults instead of unisex
  }
];

testCases.forEach((testCase, index) => {
  const result = determineProductCategory({
    name: testCase.name,
    tags: testCase.tags,
    metadata: testCase.metadata
  });

  const success = result === testCase.expected;
  console.log(`Test ${index + 1}: ${success ? '✅' : '❌'}`);
  console.log(`  Input: "${testCase.name}" with tags [${testCase.tags.join(', ')}]`);
  console.log(`  Expected: ${testCase.expected}`);
  console.log(`  Got: ${result}`);
  console.log('');
});
