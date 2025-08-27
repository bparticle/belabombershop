import { determineProductCategory, getCategoryById, getCategoryBySlug } from './category-config';

// Simple test function to verify category detection
export function testCategoryDetection() {
  console.log('Testing category detection...\n');

  // Test cases
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
      name: 'Backpack',
      tags: ['accessory'],
      metadata: {},
      expected: 'accessories'
    },
    {
      name: 'Generic T-Shirt',
      tags: [],
      metadata: {},
      expected: 'unisex'
    },
    {
      name: 'Baby Onesie',
      tags: [],
      metadata: { category: 'children' },
      expected: 'children'
    }
  ];

  let passed = 0;
  let total = testCases.length;

  testCases.forEach((testCase, index) => {
    const result = determineProductCategory({
      name: testCase.name,
      tags: testCase.tags,
      metadata: testCase.metadata
    });

    const success = result === testCase.expected;
    if (success) passed++;

    console.log(`Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`  Input: "${testCase.name}" with tags [${testCase.tags.join(', ')}]`);
    console.log(`  Expected: ${testCase.expected}`);
    console.log(`  Got: ${result}`);
    console.log('');
  });

  console.log(`Results: ${passed}/${total} tests passed`);
  return passed === total;
}

// Test category utility functions
export function testCategoryUtilities() {
  console.log('Testing category utilities...\n');

  // Test getCategoryById
  const childrenCategory = getCategoryById('children');
  console.log('getCategoryById("children"):', childrenCategory ? '✅' : '❌');

  // Test getCategoryBySlug
  const adultsCategory = getCategoryBySlug('adults');
  console.log('getCategoryBySlug("adults"):', adultsCategory ? '✅' : '❌');

  // Test invalid category
  const invalidCategory = getCategoryById('invalid');
  console.log('getCategoryById("invalid"):', !invalidCategory ? '✅' : '❌');

  console.log('');
}

// Run tests if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  testCategoryDetection();
  testCategoryUtilities();
}
