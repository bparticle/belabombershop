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
    description: 'Premium cotton t-shirt with classic Bela Bomberman design. The Bomberman Youth Long Sleeve Tee is a wardrobe staple that\'ll go great with casual, sporty, or loungewear looks. The shirt is made of airlume combed and ring-spun cotton and will feel soft and comfy.',
    shortDescription: 'Premium cotton t-shirt with classic Bela Bomberman design. Comfortable fit with durable print.',
    defaultVariant: '68ad4d02631253', // Black S variant (updated to valid ID)
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
      metaDescription: 'Premium Bela Bomberman t-shirt made from 100% cotton. Perfect for gaming enthusiasts and retro gaming fans.'
    }
  },

  '68ac95d1455845': {
    description: 'Premium cotton t-shirt with original Bela Bomberman pufferfish design. What sets the Youth Classic Tee apart is its thick and durable fabric. Engineered to withstand the boundless energy of kids, the shirt promises longevity and resilience.',
    shortDescription: 'Premium cotton t-shirt with original Bela Bomberman pufferfish design.',
    defaultVariant: '68ac95d1455b15',
    features: [
      'Pre-shrunk fabric',
      'Classic fit',
      'Taped neck and shoulders',
      'Tear-away tag',
      'Made with OEKO-TEX certified low-impact dyes'
    ],
    specifications: {
      material: '100% Cotton',
      weight: '180 GSM',
      fit: 'Regular fit',
      printMethod: 'Direct to Garment (DTG)'
    },
    additionalImages: [
      {
        url: '/images/products/youth-classic-tee-gold-front-68ab56d7bd2a7.png',
        alt: 'Gold front view of the shirt',
        caption: 'Gold front view of the shirt'
      }, {
        url: '/images/products/youth-classic-tee-azalea-front-68ab56d7bba36.png',
        alt: 'Azalea front view of the shirt',
        caption: 'Azalea front view of the shirt'
      }, {
        url: '/images/products/youth-classic-tee-black-front-68ab56d7b798a.png',
        alt: 'Black lifestyle',
        caption: 'Black lifestyle'
      }
    ],
    seo: {
      keywords: ['bela bomberman', 'cotton t-shirt', 'gaming apparel'],
      metaDescription: 'Premium Bela Bomberman t-shirt made from 100% cotton. Perfect for gaming enthusiasts and retro gaming fans.'
    }
  },


  '68b008db7aed87': {
    description: 'Premium cotton t-shirt with original Bela Bomberman explosion design. What sets the Youth Classic Tee apart is its thick and durable fabric. Engineered to withstand the boundless energy of kids, the shirt promises longevity and resilience.',
    shortDescription: 'Premium cotton t-shirt with original Bela Bomberman explosion design.',
    defaultVariant: '68b008db7af1c5',
    features: [
      'Pre-shrunk fabric',
      'Classic fit',
      'Taped neck and shoulders',
      'Tear-away tag',
      'Made with OEKO-TEX certified low-impact dyes'
    ],
    specifications: {
      material: '100% Cotton',
      weight: '180 GSM',
      fit: 'Regular fit',
      printMethod: 'Direct to Garment (DTG)'
    },
    additionalImages: [
      {
        url: '/images/products/youth-classic-tee-black-front-68b00f4e89286.jpg',
        alt: 'Black front view of the shirt',
        caption: 'Black front view of the shirt'
      }, {
        url: '/images/products/youth-classic-tee-black-product-details-68b00f4e88cc6.jpg',
        alt: 'Black front view of the shirt',
        caption: 'Black front view of the shirt'
      }, {
        url: '/images/products/youth-classic-tee-sport-grey-front-68b00f4e98912.jpg',
        alt: 'Sport grey',
        caption: 'Sport grey'
      }, {
        url: '/images/products/youth-classic-tee-charcoal-back-68b00f4e91e74.jpg',
        alt: 'Grey backside',
        caption: 'Grey backside'
      }
    ],
    seo: {
      keywords: ['bela bomberman', 'cotton t-shirt', 'gaming apparel'],
      metaDescription: 'Premium Bela Bomberman t-shirt made from 100% cotton. Perfect for gaming enthusiasts and retro gaming fans.'
    }
  },

  '68b15542875c91': {
    description: "Premium cotton t-shirt with original Bela Bomberman explosion design. The Unisex Staple T-Shirt feels soft and light with just the right amount of stretch. It's comfortable and flattering for all.",
    shortDescription: 'Premium cotton t-shirt with original Bela Bomberman explosion design.',
    defaultVariant: '68b008db7af1c5',
    features: [
      'Pre-shrunk fabric',
      'Side-seamed',
    ],
    specifications: {
      fit: 'Regular fit',
      printMethod: 'Direct to Garment (DTG)'
    },
    additionalImages: [
      {
        url: '/images/products/youth-classic-tee-black-front-68b00f4e89286.jpg',
        alt: 'Black front view of the shirt',
        caption: 'Black front view of the shirt'
      },
    ],
    seo: {
      keywords: ['bela bomberman', 'cotton t-shirt', 'gaming apparel'],
      metaDescription: 'Premium Bela Bomberman t-shirt made from 100% cotton.'
    }
  },


  '68aff9a217a5f9': {
    description: 'A great bomberman hat!',
    shortDescription: 'A great bomberman hat!',
    defaultVariant: '68aff9a217a691',
    features: [
      'Classic brim with decorative stitching',
      'One size fits most',
    ],
    specifications: {
      material: '100% terry cotton',
      printMethod: 'Flat Embroidery'
    },
    additionalImages: [
      {
        url: '/images/products/unstructured-terry-cloth-bucket-hat-black-front-68b00e3304435.jpg',
        alt: 'Bucket hat with embroidery front',
        caption: 'Bucket hat with embroidery front'
      },
    ],
    seo: {
      keywords: ['bela bomberman', 'cotton bucket hat'],
      metaDescription: 'Premium Bela Bomberman bucket hat made from 100% terry cotton.'
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
 * @param printfulProduct - The product data from Printful (may include database enhancement)
 * @returns Enhanced product data
 */
export function enhanceProductData(printfulProduct: any): any {
  // Check if the product already has a database enhancement
  const dbEnhancement = printfulProduct.enhancement;
  const hardcodedEnhancement = getProductEnhancement(printfulProduct.external_id);
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
      defaultVariant: dbEnhancement.defaultVariantId || '', // Transform defaultVariantId to defaultVariant
    };
  } else if (hardcodedEnhancement) {
    enhancement = hardcodedEnhancement;
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

  // Check for database enhancement first, then fallback to hardcoded
  const enhancement = product.enhancement || getProductEnhancement(product.external_id);

  // If we have a specific default variant in enhancements, use it
  if (enhancement?.defaultVariant) {
    const defaultVariant = product.variants.find(
      (v: any) => v.external_id === enhancement.defaultVariant
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
