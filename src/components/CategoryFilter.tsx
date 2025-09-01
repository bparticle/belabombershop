import React from 'react';
import { CategoryFilter as CategoryFilterType } from '../types';
import { useCategories } from '../hooks/useCategories';

interface CategoryFilterProps {
  filters: CategoryFilterType[];
  selectedCategory?: string;
  onCategoryChange: (categoryId: string | undefined) => void;
  className?: string;
  showCounts?: boolean;
}

/**
 * CategoryFilter Component
 * 
 * Provides a clean interface for filtering products by category.
 * Shows category badges with counts and allows users to filter
 * or clear filters. Fully accessible with keyboard navigation.
 */
const CategoryFilter: React.FC<CategoryFilterProps> = ({
  filters,
  selectedCategory,
  onCategoryChange,
  className = '',
  showCounts = true
}) => {
  const { getCategoryById, loading } = useCategories();
  const handleCategoryClick = (categoryId: string) => {
    // If clicking the same category, clear the filter
    if (selectedCategory === categoryId) {
      onCategoryChange(undefined);
    } else {
      onCategoryChange(categoryId);
    }
  };

  const handleClearAll = () => {
    onCategoryChange(undefined);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Filter by Category
        </h3>
        {selectedCategory && (
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {loading ? (
          <div className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            Loading categories...
          </div>
        ) : (
          filters.map((filter) => {
            const category = getCategoryById(filter.category);
            if (!category) {
              // Show a loading state or skip this filter
              return (
                <div key={filter.category} className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  Loading...
                </div>
              );
            }

            const isSelected = selectedCategory === filter.category;
            
            return (
              <button
                key={filter.category}
                onClick={() => handleCategoryClick(filter.category)}
                className={`
                  inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                  transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${isSelected 
                    ? 'ring-2 ring-offset-2' 
                    : 'hover:scale-105 hover:shadow-md'
                  }
                `}
                style={{
                  backgroundColor: isSelected ? category.color : `${category.color}20`,
                  color: isSelected ? 'white' : category.color,
                  border: `1px solid ${isSelected ? category.color : `${category.color}40`}`,
                  boxShadow: isSelected ? `0 0 0 2px ${category.color}40` : 'none'
                }}
                aria-pressed={isSelected}
                title={`${category.description} (${filter.count} products)`}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-1.5" 
                  style={{ backgroundColor: isSelected ? 'white' : category.color }}
                  aria-hidden="true"
                ></div>
                <span>{category.name}</span>
                {showCounts && (
                  <span 
                    className={`
                      ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                      ${isSelected ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-80'}
                    `}
                  >
                    {filter.count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
      
      {filters.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No categories available
        </p>
      )}
    </div>
  );
};

export default CategoryFilter;
