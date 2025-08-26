import React from 'react';
import { ProductEnhancement } from '../types';
import SafeImage from './SafeImage';

interface ProductEnhancementsProps {
  enhancement: ProductEnhancement;
  className?: string;
  onImageClick?: (imageIndex: number) => void;
}

const ProductEnhancements: React.FC<ProductEnhancementsProps> = ({
  enhancement,
  className = '',
  onImageClick
}) => {
  if (!enhancement) return null;

  const handleImageClick = (index: number) => {
    if (onImageClick) {
      onImageClick(index);
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Features */}
      {enhancement.features && enhancement.features.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
          <ul className="space-y-2">
            {enhancement.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specifications */}
      {enhancement.specifications && Object.keys(enhancement.specifications).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(enhancement.specifications).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 pb-2">
                <dt className="text-sm font-medium text-gray-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </dt>
                <dd className="text-sm text-gray-900 mt-1">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Additional Images */}
      {enhancement.additionalImages && enhancement.additionalImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Views</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {enhancement.additionalImages.map((image, index) => (
              <div key={index} className="space-y-2">
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
                        className="w-8 h-8 text-white opacity-0 hover:opacity-100 transition-opacity"
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductEnhancements;
