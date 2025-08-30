# Development Scripts

This folder contains debugging and development tools that should not be used in production.

## Scripts

### `get-product-variants.js`
Fetches all products from Printful and displays their variants with external IDs, colors, and sizes. Use this to set up product enhancements.

**Usage:**
```bash
npm run getVariants
```

**Purpose:**
- Debug product variant configuration
- Get external IDs for product enhancements
- Generate enhancement templates

**Note:** This script should only be used during development and setup. It contains extensive console logging and should not be deployed to production.
