import { getEnv } from "./env-validation";
import { printful } from "./printful-client";

/**
 * Maps Snipcart shipping method to Printful v1 shipping method
 * @param shippingRateUserDefinedId - Snipcart shipping method ID
 * @returns string - Printful v1 shipping method
 */
function mapShippingMethod(shippingRateUserDefinedId: string): string {
  console.log('Mapping shipping method:', shippingRateUserDefinedId);
  
  // Map common Snipcart shipping methods to Printful v1 methods
  const shippingMap: { [key: string]: string } = {
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

/**
 * Get the sync variant ID from Printful using the external ID
 * @param externalId - The sync variant external ID
 * @returns number - The sync variant ID
 */
async function getSyncVariantId(externalId: string): Promise<number> {
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

export default async function createOrderV1({
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

  // Prepare recipient data according to v1 API structure
  const recipient = {
    name: shippingAddress.name || 
          shippingAddress.fullName || 
          `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 
          'Customer',
    address1: shippingAddress.address1 || shippingAddress.fullAddress || '',
    address2: shippingAddress.address2 || undefined,
    city: shippingAddress.city || '',
    state_code: shippingAddress.province || 'CA', // Default to CA if not provided
    country_code: shippingAddress.country || 'US',
    zip: shippingAddress.postalCode || '',
    phone: shippingAddress.phone || undefined,
    email,
  };

  // Prepare items according to v1 API structure
  // For v1 API, we need to get the actual sync variant ID from Printful
  const orderItems = await Promise.all(items.map(async (item) => {
    console.log('Processing item for order:', {
      id: item.id,
      name: item.name,
      quantity: item.quantity
    });

    // Get the actual sync variant ID from Printful using the external ID
    const syncVariantId = await getSyncVariantId(item.id);
    console.log('Found sync variant ID:', syncVariantId);

    return {
      sync_variant_id: syncVariantId, // Use the actual numeric sync variant ID
      quantity: item.quantity,
    };
  }));

  // Prepare order data according to v1 API structure
  const orderData = {
    recipient,
    items: orderItems,
    retail_costs: {
      currency: "USD",
    },
    shipping: mapShippingMethod(shippingRateUserDefinedId),
  };

  try {
    // Log the order data being sent (for debugging)
    console.log('Creating Printful v1 order with data:', {
      recipient: {
        name: orderData.recipient.name,
        email: orderData.recipient.email,
        country: orderData.recipient.country_code,
      },
      items: orderData.items.map(item => ({
        sync_variant_id: item.sync_variant_id,
        quantity: item.quantity,
      })),
      shipping: orderData.shipping,
    });

    // Make request to Printful v1 API using the printful client
    const result = await printful.post("orders", orderData);
    
    console.log('Printful v1 order created successfully:', {
      orderId: result.result?.id,
      status: result.result?.status,
    });

    return result;
  } catch (error) {
    console.error('Error creating Printful v1 order:', error);
    throw error;
  }
}
