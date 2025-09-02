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

  // Fixed image path function (currently unused but kept for potential future use)
  // const fixImagePath = (src: string) => {
  //   if (!src || typeof src !== 'string') return src;
  //   if (src.startsWith('/images/products/')) return src;
  //   if (!src.startsWith('/') && !src.startsWith('http')) {
  //     return `/images/products/${src}`;
  //   }
  //   return src;
  // };

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-2 sm:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gallery-title"
      aria-describedby="gallery-description"
    >
      {/* Modal Container */}
      <div className="relative bg-white rounded-lg shadow-2xl w-[95vw] max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 lg:p-5 border-b border-gray-200 flex-shrink-0">
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

        {/* Image Container - Auto-sizing based on content */}
        <div className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full bg-white bg-opacity-90 backdrop-blur-sm shadow-sm"
                aria-label="Previous image"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full bg-white bg-opacity-90 backdrop-blur-sm shadow-sm"
                aria-label="Next image"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image - Auto-sizing based on intrinsic dimensions */}
          <div className="flex items-center justify-center">
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="max-w-full max-h-[70vh] object-contain rounded"
              style={{
                imageRendering: 'crisp-edges',
                width: 'auto',
                height: 'auto'
              }}
              onError={(e) => {
                console.error('Gallery image failed to load:', currentImage.url);
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Bottom Section - Compact and efficient */}
        <div className="flex-shrink-0">
          {/* Image Info - Only show if there's meaningful content */}
          {(currentImage.caption || currentImage.alt) && (
            <div className="px-3 sm:px-4 lg:px-5 py-3 border-t border-gray-200">
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

          {/* Thumbnail Navigation - Compact but functional */}
          {images.length > 1 && (
            <div className="px-3 sm:px-4 lg:px-5 pb-3">
              <div className="flex space-x-2 max-w-full overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={`${image.url}-${index}`}
                    onClick={() => goToImage(index)}
                    className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded overflow-hidden border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      index === currentIndex
                        ? 'border-blue-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  >
                    <SafeImage
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover"
                      useDownsized={true}
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
        </div>

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
