# Product Category System Documentation

## Overview

The product category system provides a robust, scalable way to organize and filter products in the Bela Bomberman Collection e-commerce store. This system leverages Printful's metadata capabilities and provides a flexible categorization framework that can be easily extended and maintained.

## Features

- **Automatic Category Detection**: Products are automatically categorized based on metadata, tags, and name patterns
- **Visual Category Badges**: Products display category badges with icons and colors
- **Category Filtering**: Users can filter products by category on the main page
- **Category Pages**: Dedicated pages for each category with SEO optimization
- **Responsive Design**: All category components are fully responsive
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Category Configuration

### Available Categories

The system includes four predefined categories:

1. **Children** (`children`)
   - Icon: 👶
   - Color: #FF6B6B
   - Description: Products designed for kids and children

2. **Adults** (`adults`)
   - Icon: 👨‍💼
   - Color: #4ECDC4
   - Description: Products designed for adults

3. **Unisex** (`unisex`)
   - Icon: 👥
   - Color: #45B7D1
   - Description: Products suitable for all ages

4. **Accessories** (`accessories`)
   - Icon: 👜
   - Color: #96CEB4
   - Description: Fashion accessories and add-ons

### Category Detection Rules

Products are categorized using a hierarchical approach:

1. **Metadata Priority**: Check product metadata fields first (most reliable)
   - `category`
   - `audience`
   - `target_age`
   - `age_group`
   - `demographic`

2. **Tag Analysis**: Check product tags for category keywords
3. **Name Pattern Matching**: Analyze product name for category indicators
4. **Default Fallback**: Products without clear category indicators default to "unisex"

### Keyword Mapping

#### Children Category Keywords
- **Name Keywords**: kids, child, children, baby, toddler, youth, junior
- **Tag Keywords**: kids, children, child, baby, toddler, youth

#### Adults Category Keywords
- **Name Keywords**: adult, men, women, grown, mature
- **Tag Keywords**: adult, men, women, grown

#### Accessories Category Keywords
- **Name Keywords**: bag, backpack, hat, cap, accessory, accessories
- **Tag Keywords**: accessory, accessories, bag, hat

## Implementation Details

### Core Files

#### 1. Category Configuration (`src/lib/category-config.ts`)
- Defines category structure and metadata
- Contains category detection logic
- Provides utility functions for category management

#### 2. Type Definitions (`src/types.ts`)
- `ProductCategory`: Category structure interface
- `CategoryFilter`: Filter interface with counts
- `ProductFilters`: Complete filter state interface

#### 3. Components

**CategoryBadge** (`src/components/CategoryBadge.tsx`)
- Displays category badges on products
- Supports different sizes (sm, md, lg)
- Optional icon display
- Accessible with proper ARIA labels

**CategoryFilter** (`src/components/CategoryFilter.tsx`)
- Interactive category filtering interface
- Shows category counts
- Supports clear all functionality
- Fully accessible with keyboard navigation

**ProductGrid** (`src/components/ProductGrid.tsx`)
- Enhanced with category filtering
- Displays filtered product counts
- Responsive grid layout

### Pages

#### 1. Home Page (`src/pages/index.tsx`)
- Processes products with category detection
- Displays category filters
- Shows category badges on products

#### 2. Product Detail Page (`src/pages/product/[id].tsx`)
- Shows category badge on product details
- Includes category in breadcrumb navigation

#### 3. Category Pages (`src/pages/category/[slug].tsx`)
- Dedicated pages for each category
- SEO optimized with proper meta tags
- Breadcrumb navigation
- Product count display

## Usage Examples

### Adding a New Category

1. **Update Category Configuration**:
```typescript
// In src/lib/category-config.ts
export const PRODUCT_CATEGORIES: ProductCategory[] = [
  // ... existing categories
  {
    id: 'new-category',
    name: 'New Category',
    description: 'Description of the new category',
    slug: 'new-category',
    color: '#FF6B6B',
    icon: '🎯'
  }
];
```

2. **Add Detection Keywords**:
```typescript
export const CATEGORY_MAPPING_RULES = {
  nameKeywords: {
    // ... existing categories
    'new-category': ['keyword1', 'keyword2']
  },
  tagKeywords: {
    // ... existing categories
    'new-category': ['tag1', 'tag2']
  }
};
```

### Customizing Category Detection

The category detection logic can be customized by modifying the `determineProductCategory` function in `src/lib/category-config.ts`. The function supports:

- Custom metadata field names
- Complex keyword matching patterns
- External API integration
- Machine learning-based classification

### Styling Categories

Category badges use CSS custom properties for colors, making them easy to customize:

```css
.category-badge {
  background-color: var(--category-color-20);
  color: var(--category-color);
  border: 1px solid var(--category-color-40);
}
```

## Printful Integration

### Metadata Usage

The system leverages Printful's product metadata fields:

- **Tags**: Product tags for category identification
- **Metadata**: Custom metadata fields for category information
- **Product Name**: Name pattern analysis for category detection

### Best Practices for Printful Setup

1. **Use Consistent Tagging**: Apply consistent tags across similar products
2. **Leverage Metadata**: Use metadata fields for category information
3. **Descriptive Names**: Include category indicators in product names
4. **Regular Updates**: Update product metadata as categories evolve

## SEO Benefits

### Category Pages
- Unique URLs for each category (`/category/children`, `/category/adults`)
- Optimized meta titles and descriptions
- Structured data markup support
- Breadcrumb navigation for better crawlability

### Product Pages
- Category information in product schema
- Related category links
- Category-specific meta tags

## Performance Considerations

### Static Generation
- Category pages are statically generated at build time
- Product filtering happens client-side for better performance
- Category data is cached and revalidated periodically

### Optimization
- Category filters use React.memo for performance
- Product filtering is memoized to prevent unnecessary re-renders
- Category badges are optimized for rendering performance

## Accessibility Features

### Keyboard Navigation
- Category filters support full keyboard navigation
- Focus indicators for all interactive elements
- Proper tab order and skip links

### Screen Reader Support
- ARIA labels for category badges
- Descriptive alt text for category icons
- Proper heading structure for category pages

### Color and Contrast
- High contrast colors for category badges
- Color is not the only indicator of category
- Support for reduced motion preferences

## Future Enhancements

### Planned Features
1. **Multi-level Categories**: Support for subcategories
2. **Dynamic Categories**: Admin interface for category management
3. **Category Analytics**: Track category performance and popularity
4. **Smart Recommendations**: Category-based product recommendations
5. **Category SEO**: Advanced SEO features for category pages

### Extension Points
- Category detection can be extended with AI/ML models
- External category data sources can be integrated
- Custom category visualization components can be added
- Category-based pricing and promotions can be implemented

## Troubleshooting

### Common Issues

1. **Products Not Categorized**: Check if product has proper metadata or tags
2. **Category Not Displaying**: Verify category ID matches configuration
3. **Filter Not Working**: Ensure category detection is running correctly
4. **Styling Issues**: Check if category colors are properly defined

### Debug Tools

Use the debug endpoint to inspect product data:
```
GET /api/debug/printful-data
```

This will show the raw product data including metadata and tags used for categorization.

## Maintenance

### Regular Tasks
1. **Review Category Accuracy**: Periodically check if products are correctly categorized
2. **Update Keywords**: Add new keywords as product catalog evolves
3. **Monitor Performance**: Track category page performance and user engagement
4. **Update Documentation**: Keep this documentation current with system changes

### Category Updates
When updating categories:
1. Update the configuration file
2. Test with existing products
3. Update documentation
4. Deploy changes during low-traffic periods

## Support

For questions or issues with the category system:
1. Check this documentation first
2. Review the debug endpoint output
3. Check browser console for errors
4. Contact the development team with specific error details
