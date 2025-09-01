import React from 'react';
import Link from 'next/link';
import { useCategories } from '../hooks/useCategories';

interface CategoryNavigationProps {
  currentSlug: string;
  className?: string;
}

/**
 * CategoryNavigation Component
 * 
 * Shows navigation tabs between different categories on category pages.
 * Allows users to easily switch between different product categories.
 */
const CategoryNavigation: React.FC<CategoryNavigationProps> = ({ 
  currentSlug, 
  className = '' 
}) => {
  const { categories, loading } = useCategories();

  if (loading) {
    return (
      <div className={`flex justify-center space-x-1 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-lg w-20 h-10"></div>
        ))}
      </div>
    );
  }

  const activeCategories = categories
    .filter(cat => cat.isActive)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <nav className={`flex justify-center ${className}`}>
      <div className="flex flex-wrap justify-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {activeCategories.map((category) => {
          const isActive = category.slug === currentSlug;
          
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isActive 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
              style={{
                '--tw-ring-color': isActive ? category.color : undefined,
              } as React.CSSProperties}
              aria-current={isActive ? 'page' : undefined}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: category.color }}
                aria-hidden="true"
              ></div>
              {category.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default CategoryNavigation;
