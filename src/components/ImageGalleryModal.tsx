import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import SafeImage from './SafeImage';

interface GalleryImage {
  url: string;
  alt: string;
  caption?: string;
  source: 'printful' | 'enhancement';
}

interface ImageGalleryModalProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  images,
  initialIndex,
  isOpen,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  // Fix image path for local images that might be missing the proper prefix
  const fixImagePath = (src: string) => {
    if (!src || typeof src !== 'string') return src;
    
    // If it's already a proper local path, return as is
    if (src.startsWith('/images/products/')) return src;
    
    // If it's just a filename, add the proper prefix
    if (!src.startsWith('/') && !src.startsWith('http')) {
      return `/images/products/${src}`;
    }
    
    return src;
  };

  // Reset index when modal opens with new initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        goToPrevious();
        break;
      case 'ArrowRight':
        event.preventDefault();
        goToNext();
        break;
    }
  }, [isOpen, onClose]);

  // Add/remove keyboard event listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  // Create portal to render modal outside of normal DOM hierarchy
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
      aria-describedby="gallery-description"
    >
      {/* Modal Container */}
      <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 id="gallery-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Gallery
            </h2>
            {images.length > 1 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {currentIndex + 1} of {images.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full"
            aria-label="Close gallery"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Image Container */}
        <div className="relative flex-1 flex items-center justify-center p-6">
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full bg-white bg-opacity-90 backdrop-blur-sm shadow-sm"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full bg-white bg-opacity-90 backdrop-blur-sm shadow-sm"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div className="relative max-w-full max-h-full">
            <SafeImage
              src={currentImage.url}
              alt={currentImage.alt}
              className="max-w-full max-h-[60vh] object-contain rounded"
            />
          </div>
        </div>

        {/* Image Info */}
        {(currentImage.caption || currentImage.alt) && (
          <div className="px-6 pb-4 border-t border-gray-200 pt-4">
            <div className="text-gray-900">
              {currentImage.caption && (
                <p className="text-sm font-medium mb-1">{currentImage.caption}</p>
              )}
              <p className="text-xs text-gray-600">
                {currentImage.alt}
              </p>
            </div>
          </div>
        )}

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="px-6 pb-4">
            <div className="flex space-x-2 max-w-full overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    index === currentIndex
                      ? 'border-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                >
                  <img
                    src={fixImagePath(image.url)}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      console.error('Gallery thumbnail failed to load:', image.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Screen reader only content */}
        <div className="sr-only">
          <p id="gallery-description">
            Use arrow keys to navigate between images, or click the navigation buttons.
            Press Escape to close the gallery.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageGalleryModal;
