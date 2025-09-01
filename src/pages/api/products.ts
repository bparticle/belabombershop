import type { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../lib/database/services/product-service';
import type { PrintfulProduct } from '../../types';
import { formatVariantName } from '../../lib/format-variant-name';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { category, limit, offset } = req.query;
    
    let dbProducts;
    
    if (category && typeof category === 'string') {
      dbProducts = await productService.getProductsByCategory(category);
    } else {
      dbProducts = await productService.getActiveProducts();
    }

    // Convert database products to frontend format
    const products: PrintfulProduct[] = dbProducts.map(product => {
      // Get the primary category for this product
      const primaryCategory = product.categories.find(cat => cat.isPrimary) || product.categories[0];
      
      return {
        id: product.externalId,
        external_id: product.externalId,
        name: product.name || 'Unnamed Product',
        thumbnail_url: product.thumbnailUrl || '',
        is_ignored: product.isIgnored || false,
        category: primaryCategory?.id || 'default',
        tags: product.tags?.map(tag => tag.name) || [],
        metadata: product.metadata || {},
        description: product.enhancement?.description || 
                    product.description || 
                    `Premium quality ${product.name || 'product'} featuring unique designs.`,
        variants: product.variants
          .filter(variant => variant.isEnabled)
          .map(variant => ({
            id: variant.printfulId,
            external_id: variant.externalId,
            name: formatVariantName(variant.name, variant.options || [], variant.size, variant.color),
            retail_price: variant.retailPrice,
            currency: variant.currency,
            files: variant.files || [],
            options: variant.options || [],
            size: variant.size || null,
            color: variant.color || null,
            is_enabled: variant.isEnabled || false,
            in_stock: variant.inStock || false,
            is_ignored: variant.isIgnored || false,
          })),
      };
    });

    // Apply pagination
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    
    let paginatedProducts = products;
    if (limitNum) {
      paginatedProducts = products.slice(offsetNum, offsetNum + limitNum);
    }

    return res.status(200).json({
      products: paginatedProducts,
      total: products.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}
