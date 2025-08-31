import * as React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import Head from "next/head";

import { formatVariantName } from "../../lib/format-variant-name";
import { PrintfulProduct } from "../../types";
import type { Category } from "../../lib/database/schema";

import { categoryService } from "../../lib/database/services/category-service";
import ProductGrid from "../../components/ProductGrid";

// Serialized Category type for getStaticProps
type SerializedCategory = Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt: string | null;
  updatedAt: string | null;
};

interface CategoryPageProps {
  category: SerializedCategory;
  products: PrintfulProduct[];
}

/**
 * Category Page Component
 * 
 * Displays products filtered by a specific category with proper SEO,
 * breadcrumb navigation, and category information.
 */
const CategoryPage: React.FC<CategoryPageProps> = ({ category, products }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Category Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The requested category could not be found.</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{`${category.name} Products - Bela Bomberman Collection`}</title>
        <meta 
          name="description" 
          content={category.description || `Browse our collection of ${category.name.toLowerCase()} products.`} 
        />
        <meta property="og:title" content={`${category.name} Products`} />
        <meta property="og:description" content={category.description || `Browse our collection of ${category.name.toLowerCase()} products.`} />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
                      <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <button
                onClick={() => router.push('/')}
                className="hover:text-blue-600 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <button
                onClick={() => router.push('/')}
                className="hover:text-blue-600 transition-colors"
              >
                Products
              </button>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
                          <li className="text-gray-900 dark:text-white font-medium">{category.name}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="text-center pb-6 md:pb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3" aria-hidden="true">
              {category.icon}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {category.description}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-4">
            {products.length} product{products.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {/* Products Grid */}
        <ProductGrid 
          products={products} 
          showFilters={false} 
          className="mt-8"
        />

        {/* Back to All Products */}
        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            ← View All Products
          </button>
        </div>
      </div>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Generate paths for all active categories from database
  const categories = await categoryService.getAllCategories({
    includeInactive: false,
    includeSystem: true,
  });

  const paths = categories.map((category) => ({
    params: { slug: category.slug },
  }));

  return {
    paths,
    fallback: 'blocking', // Allow new categories to be generated at runtime
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    
    if (!slug) {
      return { notFound: true };
    }

    // Get category information from database
    const category = await categoryService.getCategoryBySlug(slug);
    if (!category) {
      return { notFound: true };
    }

    // Serialize category data
    const serializedCategory: SerializedCategory = {
      ...category,
      createdAt: category.createdAt ? category.createdAt.toISOString() : null,
      updatedAt: category.updatedAt ? category.updatedAt.toISOString() : null,
    };

    // Get products for this category from database
    const { productService } = await import("../../lib/database/services/product-service");
    const dbProducts = await productService.getProductsByCategory(slug);

    // Convert database products to frontend format
    const products: PrintfulProduct[] = dbProducts.map(product => ({
      id: product.externalId,
      external_id: product.externalId,
      name: product.name || 'Unnamed Product',
      thumbnail_url: product.thumbnailUrl || '',
      is_ignored: product.isIgnored || false,
      category: category.id, // Use the database category ID
      tags: product.tags?.map(tag => tag.name) || [],
      metadata: product.metadata || {},
      description: product.enhancement?.description || 
                  product.description || 
                  `Premium quality ${product.name || 'product'} featuring unique designs.`,
      variants: product.variants
        .filter(variant => variant.isEnabled)
        .map(variant => ({
          id: variant.printfulId,
          external_id: variant.externalId,
          name: formatVariantName(variant.name, variant.options || [], variant.size, variant.color),
          retail_price: variant.retailPrice,
          currency: variant.currency,
          files: variant.files || [],
          options: variant.options || [],
          size: variant.size || null,
          color: variant.color || null,
          is_enabled: variant.isEnabled || false,
          in_stock: variant.inStock || false,
          is_ignored: variant.isIgnored || false,
        })),
    }));

    return {
      props: {
        category: serializedCategory,
        products,
      },
      revalidate: 300, // Revalidate every 5 minutes
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true,
    };
  }
};

export default CategoryPage;
