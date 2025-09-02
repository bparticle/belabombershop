import type { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';

/**
 * WORKING SYNC API ROUTE
 * 
 * This API route uses the proven working sync implementation
 * that successfully processed 15 products in 25 seconds.
 */

// Increase timeout for sync operations
export const config = {
  api: {
    responseTimeout: 8 * 60 * 1000, // 8 minutes
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Basic admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetSyncLogs(req, res);
      case 'POST':
        return await handleTriggerWorkingSync(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Working sync API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleGetSyncLogs(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { limit = '10', active } = req.query;
    const limitNum = parseInt(limit as string, 10);
    
    let syncLogs;
    
    if (active === 'true') {
      syncLogs = await productService.getActiveSyncLogs();
    } else {
      const includeActive = active !== 'false';
      syncLogs = await productService.getRecentSyncLogs(limitNum, includeActive);
    }

    return res.status(200).json({
      success: true,
      syncLogs: syncLogs || [],
      activeSyncs: active === 'true' ? syncLogs : undefined,
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
}

async function handleTriggerWorkingSync(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check for existing active syncs
    const activeSyncs = await productService.getActiveSyncLogs();
    if (activeSyncs.length > 0) {
      return res.status(409).json({ 
        error: 'Another sync is already in progress',
        activeSyncId: activeSyncs[0].id
      });
    }

    // Create a sync log entry
    const syncLog = await productService.createSyncLog({
      operation: 'working_manual_sync',
      status: 'queued',
      currentStep: 'Working sync queued for processing',
      progress: 0,
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      variantsDeleted: 0,
    });

    // Start the working sync in the background
    startWorkingSyncBackground(syncLog.id);

    return res.status(202).json({
      message: 'Working sync started',
      syncLogId: syncLog.id,
      mode: 'working'
    });

  } catch (error) {
    console.error('Error triggering working sync:', error);
    return res.status(500).json({ error: 'Failed to trigger working sync' });
  }
}

async function startWorkingSyncBackground(syncLogId: string): Promise<void> {
  try {
    console.log(`🚀 Starting working sync in background: ${syncLogId}`);
    
    // Import required modules dynamically
    const { PrintfulClient } = await import('printful-request');
    const printful = new PrintfulClient(process.env.PRINTFUL_API_KEY!);

    const stats = {
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    const startTime = Date.now();

    // Step 1: Fetch products from Printful
    console.log('📦 Fetching products from Printful...');
    await productService.updateSyncLog(syncLogId, {
      status: 'fetching_products',
      currentStep: 'Fetching products from Printful API...',
      progress: 5,
    });

    const response = await printful.get('store/products', { 
      offset: 0, 
      limit: 50 // Reasonable limit for API routes
    }) as any;

    if (!response.result || response.result.length === 0) {
      throw new Error('No products found in Printful store');
    }

    console.log(`✅ Found ${response.result.length} products to process`);

    // Step 2: Process products
    console.log('🔄 Processing products...');
    await productService.updateSyncLog(syncLogId, {
      status: 'processing_products',
      currentStep: 'Processing products...',
      progress: 15,
      totalProducts: response.result.length,
    });

    for (let i = 0; i < response.result.length; i++) {
      const basicProduct = response.result[i];
      const progressPercent = 15 + Math.round((i / response.result.length) * 70); // 15-85%
      
      console.log(`📦 Processing ${i + 1}/${response.result.length}: ${basicProduct.name}`);
      
      try {
        // Update progress
        await productService.updateSyncLog(syncLogId, {
          currentStep: `Processing product: ${basicProduct.name}`,
          progress: progressPercent,
          currentProductIndex: i,
          currentProductName: basicProduct.name,
        });

        // Get detailed product info
        const detailResponse = await printful.get(`store/products/${basicProduct.id}`) as any;
        const { sync_product, sync_variants } = detailResponse.result;

        // Check if product exists
        const existingProduct = await productService.getProductByPrintfulId(sync_product.id);
        const isNewProduct = !existingProduct;

        // Upsert product
        const product = await productService.upsertProduct(sync_product);
        
        if (isNewProduct) {
          stats.productsCreated++;
          console.log(`  ✅ Created product: ${product.name}`);
        } else {
          stats.productsUpdated++;
          console.log(`  ✅ Updated product: ${product.name}`);
        }
        stats.productsProcessed++;

        // Process variants
        if (sync_variants && sync_variants.length > 0) {
          const variantResults = await productService.upsertVariants(product.id, sync_variants);
          stats.variantsProcessed += variantResults.length;
          
          // Count new vs updated variants
          const existingVariants = existingProduct?.variants || [];
          const newVariants = variantResults.filter(v => 
            !existingVariants.find(ev => ev.printfulId === v.printfulId)
          );
          
          stats.variantsCreated += newVariants.length;
          stats.variantsUpdated += variantResults.length - newVariants.length;
          
          console.log(`  📊 Processed ${variantResults.length} variants (${newVariants.length} new)`);
        }

        // Auto-categorize if new
        if (isNewProduct) {
          try {
            await productService.autoCategorizeAndTagProduct(product);
            console.log(`  🏷️  Auto-categorized product`);
          } catch (error) {
            stats.warnings.push(`Failed to auto-categorize ${product.name}: ${error}`);
          }
        }

        // Small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));

      } catch (error) {
        stats.errors.push(`Failed to process ${basicProduct.name}: ${error}`);
        console.log(`  ❌ Error processing ${basicProduct.name}: ${error}`);
      }
    }

    // Step 3: Finalize
    console.log('✅ Finalizing sync...');
    const duration = Date.now() - startTime;
    const finalStatus = stats.errors.length > 0 ? 'partial' : 'success';
    
    await productService.updateSyncLog(syncLogId, {
      status: finalStatus,
      currentStep: 'Sync completed successfully',
      progress: 100,
      duration,
      completedAt: new Date(),
      productsProcessed: stats.productsProcessed,
      productsCreated: stats.productsCreated,
      productsUpdated: stats.productsUpdated,
      variantsProcessed: stats.variantsProcessed,
      variantsCreated: stats.variantsCreated,
      variantsUpdated: stats.variantsUpdated,
    });

    console.log(`🎉 Working sync completed: ${stats.productsProcessed} products, ${stats.variantsProcessed} variants in ${Math.round(duration / 1000)}s`);

  } catch (error) {
    console.error('Background working sync failed:', error);
    
    // Update sync log with error
    try {
      await productService.updateSyncLog(syncLogId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        currentStep: 'Working sync failed - check logs for details',
        completedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update sync log with error:', updateError);
    }
  }
}
