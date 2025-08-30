import { printful } from "./printful-client";

// Cache for product mappings to avoid repeated API calls
const productCache = new Map<string, any>();

/**
 * Maps Snipcart product data to Printful variant ID
 * @param item - Snipcart item data
 * @returns Promise<number> - Printful variant ID
 */
export async function mapToPrintfulVariantId(item: any): Promise<number> {
  console.log('Mapping item to Printful variant ID:', {
    snipcartId: item.id,
    name: item.name,
    url: item.url,
    customFields: item.customFields
  });

  // Extract Printful product ID from URL if available
  let printfulProductId: string | null = null;
  if (item.url && item.url.includes('/product/')) {
    printfulProductId = item.url.split('/product/')[1];
    console.log('Extracted Printful product ID from URL:', printfulProductId);
  }

  // If we have a Printful product ID, try to get the variant
  if (printfulProductId) {
    try {
      const variantId = await getVariantIdFromProduct(printfulProductId, item.customFields);
      if (variantId) {
        console.log('Found Printful variant ID:', variantId);
        return variantId;
      }
    } catch (error) {
      console.error('Error getting variant from product:', error);
    }
  }

  // Fallback: try to parse the Snipcart ID as a Printful variant ID
  // (in case it's already a Printful ID)
  const parsedId = parseInt(item.id);
  if (!isNaN(parsedId)) {
    console.log('Using Snipcart ID as Printful variant ID:', parsedId);
    return parsedId;
  }

  throw new Error(`Unable to map Snipcart item ID "${item.id}" to Printful variant ID`);
}

/**
 * Gets the correct variant ID from a Printful product based on custom fields
 * @param productId - Printful product ID
 * @param customFields - Snipcart custom fields (color, size, etc.)
 * @returns Promise<number> - Printful variant ID
 */
async function getVariantIdFromProduct(productId: string, customFields: any[]): Promise<number | null> {
  console.log('Getting variant from product:', productId, 'with custom fields:', customFields);

  // Check cache first
  const cacheKey = `${productId}-${JSON.stringify(customFields)}`;
  if (productCache.has(cacheKey)) {
    console.log('Using cached variant mapping');
    return productCache.get(cacheKey);
  }

  try {
    // Get product details from Printful
    const productResponse = await printful.get(`sync/products/${productId}`);
    const product = productResponse.result;
    
    console.log('Printful product details:', {
      id: product.id,
      name: product.name,
      variantsCount: product.variants?.length || 0
    });

    if (!product.variants || product.variants.length === 0) {
      console.error('No variants found for product:', productId);
      return null;
    }

    // Extract color and size from custom fields
    const color = customFields?.find(f => f.name === 'Color')?.value;
    const size = customFields?.find(f => f.name === 'Size')?.value;

    console.log('Looking for variant with:', { color, size });

    // Find the matching variant
    const matchingVariant = product.variants.find((variant: any) => {
      const variantColor = variant.color?.toLowerCase();
      const variantSize = variant.size?.toLowerCase();
      const searchColor = color?.toLowerCase();
      const searchSize = size?.toLowerCase();

      const colorMatch = !searchColor || !variantColor || variantColor.includes(searchColor);
      const sizeMatch = !searchSize || !variantSize || variantSize.includes(searchSize);

      console.log('Checking variant:', {
        id: variant.id,
        color: variant.color,
        size: variant.size,
        colorMatch,
        sizeMatch
      });

      return colorMatch && sizeMatch;
    });

    if (matchingVariant) {
      console.log('Found matching variant:', matchingVariant.id);
      productCache.set(cacheKey, matchingVariant.id);
      return matchingVariant.id;
    }

    // If no exact match, return the first variant as fallback
    console.log('No exact match found, using first variant:', product.variants[0].id);
    productCache.set(cacheKey, product.variants[0].id);
    return product.variants[0].id;

  } catch (error) {
    console.error('Error fetching product from Printful:', error);
    return null;
  }
}

/**
 * Clears the product cache (useful for testing)
 */
export function clearProductCache(): void {
  productCache.clear();
}
