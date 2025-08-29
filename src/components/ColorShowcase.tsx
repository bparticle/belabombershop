import React, { useState } from 'react';
import ColorCircle from './ColorCircle';
import { getNewColors, sortColorsByPreference } from '../lib/color-utils';

interface ColorShowcaseProps {
  className?: string;
}

const ColorShowcase: React.FC<ColorShowcaseProps> = ({ className = '' }) => {
  const [selectedColor, setSelectedColor] = useState<string>('');
  const newColors = getNewColors();
  const sortedColors = sortColorsByPreference(newColors);

  return (
    <div className={`p-6 bg-white rounded-lg shadow-md ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">New Color Collection</h2>
      <p className="text-gray-600 mb-6">
        Explore our latest color additions
      </p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {sortedColors.map((colorName) => (
          <ColorCircle
            key={colorName}
            colorName={colorName}
            isSelected={selectedColor === colorName}
            isAvailable={true}
            onClick={() => setSelectedColor(colorName)}
            size="md"
            showLabel={true}
          />
        ))}
      </div>
      
      {selectedColor && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Selected Color</h3>
          <div className="flex items-center space-x-3">
            <ColorCircle
              colorName={selectedColor}
              isSelected={true}
              isAvailable={true}
              onClick={() => {}}
              size="lg"
              showLabel={false}
            />
            <div>
              <p className="font-medium text-gray-900">{selectedColor}</p>
              <p className="text-sm text-gray-600">Click another color to change selection</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-500">
        <p>Total new colors: {newColors.length}</p>
        <p>Colors are sorted by popularity and preference</p>
      </div>
    </div>
  );
};

export default ColorShowcase;
