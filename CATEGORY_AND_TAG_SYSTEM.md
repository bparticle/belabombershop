# Category and Tag Management System

## Overview

This document describes the comprehensive product management system that replaces the old automatic category system with a robust, scalable manual category and tag management solution.

## Architecture

### Database Schema

The system uses a normalized database design with the following key tables:

- **`categories`** - Stores category information with hierarchical support
- **`tags`** - Stores tag information with usage tracking
- **`product_categories`** - Many-to-many relationship between products and categories
- **`product_tags`** - Many-to-many relationship between products and tags
- **`category_mapping_rules`** - Rules for automatic categorization during sync

### Key Features

1. **Hierarchical Categories** - Support for parent-child category relationships
2. **Primary Categories** - Each product can have one primary category
3. **Flexible Tagging** - Unlimited tags per product with usage statistics
4. **Automatic Categorization** - AI-powered category suggestions during sync
5. **System Categories** - Protected categories that cannot be deleted
6. **Usage Tracking** - Real-time statistics for categories and tags

## Services

### CategoryService

Located at `src/lib/database/services/category-service.ts`

**Key Methods:**
- `getAllCategories()` - Get categories with filtering options
- `getCategoryTree()` - Get hierarchical category structure
- `createCategory()` - Create new categories
- `updateCategory()` - Update existing categories
- `deleteCategory()` - Delete categories (with safety checks)
- `autoCategorizeProduct()` - Automatically categorize products
- `assignCategoryToProduct()` - Assign categories to products

### TagService

Located at `src/lib/database/services/tag-service.ts`

**Key Methods:**
- `getAllTags()` - Get tags with sorting and filtering
- `createTag()` - Create new tags
- `updateTag()` - Update existing tags
- `deleteTag()` - Delete tags (with safety checks)
- `autoTagProduct()` - Automatically tag products
- `assignTagsToProduct()` - Assign tags to products
- `getTagsWithStats()` - Get tags with usage statistics

### ProductService

Enhanced with category and tag integration:

**New Methods:**
- `updateProductCategories()` - Update product category assignments
- `updateProductTags()` - Update product tag assignments
- `autoCategorizeAndTagProduct()` - Auto-categorize and tag during sync
- `getProductWithFullInfo()` - Get product with complete category/tag info

## API Endpoints

### Categories API

**GET** `/api/admin/categories`
- Query parameters:
  - `includeInactive` - Include inactive categories
  - `includeSystem` - Include system categories
  - `parentId` - Filter by parent category
  - `tree` - Return hierarchical structure

**POST** `/api/admin/categories`
- Create new category
- Required: `name`, `slug`
- Optional: `description`, `color`, `icon`, `parentId`, `sortOrder`

**PUT** `/api/admin/categories?id={id}`
- Update existing category

**DELETE** `/api/admin/categories?id={id}`
- Delete category (with safety checks)

### Tags API

**GET** `/api/admin/tags`
- Query parameters:
  - `includeInactive` - Include inactive tags
  - `sortBy` - Sort by name, usageCount, or createdAt
  - `sortOrder` - asc or desc
  - `search` - Search by tag name
  - `withStats` - Include usage statistics

**POST** `/api/admin/tags`
- Create new tag
- Required: `name`, `slug`
- Optional: `description`, `color`

**PUT** `/api/admin/tags?id={id}`
- Update existing tag

**DELETE** `/api/admin/tags?id={id}`
- Delete tag (with safety checks)

## Admin Interface

### Category Management (`/admin/categories`)

Features:
- Hierarchical category tree display
- Create, edit, and delete categories
- Visual indicators for system categories
- Product count display
- Color and icon customization
- Sort order management

### Tag Management (`/admin/tags`)

Features:
- Grid layout with tag cards
- Search functionality
- Sorting by name, usage, or creation date
- Usage statistics with color coding
- Create, edit, and delete tags
- Color customization

## Automatic Categorization

### Category Mapping Rules

The system uses configurable rules for automatic categorization:

1. **Name Keywords** - Match product names against keywords
2. **Tag Keywords** - Match product tags against keywords
3. **Metadata Keys** - Match product metadata fields

### Default Rules

The system initializes with default mapping rules:

**Children Category:**
- Keywords: kids, child, children, baby, toddler, youth, junior

**Adults Category:**
- Keywords: adult, men, women, grown, mature

**Accessories Category:**
- Keywords: bag, backpack, hat, cap, accessory, accessories

**Home & Living Category:**
- Keywords: home, living, decor, decoration, house, room, wall, cushion, pillow, blanket

### Auto-Tagging

The system automatically creates and assigns tags based on:

1. **Product Name Analysis** - Extract meaningful words
2. **Printful Tags** - Import existing tags from Printful
3. **Keyword Detection** - Identify trending keywords (new, trending, popular, etc.)

## Migration Process

### Running the Migration

1. **Database Migration:**
   ```bash
   npm run db:migrate
   ```

2. **Initialize Categories and Tags:**
   ```bash
   npx tsx scripts/migrate-categories-and-tags.ts
   ```

### Migration Steps

1. **Initialize Default Categories** - Creates system categories (Children, Adults, Accessories, Home & Living)
2. **Initialize Default Tags** - Creates common tags (New, Trending, Popular, Best Seller, Featured)
3. **Migrate Existing Products** - Auto-categorize and auto-tag all existing products
4. **Update Usage Counts** - Calculate and update tag usage statistics

## Best Practices

### Category Management

1. **Use Hierarchical Structure** - Organize categories in logical parent-child relationships
2. **Keep Categories Focused** - Each category should have a clear, specific purpose
3. **Use Descriptive Names** - Category names should be self-explanatory
4. **Set Primary Categories** - Ensure each product has one primary category
5. **Monitor Usage** - Regularly review category usage and clean up unused categories

### Tag Management

1. **Use Consistent Naming** - Follow a consistent naming convention for tags
2. **Limit Tag Count** - Avoid over-tagging products (recommend 3-10 tags per product)
3. **Use Descriptive Tags** - Tags should provide meaningful information
4. **Monitor Popularity** - Use usage statistics to identify trending tags
5. **Clean Up Unused Tags** - Regularly remove tags with zero usage

### Performance Considerations

1. **Indexing** - All foreign keys and frequently queried fields are indexed
2. **Caching** - Consider implementing Redis caching for frequently accessed data
3. **Pagination** - Use pagination for large tag/category lists
4. **Lazy Loading** - Load category trees and tag lists on demand

## Security

### Access Control

- All admin endpoints require authentication
- Admin token verification on all category/tag operations
- CSRF protection on all forms

### Data Validation

- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- XSS protection through proper output encoding

### Safety Checks

- Prevent deletion of categories with associated products
- Prevent deletion of system categories
- Prevent deletion of tags with associated products
- Validate hierarchical relationships

## Monitoring and Analytics

### Usage Statistics

- Category product counts
- Tag usage statistics
- Popular categories and tags
- Recent activity tracking

### Performance Metrics

- API response times
- Database query performance
- Memory usage
- Error rates

## Troubleshooting

### Common Issues

1. **Category Not Appearing** - Check if category is active and has proper permissions
2. **Tags Not Saving** - Verify tag name uniqueness and slug format
3. **Auto-categorization Not Working** - Check mapping rules and product data
4. **Performance Issues** - Monitor database indexes and query optimization

### Debug Tools

- Database query logging
- API request/response logging
- Error tracking and reporting
- Performance monitoring

## Future Enhancements

### Planned Features

1. **Bulk Operations** - Bulk category/tag assignment
2. **Advanced Search** - Full-text search with filters
3. **Analytics Dashboard** - Detailed usage analytics
4. **Import/Export** - CSV import/export functionality
5. **API Rate Limiting** - Protect against abuse
6. **Webhook Integration** - Real-time updates to external systems

### Scalability Improvements

1. **Database Sharding** - For very large datasets
2. **CDN Integration** - For static category/tag data
3. **Microservices** - Split into separate services
4. **Event Sourcing** - For audit trails and history

## Support

For technical support or questions about the category and tag system:

1. Check this documentation
2. Review the code comments
3. Check the database schema
4. Monitor the application logs
5. Contact the development team

---

*This system is designed to be scalable, maintainable, and follows enterprise-level best practices for e-commerce applications.*
