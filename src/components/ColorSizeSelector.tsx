import React from 'react';

interface ColorSizeSelectorProps {
  variants: any[];
  activeVariantExternalId: string;
  onVariantChange: (externalId: string) => void;
}

const ColorSizeSelector: React.FC<ColorSizeSelectorProps> = ({
  variants,
  activeVariantExternalId,
  onVariantChange,
}) => {
  // Get unique colors and sizes
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

  // Find the currently selected variant
  const activeVariant = variants.find(v => v.external_id === activeVariantExternalId);
  const selectedColor = activeVariant?.color || colors[0];
  const selectedSize = activeVariant?.size || sizes[0];

  // Find available variants for the selected color and size
  const getAvailableVariants = (color: string, size: string) => {
    return variants.filter(v => v.color === color && v.size === size);
  };

  // Handle color selection
  const handleColorChange = (color: string) => {
    // Find a variant with the new color and current size, or fallback to first available
    const newVariant = variants.find(v => v.color === color && v.size === selectedSize) ||
                      variants.find(v => v.color === color) ||
                      variants[0];
    
    if (newVariant) {
      onVariantChange(newVariant.external_id);
    }
  };

  // Handle size selection
  const handleSizeChange = (size: string) => {
    // Find a variant with the current color and new size, or fallback to first available
    const newVariant = variants.find(v => v.color === selectedColor && v.size === size) ||
                      variants.find(v => v.size === size) ||
                      variants[0];
    
    if (newVariant) {
      onVariantChange(newVariant.external_id);
    }
  };

  // Get price for current selection
  const getCurrentPrice = () => {
    const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
    return currentVariant?.retail_price || '0';
  };

  return (
    <div className="space-y-6">
      {/* Color Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Select Color</h3>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorChange(color)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                selectedColor === color
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-900">Select Size</h3>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const isAvailable = getAvailableVariants(selectedColor, size).length > 0;
            return (
              <button
                key={size}
                onClick={() => handleSizeChange(size)}
                disabled={!isAvailable}
                className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                  selectedSize === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : isAvailable
                    ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selection Display */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Selected:</span> {selectedColor} - {selectedSize}
          </div>
          <div className="text-lg font-semibold text-blue-600">
            €{getCurrentPrice()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorSizeSelector;
