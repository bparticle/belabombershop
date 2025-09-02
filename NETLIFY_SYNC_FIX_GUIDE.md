# Netlify Sync Issues - Complete Fix Guide

## Problems Identified

1. **Frontend Hanging at 15%**: Sync process gets stuck due to serverless timeout limits
2. **Incomplete Product Sync**: Products disappear due to failed cleanup operations
3. **API Route Timeouts**: Default 10-second timeout is too short for sync operations
4. **Environment Variable Issues**: Production environment not properly configured

## Root Causes

### 1. Serverless Environment Limitations
- **Function Timeout**: Netlify functions have a 10-second timeout (26 seconds for Pro)
- **Memory Limits**: Limited memory can cause process crashes
- **Cold Starts**: Initial delays affect sync timing
- **Connection Limits**: Database connections may be limited

### 2. Sync Implementation Issues
- **No Circuit Breakers**: Failed API calls cascade into hanging processes
- **Poor Error Recovery**: Errors cause entire sync to fail
- **Inefficient Batching**: Processing too many products at once
- **Missing Timeouts**: No per-operation timeouts

### 3. Database Configuration
- **Connection Pooling**: Not optimized for serverless
- **Transaction Timeouts**: Long-running transactions fail
- **SSL Configuration**: May not be properly configured for production

## Complete Solution

### Step 1: Environment Configuration

1. **Update Netlify Environment Variables**:
   ```bash
   # In Netlify dashboard, add these environment variables:
   NODE_ENV=production
   PRINTFUL_API_KEY=your_actual_key_here
   DATABASE_HOST=your_database_host
   DATABASE_NAME=your_database_name
   DATABASE_USERNAME=your_username
   DATABASE_PASSWORD=your_password
   DATABASE_PORT=5432
   DATABASE_SSL=true
   JWT_SECRET=your_jwt_secret_here
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   ```

2. **Update `netlify.toml`**:
   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [build.environment]
     NODE_VERSION = "18"
     NPM_VERSION = "9"

   [[redirects]]
     from = "/api/*"
     to = "/.netlify/functions/:splat"
     status = 200

   [functions]
     # Increase timeout for sync operations
     timeout = 300  # 5 minutes (requires Pro plan)
     memory = 1024  # Increase memory
   ```

### Step 2: Update Sync Implementation

Replace your current sync with the improved version:

1. **Use the New Sync API Route**:
   ```typescript
   // In your admin dashboard, change the sync endpoint
   const response = await fetch('/api/admin/sync-improved', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${token}`,
       'Content-Type': 'application/json',
     },
   });
   ```

2. **Update Frontend Polling**:
   ```typescript
   // In useSyncProgress hook, reduce polling frequency for Netlify
   const {
     activePollInterval = 5000, // 5 seconds instead of 2
     inactivePollInterval = 15000, // 15 seconds instead of 10
     maxRecentLogs = 3, // Reduce to limit data transfer
   } = options;
   ```

### Step 3: Database Optimization

1. **Update Database Configuration**:
   ```typescript
   // In src/lib/database/config.ts
   const client = postgres(connectionString, {
     max: 3, // Reduce connection pool for serverless
     idle_timeout: 10, // Shorter timeout
     connect_timeout: 10,
     ssl: env.DATABASE_SSL ? {
       rejectUnauthorized: false, // For some hosting providers
     } : false,
     prepare: false, // Disable prepared statements for serverless
   });
   ```

### Step 4: Frontend Improvements

1. **Add Better Error Handling**:
   ```typescript
   // In admin dashboard component
   const handleTriggerSync = async () => {
     setShowCompletedSync(false);
     
     try {
       const result = await triggerSync();
       if (result.error) {
         // Show user-friendly error message
         setErrorMessage(result.error);
         return;
       }
       
       // Start polling with exponential backoff
       startPolling();
       
     } catch (error) {
       console.error('Failed to trigger sync:', error);
       setErrorMessage('Failed to start sync. Please try again.');
     }
   };
   ```

2. **Add Sync Status Indicators**:
   ```typescript
   // Add these status indicators to your UI
   const getSyncStatusMessage = (activeSyncLog) => {
     if (!activeSyncLog) return null;
     
     const { status, progress, currentStep } = activeSyncLog;
     
     if (status === 'queued') {
       return 'Sync is starting up...';
     } else if (status === 'fetching_products') {
       return 'Connecting to Printful...';
     } else if (status === 'processing_products') {
       return `Processing products... ${progress || 0}%`;
     } else if (progress < 10) {
       return 'Initializing sync process...';
     }
     
     return currentStep || 'Processing...';
   };
   ```

### Step 5: Monitoring and Debugging

1. **Add Debug Logging**:
   ```typescript
   // In your sync components, add debug logging
   useEffect(() => {
     if (activeSyncLog) {
       console.log('Sync Status Update:', {
         id: activeSyncLog.id,
         status: activeSyncLog.status,
         progress: activeSyncLog.progress,
         step: activeSyncLog.currentStep,
         timestamp: new Date().toISOString()
       });
     }
   }, [activeSyncLog]);
   ```

2. **Create a Debug Dashboard**:
   ```typescript
   // Add this to your admin page for debugging
   const DebugPanel = ({ activeSyncLog, recentSyncLogs }) => (
     <details className="mt-4 p-4 border rounded">
       <summary>Debug Information</summary>
       <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
         {JSON.stringify({
           activeSync: activeSyncLog,
           recentSyncs: recentSyncLogs?.slice(0, 3),
           environment: process.env.NODE_ENV,
           timestamp: new Date().toISOString()
         }, null, 2)}
       </pre>
     </details>
   );
   ```

## Testing the Fix

### 1. Local Testing
```bash
# Run the diagnostic tool
npm run tsx scripts/comprehensive-sync-diagnostic-advanced.ts

# Test the improved sync
npm run tsx scripts/sync-products-improved.ts

# Fix any identified issues
npm run tsx scripts/fix-sync-issues.ts
```

### 2. Production Testing
1. Deploy the changes to Netlify
2. Check the function logs in Netlify dashboard
3. Monitor the sync progress in your admin dashboard
4. Verify products are syncing correctly

### 3. Rollback Plan
If issues persist:
1. Revert to the safe sync: `/api/admin/sync` endpoint
2. Use smaller batch sizes in production
3. Consider breaking sync into multiple smaller operations

## Performance Optimizations

### 1. Reduce Sync Scope
```typescript
// In production, limit sync scope
const syncOptions = {
  maxProducts: 25, // Start small
  timeoutMs: 4 * 60 * 1000, // 4 minutes
  batchSize: 2, // Very small batches
  retryAttempts: 1 // Minimal retries
};
```

### 2. Implement Progressive Sync
```typescript
// Sync in phases instead of all at once
const phases = [
  { offset: 0, limit: 25 },
  { offset: 25, limit: 25 },
  { offset: 50, limit: 25 },
];

for (const phase of phases) {
  await syncPhase(phase);
  await delay(30000); // 30 second pause between phases
}
```

### 3. Background Jobs (Advanced)
Consider implementing a queue system:
```typescript
// Use Netlify Background Functions (Pro feature)
// Or integrate with external services like:
// - Inngest
// - Trigger.dev
// - Upstash QStash
```

## Monitoring

### 1. Add Health Checks
Create `/api/health` endpoint:
```typescript
export default async function handler(req, res) {
  try {
    // Quick database ping
    const dbHealth = await testDatabaseConnection();
    
    // Quick Printful API ping  
    const apiHealth = await testPrintfulConnection();
    
    res.json({
      status: 'healthy',
      database: dbHealth ? 'ok' : 'error',
      printful: apiHealth ? 'ok' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
}
```

### 2. Error Notifications
Set up alerts for sync failures:
```typescript
// Add to your sync error handling
const notifyOfSyncFailure = async (error, syncLogId) => {
  // Send to monitoring service
  // Or email notification
  // Or Slack webhook
};
```

## Expected Results

After implementing these fixes:

1. **Frontend**: Should no longer hang at 15%
2. **Sync Process**: Should complete within 5-8 minutes for 50 products
3. **Error Recovery**: Failed products won't break entire sync
4. **Netlify**: Should work properly with environment variables
5. **Data Integrity**: Products should no longer disappear unexpectedly

## Support

If issues persist after implementing this guide:

1. Run the diagnostic tool and share results
2. Check Netlify function logs for specific errors
3. Verify all environment variables are set correctly
4. Consider upgrading to Netlify Pro for longer function timeouts
5. Test with a smaller product subset first
