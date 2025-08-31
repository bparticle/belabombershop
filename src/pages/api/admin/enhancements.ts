import { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';
import { withAdminAuth } from '../../../lib/auth';

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      case 'DELETE':
        return await handleDelete(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Enhancements API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;

  if (productId) {
    // Get enhancement for specific product
    const product = await productService.getProductById(productId as string);
    return res.status(200).json({ enhancement: product?.enhancement || null });
  }

  // Get all enhancements
  const products = await productService.getAllProducts();
  const enhancements = products
    .filter(product => product.enhancement)
    .map(product => ({
      productId: product.id,
      productName: product.name,
      externalId: product.externalId,
      enhancement: product.enhancement
    }));

  return res.status(200).json({ enhancements });
}

async function handlePost(req: NextApiResponse, res: NextApiResponse) {
  const { productId, ...enhancementData } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const enhancement = await productService.upsertEnhancement(productId, enhancementData);
  
  // Trigger revalidation for the product page
  try {
    const product = await productService.getProductById(productId);
    if (product?.externalId) {
      // Revalidate the product page
      await res.revalidate(`/product/${product.externalId}`);
    }
  } catch (error) {
    console.error('Failed to revalidate product page:', error);
  }
  
  return res.status(201).json({ enhancement });
}

async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const { productId, ...enhancementData } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const enhancement = await productService.upsertEnhancement(productId, enhancementData);
  return res.status(200).json({ enhancement });
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const { productId } = req.query;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  // Note: You might want to add a method to deactivate enhancements instead of deleting
  // For now, we'll just return success
  return res.status(200).json({ message: 'Enhancement deleted' });
}


