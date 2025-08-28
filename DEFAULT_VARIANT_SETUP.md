# Default Variant Setup Guide

## Overview

This system allows you to specify which variant of each product should be displayed by default on the home page, instead of relying on alphabetical sorting (which was defaulting to "Azalea" variants).

## How It Works

1. **Product Enhancements**: Each product can have a `defaultVariant` field in the `PRODUCT_ENHANCEMENTS` object
2. **Fallback Logic**: If no default variant is specified, the system will:
   - First try to find a black variant
   - If no black variant exists, use the first available variant
3. **Automatic Integration**: The system automatically applies these defaults on the home page

## Setting Up Default Variants

### Step 1: Find Your Product's External ID

The external ID is the key in the `PRODUCT_ENHANCEMENTS` object. You can find this in your Printful dashboard or by checking the product data.

### Step 2: Find Variant External IDs

To find the correct external IDs for variants, you can temporarily add this code to your home page:

```typescript
// In src/pages/index.tsx, add this import:
import { debugProductVariants } from "../lib/product-enhancements";

// Then in the getStaticProps function, after processing products:
products.forEach(product => {
  debugProductVariants(product);
});
```

This will log all variants to the console during build time, showing you the external IDs.

### Step 3: Update Product Enhancements

In `src/lib/product-enhancements.ts`, update your product entries:

```typescript
'YOUR_PRODUCT_EXTERNAL_ID': {
  description: '...',
  shortDescription: '...',
  defaultVariant: 'VARIANT_EXTERNAL_ID', // Add this line
  features: [...],
  // ... rest of your enhancement data
}
```

### Step 4: Remove Debug Code

Once you've set up all your default variants, remove the debug code from the home page.

## Example

```typescript
'68ac95d1455845': {
  description: 'Premium cotton t-shirt...',
  shortDescription: 'Premium cotton t-shirt...',
  defaultVariant: '68ab56d7b798a', // Black variant
  features: [...],
  // ... rest of data
}
```

## Best Practices

1. **Consistency**: Try to use the same color variant across similar products (e.g., always use black for t-shirts)
2. **User Experience**: Choose variants that look good and represent the product well
3. **Availability**: Ensure the default variant is in stock
4. **Testing**: Test your changes to ensure the correct variants are showing

## Troubleshooting

- If a default variant isn't showing, check that the external ID matches exactly
- If no variant shows, ensure the product has at least one variant
- Use the debug function to verify your external IDs are correct

## Files Modified

- `src/types.ts` - Added `defaultVariant` field to `ProductEnhancement` interface
- `src/lib/product-enhancements.ts` - Added helper functions and updated existing products
- `src/components/Product.tsx` - Updated to use default variant logic
