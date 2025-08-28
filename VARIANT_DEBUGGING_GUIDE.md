# Variant Debugging Guide

## Overview

This guide explains how to debug product variants and default variant selection in your headless dropshipping store.

## Quick Debugging

### 1. Enable Default Variant Debugging

To debug default variant selection, simply change one line in `src/lib/product-enhancements.ts`:

```typescript
// Change this line from false to true
const DEBUG_DEFAULT_VARIANTS = true;
```

This will show detailed console logs about:
- Which product is being processed
- Whether an enhancement was found
- What default variant is being looked for
- Whether the default variant was found
- What fallback variant is being used

### 2. Get All Product Variants

To see all available variants for your products, add this to your home page temporarily:

```typescript
// In src/pages/index.tsx, add this import:
import { debugProductVariants } from "../lib/product-enhancements";

// Then in the getStaticProps function, after processing products:
products.forEach(product => {
  debugProductVariants(product);
});
```

This will log all variants with their external IDs, colors, and sizes.

## Debugging Workflow

### Step 1: Enable Debugging
```typescript
// In src/lib/product-enhancements.ts
const DEBUG_DEFAULT_VARIANTS = true;
```

### Step 2: Run Your Site
```bash
npm run dev
# or
yarn dev
```

### Step 3: Check Console Output
Open your browser's developer tools (F12) and check the Console tab. You'll see:
- Detailed default variant selection process
- All available variants for each product
- External IDs for each variant

### Step 4: Update Product Enhancements
Use the external IDs from the console to update your `PRODUCT_ENHANCEMENTS`:

```typescript
'YOUR_PRODUCT_EXTERNAL_ID': {
  description: '...',
  shortDescription: '...',
  defaultVariant: 'VARIANT_EXTERNAL_ID', // From console output
  features: [...],
  // ... rest of your enhancement data
}
```

### Step 5: Disable Debugging
```typescript
// In src/lib/product-enhancements.ts
const DEBUG_DEFAULT_VARIANTS = false;
```

## Debug Output Examples

### Default Variant Debugging
When `DEBUG_DEFAULT_VARIANTS = true`, you'll see:
```
🔍 Getting default variant for product: Pufferfish Youth T-shirt (68ac95d1455845)
🔍 Enhancement found: Yes
🔍 Looking for default variant: 68ac95d1455b15
🔍 Found default variant: M - Navy (68ac95d1455b15)
```

### Product Variants Debugging
When using `debugProductVariants()`, you'll see:
```
Product: Pufferfish Youth T-shirt (68ac95d1455845)
Available variants:
  1. XS - Black - Color: Black - Size: XS - External ID: 68ac95d14558e2
  2. S - Black - Color: Black - Size: S - External ID: 68ac95d1455958
  3. M - Black - Color: Black - Size: M - External ID: 68ac95d14559a5
  ...
---
```

## Troubleshooting

### Issue: Default variant not showing
1. Enable debugging: `DEBUG_DEFAULT_VARIANTS = true`
2. Check if enhancement is found
3. Verify the external ID matches exactly
4. Check if the variant exists in the product

### Issue: Wrong variant showing
1. Use `debugProductVariants()` to get correct external IDs
2. Update your `defaultVariant` in product enhancements
3. Verify the external ID is correct

### Issue: No debugging output
1. Make sure you're looking at the browser console (F12 → Console)
2. Check that the debugging flag is set to `true`
3. Refresh the page after changing the flag

## Best Practices

1. **Always disable debugging in production** - Set `DEBUG_DEFAULT_VARIANTS = false`
2. **Use specific external IDs** - Don't guess, always get them from the debug output
3. **Test after changes** - Always verify your changes work before disabling debugging
4. **Keep debugging code clean** - The system is designed to be non-intrusive

## Files Involved

- `src/lib/product-enhancements.ts` - Main debugging system
- `src/pages/index.tsx` - Where to add variant debugging
- `src/components/Product.tsx` - Product display logic
- `src/components/VariantPicker.tsx` - Variant selection UI

## Quick Reference

```typescript
// Enable default variant debugging
const DEBUG_DEFAULT_VARIANTS = true;

// Get all variants for a product
debugProductVariants(product);

// Set default variant in enhancements
defaultVariant: 'EXTERNAL_ID_FROM_DEBUG_OUTPUT'
```

This system provides a clean, maintainable way to debug variants without cluttering your production code.
