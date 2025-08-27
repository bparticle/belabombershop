import React from 'react';

interface ProductVariantsProps {
  variants: any[];
  activeVariantExternalId: string;
  onVariantChange: (externalId: string) => void;
}

const ProductVariants: React.FC<ProductVariantsProps> = ({
  variants,
  activeVariantExternalId,
  onVariantChange,
}) => {
  // Group variants by color and size
  const variantsByColor = variants.reduce((acc, variant) => {
    const color = variant.color || 'Default';
    if (!acc[color]) {
      acc[color] = [];
    }
    acc[color].push(variant);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      {Object.entries(variantsByColor).map(([color, colorVariants]) => (
        <div key={color} className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Color: {color}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {(colorVariants as any[]).map((variant) => (
              <button
                key={variant.external_id}
                onClick={() => onVariantChange(variant.external_id)}
                className={`p-3 border rounded-lg text-sm transition-colors ${
                  activeVariantExternalId === variant.external_id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{variant.size}</div>
                <div className="text-xs text-gray-500">
                  €{variant.retail_price}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductVariants;
