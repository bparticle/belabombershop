#!/usr/bin/env node

/**
 * Tax/VAT Setup Test Script
 * 
 * This script helps verify that your tax calculation is working correctly.
 * Run this after setting up your environment variables and Snipcart tax webhook.
 */

const https = require('https');
const http = require('http');

// Configuration - Update these values
const config = {
  // Your domain (without protocol)
  domain: 'localhost:3000', // Change this to your actual domain
  protocol: 'http', // Change to 'https' for production
  
  // Test data - Replace with actual variant IDs from your Printful store
  testVariantId: '12345', // Replace with an actual variant ID
  testPrice: 25.00
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test tax endpoint with different addresses
 */
async function testTaxEndpoint(address, expectedVAT = null) {
  const url = `${config.protocol}://${config.domain}/api/snipcart/tax`;
  const testData = {
    eventName: 'taxes.calculate',
    content: {
      items: [
        {
          id: config.testVariantId,
          quantity: 1,
          price: config.testPrice
        }
      ],
      shippingAddress: address,
      shippingRateUserDefinedId: 'standard'
    }
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: testData
    });

    console.log(`\n📍 Testing with ${address.country} address:`);
    console.log(`   Address: ${address.address1}, ${address.city}, ${address.country}`);
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      if (response.data.taxes && response.data.taxes.length > 0) {
        const tax = response.data.taxes[0];
        console.log(`   ✅ Tax calculated: ${tax.name} - $${tax.amount} (${tax.rate}%)`);
        
        if (expectedVAT && tax.amount > 0) {
          console.log(`   ✅ VAT is being charged as expected`);
        } else if (expectedVAT && tax.amount === 0) {
          console.log(`   ⚠️  Expected VAT but got 0 - check Printful VAT settings`);
        } else if (!expectedVAT && tax.amount === 0) {
          console.log(`   ✅ No VAT charged (expected for non-EU address)`);
        }
      } else {
        console.log(`   ⚠️  No taxes returned`);
        if (expectedVAT) {
          console.log(`   ❌ Expected VAT but none calculated`);
        } else {
          console.log(`   ✅ No VAT (expected for non-EU address)`);
        }
      }
    } else {
      console.log(`   ❌ Tax endpoint failed`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log(`   ❌ Error testing tax endpoint:`, error.message);
  }
}

/**
 * Test different address scenarios
 */
async function testAllTaxScenarios() {
  console.log('🧮 Testing Tax/VAT Calculation...\n');
  
  // Test addresses
  const testAddresses = [
    {
      name: 'UK (20% VAT)',
      address: {
        address1: '123 Test St',
        city: 'London',
        country: 'GB',
        postalCode: 'SW1A 1AA',
        province: 'England'
      },
      expectedVAT: true
    },
    {
      name: 'Germany (19% VAT)',
      address: {
        address1: '123 Test St',
        city: 'Berlin',
        country: 'DE',
        postalCode: '10115',
        province: 'Berlin'
      },
      expectedVAT: true
    },
    {
      name: 'France (20% VAT)',
      address: {
        address1: '123 Test St',
        city: 'Paris',
        country: 'FR',
        postalCode: '75001',
        province: 'Île-de-France'
      },
      expectedVAT: true
    },
    {
      name: 'US (No VAT)',
      address: {
        address1: '123 Test St',
        city: 'New York',
        country: 'US',
        postalCode: '10001',
        province: 'NY'
      },
      expectedVAT: false
    },
    {
      name: 'Canada (No VAT)',
      address: {
        address1: '123 Test St',
        city: 'Toronto',
        country: 'CA',
        postalCode: 'M5V 3A8',
        province: 'ON'
      },
      expectedVAT: false
    }
  ];

  for (const testCase of testAddresses) {
    await testTaxEndpoint(testCase.address, testCase.expectedVAT);
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  console.log('🔧 Checking Environment Variables...');
  
  const requiredVars = [
    'PRINTFUL_API_KEY',
    'NEXT_PUBLIC_SNIPCART_API_KEY'
  ];

  console.log('\nRequired Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: Not set`);
    }
  });
}

/**
 * Test Snipcart webhook configuration
 */
async function testSnipcartWebhookConfig() {
  console.log('\n🔗 Testing Snipcart Webhook Configuration...');
  
  // Test if tax endpoint is accessible
  const url = `${config.protocol}://${config.domain}/api/snipcart/tax`;
  
  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: {
        eventName: 'taxes.calculate',
        content: {
          items: [{ id: 'test', quantity: 1, price: 10 }],
          shippingAddress: {
            address1: '123 Test',
            city: 'Test',
            country: 'GB',
            postalCode: 'TEST'
          }
        }
      }
    });

    if (response.status === 200) {
      console.log('  ✅ Tax endpoint is accessible');
    } else {
      console.log(`  ⚠️  Tax endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    console.log('  ❌ Tax endpoint not accessible:', error.message);
  }
}

/**
 * Main test function
 */
async function runTaxTests() {
  console.log('🧪 Tax/VAT Setup Test Suite\n');
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Test webhook configuration
  await testSnipcartWebhookConfig();
  
  // Test tax calculations
  await testAllTaxScenarios();
  
  console.log('\n📋 Tax Setup Summary:');
  console.log('1. Make sure your development server is running: npm run dev');
  console.log('2. Configure Snipcart tax webhook at: https://yourdomain.com/api/snipcart/tax');
  console.log('3. Verify Printful VAT settings are configured correctly');
  console.log('4. Test with real EU addresses in your store');
  console.log('5. Check server logs for tax API calls');
  
  console.log('\n🔍 Common Issues:');
  console.log('- If no VAT is calculated for EU addresses: Check Printful VAT settings');
  console.log('- If tax API is not called: Verify Snipcart tax webhook configuration');
  console.log('- If tax calculation fails: Check server logs for errors');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTaxTests().catch(console.error);
}

module.exports = {
  testTaxEndpoint,
  testAllTaxScenarios,
  checkEnvironmentVariables
};
