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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
          <ul className="space-y-2">
            {enhancement.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 dark:text-green-400 mr-2 mt-1">✓</span>
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Specifications */}
      {enhancement.specifications && Object.keys(enhancement.specifications).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Specifications</h3>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(enhancement.specifications).map(([key, value]) => (
              <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 mt-1">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Additional Images */}
      {enhancement.additionalImages && enhancement.additionalImages.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Views</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enhancement.additionalImages.map((image, index) => (
              <div key={index} className="group cursor-pointer" onClick={() => handleImageClick(index)}>
                <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <SafeImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                {image.caption && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {image.caption}
                  </p>
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
