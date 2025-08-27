import React from 'react';
import { ProductImage } from '../types';
import SafeImage from './SafeImage';

interface AdditionalViewsGalleryProps {
  images: ProductImage[];
  onImageClick: (imageIndex: number) => void;
  maxVisibleThumbnails?: number;
  className?: string;
}

const AdditionalViewsGallery: React.FC<AdditionalViewsGalleryProps> = ({
  images,
  onImageClick,
  maxVisibleThumbnails = 3,
  className = ''
}) => {
  if (!images || images.length === 0) return null;

  const visibleImages = images.slice(0, maxVisibleThumbnails);
  const hasMoreImages = images.length > maxVisibleThumbnails;
  const remainingCount = images.length - maxVisibleThumbnails;

  const handleImageClick = (index: number) => {
    onImageClick(index);
  };

  const handleMoreClick = () => {
    onImageClick(0);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-gray-900">Additional Views</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visibleImages.map((image, index) => (
          <div key={`${image.url}-${index}`} className="space-y-1">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={() => handleImageClick(index)}
                className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`View larger image: ${image.alt}`}
              >
                <SafeImage
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover hover:opacity-90 transition-opacity"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {/* Click indicator */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </button>
            </div>
            {image.caption && (
              <p className="text-xs text-gray-600 text-center">{image.caption}</p>
            )}
          </div>
        ))}
        
        {/* More images indicator */}
        {hasMoreImages && (
          <div className="space-y-1">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <button
                onClick={handleMoreClick}
                className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                aria-label={`View all ${images.length} additional images`}
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
            </div>
            <p className="text-xs text-gray-600 text-center">More views</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalViewsGallery;
