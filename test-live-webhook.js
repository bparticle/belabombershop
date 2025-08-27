async function testLiveWebhook() {
  const fetch = (await import('node-fetch')).default;
  
  const testData = {
    eventName: "order.completed",
    content: {
      invoiceNumber: "TEST-ORDER-" + Date.now(),
      email: "test@example.com",
      shippingAddress: {
        name: "Test Customer",
        address1: "123 Main St",
        city: "Los Angeles",
        country: "US",
        province: "CA",
        postalCode: "90210"
      },
      items: [
        {
          id: "youth-classic-tee-black-front-68ab56d7b798a",
          quantity: 1
        }
      ],
      shippingRateUserDefinedId: "STANDARD"
    }
  };

  try {
    console.log('🧪 Testing live webhook at https://belabomberman.netlify.app/api/snipcart/webhook');
    console.log('📋 Test data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('https://belabomberman.netlify.app/api/snipcart/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-snipcart-requesttoken': 'test-token'
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    const result = await response.text();
    console.log('📄 Response body:', result);
    
    if (response.ok) {
      console.log('✅ Live webhook test successful!');
      console.log('🎉 Your webhook is working and should send orders to Printful');
    } else {
      console.log('❌ Live webhook test failed');
      console.log('🔧 This might indicate the webhook needs configuration');
    }
  } catch (error) {
    console.error('❌ Error testing live webhook:', error.message);
  }
}

testLiveWebhook();
