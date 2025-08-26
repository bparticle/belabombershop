import { useState, useMemo } from "react";
import { PrintfulProduct, CategoryFilter as CategoryFilterType } from "../types";
import { generateCategoryFilters } from "../lib/category-config";
import Product from "./Product";
import CategoryFilter from "./CategoryFilter";

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

  // Generate category filters from products
  const categoryFilters = useMemo(() => {
    return generateCategoryFilters(products);
  }, [products]);

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
        <p className="text-gray-500 text-lg">No products available</p>
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
          <p className="text-gray-500 text-lg">
            No products found in the selected category
          </p>
          <button
            onClick={() => setSelectedCategory(undefined)}
            className="mt-4 text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Product key={product.id} product={product} />
          ))}
        </div>
      )}

      {selectedCategory && filteredProducts.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
