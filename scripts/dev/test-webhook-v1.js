// Using built-in fetch (available in Node.js 18+)

// Mock environment variables
process.env.PRINTFUL_API_KEY = 'test-key';

// Test data that mimics what Snipcart would send
const testWebhookData = {
  eventName: 'order.completed',
  mode: 'Live',
  createdOn: '2024-01-01T00:00:00.000Z',
  content: {
    items: [
      {
        id: '68b2fd4bbab7b4', // Example sync variant external ID
        quantity: 1,
        price: 20.00,
        name: 'Fireskull Youth classic tee (Gold L)',
        customFields: [
          { name: 'Color', value: 'Gold' },
          { name: 'Size', value: 'L' }
        ]
      }
    ],
    shippingAddress: {
      name: 'Bruno Patyn',
      company: '',
      address1: 'Gastfeldstraße',
      address2: '',
      city: 'Bremen',
      province: 'HB',
      country: 'DE',
      postalCode: '28201',
      phone: '0484973368'
    },
    shippingRateUserDefinedId: 'RATE_STANDARD',
    invoiceNumber: 'SNIP-1040',
    email: 'bparticle@protonmail.com'
  },
  invoiceNumber: 'SNIP-1040',
  email: 'bparticle@protonmail.com'
};

async function testWebhookV1() {
  try {
    console.log('Testing webhook v1 endpoint...');
    
    const response = await fetch('http://localhost:3000/api/snipcart/webhook-v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-snipcart-requesttoken': 'test-token'
      },
      body: JSON.stringify(testWebhookData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Webhook v1 test successful!');
    } else {
      console.log('❌ Webhook v1 test failed!');
    }
  } catch (error) {
    console.error('Error testing webhook v1:', error);
  }
}

// Run the test
testWebhookV1();
