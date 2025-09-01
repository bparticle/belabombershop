import React, { useState, useMemo } from 'react';
import { PrintfulProduct } from '../types';
import ProductCard from './ProductCard';
import { useCategories } from '../hooks/useCategories';
import type { Category } from '../lib/database/schema';

interface ProductsPageWithFiltersProps {
  products: PrintfulProduct[];
  defaultCategories?: string[]; // Category IDs to show by default
}

interface CheckboxFilterProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryChange: (categoryId: string, checked: boolean) => void;
}

const CheckboxFilter: React.FC<CheckboxFilterProps> = ({
  categories,
  selectedCategories,
  onCategoryChange
}) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Filter by Category
      </h3>
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          
          return (
            <label
              key={category.id}
              className={`
                flex items-center px-4 py-3 rounded-lg border-2 cursor-pointer
                transition-all duration-200 hover:shadow-md
                ${isSelected 
                  ? 'border-2 shadow-lg' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }
              `}
              style={{
                backgroundColor: isSelected ? `${category.color}15` : 'transparent',
                borderColor: isSelected ? category.color : undefined,
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => onCategoryChange(category.id, e.target.checked)}
                className="sr-only"
              />
              <div 
                className="w-4 h-4 rounded-full mr-3" 
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              />
              <span 
                className={`font-medium ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}
              >
                {category.name}
              </span>
              <div 
                className={`
                  ml-2 w-5 h-5 border-2 rounded flex items-center justify-center
                  ${isSelected ? 'border-white bg-white' : 'border-gray-300'}
                `}
                style={{
                  borderColor: isSelected ? category.color : undefined,
                  backgroundColor: isSelected ? category.color : 'transparent',
                }}
              >
                {isSelected && (
                  <svg 
                    className="w-3 h-3 text-white" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

const ProductsPageWithFilters: React.FC<ProductsPageWithFiltersProps> = ({ 
  products, 
  defaultCategories = [] 
}) => {
  const { categories, loading } = useCategories();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(defaultCategories);

  // Filter products based on selected categories
  const filteredProducts = useMemo(() => {
    if (selectedCategories.length === 0) {
      return products;
    }
    return products.filter(product => 
      selectedCategories.includes(product.category)
    );
  }, [products, selectedCategories]);

  // Get categories that have products
  const availableCategories = useMemo(() => {
    const productCategoryIds = new Set(products.map(p => p.category));
    return categories.filter(cat => 
      cat.isActive && productCategoryIds.has(cat.id)
    ).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [categories, products]);

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => {
      if (checked) {
        return [...prev, categoryId];
      } else {
        return prev.filter(id => id !== categoryId);
      }
    });
  };

  const handleClearAll = () => {
    setSelectedCategories([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Our Collection
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Discover unique designs and premium quality apparel. Browse our complete collection or filter by category.
        </p>
      </div>

      {/* Category Filters */}
      {availableCategories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedCategories.length > 0 
                  ? `Showing ${filteredProducts.length} of ${products.length} products`
                  : `Showing all ${products.length} products`
                }
              </span>
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
          <CheckboxFilter
            categories={availableCategories}
            selectedCategories={selectedCategories}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No products found with the selected filters
          </p>
          <button
            onClick={handleClearAll}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPageWithFilters;
