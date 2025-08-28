import React, { useState, useEffect, useMemo } from 'react';

interface Variant {
  external_id: string;
  name: string;
  size: string | null;
  color: string | null;
  retail_price: string;
  currency: string;
}

interface VariantPickerProps {
  variants: Variant[];
  onVariantChange: (externalId: string) => void;
  className?: string;
  defaultVariant?: Variant; // Add default variant prop
}

const VariantPicker: React.FC<VariantPickerProps> = ({ 
  variants, 
  onVariantChange, 
  className = "", 
  defaultVariant 
}) => {
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Extract unique colors and their available sizes
  const colorSizeMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    
    variants.forEach(variant => {
      if (variant.color && variant.size) {
        if (!map.has(variant.color)) {
          map.set(variant.color, new Set());
        }
        map.get(variant.color)!.add(variant.size);
      }
    });
    
    return map;
  }, [variants]);

  // Get available colors
  const availableColors = useMemo(() => {
    return Array.from(colorSizeMap.keys()).sort();
  }, [colorSizeMap]);

  // Get available sizes for selected color
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return Array.from(colorSizeMap.get(selectedColor) || []).sort((a, b) => {
      // Custom size sorting: XS, S, M, L, XL, XXL, etc.
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
      const aIndex = sizeOrder.indexOf(a);
      const bIndex = sizeOrder.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      return a.localeCompare(b);
    });
  }, [selectedColor, colorSizeMap]);

  // Find the selected variant
  const selectedVariant = useMemo(() => {
    if (!selectedColor || !selectedSize) return null;
    return variants.find(variant => 
      variant.color === selectedColor && variant.size === selectedSize
    );
  }, [variants, selectedColor, selectedSize]);

  // Auto-select default variant or first color and size when component mounts or variants change
  useEffect(() => {
    if (availableColors.length > 0 && !selectedColor) {
      // Use default variant color if available, otherwise use first color
      const initialColor = defaultVariant?.color && availableColors.includes(defaultVariant.color) 
        ? defaultVariant.color 
        : availableColors[0];
      setSelectedColor(initialColor);
    }
  }, [availableColors, selectedColor, defaultVariant]);

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      // Use default variant size if available and color matches, otherwise use first size
      const initialSize = (defaultVariant?.size && 
                          defaultVariant?.color === selectedColor && 
                          availableSizes.includes(defaultVariant.size))
        ? defaultVariant.size 
        : availableSizes[0];
      setSelectedSize(initialSize);
    }
  }, [availableSizes, selectedSize, defaultVariant, selectedColor]);

  // Handle color change
  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    setSelectedSize(null); // Reset size when color changes
  };

  // Handle size change
  const handleSizeChange = (size: string) => {
    setSelectedSize(size);
  };

  // Notify parent of variant change
  useEffect(() => {
    if (selectedVariant) {
      onVariantChange(selectedVariant.external_id);
    }
  }, [selectedVariant, onVariantChange]);

  // Don't render if no variants or only one variant
  if (variants.length <= 1) {
    return null;
  }

  // Don't render if no color/size data
  if (availableColors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Color Selection */}
      <div className="w-full">
        <label htmlFor="color-select" className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <select
          id="color-select"
          value={selectedColor || ''}
          onChange={(e) => handleColorChange(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        >
          {availableColors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>
      </div>

      {/* Size Selection */}
      {selectedColor && availableSizes.length > 0 && (
        <div className="w-full">
          <label htmlFor="size-select" className="block text-sm font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            id="size-select"
            value={selectedSize || ''}
            onChange={(e) => handleSizeChange(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            {availableSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price Display */}
      {selectedVariant && (
        <div className="text-sm text-gray-600 mt-2">
          <span className="font-medium">
            {selectedVariant.retail_price && selectedVariant.currency
              ? new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: selectedVariant.currency,
                }).format(Number(selectedVariant.retail_price))
              : "Price not available"}
          </span>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="text-xs text-green-600 font-medium">
          ✓ In Stock
        </div>
      )}
    </div>
  );
};

export default VariantPicker;
