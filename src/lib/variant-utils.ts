import { PrintfulVariant } from "../types";

export interface VariantThumbnail {
  id: string;
  external_id: string;
  imageUrl: string;
  color: string | null;
  size: string | null;
  name: string;
}

/**
 * Extract unique variant thumbnails from a list of variants
 * Groups variants by color/size combinations to avoid duplicates
 */
export const extractVariantThumbnails = (variants: PrintfulVariant[]): VariantThumbnail[] => {
  const uniqueVariants = new Map<string, VariantThumbnail>();
  
  variants.forEach(variant => {
    const previewFile = variant.files?.find(file => file.type === "preview");
    if (!previewFile?.preview_url) return;

    // Create a unique key based on color and size
    const key = `${variant.color || 'default'}-${variant.size || 'default'}`;
    
    if (!uniqueVariants.has(key)) {
      uniqueVariants.set(key, {
        id: variant.external_id,
        external_id: variant.external_id,
        imageUrl: previewFile.preview_url,
        color: variant.color,
        size: variant.size,
        name: variant.name
      });
    }
  });

  return Array.from(uniqueVariants.values());
};

/**
 * Get the default variant thumbnail (first available)
 */
export const getDefaultVariantThumbnail = (variants: PrintfulVariant[]): VariantThumbnail | null => {
  const thumbnails = extractVariantThumbnails(variants);
  return thumbnails.length > 0 ? thumbnails[0] : null;
};
