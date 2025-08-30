// Test script with real webhook data from the user's order

const testWebhookData = {
  "eventName": "order.completed",
  "mode": "Test",
  "createdOn": "2025-08-30T18:17:32.8065916Z",
  "content": {
    "discounts": [],
    "items": [
      {
        "description": "Fireskull Youth classic tee - Black XS",
        "totalPriceWithoutTaxes": 20,
        "totalPrice": 20,
        "totalWeight": 0,
        "unitPrice": 20,
        "hasDimensions": false,
        "totalPriceWithoutDiscountsAndTaxes": 20,
        "paymentSchedule": {
          "interval": 0,
          "intervalCount": 1,
          "trialPeriodInDays": null,
          "startsOn": "2025-08-30T00:00:00Z"
        },
        "pausingAction": "None",
        "cancellationAction": "None",
        "token": "635a5a58-6298-4e7b-a6a4-17228f4421a2",
        "name": "Fireskull Youth classic tee (Black XS)",
        "price": 20,
        "quantity": 1,
        "fileGuid": null,
        "url": "/product/391242016",
        "id": "68b2fd4bbab386",
        "initialData": "",
        "categories": [],
        "weight": null,
        "image": "https://files.cdn.printful.com/files/19a/19aa8816c789db566df54931f59b01d6_preview.png",
        "originalPrice": null,
        "uniqueId": "e595ebf2-8cf1-48e8-b9c4-99de7a9f166f",
        "stackable": true,
        "minQuantity": null,
        "maxQuantity": null,
        "addedOn": "2025-08-30T18:16:58Z",
        "modificationDate": "2025-08-30T18:16:58Z",
        "shippable": true,
        "taxable": true,
        "duplicatable": false,
        "width": null,
        "height": null,
        "length": null,
        "metadata": null,
        "taxes": [],
        "alternatePrices": {},
        "customFields": [
          {
            "name": "Color",
            "placeholder": "",
            "displayValue": "Black",
            "type": "textbox",
            "options": "",
            "required": false,
            "value": "Black",
            "operation": null,
            "optionsArray": null
          },
          {
            "name": "Size",
            "placeholder": "",
            "displayValue": "XS",
            "type": "textbox",
            "options": "",
            "required": false,
            "value": "XS",
            "operation": null,
            "optionsArray": null
          }
        ],
        "parcels": null,
        "hasTaxesIncluded": false
      }
    ],
    "plans": [],
    "refunds": [],
    "taxes": [
      {
        "taxName": "VAT",
        "taxRate": 0.19,
        "amount": 3.8,
        "numberForInvoice": null,
        "includedInPrice": false,
        "appliesOnShipping": false,
        "discountInducedAmountVariation": 0
      }
    ],
    "user": {
      "gravatarUrl": "https://www.gravatar.com/avatar/eed2215fddf5c61f4b9add7cb820b6c5?s=70&d=https%3a%2f%2fcdn.snipcart.com%2fassets%2fimages%2favatar.jpg",
      "id": "2463e188-85ef-47a0-a1d4-661855f9afc6",
      "email": "bparticle@protonmail.com",
      "mode": "Test",
      "statistics": {
        "ordersCount": 0,
        "ordersAmount": null,
        "subscriptionsCount": 0
      },
      "creationDate": "2025-08-27T07:06:37.743Z",
      "shippingAddressSameAsBilling": true,
      "status": "Unconfirmed",
      "sessionToken": null,
      "billingAddress": {
        "fullName": "Bruno Patyn",
        "firstName": null,
        "name": "Bruno Patyn",
        "company": null,
        "address1": " Gastfeldstraße",
        "address2": "",
        "fullAddress": " Gastfeldstraße",
        "city": "Bremen",
        "country": "DE",
        "postalCode": "28201",
        "province": "HB",
        "phone": "0484973368",
        "vatNumber": null,
        "hasMinimalRequiredInfo": true,
        "validationErrors": {}
      },
      "shippingAddress": {
        "fullName": "Bruno Patyn",
        "firstName": null,
        "name": "Bruno Patyn",
        "company": null,
        "address1": " Gastfeldstraße",
        "address2": "",
        "fullAddress": " Gastfeldstraße",
        "city": "Bremen",
        "country": "DE",
        "postalCode": "28201",
        "province": "HB",
        "phone": "0484973368",
        "vatNumber": null,
        "hasMinimalRequiredInfo": true,
        "validationErrors": {}
      }
    },
    "isRecurringV3Order": false,
    "parentInvoiceNumber": null,
    "paymentMethod": "CreditCard",
    "adjustedAmount": 28.09,
    "token": "635a5a58-6298-4e7b-a6a4-17228f4421a2",
    "isRecurringOrder": false,
    "parentToken": null,
    "subscriptionId": null,
    "currency": "eur",
    "creationDate": "2025-08-30T18:16:58Z",
    "modificationDate": "2025-08-30T18:17:30Z",
    "recoveredFromCampaignId": null,
    "status": "Processed",
    "paymentStatus": "Paid",
    "email": "bparticle@protonmail.com",
    "willBePaidLater": false,
    "billingAddress": {
      "fullName": "Bruno Patyn",
      "firstName": null,
      "name": "Bruno Patyn",
      "company": null,
      "address1": " Gastfeldstraße",
      "address2": "",
      "fullAddress": " Gastfeldstraße",
      "city": "Bremen",
      "country": "DE",
      "postalCode": "28201",
      "province": "HB",
      "phone": "0484973368",
      "vatNumber": null,
      "hasMinimalRequiredInfo": true,
      "validationErrors": {}
    },
    "shippingAddress": {
      "fullName": "Bruno Patyn",
      "firstName": null,
      "name": "Bruno Patyn",
      "company": null,
      "address1": " Gastfeldstraße",
      "address2": "",
      "fullAddress": " Gastfeldstraße",
      "city": "Bremen",
      "country": "DE",
      "postalCode": "28201",
      "province": "HB",
      "phone": "0484973368",
      "vatNumber": null,
      "hasMinimalRequiredInfo": true,
      "validationErrors": {}
    },
    "shippingAddressSameAsBilling": true,
    "creditCardLast4Digits": "4242",
    "trackingNumber": null,
    "trackingUrl": null,
    "shippingFees": 4.29,
    "shippingProvider": null,
    "shippingMethod": "Flat Rate (Estimated delivery: Sep 6) ",
    "shippingLocalizedMethod": null,
    "shippingRateUserDefinedId": "RATE_STANDARD",
    "cardHolderName": "Bruno Patyn",
    "notes": null,
    "mode": "Test",
    "customFieldsJson": "[]",
    "userId": "2463e188-85ef-47a0-a1d4-661855f9afc6",
    "completionDate": "2025-08-30T18:17:30Z",
    "cardType": "Visa",
    "paymentGatewayUsed": "SnipcartPaymentService",
    "paymentDetails": {
      "iconUrl": null,
      "display": null,
      "instructions": null
    },
    "taxProvider": "Webhooks",
    "lang": "en",
    "refundsAmount": 0,
    "finalGrandTotal": 28.09,
    "billingAddressFirstName": null,
    "billingAddressName": "Bruno Patyn",
    "billingAddressCompanyName": null,
    "billingAddressAddress1": " Gastfeldstraße",
    "billingAddressAddress2": "",
    "billingAddressCity": "Bremen",
    "billingAddressCountry": "DE",
    "billingAddressProvince": "HB",
    "billingAddressPostalCode": "28201",
    "billingAddressPhone": "0484973368",
    "shippingAddressFirstName": null,
    "shippingAddressName": "Bruno Patyn",
    "shippingAddressCompanyName": null,
    "shippingAddressAddress1": " Gastfeldstraße",
    "shippingAddressAddress2": "",
    "shippingAddressCity": "Bremen",
    "shippingAddressCountry": "DE",
    "shippingAddressProvince": "HB",
    "shippingAddressPostalCode": "28201",
    "shippingAddressPhone": "0484973368",
    "totalNumberOfItems": 0,
    "invoiceNumber": "SNIP-1036",
    "billingAddressComplete": true,
    "shippingAddressComplete": true,
    "shippingMethodComplete": true,
    "savedAmount": 0,
    "subtotal": 20,
    "baseTotal": 28.09,
    "itemsTotal": 20,
    "totalPriceWithoutDiscountsAndTaxes": 20,
    "taxableTotal": 20,
    "grandTotal": 28.09,
    "total": 28.09,
    "totalWeight": 0,
    "totalRebateRate": 0,
    "customFields": [],
    "shippingEnabled": true,
    "numberOfItemsInOrder": 1,
    "paymentTransactionId": "02688288-500f-4bb2-9e43-3c82977c1c9b",
    "metadata": null,
    "taxesTotal": 3.8,
    "itemsCount": 1,
    "summary": {
      "subtotal": 20,
      "taxableTotal": 20,
      "total": 28.09,
      "payableNow": 485.8,
      "paymentMethod": "CreditCard",
      "taxes": [
        {
          "taxId": null,
          "name": "VAT",
          "rate": 0.19,
          "amount": 3.8,
          "unroundedAmount": 3.8,
          "numberForInvoice": null,
          "includedInPrice": false,
          "appliesOnShipping": false,
          "discountInducedAmountVariation": 0
        }
      ],
      "discountInducedTaxesVariation": 0,
      "adjustedTotal": 28.09,
      "shipping": null
    },
    "ipAddress": "109.236.63.184",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    "hasSubscriptions": false
  }
};

async function testRealWebhook() {
  try {
    console.log('Testing webhook with real order data...');
    
    const response = await fetch('http://localhost:3001/api/snipcart/webhook', {
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
testRealWebhook();
