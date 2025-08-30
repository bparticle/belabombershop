import { getEnv } from "./env-validation";

export default async function createOrderV2({
  invoiceNumber,
  email,
  shippingAddress,
  items,
  shippingRateUserDefinedId,
}: {
  invoiceNumber: string;
  email: string;
  shippingAddress: any;
  items: any[];
  shippingRateUserDefinedId: string;
}) {
  const env = getEnv();
  
  // Validate required environment variable
  if (!env.PRINTFUL_API_KEY) {
    throw new Error("PRINTFUL_API_KEY is required");
  }

  // Validate required order data
  if (!invoiceNumber) {
    throw new Error("Invoice number is required");
  }
  
  if (!email) {
    throw new Error("Email is required");
  }
  
  if (!shippingAddress) {
    throw new Error("Shipping address is required");
  }
  
  if (!items || items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Prepare recipient data according to v2 API structure
  const recipient = {
    name: shippingAddress.name || 
          shippingAddress.fullName || 
          `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 
          'Customer',
    company: shippingAddress.company || undefined,
    address1: shippingAddress.address1 || shippingAddress.fullAddress || '',
    address2: shippingAddress.address2 || undefined,
    city: shippingAddress.city || '',
    state_code: shippingAddress.province || '',
    state_name: shippingAddress.province || '', // v2 requires both code and name
    country_code: shippingAddress.country || 'US',
    country_name: shippingAddress.country || 'United States', // v2 requires both code and name
    zip: shippingAddress.postalCode || '',
    phone: shippingAddress.phone || undefined,
    email,
    tax_number: undefined, // Optional field for v2
  };

  // Prepare items according to v2 API structure
  const orderItems = items.map((item) => {
    // Handle different possible ID formats
    let variantId: number;
    if (typeof item.id === 'string') {
      variantId = parseInt(item.id);
      if (isNaN(variantId)) {
        throw new Error(`Invalid variant ID: ${item.id}`);
      }
    } else if (typeof item.id === 'number') {
      variantId = item.id;
    } else {
      throw new Error(`Invalid variant ID type: ${typeof item.id}`);
    }

    return {
      source: "catalog" as const,
      catalog_variant_id: variantId,
      quantity: item.quantity,
      name: item.name || undefined,
      price: item.price?.toString() || undefined,
      retail_price: item.price?.toString() || undefined,
      currency: "USD",
      retail_currency: "USD",
    };
  });

  // Prepare order data according to v2 API structure
  const orderData = {
    external_id: invoiceNumber, // Use Snipcart invoice number as external ID
    recipient,
    items: orderItems,
    retail_costs: {
      currency: "USD",
      subtotal: "0.00", // Will be calculated by Printful
      discount: "0.00",
      shipping: "0.00",
      tax: "0.00",
      vat: "0.00",
      total: "0.00", // Will be calculated by Printful
    },
    shipping: shippingRateUserDefinedId === 'standard' ? 'STANDARD' : shippingRateUserDefinedId.toUpperCase(),
  };

  try {
    // Log the order data being sent (for debugging)
    console.log('Creating Printful v2 order with data:', {
      externalId: orderData.external_id,
      recipient: {
        name: orderData.recipient.name,
        email: orderData.recipient.email,
        country: orderData.recipient.country_code,
      },
      items: orderData.items.map(item => ({
        catalog_variant_id: item.catalog_variant_id,
        quantity: item.quantity,
        name: item.name,
      })),
      shipping: orderData.shipping,
    });

    // Make request to Printful v2 API
    const response = await fetch('https://api.printful.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Printful v2 API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        orderData: JSON.stringify(orderData, null, 2),
      });
      
      throw new Error(`Printful API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('Printful v2 order created successfully:', {
      orderId: result.data?.id,
      externalId: result.data?.external_id,
      status: result.data?.status,
    });

    return result;
  } catch (error) {
    console.error('Error creating Printful v2 order:', error);
    throw error;
  }
}
