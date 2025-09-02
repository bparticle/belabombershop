import type { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';

/**
 * IMPROVED SYNC API ROUTE
 * 
 * This API route addresses the hanging and timeout issues by:
 * 1. Using the improved sync implementation
 * 2. Adding request timeouts
 * 3. Better error handling
 * 4. Optimized for serverless environments
 */

// Increase timeout for serverless functions
export const config = {
  api: {
    responseTimeout: 8 * 60 * 1000, // 8 minutes for Netlify
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

  // Add CORS headers for Netlify
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
        return await handleTriggerImprovedSync(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Improved sync API error:', error);
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

async function handleTriggerImprovedSync(req: NextApiRequest, res: NextApiResponse) {
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
      operation: 'improved_manual_sync',
      status: 'queued',
      currentStep: 'Improved sync queued for processing',
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

    // Determine if running in serverless environment
    const isServerless = process.env.NETLIFY === 'true' || process.env.VERCEL === '1';
    
    if (isServerless) {
      // In serverless, start sync immediately and respond quickly
      // The function will continue running in the background
      startImprovedSyncBackground(syncLog.id);
      
      return res.status(202).json({
        message: 'Improved sync started (serverless mode)',
        syncLogId: syncLog.id,
        mode: 'serverless'
      });
    } else {
      // In local development, use process.nextTick
      process.nextTick(async () => {
        await startImprovedSyncBackground(syncLog.id);
      });

      return res.status(202).json({
        message: 'Improved sync started (local mode)',
        syncLogId: syncLog.id,
        mode: 'local'
      });
    }

  } catch (error) {
    console.error('Error triggering improved sync:', error);
    return res.status(500).json({ error: 'Failed to trigger improved sync' });
  }
}

async function startImprovedSyncBackground(syncLogId: string): Promise<void> {
  try {
    // Dynamic import to avoid loading issues
    const { ImprovedProductSync } = await import('../../../../scripts/sync-products-improved');
    
    // Configure for serverless environment
    const isServerless = process.env.NETLIFY === 'true' || process.env.VERCEL === '1';
    
    const syncOptions = {
      maxProducts: isServerless ? 50 : 200, // Limit products in serverless
      timeoutMs: isServerless ? 7 * 60 * 1000 : 15 * 60 * 1000, // 7min for serverless
      retryAttempts: isServerless ? 1 : 2, // Less retries in serverless
      batchSize: isServerless ? 3 : 5, // Smaller batches in serverless
    };
    
    const sync = new ImprovedProductSync(syncOptions);
    await sync.syncProducts(syncLogId);
    
  } catch (error) {
    console.error('Background improved sync failed:', error);
    
    // Update sync log with error
    try {
      await productService.updateSyncLog(syncLogId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : String(error),
        currentStep: 'Improved sync failed - check logs for details',
        completedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Failed to update sync log with error:', updateError);
    }
  }
}
