import type { NextApiRequest, NextApiResponse } from 'next';
import { productService } from '../../../lib/database/services/product-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Basic admin authentication (you should implement proper auth)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetSyncLogs(req, res);
      case 'POST':
        return await handleTriggerSync(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin sync API error:', error);
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
      // Get only active sync operations
      syncLogs = await productService.getActiveSyncLogs();
    } else {
      // Get recent sync logs (can include or exclude active based on parameter)
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
};

async function handleTriggerSync(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create a sync log entry
    const syncLog = await productService.createSyncLog({
      operation: 'safe_manual_sync',
      status: 'queued',
      currentStep: 'Sync queued for processing',
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

    // Start the SAFE sync process in the background
    // Using the new data-loss prevention sync script
    process.nextTick(async () => {
      try {
        // Import and run the SAFE sync with the existing sync log ID
        const { SafeProductSync } = await import('../../../../scripts/sync-products-safe');
        const sync = new SafeProductSync();
        await sync.syncProducts(syncLog.id); // Pass the sync log ID!
      } catch (error) {
        console.error('Background sync failed:', error);
        
        // Update sync log with error
        await productService.updateSyncLog(syncLog.id, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          duration: Date.now() - (syncLog.startedAt?.getTime() || Date.now()),
          currentStep: 'Sync failed - check logs for details',
        });
      }
    });

    return res.status(202).json({
      message: 'Sync started',
      syncLogId: syncLog.id,
    });
  } catch (error) {
    console.error('Error triggering sync:', error);
    return res.status(500).json({ error: 'Failed to trigger sync' });
  }
}
