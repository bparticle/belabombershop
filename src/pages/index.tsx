import * as React from "react";
import { GetStaticProps } from "next";
import Head from "next/head";

import ProductsPageWithFilters from "../components/ProductsPageWithFilters";
import { PrintfulProduct } from "../types";
import { productService } from "../lib/database/services/product-service";
import { categoryService } from "../lib/database/services/category-service";
import { formatVariantName } from "../lib/format-variant-name";

interface IndexPageProps {
  products: PrintfulProduct[];
  defaultCategories: string[];
}

const IndexPage: React.FC<IndexPageProps> = ({ products, defaultCategories }) => (
  <>
    <Head>
      <title>Bela Bomberman Collection - Premium Apparel & Accessories</title>
      <meta 
        name="description" 
        content="Discover unique designs and premium quality apparel. Shop kids, adults, and accessories collections." 
      />
      <meta property="og:title" content="Bela Bomberman Collection" />
      <meta property="og:description" content="Premium apparel and accessories with unique designs. Shop our latest collections." />
    </Head>
    
    <ProductsPageWithFilters 
      products={products} 
      defaultCategories={defaultCategories}
    />
  </>
);

export const getStaticProps: GetStaticProps = async () => {
  try {
    // Get all active products
    const dbProducts = await productService.getActiveProducts();

    // Get categories for default selection (Kids and Accessories)
    const [kidsCategory, accessoriesCategory] = await Promise.all([
      categoryService.getCategoryBySlug('kids'),
      categoryService.getCategoryBySlug('accessories'),
    ]);

    const defaultCategories: string[] = [];
    if (kidsCategory) defaultCategories.push(kidsCategory.id);
    if (accessoriesCategory) defaultCategories.push(accessoriesCategory.id);

    // Convert database products to frontend format
    const products: PrintfulProduct[] = dbProducts.map(product => {
      // Get the primary category for this product
      const primaryCategory = product.categories.find(cat => cat.isPrimary) || product.categories[0];
      
      return {
        id: product.externalId,
        external_id: product.externalId,
        name: product.name || 'Unnamed Product',
        thumbnail_url: product.thumbnailUrl || '',
        is_ignored: product.isIgnored || false,
        category: primaryCategory?.id || 'default',
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
      };
    });

    return {
      props: {
        products,
        defaultCategories,
      },
      // Revalidate every 5 minutes to keep products fresh
      revalidate: 300,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      props: {
        products: [],
        defaultCategories: [],
      },
      revalidate: 300,
    };
  }
};

export default IndexPage;
