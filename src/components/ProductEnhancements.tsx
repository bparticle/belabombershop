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


    </div>
  );
};

export default ProductEnhancements;
