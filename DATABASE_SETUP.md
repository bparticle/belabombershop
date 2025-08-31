# Database Setup and Product Management System

This document describes the new database-driven product management system that provides a buffer between Printful API and your storefront.

## Overview

The system consists of:
- **PostgreSQL Database** (hosted on Neon.tech)
- **Drizzle ORM** for type-safe database operations
- **Product Sync Script** for synchronizing with Printful
- **Admin Interface** for managing products and enhancements
- **Database-driven API endpoints** for the storefront

## Database Schema

### Tables

1. **`products`** - Stores Printful product data
   - `id` - Internal database ID
   - `printfulId` - Printful's internal ID
   - `externalId` - Printful's external ID
   - `name`, `thumbnailUrl`, `description`, etc.
   - `isActive` - Whether the product is visible on the storefront

2. **`variants`** - Stores Printful variant data
   - `id` - Internal database ID
   - `productId` - Reference to products table
   - `printfulId` - Printful's variant ID
   - `externalId` - Printful's external variant ID
   - `name`, `retailPrice`, `currency`, etc.
   - `files` - JSON array of variant images

3. **`product_enhancements`** - Stores custom product enhancements
   - `id` - Internal database ID
   - `productId` - Reference to products table
   - `description`, `shortDescription`
   - `features` - JSON array of product features
   - `specifications` - JSON object of product specs
   - `additionalImages` - JSON array of additional images
   - `seo` - JSON object with keywords and meta description
   - `defaultVariantId` - External ID of default variant

4. **`categories`** - Product categories
5. **`product_categories`** - Many-to-many relationship between products and categories
6. **`sync_logs`** - Tracks sync operations

## Setup Instructions

### 1. Database Setup

1. Create a PostgreSQL database on Neon.tech
2. Add the database credentials to your `.env` file:

```env
DATABASE_CLIENT=postgresql
DATABASE_HOST=your_database_host_here
DATABASE_PORT=5432
DATABASE_NAME=your_database_name_here
DATABASE_USERNAME=your_database_username_here
DATABASE_PASSWORD=your_database_password_here
DATABASE_SSL=true
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate and Run Migrations

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate
```

### 4. Initial Product Sync

```bash
# Run the sync script to populate the database
npm run syncProducts
```

## Usage

### Product Synchronization

The sync script (`scripts/sync-products.ts`) handles:

- Fetching all products from Printful
- Creating/updating products in the database
- Creating/updating variants
- Removing products that no longer exist in Printful
- Preserving product enhancements during updates
- Logging sync operations

**Run sync manually:**
```bash
npm run syncProducts
```

**Schedule sync (recommended):**
Set up a cron job or use a service like GitHub Actions to run the sync periodically.

### Admin Interface

Access the admin interface at `/admin` to:

- View all products from the database
- Toggle product visibility
- View sync logs
- Trigger manual syncs

**Note:** The admin interface currently uses a placeholder authentication token. Implement proper authentication before production use.

### Product Enhancement Editor

Access individual product enhancement editors at `/admin/product/[id]` to:

- Edit product descriptions
- Add/remove features
- Manage specifications
- Add additional images
- Configure SEO settings
- Set default variants

### API Endpoints

The system provides several API endpoints:

- `GET /api/products/[id]` - Get product price (for Snipcart)
- `GET /api/admin/products` - Admin: List products
- `PUT /api/admin/products` - Admin: Update product/enhancement
- `GET /api/admin/sync` - Admin: Get sync logs
- `POST /api/admin/sync` - Admin: Trigger sync

## Database Operations

### Product Service

The `ProductService` class provides methods for:

```typescript
// Get all active products (for frontend)
const products = await productService.getActiveProducts();

// Get all products including inactive ones (for admin)
const products = await productService.getAllProductsForAdmin();

// Get product by ID
const product = await productService.getProductById(id);

// Get product by Printful ID
const product = await productService.getProductByPrintfulId(printfulId);

// Get product by external ID
const product = await productService.getProductByExternalId(externalId);

// Update product enhancement
const enhancement = await productService.upsertEnhancement(productId, enhancementData);

// Toggle product visibility
const product = await productService.toggleProductVisibility(productId);
```

### Sync Operations

```typescript
// Create sync log
const syncLog = await productService.createSyncLog({
  operation: 'full_sync',
  status: 'running',
  // ... other fields
});

// Update sync log
await productService.updateSyncLog(syncLog.id, {
  status: 'success',
  duration: 5000,
  // ... other fields
});
```

## Migration from File-based Enhancements

The system automatically preserves existing product enhancements from the `product-enhancements.ts` file during the first sync. The enhancements are stored in the database and can be managed through the admin interface.

## Benefits

1. **Performance**: Products are served from the database instead of API calls
2. **Reliability**: Reduced dependency on Printful API availability
3. **Flexibility**: Easy to show/hide products and manage enhancements
4. **Scalability**: Database queries are faster than API calls
5. **Control**: Full control over product data and presentation
6. **Audit Trail**: Sync logs track all operations

## Monitoring

### Sync Logs

Monitor sync operations through the admin interface or database:

```sql
SELECT * FROM sync_logs ORDER BY started_at DESC LIMIT 10;
```

### Database Health

Check database connectivity:

```bash
npm run db:studio
```

This opens Drizzle Studio for database inspection.

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify database credentials in `.env`
   - Check if database is accessible from your environment
   - Ensure SSL is properly configured

2. **Sync Fails**
   - Check Printful API key
   - Verify network connectivity
   - Review sync logs for specific errors

3. **Products Not Showing**
   - Check if products are marked as `isActive = true`
   - Verify sync completed successfully
   - Check for database connection issues

### Debug Commands

```bash
# Check database connection
npm run db:studio

# Run sync with verbose logging
npm run syncProducts

# Generate new migration
npm run db:generate
```

## Security Considerations

1. **Admin Authentication**: Implement proper authentication for admin endpoints
2. **Database Access**: Use connection pooling and limit database permissions
3. **API Rate Limiting**: Implement rate limiting on admin endpoints
4. **Environment Variables**: Keep database credentials secure

## Future Enhancements

- [ ] Implement proper admin authentication
- [ ] Add product categories management
- [ ] Add bulk operations for products
- [ ] Implement webhook-based sync triggers
- [ ] Add product analytics and reporting
- [ ] Implement caching layer for better performance
