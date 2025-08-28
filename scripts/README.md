# Scripts Directory

This directory contains utility scripts for development and maintenance tasks.

## Available Scripts

### `get-product-variants.js`
Fetches all products from Printful and displays their variants with external IDs, colors, and sizes. Use this to set up product enhancements.

**Usage:**
```bash
npm run getVariants
```

**What it does:**
- Fetches all products from your Printful store
- Displays each product with all its variants
- Shows external IDs, colors, and sizes for each variant
- Generates enhancement templates you can copy to `src/lib/product-enhancements.ts`

**Requirements:**
- `PRINTFUL_API_KEY` must be set in your `.env` file

**Output:**
- Lists all products and their variants
- Provides ready-to-use enhancement templates
- Shows tips for setting up product enhancements

## Adding New Scripts

When adding new scripts:

1. Create the script in this directory
2. Add a corresponding npm script in `package.json`
3. Update this README with documentation
4. Ensure the script handles errors gracefully
5. Add any required dependencies to `package.json`
