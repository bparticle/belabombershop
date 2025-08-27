#!/usr/bin/env node

/**
 * Test Script for Shipping and Order Processing Setup
 * 
 * This script helps verify that your shipping and webhook endpoints are working correctly.
 * Run this after setting up your environment variables and Snipcart configuration.
 */

const https = require('https');
const http = require('http');

// Configuration - Update these values
const config = {
  // Your domain (without protocol)
  domain: 'localhost:3000', // Change this to your actual domain
  protocol: 'http', // Change to 'https' for production
  
  // Test data
  testVariantId: '12345', // Replace with an actual variant ID from your Printful store
  testAddress: {
    country: 'US',
    postalCode: '10001',
    city: 'New York',
    address1: '123 Test St',
    province: 'NY'
  }
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
 * Test shipping endpoint
 */
async function testShippingEndpoint() {
  console.log('🚚 Testing Shipping Endpoint...');
  
  const url = `${config.protocol}://${config.domain}/api/snipcart/shipping`;
  const testData = {
    eventName: 'shippingrates.fetch',
    content: {
      items: [
        {
          id: config.testVariantId,
          quantity: 1
        }
      ],
      shippingAddressCountry: config.testAddress.country,
      shippingAddressPostalCode: config.testAddress.postalCode,
      shippingAddressCity: config.testAddress.city,
      shippingAddress1: config.testAddress.address1,
      shippingAddressProvince: config.testAddress.province
    }
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: testData
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      if (response.data.rates && response.data.rates.length > 0) {
        console.log('✅ Shipping endpoint working! Found shipping rates:');
        response.data.rates.forEach((rate, index) => {
          console.log(`  ${index + 1}. ${rate.description}: $${rate.cost}`);
        });
      } else {
        console.log('⚠️  Shipping endpoint responded but no rates found');
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.log('❌ Shipping endpoint failed');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error testing shipping endpoint:', error.message);
  }
}

/**
 * Test webhook endpoint
 */
async function testWebhookEndpoint() {
  console.log('\n📦 Testing Webhook Endpoint...');
  
  const url = `${config.protocol}://${config.domain}/api/snipcart/webhook`;
  const testData = {
    eventName: 'order.completed',
    mode: 'test',
    createdOn: new Date().toISOString(),
    content: {
      invoiceNumber: 'TEST-ORDER-123',
      email: 'test@example.com',
      shippingAddress: {
        name: 'Test Customer',
        address1: config.testAddress.address1,
        city: config.testAddress.city,
        country: config.testAddress.country,
        postalCode: config.testAddress.postalCode,
        province: config.testAddress.province
      },
      items: [
        {
          id: config.testVariantId,
          quantity: 1,
          name: 'Test Product'
        }
      ]
    }
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'x-snipcart-requesttoken': 'test-token'
      },
      body: testData
    });

    console.log(`Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Webhook endpoint responding correctly');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 401) {
      console.log('⚠️  Webhook endpoint requires proper authentication');
      console.log('This is expected in production with real webhook tokens');
    } else {
      console.log('❌ Webhook endpoint failed');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.log('❌ Error testing webhook endpoint:', error.message);
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

  const optionalVars = [
    'SNIPCART_SECRET_KEY'
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

  console.log('\nOptional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ⚠️  ${varName}: Not set (optional)`);
    }
  });
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Testing Shipping and Order Processing Setup\n');
  
  // Check environment variables
  checkEnvironmentVariables();
  
  // Test endpoints
  await testShippingEndpoint();
  await testWebhookEndpoint();
  
  console.log('\n📋 Summary:');
  console.log('1. Make sure your development server is running: npm run dev');
  console.log('2. Update the domain in this script to match your setup');
  console.log('3. Configure Snipcart webhooks as described in setup-shipping-and-orders.md');
  console.log('4. Test with real orders in your store');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testShippingEndpoint,
  testWebhookEndpoint,
  checkEnvironmentVariables
};
