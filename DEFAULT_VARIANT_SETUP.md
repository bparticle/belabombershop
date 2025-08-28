# Default Variant Setup Guide

This guide helps you set up default variants for your products in the product enhancements system.

## Overview

The product enhancements system allows you to specify which variant should be displayed by default for each product. This is useful for ensuring customers see your preferred color/size combination first.

## Step 1: Get Product Variants

Use the built-in script to get all your product variants and their external IDs:

```bash
npm run getVariants
```

This will:
- Fetch all products from your Printful store
- Display each product with all its variants
- Show external IDs, colors, and sizes for each variant
- Generate enhancement templates you can use

## Step 2: Set Default Variants

1. Run the script and copy the external IDs you need
2. Open `src/lib/product-enhancements.ts`
3. For each product, set the `defaultVariant` property to your preferred variant's external ID

Example:
```typescript
'68ac95d1455845': {
  description: 'Your product description',
  shortDescription: 'Short description',
  defaultVariant: '68ac95d1455b15', // Set this to your preferred variant
  // ... other properties
}
```

## Step 3: Test Your Changes

1. Start your development server: `npm run dev`
2. Visit your product pages to verify the correct variants are showing
3. Check that the default variant matches your preference

## Step 4: Verify Setup

- Use the getVariants script to verify your external IDs are correct
- Test with existing products to ensure the right variants display
- Check that the fallback logic works for products without enhancements

## Troubleshooting

### Variant Not Found
If a variant isn't found, check:
1. The external ID is correct (use `npm run getVariants` to verify)
2. The variant exists in your Printful store
3. The product has the enhancement configured

### Fallback Behavior
If no default variant is set, the system will:
1. Try to find a black variant
2. Fall back to the first available variant

### Debugging
- Use `npm run getVariants` to see all available variants
- Check the browser console for any errors
- Verify your product enhancement configuration
