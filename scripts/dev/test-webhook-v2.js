// Using built-in fetch (available in Node.js 18+)

// Mock environment variables
process.env.PRINTFUL_API_KEY = 'test-key';

// Test data that mimics what Snipcart would send
const testWebhookData = {
  eventName: 'order.completed',
  mode: 'Test',
  createdOn: '2025-08-30T21:03:27.2345862Z',
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
      address1: 'Gaston Lejeunestraat 14',
      address2: '',
      city: 'Koksijde',
      province: 'BE',
      country: 'BE',
      postalCode: '8670',
      phone: '0484973368'
    },
    shippingRateUserDefinedId: 'RATE_STANDARD',
    invoiceNumber: 'SNIP-1043',
    email: 'bparticle@protonmail.com'
  },
  invoiceNumber: 'SNIP-1043',
  email: 'bparticle@protonmail.com'
};

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint with v1 implementation...');
    
    const response = await fetch('http://localhost:3000/api/snipcart/webhook', {
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
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed!');
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
}

// Run the test
testWebhook();
