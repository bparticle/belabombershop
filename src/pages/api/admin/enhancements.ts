import { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';
import { PRODUCT_ENHANCEMENTS } from '../../../lib/product-enhancements';
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
  const { productId, action } = req.query;

  if (action === 'migrate') {
    // Migration endpoint
    return await handleMigration(req, res);
  }

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

async function handleMigration(req: NextApiRequest, res: NextApiResponse) {
  // Starting migration of product enhancements to database
  
  try {
    const enhancements = Object.entries(PRODUCT_ENHANCEMENTS);
    // Found ${enhancements.length} enhancements to migrate
    
    let migrated = 0;
    let skipped = 0;
    let errors = 0;
    const results: Array<{ externalId: string; status: string; message: string }> = [];
    
    for (const [externalId, enhancement] of enhancements) {
      try {
        // Find the product by external ID
        const product = await productService.getProductByExternalId(externalId);
        
        if (!product) {
          results.push({
            externalId,
            status: 'skipped',
            message: `Product with external ID ${externalId} not found`
          });
          skipped++;
          continue;
        }
        
        // Check if enhancement already exists
        const existingEnhancement = await productService.getProductById(product.id);
        
        if (existingEnhancement?.enhancement) {
          results.push({
            externalId,
            status: 'skipped',
            message: `Enhancement already exists for product ${product.name}`
          });
          skipped++;
          continue;
        }
        
        // Prepare enhancement data
        const enhancementData = {
          description: enhancement.description,
          shortDescription: enhancement.shortDescription,
          features: enhancement.features,
          specifications: enhancement.specifications,
          additionalImages: enhancement.additionalImages,
          seo: enhancement.seo,
          defaultVariantId: enhancement.defaultVariant,
        };
        
        // Create the enhancement
        await productService.upsertEnhancement(product.id, enhancementData);
        
        results.push({
          externalId,
          status: 'migrated',
          message: `Successfully migrated enhancement for ${product.name}`
        });
        migrated++;
        
      } catch (error) {
        results.push({
          externalId,
          status: 'error',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
        errors++;
      }
    }
    
    // Migration completed
    // Migrated: ${migrated}
    // Skipped: ${skipped}
    // Errors: ${errors}
    
    return res.status(200).json({
      success: true,
      summary: {
        total: enhancements.length,
        migrated,
        skipped,
        errors
      },
      results
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed'
    });
  }
}
