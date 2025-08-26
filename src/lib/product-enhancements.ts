import { ProductEnhancement } from '../types';

/**
 * Product Enhancements System
 * 
 * This system provides local product enhancements (descriptions, additional images, etc.)
 * that work alongside Printful's live product data. It allows you to:
 * - Add custom descriptions for each product
 * - Include additional product images
 * - Add product-specific features and specifications
 * - Maintain SEO-friendly content
 * 
 * The system uses Printful's external_id as the key to match enhancements with live products.
 */

// Product enhancements database
// Key: Printful external_id, Value: ProductEnhancement
export const PRODUCT_ENHANCEMENTS: Record<string, ProductEnhancement> = {
  // Example enhancements - replace with your actual product data
  // You can get the external_id from your Printful dashboard or API
  '68ad4d026311b3': {
    description: 'Premium cotton t-shirt with classic Bela Bomberman design. The Bomberman Youth Long Sleeve Tee is a wardrobe staple that’ll go great with casual, sporty, or loungewear looks. The shirt is made of airlume combed and ring-spun cotton and will feel soft and comfy.',
    shortDescription: 'Premium cotton t-shirt with classic Bela Bomberman design. Comfortable fit with durable print.',
    features: [
      'Comfortable, breathable fabric',
      'Vibrant, durable print'
    ],
    specifications: {
      material: '100% airlume combed and ring-spun cotton',
      weight: '180 GSM',
      fit: 'Regular fit',
      printMethod: 'Direct to Garment (DTG)'
    },
    additionalImages: [
      {
        url: '/images/products/youth-long-sleeve-tee-black-front-68ad4bd544b85.png',
        alt: 'Close-up of Bela Bomberman design',
        caption: 'Folded shirt'
      },
      {
        url: '/images/products/youth-long-sleeve-tee-black-back-68acb5f5e81ba.png',
        alt: 'Backside of the shirt',
        caption: 'Backside'
      }
    ],
    seo: {
      keywords: ['bela bomberman', 'cotton t-shirt', 'gaming apparel'],
      metaDescription: 'Premium Bela Bomberman t-shirt made from organic cotton. Perfect for gaming enthusiasts and retro gaming fans.'
    }
  },
  
  'example-product-2': {
    description: 'Comfortable hoodie featuring the iconic Bela Bomberman character. Made from premium cotton blend fabric that provides warmth and comfort. Features a classic pullover design with a spacious hood and front pocket. The high-quality print ensures the design stays vibrant wash after wash.',
    shortDescription: 'Warm and comfortable hoodie with Bela Bomberman design. Perfect for cooler weather.',
    features: [
      'Premium cotton blend',
      'Warm and comfortable',
      'Spacious hood',
      'Front pocket',
      'Durable print quality'
    ],
    specifications: {
      material: '80% Cotton, 20% Polyester',
      weight: '300 GSM',
      fit: 'Regular fit',
      care: 'Machine wash cold, tumble dry low',
      printMethod: 'Direct to Garment (DTG)'
    },
    additionalImages: [
      {
        url: '/images/products/example-product-2-back.jpg',
        alt: 'Back view of hoodie',
        caption: 'Back view showing full design'
      }
    ],
    seo: {
      keywords: ['bela bomberman hoodie', 'gaming hoodie', 'warm hoodie', 'cotton blend', 'gaming apparel'],
      metaDescription: 'Comfortable Bela Bomberman hoodie made from premium cotton blend. Perfect for gaming and casual wear.'
    }
  }
};

/**
 * Get product enhancement by Printful external_id
 * @param externalId - The Printful external_id
 * @returns ProductEnhancement or undefined if not found
 */
export function getProductEnhancement(externalId: string): ProductEnhancement | undefined {
  return PRODUCT_ENHANCEMENTS[externalId];
}

/**
 * Get product enhancement by Printful product ID
 * This is a fallback method if you have the internal ID instead of external_id
 * @param productId - The Printful product ID
 * @returns ProductEnhancement or undefined if not found
 */
export function getProductEnhancementById(productId: string): ProductEnhancement | undefined {
  // This would need to be implemented based on your specific mapping
  // For now, we'll return undefined
  return undefined;
}

/**
 * Check if a product has enhancements
 * @param externalId - The Printful external_id
 * @returns boolean
 */
export function hasProductEnhancement(externalId: string): boolean {
  return externalId in PRODUCT_ENHANCEMENTS;
}

/**
 * Get all product enhancements
 * @returns Array of all product enhancements
 */
export function getAllProductEnhancements(): ProductEnhancement[] {
  return Object.values(PRODUCT_ENHANCEMENTS);
}

/**
 * Get product enhancement keys (external_ids)
 * @returns Array of external_ids that have enhancements
 */
export function getProductEnhancementKeys(): string[] {
  return Object.keys(PRODUCT_ENHANCEMENTS);
}

/**
 * Merge Printful product data with local enhancements
 * @param printfulProduct - The product data from Printful
 * @returns Enhanced product data
 */
export function enhanceProductData(printfulProduct: any): any {
  const enhancement = getProductEnhancement(printfulProduct.external_id);
  
  if (!enhancement) {
    return printfulProduct;
  }
  
  return {
    ...printfulProduct,
    // Override description if enhancement exists
    description: enhancement.description || printfulProduct.description,
    // Add enhancement data
    enhancement
  };
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
