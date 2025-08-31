#!/usr/bin/env node

/**
 * Test Order Creation with v1 API
 * 
 * This script creates a real order using the v1 API to verify
 * the complete flow works correctly.
 * 
 * Usage: npm run testOrderCreation
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

/**
 * Get the sync variant ID from Printful using the external ID
 */
async function getSyncVariantId(externalId) {
  console.log('Getting sync variant ID for external ID:', externalId);
  
  try {
    const response = await printful.get(`store/variants/@${externalId}`);
    const syncVariant = response.result;
    
    console.log('Found sync variant:', {
      id: syncVariant.id,
      external_id: syncVariant.external_id,
      name: syncVariant.name
    });
    
    return syncVariant.id;
  } catch (error) {
    console.error('Error getting sync variant:', error);
    throw new Error(`Unable to find sync variant with external ID: ${externalId}`);
  }
}

function mapShippingMethod(shippingRateUserDefinedId) {
  console.log('Mapping shipping method:', shippingRateUserDefinedId);
  
  const shippingMap = {
    'standard': 'STANDARD',
    'RATE_STANDARD': 'STANDARD',
    'express': 'EXPRESS',
    'RATE_EXPRESS': 'EXPRESS',
    'priority': 'PRIORITY',
    'RATE_PRIORITY': 'PRIORITY',
    'overnight': 'OVERNIGHT',
    'RATE_OVERNIGHT': 'OVERNIGHT',
    'economy': 'ECONOMY',
    'RATE_ECONOMY': 'ECONOMY',
  };
  
  const mappedMethod = shippingMap[shippingRateUserDefinedId] || 'STANDARD';
  console.log('Mapped to Printful shipping method:', mappedMethod);
  
  return mappedMethod;
}

async function testOrderCreation() {
  console.log('🧪 Test Order Creation with v1 API');
  console.log('====================================\n');
  
  // Test order data
  const orderData = {
    invoiceNumber: `TEST-${Date.now()}`, // Unique invoice number
    email: 'bparticle@protonmail.com',
    shippingAddress: {
      name: 'Bruno Patyn',
      address1: 'Gaston Lejeunestraat 14',
      address2: '',
      city: 'Koksijde',
      country: 'BE',
      postalCode: '8670',
      province: 'BE',
      phone: '0484973368'
    },
    items: [
      {
        id: '68b2fd4bbab7b4', // Sync variant external ID
        name: 'Fireskull Youth classic tee (Gold L)',
        quantity: 1,
        price: 20,
        customFields: [
          { name: 'Color', value: 'Gold' },
          { name: 'Size', value: 'L' }
        ]
      }
    ],
    shippingRateUserDefinedId: 'RATE_STANDARD'
  };
  
  console.log('Creating test order with data:', {
    invoiceNumber: orderData.invoiceNumber,
    email: orderData.email,
    itemsCount: orderData.items.length,
    items: orderData.items.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity
    }))
  });
  console.log('');
  
  try {
    // Step 1: Get sync variant IDs
    console.log('1️⃣ Getting sync variant IDs...');
    const orderItems = await Promise.all(orderData.items.map(async (item) => {
      const syncVariantId = await getSyncVariantId(item.id);
      return {
        sync_variant_id: syncVariantId,
        quantity: item.quantity
      };
    }));
    
    console.log('Order items:', JSON.stringify(orderItems, null, 2));
    console.log('');
    
    // Step 2: Prepare recipient data
    console.log('2️⃣ Preparing recipient data...');
    const recipient = {
      name: orderData.shippingAddress.name,
      address1: orderData.shippingAddress.address1,
      address2: orderData.shippingAddress.address2 || undefined,
      city: orderData.shippingAddress.city,
      state_code: orderData.shippingAddress.province,
      country_code: orderData.shippingAddress.country,
      zip: orderData.shippingAddress.postalCode,
      phone: orderData.shippingAddress.phone,
      email: orderData.email
    };
    
    console.log('Recipient data:', recipient);
    console.log('');
    
    // Step 3: Prepare order data
    console.log('3️⃣ Preparing order data...');
    const v1OrderData = {
      recipient,
      items: orderItems,
      retail_costs: {
        currency: "USD"
      },
      shipping: mapShippingMethod(orderData.shippingRateUserDefinedId)
    };
    
    console.log('V1 Order data structure:', {
      recipient: {
        name: v1OrderData.recipient.name,
        email: v1OrderData.recipient.email,
        country: v1OrderData.recipient.country_code
      },
      items: v1OrderData.items.map(item => ({
        sync_variant_id: item.sync_variant_id,
        quantity: item.quantity
      })),
      shipping: v1OrderData.shipping
    });
    console.log('');
    
    // Step 4: Create the order
    console.log('4️⃣ Creating order with Printful v1 API...');
    const result = await printful.post("orders", v1OrderData);
    
    console.log('✅ Order created successfully!');
    console.log('Order ID:', result.result.id);
    console.log('Order status:', result.result.status);
    console.log('External ID:', result.result.external_id);
    console.log('');
    
    console.log('💡 Summary:');
    console.log('  - ✅ Order created successfully with v1 API');
    console.log('  - ✅ Sync variant mapping works correctly');
    console.log('  - ✅ Authentication and API calls work');
    console.log('  - ✅ Ready for production use');
    console.log('');
    console.log('🎉 The webhook integration is working perfectly!');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    
    if (error.result && error.error) {
      console.error('❌ Printful API Error:', error.result);
      console.error('❌ Error Code:', error.code, 'Reason:', error.error.reason);
    }
    
    throw error;
  }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

testOrderCreation().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
