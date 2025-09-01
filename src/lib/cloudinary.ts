/**
 * Server-Side Cloudinary Integration
 * 
 * This module provides server-side Cloudinary functionality including
 * image upload, transformation, and management utilities.
 * 
 * IMPORTANT: This module should only be used on the server side.
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryImage } from './cloudinary-client';

// Configuration
export const CLOUDINARY_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'ico'] as const,
  FOLDERS: {
    PRODUCTS: 'belabomberman/products',
    ENHANCEMENTS: 'belabomberman/enhancements',
    CATEGORIES: 'belabomberman/categories',
    TEMP: 'belabomberman/temp',
  },
  TRANSFORMATIONS: {
    THUMBNAIL: { width: 150, height: 150, crop: 'thumb' },
    PREVIEW: { width: 300, height: 300, crop: 'limit' },
    MEDIUM: { width: 600, height: 600, crop: 'limit' },
    LARGE: { width: 1000, height: 1000, crop: 'limit' },
    HERO: { width: 1200, height: 800, crop: 'fill', gravity: 'auto' },
  },
} as const;

/**
 * Initialize Cloudinary configuration
 */
function initializeCloudinary() {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing required Cloudinary environment variables: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload options interface
 */
export interface UploadOptions {
  folder?: string;
  public_id?: string;
  quality?: 'auto' | 'auto:best' | 'auto:eco' | 'auto:good' | 'auto:low' | number;
  transformation?: any[];
  eager?: any[];
  eager_async?: boolean;
  overwrite?: boolean;
  invalidate?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  type?: 'upload' | 'private' | 'authenticated';
}

/**
 * Upload result interface
 */
export interface UploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  eager?: any[];
}

/**
 * Upload an image to Cloudinary
 * @param imageBuffer - The image buffer or base64 string
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadImage(
  imageBuffer: Buffer | string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  try {
    // Initialize Cloudinary if not already done
    initializeCloudinary();

    // Default options
    const uploadOptions: UploadOptions = {
      folder: CLOUDINARY_CONSTANTS.FOLDERS.PRODUCTS,
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
      type: 'upload',
      ...options,
    };

    let uploadData: string;
    
    if (Buffer.isBuffer(imageBuffer)) {
      // Convert buffer to base64
      uploadData = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    } else if (typeof imageBuffer === 'string') {
      // Assume it's already a base64 data URL
      uploadData = imageBuffer;
    } else {
      throw new Error('Invalid image data format');
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(uploadData, uploadOptions);

    return {
      ...result,
      folder: result.folder || uploadOptions.folder || '',
      original_filename: result.original_filename || '',
      placeholder: result.placeholder || false,
    } as UploadResult;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Invalid image file')) {
        throw new Error('Invalid image file format or corrupted data');
      }
      if (error.message.includes('File size')) {
        throw new Error('File size exceeds maximum allowed limit');
      }
      if (error.message.includes('API')) {
        throw new Error('Cloudinary API error - check your credentials');
      }
    }
    
    throw new Error('Cloudinary upload failed');
  }
}

/**
 * Create a CloudinaryImage object from upload result
 * @param uploadResult - The Cloudinary upload result
 * @param alt - Alt text for the image
 * @param caption - Optional caption
 * @returns CloudinaryImage object
 */
export function createCloudinaryImage(
  uploadResult: UploadResult,
  alt: string,
  caption?: string
): CloudinaryImage {
  // Build clean Cloudinary URL from public_id instead of using potentially malformed secure_url
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const cleanUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${uploadResult.public_id}`;
  
  return {
    public_id: uploadResult.public_id,
    url: cleanUrl,
    alt,
    caption,
    width: uploadResult.width,
    height: uploadResult.height,
    format: uploadResult.format,
  };
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteImage(publicId: string): Promise<{ result: string }> {
  try {
    initializeCloudinary();
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

/**
 * Get image details from Cloudinary
 * @param publicId - The public ID of the image
 * @returns Image details
 */
export async function getImageDetails(publicId: string): Promise<any> {
  try {
    initializeCloudinary();
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary get image details error:', error);
    throw new Error('Failed to get image details from Cloudinary');
  }
}

/**
 * List images in a folder
 * @param folder - The folder path
 * @param maxResults - Maximum number of results (default: 100)
 * @returns List of images
 */
export async function listImages(folder: string, maxResults: number = 100): Promise<any> {
  try {
    initializeCloudinary();
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: maxResults,
    });
    return result;
  } catch (error) {
    console.error('Cloudinary list images error:', error);
    throw new Error('Failed to list images from Cloudinary');
  }
}

/**
 * Validate image file (server-side validation)
 * @param file - File buffer or base64 string
 * @param filename - Original filename
 * @returns Validation result
 */
export function validateImageFile(file: Buffer | string, filename?: string): { valid: boolean; error?: string } {
  try {
    // Check file size for buffers
    if (Buffer.isBuffer(file)) {
      if (file.length > CLOUDINARY_CONSTANTS.MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File size exceeds maximum allowed size of ${CLOUDINARY_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        };
      }
    }

    // Check file extension if filename is provided
    if (filename) {
      const extension = filename.split('.').pop()?.toLowerCase();
      if (!extension || !CLOUDINARY_CONSTANTS.SUPPORTED_FORMATS.includes(extension as any)) {
        return {
          valid: false,
          error: `Unsupported file format. Supported formats: ${CLOUDINARY_CONSTANTS.SUPPORTED_FORMATS.join(', ')}`,
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: 'Failed to validate image file',
    };
  }
}

/**
 * Generate image URL with transformations (server-side)
 * @param publicId - The Cloudinary public ID
 * @param transformations - Transformation options
 * @returns Transformed URL
 */
export function generateImageUrl(publicId: string, transformations: any = {}): string {
  try {
    initializeCloudinary();
    return cloudinary.url(publicId, {
      secure: true,
      ...transformations,
    });
  } catch (error) {
    console.error('URL generation error:', error);
    throw new Error('Failed to generate image URL');
  }
}

/**
 * Bulk upload images
 * @param images - Array of image data
 * @param options - Upload options
 * @returns Array of upload results
 */
export async function bulkUploadImages(
  images: Array<{ data: Buffer | string; filename?: string; alt?: string; caption?: string }>,
  options: UploadOptions = {}
): Promise<CloudinaryImage[]> {
  try {
    const uploadPromises = images.map(async (image, index) => {
      const uploadOptions = {
        ...options,
        public_id: image.filename ? image.filename.split('.')[0] : `bulk_upload_${Date.now()}_${index}`,
      };

      const uploadResult = await uploadImage(image.data, uploadOptions);
      return createCloudinaryImage(
        uploadResult,
        image.alt || image.filename || `Image ${index + 1}`,
        image.caption
      );
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Bulk upload error:', error);
    throw new Error('Failed to bulk upload images');
  }
}

/**
 * Get Cloudinary configuration status
 * @returns Configuration status
 */
export function getCloudinaryStatus(): { configured: boolean; missingVars: string[] } {
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    configured: missingVars.length === 0,
    missingVars,
  };
}