import { useState, useMemo } from "react";
import { PrintfulProduct, CategoryFilter as CategoryFilterType } from "../types";
import ProductCard from "./ProductCard";
import CategoryFilter from "./CategoryFilter";
import { useCategories } from "../hooks/useCategories";

interface ProductGridProps {
  products: PrintfulProduct[];
  showFilters?: boolean;
  className?: string;
}

/**
 * ProductGrid Component
 * 
 * Displays products in a responsive grid layout with optional category filtering.
 * Includes category filter sidebar and filtered product display.
 */
const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  showFilters = true,
  className = '' 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { categories: dbCategories } = useCategories();

  // Generate category filters from products and database categories
  const categoryFilters = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    
    // Count products in each category
    products.forEach(product => {
      const category = product.category || 'default';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Convert to array format and include only categories that exist in database
    return Object.entries(categoryCounts)
      .filter(([categoryId]) => dbCategories.some(cat => cat.id === categoryId))
      .map(([category, count]) => ({
        category,
        count
      }));
  }, [products, dbCategories]);

  // Filter products based on selected category
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) {
      return products;
    }
    return products.filter(product => product.category === selectedCategory);
  }, [products, selectedCategory]);

  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-lg">No products available</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {showFilters && categoryFilters.length > 0 && (
        <div className="mb-8">
          <CategoryFilter
            filters={categoryFilters}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No products found in the selected category
          </p>
          <button
            onClick={() => setSelectedCategory(undefined)}
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

      {selectedCategory && filteredProducts.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
