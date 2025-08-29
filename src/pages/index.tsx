import * as React from "react";
import { GetStaticProps } from "next";
import shuffle from "lodash.shuffle";

import { printful } from "../lib/printful-client";
import { formatVariantName } from "../lib/format-variant-name";
import { PrintfulProduct, LightweightProduct } from "../types";
import { determineProductCategory } from "../lib/category-config";
import { enhanceProductData, getDefaultDescription } from "../lib/product-enhancements";

import ProductGrid from "../components/ProductGrid";

type IndexPageProps = {
  products: PrintfulProduct[];
};

const IndexPage: React.FC<IndexPageProps> = ({ products }) => (
  <>
    <div className="text-center pb-6 md:pb-12">
             <h1 className="text-xl md:text-3xl lg:text-5xl font-bold text-gray-900 dark:text-white">
         Bela Bomberman Collection
       </h1>
    </div>

    <ProductGrid products={products} />
  </>
);

export const getStaticProps: GetStaticProps = async () => {
  try {
    const { result: productIds } = await printful.get("sync/products");
    
    // Product IDs fetched successfully

    // Limit the number of products to prevent build timeouts
    const limitedProductIds = productIds.slice(0, 10); // Only fetch first 10 products for build

    const allProducts = await Promise.all(
      limitedProductIds.map(async ({ id }: { id: string }) => {
        try {
          const productData = await printful.get(`sync/products/${id}`);
          // Product data fetched successfully
          return productData;
        } catch (error) {
          console.error(`Error fetching product ${id}:`, error);
          return null;
        }
      })
    );

    const products: PrintfulProduct[] = allProducts
      .filter(Boolean) // Remove null results
      .map(({ result: { sync_product, sync_variants } }) => {
        // Processing product

        // Determine product category based on metadata, tags, and name
        const productCategory = determineProductCategory({
          name: sync_product.name || '',
          tags: sync_product.tags || [],
          metadata: sync_product.metadata || {}
        });

        // Create base product object with minimal data for homepage
        const baseProduct = {
          id: sync_product.id || '',
          external_id: sync_product.external_id || '',
          name: sync_product.name || 'Unnamed Product',
          thumbnail_url: sync_product.thumbnail_url || '',
          is_ignored: sync_product.is_ignored ?? false,
          category: productCategory,
          tags: sync_product.tags || [],
          metadata: sync_product.metadata || {},
          description: getDefaultDescription(sync_product.name || 'Product', productCategory),
          // Only include essential variant data for homepage - lightweight version
          variants: sync_variants
            .filter((variant: any) => variant.is_enabled !== false) // Only enabled variants
            .map((variant: any) => ({
              id: variant.id || 0,
              external_id: variant.external_id || '',
              name: formatVariantName(variant.name, variant.options, variant.size, variant.color),
              retail_price: variant.retail_price || '0',
              currency: variant.currency || 'USD',
              // Only include color information for homepage - no images
              color: variant.color || null,
              size: variant.size || null,
              is_enabled: variant.is_enabled ?? true,
              in_stock: variant.in_stock ?? true,
              is_ignored: variant.is_ignored ?? false,
            }))
            // Don't limit variants - we want all colors!
            // .slice(0, 10), // Allow more variants since we're not loading images
        };



        // Enhance product with local data
        return enhanceProductData(baseProduct);
      });

    // Successfully processed products

    return {
      props: {
        products: shuffle(products),
      },
      // Revalidate every 2 minutes to keep data fresh but reduce build time
      revalidate: 120,
    };
  } catch (error: any) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        products: [],
        error: error?.message || 'An error occurred'
      },
      // Revalidate after 1 minute on error
      revalidate: 60,
    };
  }
};

export default IndexPage;
