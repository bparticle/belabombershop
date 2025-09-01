import { ProductCategory } from '../types';

/**
 * Category Configuration System
 * 
 * This system defines how products are categorized based on their metadata,
 * tags, and other attributes from Printful. Categories can be determined by:
 * - Product tags
 * - Product metadata
 * - Product name patterns
 * - External ID patterns
 */

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    id: 'kids',
    name: 'Kids',
    description: 'Products designed for kids and children',
    slug: 'kids',
    color: '#FF6B6B',
    icon: '👶'
  },
  {
    id: 'adults',
    name: 'Adults',
    description: 'Products designed for adults',
    slug: 'adults',
    color: '#4ECDC4',
    icon: '👨‍💼'
  },

  {
    id: 'accessories',
    name: 'Accessories',
    description: 'Fashion accessories and add-ons',
    slug: 'accessories',
    color: '#96CEB4',
    icon: '👜'
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    description: 'Home decor and lifestyle products',
    slug: 'home-living',
    color: '#FFA726',
    icon: '🏠'
  }
];

/**
 * Category mapping rules
 * These rules determine how products are categorized based on their attributes
 */
export const CATEGORY_MAPPING_RULES = {
  // Keywords in product name that indicate category
  nameKeywords: {
    kids: ['kids', 'child', 'children', 'baby', 'toddler', 'youth', 'junior'],
    adults: ['adult', 'men', 'women', 'grown', 'mature'],
    accessories: ['bag', 'backpack', 'hat', 'cap', 'accessory', 'accessories'],
    'home-living': ['home', 'living', 'decor', 'decoration', 'house', 'room', 'wall', 'cushion', 'pillow', 'blanket']
  },
  
  // Tags that indicate category
  tagKeywords: {
    kids: ['kids', 'children', 'child', 'baby', 'toddler', 'youth'],
    adults: ['adult', 'men', 'women', 'grown'],
    accessories: ['accessory', 'accessories', 'bag', 'hat'],
    'home-living': ['home', 'living', 'decor', 'decoration', 'house', 'room']
  },
  
  // Metadata keys that might contain category information
  metadataKeys: ['category', 'audience', 'target_age', 'age_group', 'demographic']
};

/**
 * Determines the category of a product based on its attributes
 * @param product - The product to categorize
 * @returns The category ID or 'unisex' as default
 */
export function determineProductCategory(product: any): string {
  const { name, tags = [], metadata = {} } = product;
  
  // Check metadata first (most reliable)
  for (const key of CATEGORY_MAPPING_RULES.metadataKeys) {
    if (metadata[key]) {
      const value = metadata[key].toLowerCase();
      
      if (CATEGORY_MAPPING_RULES.nameKeywords.children.some(keyword => 
        value.includes(keyword))) {
        return 'children';
      }
      
      if (CATEGORY_MAPPING_RULES.nameKeywords.adults.some(keyword => 
        value.includes(keyword))) {
        return 'adults';
      }
      
      if (CATEGORY_MAPPING_RULES.nameKeywords.accessories.some(keyword => 
        value.includes(keyword))) {
        return 'accessories';
      }
      
      if (CATEGORY_MAPPING_RULES.nameKeywords['home-living'].some(keyword => 
        value.includes(keyword))) {
        return 'home-living';
      }
    }
  }
  
  // Check tags
  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    
    if (CATEGORY_MAPPING_RULES.tagKeywords.children.some(keyword => 
      tagLower.includes(keyword))) {
      return 'children';
    }
    
    if (CATEGORY_MAPPING_RULES.tagKeywords.adults.some(keyword => 
      tagLower.includes(keyword))) {
      return 'adults';
    }
    
    if (CATEGORY_MAPPING_RULES.tagKeywords.accessories.some(keyword => 
      tagLower.includes(keyword))) {
      return 'accessories';
    }
    
    if (CATEGORY_MAPPING_RULES.tagKeywords['home-living'].some(keyword => 
      tagLower.includes(keyword))) {
      return 'home-living';
    }
  }
  
  // Check product name
  const nameLower = name.toLowerCase();
  
  if (CATEGORY_MAPPING_RULES.nameKeywords.children.some(keyword => 
    nameLower.includes(keyword))) {
    return 'children';
  }
  
  if (CATEGORY_MAPPING_RULES.nameKeywords.adults.some(keyword => 
    nameLower.includes(keyword))) {
    return 'adults';
  }
  
  if (CATEGORY_MAPPING_RULES.nameKeywords.accessories.some(keyword => 
    nameLower.includes(keyword))) {
    return 'accessories';
  }
  
  if (CATEGORY_MAPPING_RULES.nameKeywords['home-living'].some(keyword => 
    nameLower.includes(keyword))) {
    return 'home-living';
  }
  
  // Default to adults if no category is determined
  return 'adults';
}

/**
 * Gets category information by ID
 * @param categoryId - The category ID
 * @returns The category object or undefined if not found
 */
export function getCategoryById(categoryId: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Gets category information by slug
 * @param slug - The category slug
 * @returns The category object or undefined if not found
 */
export function getCategoryBySlug(slug: string): ProductCategory | undefined {
  return PRODUCT_CATEGORIES.find(cat => cat.slug === slug);
}

/**
 * Generates category filters from a list of products
 * @param products - Array of products
 * @returns Category filters with counts
 */
export function generateCategoryFilters(products: any[]): { category: string; count: number }[] {
  const categoryCounts: Record<string, number> = {};
  
  // Count products in each category
  products.forEach(product => {
    const category = product.category || 'unisex';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  // Convert to array format
  return Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count
  }));
}
