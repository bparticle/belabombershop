import { useState, useMemo, useCallback } from 'react';

interface ProductImage {
  url: string;
  alt: string;
  type?: string;
  caption?: string;
}

interface UseProductGalleryProps {
  printfulImages: ProductImage[];
  enhancementImages: ProductImage[];
  initialSelectedImage?: string;
}

interface UseProductGalleryReturn {
  selectedImage: string;
  allGalleryImages: Array<{
    url: string;
    alt: string;
    caption: string;
    source: 'printful' | 'enhancement';
  }>;
  setSelectedImage: (imageUrl: string) => void;
  openGallery: (startIndex?: number) => void;
  handleEnhancementImageClick: (enhancementIndex: number) => void;
  // Gallery state
  galleryOpen: boolean;
  galleryStartIndex: number;
  setGalleryOpen: (open: boolean) => void;
}

export const useProductGallery = ({
  printfulImages,
  enhancementImages,
  initialSelectedImage
}: UseProductGalleryProps): UseProductGalleryReturn => {
  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(() => {
    if (initialSelectedImage) return initialSelectedImage;
    return printfulImages[0]?.url || '';
  });

  // Combine all images for unified gallery
  const allGalleryImages = useMemo(() => {
    const printfulGalleryImages = printfulImages.map(image => ({
      url: image.url,
      alt: image.alt,
      caption: image.type || 'Product view',
      source: 'printful' as const
    }));

    const enhancementGalleryImages = enhancementImages.map(image => ({
      url: image.url,
      alt: image.alt,
      caption: image.caption || 'Additional view',
      source: 'enhancement' as const
    }));

    return [...printfulGalleryImages, ...enhancementGalleryImages];
  }, [printfulImages, enhancementImages]);

  // Open gallery with optional start index
  const openGallery = useCallback((startIndex?: number) => {
    if (startIndex !== undefined) {
      setGalleryStartIndex(startIndex);
    }
    setGalleryOpen(true);
  }, []);

  // Handle enhancement image clicks
  const handleEnhancementImageClick = useCallback((enhancementIndex: number) => {
    const printfulImageCount = printfulImages.length;
    const galleryIndex = printfulImageCount + enhancementIndex;
    setGalleryStartIndex(galleryIndex);
    setGalleryOpen(true);
  }, [printfulImages.length]);

  return {
    selectedImage,
    allGalleryImages,
    setSelectedImage,
    openGallery,
    handleEnhancementImageClick,
    // Expose gallery state for external use
    galleryOpen,
    galleryStartIndex,
    setGalleryOpen
  };
};
