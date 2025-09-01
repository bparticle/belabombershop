import React from 'react';
import SafeImage from './SafeImage';

interface ProductImage {
  url: string;
  alt: string;
  type: string;
  color?: string;
}

interface ProductImageGalleryProps {
  images: ProductImage[];
  selectedImage: string;
  onImageSelect: (imageUrl: string) => void;
  onGalleryOpen: (startIndex?: number) => void;
  allGalleryImages?: Array<{ url: string; alt: string; caption?: string; source: 'printful' | 'enhancement' }>;
  maxVisibleThumbnails?: number;
  className?: string;
}

const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  selectedImage,
  onImageSelect,
  onGalleryOpen,
  allGalleryImages = [],
  maxVisibleThumbnails = 6,
  className = ''
}) => {
  if (images.length <= 1) return null;

  const visibleImages = images.slice(0, maxVisibleThumbnails);
  const hasMoreImages = images.length > maxVisibleThumbnails;
  const remainingCount = images.length - maxVisibleThumbnails;

  const handleThumbnailClick = (image: ProductImage, index: number) => {
    onImageSelect(image.url);
    // Find the actual index in the combined gallery images array
    const actualIndex = allGalleryImages.findIndex(img => img.url === image.url);
    if (actualIndex >= 0) {
      onGalleryOpen(actualIndex);
    }
  };

  const handleMoreClick = () => {
    onGalleryOpen(0);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900">Product Views</h3>
      <div className="grid grid-cols-4 gap-2">
        {visibleImages.map((image, index) => (
          <button
            key={`${image.url}-${index}`}
            onClick={() => handleThumbnailClick(image, index)}
            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
              selectedImage === image.url 
                ? 'border-blue-500' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            aria-label={`View ${image.alt}`}
          >
            {image.url && (
              <SafeImage
                src={image.url}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 12.5vw"
                useDownsized={true}
                onError={(e) => {
                  console.error('Gallery image failed to load:', image.url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
            <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
              {image.color || image.type}
            </div>
          </button>
        ))}
        
        {/* More images indicator */}
        {hasMoreImages && (
          <button
            onClick={handleMoreClick}
            className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors bg-gray-50 hover:bg-gray-100"
            aria-label={`View all ${images.length} product images`}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
              <svg
                className="w-6 h-6 mb-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs font-medium">+{remainingCount}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;
