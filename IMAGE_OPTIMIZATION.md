# Image Optimization Scripts

This project includes two image optimization scripts to reduce file sizes while maintaining quality.

## Scripts Available

### 1. Aggressive Optimization (Recommended for maximum savings)
```bash
npm run optimizeImages
```
- **Converts all images to WebP format** for maximum compression
- Resizes images to maximum 1000px width
- Uses aggressive WebP compression settings
- **Expected savings: 50-80% file size reduction**

### 2. Conservative Optimization (Maintains original formats)
```bash
npm run optimizeImages:conservative
```
- **Keeps original file formats** (JPG, PNG, etc.)
- Resizes images to maximum 1000px width
- Applies maximum compression for each format
- **Expected savings: 20-50% file size reduction**

## Requirements

- ImageMagick installed locally
- Node.js with TypeScript support

## Features

- ✅ **In-place optimization** - Uses mogrify for efficient direct file modification
- ✅ **Smart resizing** - Only resizes if images are wider than 1000px
- ✅ **Format-specific optimization** - Uses optimal settings for each image format
- ✅ **Detailed reporting** - Shows before/after sizes and savings
- ✅ **Fast processing** - No backup/restore overhead since these are never original files

## Usage Examples

### Run aggressive optimization (WebP conversion):
```bash
npm run optimizeImages
```

### Run conservative optimization (keep original formats):
```bash
npm run optimizeImages:conservative
```

### Expected Output:
```
🖼️  Starting image optimization...

Found 4 image(s) to optimize:

Processing: youth-classic-tee-royal-product-details-68ab56d7bba36.png
  Original: 1200x800 (png)
  Optimized: 1000x667 (webp)
  Size: 5.00MB → 0.85MB
  Savings: 4.15MB (83.0%)

📊 Optimization Summary:
Total original size: 8.50MB
Total optimized size: 1.25MB
Total savings: 7.25MB (85.3%)

✅ Image optimization complete!
```

## File Format Recommendations

### For Maximum Savings (WebP):
- **Best for**: Product images, thumbnails, web use
- **Compression**: 50-80% smaller than original
- **Browser Support**: Modern browsers (95%+ support)
- **Use when**: You want maximum file size reduction

### For Conservative Approach:
- **Best for**: Maintaining compatibility, specific format requirements
- **Compression**: 20-50% smaller than original
- **Browser Support**: Universal
- **Use when**: You need to maintain original file formats

## Processing Notes

- **In-place optimization**: Files are modified directly using `mogrify`
- **No backups**: Since these are never original files, no backup overhead
- **Fast execution**: Direct modification is much faster than copy/restore approach

## Customization

You can modify the scripts to adjust:
- `MAX_WIDTH`: Maximum image width (currently 1000px)
- `QUALITY`: WebP quality setting (currently 85)
- Compression settings for specific formats

## Notes

- Scripts only process images in `public/images/products/`
- Only runs locally (not on Netlify deployment)
- Requires ImageMagick to be installed and accessible in PATH
- Supports JPG, JPEG, PNG, GIF, BMP, TIFF, and WebP formats
