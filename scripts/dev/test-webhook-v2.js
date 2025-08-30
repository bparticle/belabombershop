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
        id: '4012', // Example Printful variant ID
        quantity: 1,
        price: 25.99,
        name: 'Test Product - Small'
      }
    ],
    shippingAddress: {
      name: 'John Doe',
      company: 'Test Company',
      address1: '123 Test Street',
      address2: 'Apt 4B',
      city: 'Test City',
      province: 'CA',
      country: 'US',
      postalCode: '90210',
      phone: '+1234567890'
    },
    shippingRateUserDefinedId: 'standard'
  },
  invoiceNumber: 'TEST-ORDER-123',
  email: 'test@example.com'
};

async function testWebhook() {
  try {
    console.log('Testing webhook endpoint with v2 implementation...');
    
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
