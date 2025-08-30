import { printful } from "./printful-client";

// Cache for product mappings to avoid repeated API calls
const productCache = new Map<string, any>();

/**
 * Maps Snipcart product data to Printful catalog variant ID
 * @param item - Snipcart item data
 * @returns Promise<number> - Printful catalog variant ID
 */
export async function mapToPrintfulVariantId(item: any): Promise<number> {
  console.log('Mapping item to Printful catalog variant ID:', {
    snipcartId: item.id,
    name: item.name,
    url: item.url,
    customFields: item.customFields
  });

  // Check cache first
  if (productCache.has(item.id)) {
    console.log('Using cached catalog variant ID:', productCache.get(item.id));
    return productCache.get(item.id);
  }

  // The Snipcart item ID is the sync variant external ID
  // We need to get the sync variant details to find the catalog variant ID
  try {
    console.log('Getting sync variant details for external ID:', item.id);
    const syncVariantResponse = await printful.get(`store/variants/@${item.id}`);
    const syncVariant = syncVariantResponse.result;
    
    console.log('Sync variant details:', {
      id: syncVariant.id,
      external_id: syncVariant.external_id,
      variant_id: syncVariant.variant_id,
      name: syncVariant.name
    });
    
    if (syncVariant.variant_id) {
      console.log('Found catalog variant ID:', syncVariant.variant_id);
      // Cache the result
      productCache.set(item.id, syncVariant.variant_id);
      return syncVariant.variant_id;
    } else {
      throw new Error(`No catalog variant ID found for sync variant ${item.id}`);
    }
  } catch (error) {
    console.error('Error getting sync variant details:', error);
    
    // Fallback: try to parse the Snipcart ID as a catalog variant ID
    // (in case it's already a catalog variant ID)
    const parsedId = parseInt(item.id);
    if (!isNaN(parsedId)) {
      console.log('Using Snipcart ID as catalog variant ID (fallback):', parsedId);
      // Cache the result
      productCache.set(item.id, parsedId);
      return parsedId;
    }
    
    throw new Error(`Unable to map Snipcart item ID "${item.id}" to Printful catalog variant ID`);
  }
}

/**
 * Clears the product cache (useful for testing)
 */
export function clearProductCache(): void {
  productCache.clear();
}
