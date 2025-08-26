import React from 'react';
import { ProductEnhancement } from '../types';
import SafeImage from './SafeImage';

interface ProductEnhancementsProps {
  enhancement: ProductEnhancement;
  className?: string;
}

const ProductEnhancements: React.FC<ProductEnhancementsProps> = ({
  enhancement,
  className = ''
}) => {
  if (!enhancement) return null;

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
                  <SafeImage
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
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
