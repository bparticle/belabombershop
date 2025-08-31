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
  const { limit } = req.query;
  
  try {
    const limitNum = limit ? parseInt(limit as string) : 10;
    const syncLogs = await productService.getRecentSyncLogs(limitNum);
    
    return res.status(200).json({
      syncLogs,
      total: syncLogs.length,
    });
  } catch (error) {
    console.error('Error fetching sync logs:', error);
    return res.status(500).json({ error: 'Failed to fetch sync logs' });
  }
}

async function handleTriggerSync(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Create a sync log entry
    const syncLog = await productService.createSyncLog({
      operation: 'manual_sync',
      status: 'running',
      productsProcessed: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeleted: 0,
      variantsProcessed: 0,
      variantsCreated: 0,
      variantsUpdated: 0,
      variantsDeleted: 0,
    });

    // Start the sync process in the background
    // Note: In a production environment, you'd want to use a job queue
    // like Bull/BullMQ or similar for handling long-running tasks
    process.nextTick(async () => {
      try {
        // Import and run the sync
        const { ProductSync } = await import('../../../../scripts/sync-products');
        const sync = new ProductSync();
        await sync.syncProducts();
      } catch (error) {
        console.error('Background sync failed:', error);
        
        // Update sync log with error
        await productService.updateSyncLog(syncLog.id, {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
          duration: Date.now() - syncLog.startedAt.getTime(),
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
