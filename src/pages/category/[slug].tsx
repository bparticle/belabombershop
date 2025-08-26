import * as React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";
import Head from "next/head";

import { printful } from "../../lib/printful-client";
import { formatVariantName } from "../../lib/format-variant-name";
import { PrintfulProduct, ProductCategory } from "../../types";
import { 
  determineProductCategory, 
  getCategoryBySlug, 
  PRODUCT_CATEGORIES 
} from "../../lib/category-config";
import ProductGrid from "../../components/ProductGrid";

interface CategoryPageProps {
  category: ProductCategory;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The requested category could not be found.</p>
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
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
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
            <li className="text-gray-900 font-medium">{category.name}</li>
          </ol>
        </nav>

        {/* Category Header */}
        <div className="text-center pb-6 md:pb-12">
          <div className="flex items-center justify-center mb-4">
            <span className="text-4xl mr-3" aria-hidden="true">
              {category.icon}
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900">
              {category.name}
            </h1>
          </div>
          {category.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
  // Generate paths for all defined categories
  const paths = PRODUCT_CATEGORIES.map((category) => ({
    params: { slug: category.slug },
  }));

  return {
    paths,
    fallback: false, // Return 404 for undefined categories
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    
    if (!slug) {
      return { notFound: true };
    }

    // Get category information
    const category = getCategoryBySlug(slug);
    if (!category) {
      return { notFound: true };
    }

    // Fetch all products
    const { result: productIds } = await printful.get("sync/products");
    
    const allProducts = await Promise.all(
      productIds.map(async ({ id }) => {
        const productData = await printful.get(`sync/products/${id}`);
        return productData;
      })
    );

    // Process products and filter by category
    const products: PrintfulProduct[] = allProducts
      .map(({ result: { sync_product, sync_variants } }) => {
        // Determine product category
        const productCategory = determineProductCategory({
          name: sync_product.name || '',
          tags: sync_product.tags || [],
          metadata: sync_product.metadata || {}
        });

        return {
          id: sync_product.id || '',
          external_id: sync_product.external_id || '',
          name: sync_product.name || 'Unnamed Product',
          thumbnail_url: sync_product.thumbnail_url || '',
          is_ignored: sync_product.is_ignored ?? false,
          category: productCategory,
          tags: sync_product.tags || [],
          metadata: sync_product.metadata || {},
          variants: sync_variants.map((variant: any) => ({
            id: variant.id || 0,
            external_id: variant.external_id || '',
            name: formatVariantName(variant.name, variant.options, variant.size, variant.color),
            retail_price: variant.retail_price || '0',
            currency: variant.currency || 'USD',
            files: variant.files || [],
            options: variant.options || [],
            size: variant.size || null,
            color: variant.color || null,
            is_enabled: variant.is_enabled ?? true,
            in_stock: variant.in_stock ?? true,
            is_ignored: variant.is_ignored ?? false,
          })),
        };
      })
      .filter(product => product.category === category.id); // Filter by category

    return {
      props: {
        category,
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
