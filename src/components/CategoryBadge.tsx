import React from 'react';
import { getCategoryById } from '../lib/category-config';

interface CategoryBadgeProps {
  categoryId: string;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * CategoryBadge Component
 * 
 * Displays a styled badge showing the product category with optional icon
 * and different size variants. Uses the category configuration system
 * for consistent styling and colors.
 */
const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  categoryId,
  className = '',
  showIcon = true,
  size = 'md'
}) => {
  const category = getCategoryById(categoryId);
  
  if (!category) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizeClasses = {
    sm: 'text-xs mr-1',
    md: 'text-sm mr-1.5',
    lg: 'text-base mr-2'
  };

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizeClasses[size]}
        ${className}
      `}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        border: `1px solid ${category.color}40`
      }}
      title={category.description}
    >
      {showIcon && (
        <span className={iconSizeClasses[size]} aria-hidden="true">
          {category.icon}
        </span>
      )}
      {category.name}
    </span>
  );
};

export default CategoryBadge;
