// Simple test script for webhook

const testData = {
  "eventName": "order.completed",
  "content": {
    "items": [
      {
        "id": "4012",
        "url": "/product/391242016",
        "customFields": [
          {"name": "Color", "value": "Black"},
          {"name": "Size", "value": "XS"}
        ],
        "quantity": 1,
        "price": 20,
        "name": "Test Product"
      }
    ],
    "shippingAddress": {
      "name": "Test User",
      "address1": "123 Test St",
      "city": "Test City",
      "country": "US",
      "province": "CA",
      "postalCode": "90210"
    },
    "shippingRateUserDefinedId": "RATE_STANDARD"
  },
  "invoiceNumber": "TEST-123",
  "email": "test@example.com"
};

async function testWebhook() {
  try {
    console.log('Testing webhook...');
    
    const response = await fetch('http://localhost:3000/api/snipcart/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-snipcart-requesttoken': 'test-token'
      },
      body: JSON.stringify(testData)
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWebhook();
