/**
 * Product Enhancements System
 * 
 * This system provides database-driven product enhancements (descriptions, additional images, etc.)
 * that work alongside Printful's live product data. All enhancements are now managed through
 * the admin interface and stored in the database.
 * 
 * This file contains utility functions for working with product enhancement data.
 */

// Note: Legacy hardcoded enhancement functions have been removed.
// All product enhancements are now managed through the database via the admin interface.

/**
 * Merge Printful product data with database enhancements
 * @param printfulProduct - The product data from Printful (may include database enhancement)
 * @returns Enhanced product data
 */
export function enhanceProductData(printfulProduct: any): any {
  // Check if the product already has a database enhancement
  const dbEnhancement = printfulProduct.enhancement;
  const defaultVariant = getDefaultVariant(printfulProduct);

  // Transform database enhancement to match frontend type expectations
  let enhancement = null;
  if (dbEnhancement) {
    enhancement = {
      description: dbEnhancement.description || '',
      shortDescription: dbEnhancement.shortDescription || '',
      features: dbEnhancement.features || [],
      specifications: dbEnhancement.specifications || {},
      additionalImages: dbEnhancement.additionalImages || [],
      seo: dbEnhancement.seo || { keywords: [], metaDescription: '' },
      defaultVariant: dbEnhancement.defaultVariantId || '',
    };
  }

  if (!enhancement) {
    return {
      ...printfulProduct,
      defaultVariant: defaultVariant || null
    };
  }

  return {
    ...printfulProduct,
    // Override description if enhancement exists
    description: enhancement.description || printfulProduct.description || '',
    // Add enhancement data
    enhancement,
    // Add default variant information
    defaultVariant: defaultVariant || null
  };
}

/**
 * Get default variant for a product
 * @param product - The product data
 * @returns The default variant or null if no variants available
 */
export function getDefaultVariant(product: any): any {
  // Ensure product has variants
  if (!product.variants || product.variants.length === 0) {
    return null;
  }

  // Check for database enhancement default variant
  const enhancement = product.enhancement;

  // If we have a specific default variant in enhancements, use it
  if (enhancement?.defaultVariantId || enhancement?.defaultVariant) {
    const defaultVariantId = enhancement.defaultVariantId || enhancement.defaultVariant;
    const defaultVariant = product.variants.find(
      (v: any) => v.external_id === defaultVariantId
    );
    if (defaultVariant) {
      return defaultVariant;
    }
  }

  // Fallback logic: prefer black variants, then first available
  const blackVariant = product.variants.find(
    (v: any) => v.color?.toLowerCase().includes('black')
  );
  if (blackVariant) {
    return blackVariant;
  }

  // If no black variant, return the first available variant
  return product.variants[0] || null;
}

/**
 * Get default description template based on product category
 * @param productName - The product name
 * @param category - The product category
 * @returns Default description
 */
export function getDefaultDescription(productName: string, category: string): string {
  const templates = {
    children: `Perfect for kids! This ${productName.toLowerCase()} features our signature Bela Bomberman design. Made with child-safe materials and comfortable fit for active little ones.`,
    adults: `Premium ${productName.toLowerCase()} featuring our signature Bela Bomberman design. Made with high-quality materials for comfort and durability.`,
    accessories: `Stylish ${productName.toLowerCase()} with our signature Bela Bomberman design. Perfect accessory to complete your gaming look.`,
    'home-living': `Beautiful ${productName.toLowerCase()} featuring our signature Bela Bomberman design. Adds personality and style to your home decor.`,
    default: `Premium quality ${productName.toLowerCase()} featuring our signature Bela Bomberman design. Made with care and attention to detail.`
  };

  return templates[category as keyof typeof templates] || templates.default;
}
