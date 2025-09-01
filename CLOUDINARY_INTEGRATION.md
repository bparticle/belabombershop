# Cloudinary Integration

This document describes the Cloudinary integration for image management in the Bela Bomberman store.

## Overview

The application now uses Cloudinary for image storage and optimization instead of storing images locally. This provides:

- **Automatic image optimization**: Images are automatically resized and optimized
- **CDN delivery**: Fast global image delivery
- **Transformations**: On-the-fly image transformations (resize, crop, format conversion)
- **Reduced storage**: No need to store large image files locally

## Environment Variables

Add the following environment variables to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

You can get these values from your Cloudinary dashboard.

## Features

### 1. Image Upload

The admin interface now includes a drag-and-drop image upload component that:

- Accepts image files (PNG, JPG, GIF)
- Validates file size (max 10MB)
- Uploads directly to Cloudinary
- Stores Cloudinary public IDs for transformations

### 2. Automatic Image Optimization

All images displayed on the product detail pages are automatically downsized to a maximum of 1000px width/height while maintaining aspect ratio. This:

- Improves page load performance
- Reduces bandwidth usage
- Maintains image quality
- Works with both Cloudinary and local images

### 3. Backward Compatibility

The system maintains backward compatibility with existing local images:

- Local images (`/images/products/...`) continue to work
- Cloudinary images are automatically detected and optimized
- Existing product enhancements are preserved

## Database Schema Changes

The `productEnhancements` table now includes a `public_id` field for Cloudinary images:

```sql
additionalImages: jsonb('additional_images').$type<Array<{
  url: string;
  alt: string;
  caption?: string;
  public_id?: string; // Cloudinary public ID for transformations
}>>(),
```

## Migration

To migrate existing local images to Cloudinary format, run:

```bash
npm run migrate-cloudinary
```

This script will:
- Convert local image paths to Cloudinary public IDs
- Preserve existing image URLs for backward compatibility
- Update the database with the new format

## API Endpoints

### POST /api/admin/upload-image

Uploads an image to Cloudinary.

**Request:**
```json
{
  "image": "base64_encoded_image_data",
  "filename": "optional_filename.jpg",
  "folder": "optional_folder_name"
}
```

**Response:**
```json
{
  "success": true,
  "image": {
    "public_id": "belabomberman/products/image_name",
    "url": "https://res.cloudinary.com/...",
    "alt": "Image name"
  },
  "uploadResult": {
    "public_id": "belabomberman/products/image_name",
    "secure_url": "https://res.cloudinary.com/...",
    "width": 1920,
    "height": 1080,
    "format": "jpg",
    "resource_type": "image"
  }
}
```

## Components

### ImageUpload

A React component for drag-and-drop image uploads:

```tsx
<ImageUpload
  onImageUploaded={(cloudinaryImage) => handleImageUploaded(image)}
  onError={(error) => console.error(error)}
  maxSize={10} // MB
/>
```

### SafeImage

Enhanced to support Cloudinary transformations:

```tsx
<SafeImage
  src="https://res.cloudinary.com/..."
  alt="Product image"
  useDownsized={true} // Automatically downsizes to 1000px max
/>
```

## Image Transformations

### Downsized Images

All product images are automatically downsized to a maximum of 1000px width/height:

```typescript
// Automatically applied when useDownsized={true}
const downsizedUrl = getDownsizedImageUrl(publicId, {
  width: 1000,
  height: 1000,
  quality: 'auto',
  format: 'auto',
  crop: 'limit'
});
```

### Custom Transformations

You can apply custom transformations:

```typescript
import { getDownsizedImageUrl } from '../lib/cloudinary';

const customUrl = getDownsizedImageUrl(publicId, {
  width: 500,
  height: 500,
  quality: 80,
  format: 'webp'
});
```

## File Structure

```
src/
├── lib/
│   └── cloudinary.ts          # Cloudinary utilities
├── components/
│   ├── ImageUpload.tsx        # Upload component
│   └── SafeImage.tsx          # Enhanced image component
├── pages/
│   └── api/
│       └── admin/
│           └── upload-image.ts # Upload API endpoint
└── scripts/
    └── migrate-to-cloudinary.ts # Migration script
```

## Best Practices

1. **Image Optimization**: Always use `useDownsized={true}` for product images
2. **File Size**: Keep uploads under 10MB for best performance
3. **Alt Text**: Always provide descriptive alt text for accessibility
4. **Error Handling**: Implement proper error handling for failed uploads
5. **Backup**: Keep local image backups during migration

## Troubleshooting

### Upload Failures

- Check Cloudinary credentials in environment variables
- Verify file size is under 10MB
- Ensure file is a valid image format

### Image Not Loading

- Check if the image URL is valid
- Verify Cloudinary account has sufficient credits
- Check browser console for CORS errors

### Migration Issues

- Ensure database connection is working
- Check that environment variables are set
- Verify file permissions for the migration script

## Future Enhancements

- **Bulk Upload**: Support for multiple image uploads
- **Image Cropping**: In-browser image cropping before upload
- **Format Conversion**: Automatic WebP conversion for better compression
- **Lazy Loading**: Enhanced lazy loading for better performance
- **Image Analytics**: Track image usage and performance
