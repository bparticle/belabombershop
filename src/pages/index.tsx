import * as React from "react";
import { GetStaticProps } from "next";
import shuffle from "lodash.shuffle";

import { printful } from "../lib/printful-client";
import { formatVariantName } from "../lib/format-variant-name";
import { PrintfulProduct } from "../types";
import { determineProductCategory } from "../lib/category-config";
import { enhanceProductData, getDefaultDescription } from "../lib/product-enhancements";

import ProductGrid from "../components/ProductGrid";

type IndexPageProps = {
  products: PrintfulProduct[];
};

const IndexPage: React.FC<IndexPageProps> = ({ products }) => (
  <>
    <div className="text-center pb-6 md:pb-12">
             <h1 className="text-xl md:text-3xl lg:text-5xl font-bold">
         Bela Bomberman Collection
       </h1>
    </div>

    <ProductGrid products={products} />
  </>
);

export const getStaticProps: GetStaticProps = async () => {
  try {
    const { result: productIds } = await printful.get("sync/products");
    
    console.log('Product IDs:', productIds);

    const allProducts = await Promise.all(
      productIds.map(async ({ id }: { id: string }) => {
        const productData = await printful.get(`sync/products/${id}`);
        console.log(`Product ${id} data:`, JSON.stringify(productData.result, null, 2));
        return productData;
      })
    );

    const products: PrintfulProduct[] = allProducts.map(
      ({ result: { sync_product, sync_variants } }) => {
        console.log(`Processing product ${sync_product.id}:`, {
          product: sync_product,
          variants: sync_variants
        });

                         // Determine product category based on metadata, tags, and name
        const productCategory = determineProductCategory({
          name: sync_product.name || '',
          tags: sync_product.tags || [],
          metadata: sync_product.metadata || {}
        });

        // Create base product object
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

        // Enhance product with local data
        return enhanceProductData(baseProduct);
      }
    );

    console.log('Final processed products:', JSON.stringify(products, null, 2));

    return {
      props: {
        products: shuffle(products),
      },
    };
  } catch (error: any) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        products: [],
        error: error?.message || 'An error occurred'
      },
    };
  }
};

export default IndexPage;
