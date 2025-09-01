import type { ProductWithVariants } from './database/services/product-service';

// Type for serialized products from getServerSideProps
type SerializedProductWithVariants = Omit<ProductWithVariants, 'syncedAt' | 'createdAt' | 'updatedAt'> & {
  syncedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  variants: Array<Omit<ProductWithVariants['variants'][0], 'syncedAt' | 'createdAt' | 'updatedAt'> & {
    syncedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  enhancement: Omit<ProductWithVariants['enhancement'], 'createdAt' | 'updatedAt'> & {
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
};

/**
 * Get the best thumbnail image for admin product overview
 * Priority:
 * 1. Main product thumbnail URL (if available)
 * 2. Default variant's preview image (if set and available)
 * 3. First variant's preview image (actual product photo, not design file)
 * 4. Fallback to design file if no preview images are available
 */
export function getProductThumbnail(product: ProductWithVariants | SerializedProductWithVariants): string | null {
  // 1. Try main product thumbnail first
  if (product.thumbnailUrl && product.thumbnailUrl.trim() !== '') {
    return product.thumbnailUrl;
  }

  // 2. Try default variant if specified in enhancement
  if (product.enhancement?.defaultVariantId) {
    const defaultVariant = product.variants.find(
      variant => variant.externalId === product.enhancement?.defaultVariantId
    );
    
    if (defaultVariant?.files) {
      // Look for preview type files first (actual product photos)
      const previewFile = defaultVariant.files.find(
        file => file.type === 'preview' && file.preview_url
      );
      if (previewFile?.preview_url) {
        return previewFile.preview_url;
      }
    }
  }

  // 3. Try first variant's preview image
  for (const variant of product.variants) {
    if (variant.files && variant.files.length > 0) {
      // Look for preview type files first (actual product photos)
      const previewFile = variant.files.find(
        file => file.type === 'preview' && file.preview_url
      );
      if (previewFile?.preview_url) {
        return previewFile.preview_url;
      }
    }
  }

  // 4. Fallback to design file if no preview images available
  for (const variant of product.variants) {
    if (variant.files && variant.files.length > 0) {
      const designFile = variant.files.find(file => file.preview_url);
      if (designFile?.preview_url) {
        return designFile.preview_url;
      }
    }
  }

  return null;
}

/**
 * Check if a product has a default variant set
 */
export function hasDefaultVariant(product: ProductWithVariants | SerializedProductWithVariants): boolean {
  return !!(
    product.enhancement?.defaultVariantId &&
    product.variants.some(variant => variant.externalId === product.enhancement?.defaultVariantId)
  );
}

/**
 * Get display indicators for admin overview
 */
export function getProductIndicators(product: ProductWithVariants | SerializedProductWithVariants) {
  return {
    hasDefaultVariant: hasDefaultVariant(product),
    hasEnhancement: !!(product.enhancement && (
      product.enhancement.description ||
      product.enhancement.shortDescription ||
      (product.enhancement.features && product.enhancement.features.length > 0) ||
      (product.enhancement.additionalImages && product.enhancement.additionalImages.length > 0)
    )),
    hasMainImage: !!(product.thumbnailUrl && product.thumbnailUrl.trim() !== ''),
    hasPreviewImages: product.variants.some(variant => 
      variant.files?.some(file => file.type === 'preview' && file.preview_url)
    )
  };
}
