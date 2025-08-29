import React from 'react';
import ColorCircle from './ColorCircle';

interface ColorSelectorProps {
  colors: string[];
  selectedColor: string;
  onColorChange: (color: string) => void;
  availableColors?: string[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}

const ColorSelector: React.FC<ColorSelectorProps> = ({
  colors,
  selectedColor,
  onColorChange,
  availableColors = colors,
  size = 'md',
  showLabels = false,
  className = ''
}) => {
  const handleColorClick = (color: string) => {
    if (availableColors.includes(color)) {
      onColorChange(color);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select Color</h3>
      <div className="flex flex-wrap gap-3">
        {colors.map((color) => {
          const isAvailable = availableColors.includes(color);
          const isSelected = selectedColor === color;
          
          return (
            <ColorCircle
              key={color}
              colorName={color}
              isSelected={isSelected}
              isAvailable={isAvailable}
              onClick={() => handleColorClick(color)}
              size={size}
              showLabel={showLabels}
            />
          );
        })}
      </div>
      
      {/* Selected color display */}
      {selectedColor && (
        <div className="pt-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Selected:</span> {selectedColor}
        </div>
      )}
    </div>
  );
};

export default ColorSelector;
