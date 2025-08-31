import type { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';
import { withAdminAuth } from '../../../lib/auth';

export default withAdminAuth(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGetProducts(req, res);
      case 'POST':
        return await handleCreateProduct(req, res);
      case 'PUT':
        return await handleUpdateProduct(req, res);
      case 'DELETE':
        return await handleDeleteProduct(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin products API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

async function handleGetProducts(req: NextApiRequest, res: NextApiResponse) {
  const { category, limit, offset, includeInactive } = req.query;
  
  try {
    let products;
    
    if (category && typeof category === 'string') {
      products = await productService.getProductsByCategory(category);
    } else {
      products = await productService.getAllProducts();
    }

    // Filter inactive products if not requested
    if (includeInactive !== 'true') {
      products = products.filter(p => p.isActive);
    }

    // Apply pagination
    const limitNum = limit ? parseInt(limit as string) : undefined;
    const offsetNum = offset ? parseInt(offset as string) : 0;
    
    if (limitNum) {
      products = products.slice(offsetNum, offsetNum + limitNum);
    }

    return res.status(200).json({
      products,
      total: products.length,
      limit: limitNum,
      offset: offsetNum,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function handleCreateProduct(req: NextApiRequest, res: NextApiResponse) {
  // This would typically be used for creating custom products
  // For now, we'll return an error since products should come from Printful sync
  return res.status(400).json({ 
    error: 'Products must be created through Printful sync' 
  });
}

async function handleUpdateProduct(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { isActive, enhancement } = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update product visibility
    if (typeof isActive === 'boolean') {
      const updatedProduct = await productService.toggleProductVisibility(id);
      return res.status(200).json({ product: updatedProduct });
    }

    // Update enhancement
    if (enhancement) {
      const updatedEnhancement = await productService.upsertEnhancement(id, enhancement);
      return res.status(200).json({ enhancement: updatedEnhancement });
    }

    return res.status(400).json({ error: 'No valid update data provided' });
  } catch (error) {
    console.error('Error updating product:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
}

async function handleDeleteProduct(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const product = await productService.getProductById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await productService.deleteProduct(id);
    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
}
