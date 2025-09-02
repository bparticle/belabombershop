# Enhanced Product Synchronization Scripts

This guide explains how to use the new enhanced synchronization scripts that handle complete synchronization between Printful and your database, including product deletion.

## 🚨 Problem Solved

The original sync scripts only handled creating and updating products, but **did not delete products that were removed from Printful**. This meant:
- Products deleted from Printful remained in your database
- Product counts would never match between Printful and your database
- Your store would show products that no longer exist

## 🆕 New Scripts Available

### 1. Enhanced Production Sync (`sync:production`)
**File:** `scripts/sync-to-production.ts`
**Command:** `npm run sync:production`

- ✅ Creates new products
- ✅ Updates existing products  
- ✅ **NEW: Deletes removed products**
- ✅ Verifies counts match
- ✅ Production environment only

### 2. Complete Sync (`sync:complete`)
**File:** `scripts/sync-products-complete.ts`
**Command:** `npm run sync:complete`

- ✅ Creates new products
- ✅ Updates existing products
- ✅ **Deletes removed products**
- ✅ Verifies counts match
- ✅ Works in any environment
- ✅ Multiple safety options

### 3. Product Count Checker (`check:counts`)
**File:** `scripts/check-product-counts.ts`
**Command:** `npm run check:counts`

- ✅ Quickly checks product counts
- ✅ Shows what's missing/extra
- ✅ No database changes
- ✅ Great for verification

## 🎯 How to Use

### Step 1: Check Current Status
First, see what's out of sync:

```bash
npm run check:counts
```

This will show you:
- How many products are in Printful vs. database
- Which products are missing from the database
- Which products exist in database but not in Printful

### Step 2: Dry Run (Recommended First)
See what would change without making any changes:

```bash
npm run sync:complete:dry
```

This will show you exactly what would be:
- Created
- Updated  
- Deleted

### Step 3: Run Complete Sync
When you're ready, run the actual synchronization:

```bash
npm run sync:complete
```

### Step 4: Verify Results
Check that everything is now synchronized:

```bash
npm run check:counts
```

## 🔧 Command Line Options

The `sync:complete` script supports several options:

### `--dry-run`
Shows what would happen without making changes:
```bash
npm run sync:complete:dry
# or
npx tsx scripts/sync-products-complete.ts --dry-run
```

### `--force-delete`
Skips the double-check before deleting products:
```bash
npm run sync:complete:force
# or
npx tsx scripts/sync-products-complete.ts --force-delete
```

### `--skip-verification`
Skips the final count verification step:
```bash
npx tsx scripts/sync-products-complete.ts --skip-verification
```

## 🚀 Production Usage

For production, use the enhanced production sync:

```bash
npm run sync:production
```

This script:
- Uses production environment variables
- Has additional safety checks
- Provides detailed logging
- Is optimized for production databases

## 📊 What Gets Synchronized

### Products
- **Created:** New products from Printful
- **Updated:** Existing products with changes
- **Deleted:** Products removed from Printful

### Variants
- **Created:** New variants for products
- **Updated:** Existing variants with changes
- **Deleted:** Variants removed from products

### Related Data
- Product categories and tags
- Product enhancements
- All related database records (cascading deletes)

## 🛡️ Safety Features

### Double-Check Deletion
By default, the script double-checks that a product doesn't exist in Printful before deleting it from the database.

### Dry Run Mode
Always test with `--dry-run` first to see what would change.

### Progress Tracking
All operations are logged and tracked in the database for monitoring.

### Error Handling
Individual product failures don't stop the entire sync process.

## 📈 Monitoring and Logs

All synchronization operations are logged in the `sync_logs` table with:
- Operation type and status
- Progress tracking
- Detailed statistics
- Error messages and warnings
- Timing information

## 🔍 Troubleshooting

### Count Mismatch After Sync
If counts still don't match after running the sync:

1. Check the sync logs for errors
2. Run `npm run check:counts` to see details
3. Look for specific products that failed to sync
4. Check Printful API connectivity

### Products Not Deleting
If products aren't being deleted:

1. Verify the product is actually removed from Printful
2. Check if the product has any special status
3. Use `--force-delete` flag (with caution)
4. Check database permissions

### API Rate Limits
If you hit Printful API limits:

1. The scripts include respectful delays
2. Consider running during off-peak hours
3. Check your Printful API usage limits

## 📝 Example Workflow

Here's a typical workflow for keeping your store synchronized:

### Daily/Weekly
```bash
# Check if anything is out of sync
npm run check:counts

# If there are mismatches, run a complete sync
npm run sync:complete
```

### After Product Changes in Printful
```bash
# Quick check
npm run check:counts

# If needed, sync changes
npm run sync:complete
```

### Before Major Updates
```bash
# Dry run to see what would change
npm run sync:complete:dry

# If everything looks good, apply changes
npm run sync:complete
```

## 🎉 Benefits

With these enhanced scripts, you now have:

1. **Complete Synchronization** - Database always matches Printful exactly
2. **Automatic Cleanup** - Removed products are automatically deleted
3. **Safety Features** - Multiple verification steps and dry-run mode
4. **Better Monitoring** - Detailed logging and progress tracking
5. **Flexibility** - Works in any environment with configurable options

Your store will now stay perfectly synchronized with Printful, ensuring customers only see products that actually exist and can be purchased!
