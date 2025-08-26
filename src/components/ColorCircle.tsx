import React from 'react';
import { getColorHex, isLightColor, getBorderColor, getRingColor } from '../lib/color-mapping';

interface ColorCircleProps {
  colorName: string;
  isSelected: boolean;
  isAvailable?: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const ColorCircle: React.FC<ColorCircleProps> = ({
  colorName,
  isSelected,
  isAvailable = true,
  onClick,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const colorHex = getColorHex(colorName);
  const isLight = isLightColor(colorHex);
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  // Border classes
  const borderClasses = getBorderColor(isSelected, isAvailable);
  const ringClasses = getRingColor(isSelected, isAvailable);

  // Selection indicator
  const getSelectionIndicator = () => {
    if (!isSelected) return null;
    
    const indicatorColor = isLight ? '#000000' : '#FFFFFF';
    const indicatorSize = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3';
    
    return (
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: indicatorColor }}
      >
        <svg
          className={indicatorSize}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className={`flex flex-col items-center space-y-1 ${className}`}>
      <button
        onClick={onClick}
        disabled={!isAvailable}
        className={`
          relative ${sizeClasses[size]} rounded-full border-2 transition-all duration-200
          ${borderClasses} ${ringClasses} focus:ring-2 focus:ring-offset-2
          ${isAvailable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
          ${isSelected ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{ backgroundColor: colorHex }}
        aria-label={`Select ${colorName} color`}
        aria-pressed={isSelected}
        title={colorName}
      >
        {getSelectionIndicator()}
      </button>
      
      {showLabel && (
        <span className={`
          text-xs font-medium text-center
          ${isAvailable ? 'text-gray-700' : 'text-gray-400'}
          ${isSelected ? 'text-blue-600' : ''}
        `}>
          {colorName}
        </span>
      )}
    </div>
  );
};

export default ColorCircle;
