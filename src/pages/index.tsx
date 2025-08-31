import * as React from "react";
import { GetStaticProps } from "next";
import shuffle from "lodash.shuffle";

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
    // Import productService only on server side
    const { productService } = await import("../lib/database/services/product-service");
    
    // Get all active products from database
    const dbProducts = await productService.getActiveProducts();
    
    // Convert database products to the format expected by the frontend
    const products: PrintfulProduct[] = dbProducts
      .filter(product => product.isActive) // Only show active products
      .map(product => {
        // Determine product category based on metadata, tags, and name
        const productCategory = determineProductCategory({
          name: product.name || '',
          tags: product.tags || [],
          metadata: product.metadata || {}
        });

        // Create base product object with minimal data for homepage
        const baseProduct = {
          id: product.externalId, // Use external_id for frontend URLs
          external_id: product.externalId,
          name: product.name || 'Unnamed Product',
          thumbnail_url: product.thumbnailUrl || '',
          is_ignored: product.isIgnored || false,
          category: productCategory || 'default',
          tags: product.tags || [],
          metadata: product.metadata || {},
          description: product.enhancement?.description || 
                      product.description || 
                      getDefaultDescription(product.name || 'Product', productCategory || 'default'),
          // Only include essential variant data for homepage - lightweight version
          variants: product.variants
            .filter(variant => variant.isEnabled) // Only enabled variants
            .map(variant => ({
              id: variant.printfulId,
              external_id: variant.externalId,
              name: formatVariantName(variant.name, variant.options || [], variant.size, variant.color),
              retail_price: variant.retailPrice,
              currency: variant.currency,
              // Only include color information for homepage - no images
              color: variant.color || null,
              size: variant.size || null,
              is_enabled: variant.isEnabled || false,
              in_stock: variant.inStock || false,
              is_ignored: variant.isIgnored || false,
            }))
        };

        // Enhance product with local data
        return enhanceProductData(baseProduct);
      });

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
