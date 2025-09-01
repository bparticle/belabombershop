// Client-safe Cloudinary utilities
// These functions work on the client side without importing the full Cloudinary library

export interface CloudinaryImage {
  public_id: string;
  url: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  format?: string;
}

export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'scale' | 'fit' | 'limit' | 'mfit' | 'fill' | 'lfill' | 'pad' | 'lpad' | 'mpad' | 'crop' | 'thumb' | 'imagga_scale' | 'imagga_crop';
  gravity?: 'north' | 'north_east' | 'east' | 'south_east' | 'south' | 'south_west' | 'west' | 'north_west' | 'center' | 'auto' | 'face' | 'faces' | 'body' | 'ocr_text';
  quality?: 'auto' | 'auto:best' | 'auto:eco' | 'auto:good' | 'auto:low' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif';
  fetch_format?: 'auto' | 'jpg' | 'png' | 'webp' | 'avif' | 'gif';
  flags?: string[];
  dpr?: 'auto' | number;
  responsive?: boolean;
}

// Constants for client-side use
export const CLOUDINARY_CONSTANTS = {
  DEFAULT_TRANSFORMATIONS: {
    thumbnail: { width: 150, height: 150, crop: 'thumb' },
    preview: { width: 300, height: 300, crop: 'limit' },
    medium: { width: 600, height: 600, crop: 'limit' },
    large: { width: 1000, height: 1000, crop: 'limit' },
    hero: { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
  },
} as const;

/**
 * Check if an image URL is from Cloudinary
 * @param url - The image URL
 * @returns boolean
 */
export function isCloudinaryUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com');
}

/**
 * Extract public_id from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns string | null
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!isCloudinaryUrl(url)) return null;
  
  try {
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload' and before the transformation parameters
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.split('/').slice(1).join('/').split('.')[0];
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public_id from URL:', error);
    return null;
  }
}

/**
 * Build transformation string from options
 * @param options - Transformation options
 * @returns Transformation string
 */
function buildTransformationString(options: TransformationOptions): string {
  const transformations: string[] = [];

  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);
  if (options.gravity) transformations.push(`g_${options.gravity}`);
  if (options.quality) transformations.push(`q_${options.quality}`);
  if (options.format) transformations.push(`f_${options.format}`);
  if (options.fetch_format) transformations.push(`f_${options.fetch_format}`);
  if (options.dpr) transformations.push(`dpr_${options.dpr}`);
  if (options.responsive) transformations.push('fl_auto_image');
  if (options.flags) {
    options.flags.forEach(flag => transformations.push(`fl_${flag}`));
  }

  return transformations.join(',');
}

/**
 * Generate a Cloudinary URL with transformations
 * @param publicId - The Cloudinary public ID
 * @param options - Transformation options
 * @returns The transformed URL
 */
export function generateImageUrl(
  publicId: string,
  options: TransformationOptions = {}
): string {
  try {
    if (!publicId) {
      throw new Error('Public ID is required');
    }

    const transformation = buildTransformationString(options);
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured');
    }

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  } catch (error) {
    console.error('URL generation error:', error);
    throw error;
  }
}

/**
 * Get optimized image URL for different use cases
 * @param publicId - The Cloudinary public ID
 * @param size - Predefined size
 * @returns Optimized URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  size: keyof typeof CLOUDINARY_CONSTANTS.DEFAULT_TRANSFORMATIONS
): string {
  const transformation = CLOUDINARY_CONSTANTS.DEFAULT_TRANSFORMATIONS[size];
  return generateImageUrl(publicId, transformation);
}

/**
 * Get a downsized version of an image (max 1000px width/height)
 * @param publicId - The Cloudinary public ID
 * @param options - Transformation options
 * @returns The transformed URL
 */
export function getDownsizedImageUrl(
  publicId: string,
  options: TransformationOptions = {}
): string {
  const defaultOptions: TransformationOptions = {
    width: 1000,
    height: 1000,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
    ...options,
  };
  
  return generateImageUrl(publicId, defaultOptions);
}

/**
 * Generate responsive image URLs for different breakpoints
 * @param publicId - The Cloudinary public ID
 * @param breakpoints - Array of widths
 * @returns Object with responsive URLs
 */
export function generateResponsiveUrls(
  publicId: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280]
): Record<string, string> {
  const urls: Record<string, string> = {};
  
  breakpoints.forEach(width => {
    urls[`${width}w`] = generateImageUrl(publicId, {
      width,
      height: Math.round(width * 0.75), // 4:3 aspect ratio
      crop: 'limit',
      quality: 'auto',
      format: 'auto',
    });
  });

  return urls;
}

/**
 * Generate srcset string for responsive images
 * @param publicId - The Cloudinary public ID
 * @param breakpoints - Array of widths
 * @returns Srcset string
 */
export function generateSrcset(
  publicId: string,
  breakpoints: number[] = [320, 640, 768, 1024, 1280]
): string {
  const responsiveUrls = generateResponsiveUrls(publicId, breakpoints);
  return Object.entries(responsiveUrls)
    .map(([width, url]) => `${url} ${width}`)
    .join(', ');
}

/**
 * Convert a local image path to Cloudinary format (for backward compatibility)
 * @param localPath - Local image path (e.g., '/images/products/image.jpg')
 * @returns Cloudinary image object
 */
export function convertLocalPathToCloudinary(localPath: string): CloudinaryImage {
  // Extract filename from path
  const filename = localPath.split('/').pop()?.split('.')[0] || '';
  
  return {
    public_id: `belabomberman/products/${filename}`,
    url: localPath, // Keep original URL for backward compatibility
    alt: filename.replace(/-/g, ' '),
  };
}

/**
 * Validate image file before upload (client-side validation)
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  const SUPPORTED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'ico'];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !SUPPORTED_FORMATS.includes(extension as any)) {
    return {
      valid: false,
      error: `Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
    };
  }

  // Check MIME type
  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'File must be an image',
    };
  }

  return { valid: true };
}
