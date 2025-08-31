import { eq, and, inArray, desc } from 'drizzle-orm';
import { db } from '../config';
import { 
  products, 
  variants, 
  productEnhancements, 
  categories, 
  productCategories,
  syncLogs,
  type Product,
  type NewProduct,
  type Variant,
  type NewVariant,
  type ProductEnhancement as DBProductEnhancement,
  type NewProductEnhancement,
  type SyncLog,
  type NewSyncLog
} from '../schema';
import { printful } from '../../printful-client';
import type { PrintfulProduct, PrintfulVariant } from '../../types';

export interface ProductWithVariants extends Product {
  variants: Variant[];
  enhancement?: DBProductEnhancement;
  categories: Array<{ id: string; name: string; slug: string; color?: string }>;
}

export interface ProductWithEnhancement extends Product {
  enhancement?: DBProductEnhancement;
  variants: Variant[];
}

export class ProductService {
  /**
   * Get all active products with their variants and enhancements (for frontend)
   */
  async getActiveProducts(): Promise<ProductWithVariants[]> {
    const dbProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    const productsWithVariants: ProductWithVariants[] = [];

    for (const product of dbProducts) {
      const productVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.productId, product.id));

      const enhancement = await db
        .select()
        .from(productEnhancements)
        .where(and(
          eq(productEnhancements.productId, product.id),
          eq(productEnhancements.isActive, true)
        ))
        .limit(1);

      const productCategoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color,
        })
        .from(categories)
        .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
        .where(eq(productCategories.productId, product.id));

      productsWithVariants.push({
        ...product,
        variants: productVariants,
        enhancement: enhancement[0],
        categories: productCategoriesData,
      });
    }

    return productsWithVariants;
  }

  /**
   * Get all products with their variants and enhancements (for admin - includes inactive)
   */
  async getAllProductsForAdmin(): Promise<ProductWithVariants[]> {
    const dbProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    const productsWithVariants: ProductWithVariants[] = [];

    for (const product of dbProducts) {
      const productVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.productId, product.id));

      const enhancement = await db
        .select()
        .from(productEnhancements)
        .where(and(
          eq(productEnhancements.productId, product.id),
          eq(productEnhancements.isActive, true)
        ))
        .limit(1);

      const productCategoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color,
        })
        .from(categories)
        .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
        .where(eq(productCategories.productId, product.id));

      productsWithVariants.push({
        ...product,
        variants: productVariants,
        enhancement: enhancement[0],
        categories: productCategoriesData,
      });
    }

    return productsWithVariants;
  }

  /**
   * Get all active products with their variants and enhancements (legacy method for backward compatibility)
   */
  async getAllProducts(): Promise<ProductWithVariants[]> {
    return this.getActiveProducts();
  }

  /**
   * Get a single product by ID with variants and enhancement
   */
  async getProductById(id: string): Promise<ProductWithEnhancement | null> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product[0]) return null;

    const productVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, id));

    const enhancement = await db
      .select()
      .from(productEnhancements)
      .where(and(
        eq(productEnhancements.productId, id),
        eq(productEnhancements.isActive, true)
      ))
      .limit(1);

    return {
      ...product[0],
      variants: productVariants,
      enhancement: enhancement[0],
    };
  }

  /**
   * Get a product by Printful ID
   */
  async getProductByPrintfulId(printfulId: string): Promise<ProductWithEnhancement | null> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.printfulId, printfulId))
      .limit(1);

    if (!product[0]) return null;

    return this.getProductById(product[0].id);
  }

  /**
   * Get a product by external ID
   */
  async getProductByExternalId(externalId: string): Promise<ProductWithEnhancement | null> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.externalId, externalId))
      .limit(1);

    if (!product[0]) return null;

    return this.getProductById(product[0].id);
  }

  /**
   * Create or update a product from Printful data
   */
  async upsertProduct(printfulProduct: PrintfulProduct): Promise<Product> {
    const existingProduct = await db
      .select()
      .from(products)
      .where(eq(products.printfulId, printfulProduct.id))
      .limit(1);

    const productData: NewProduct = {
      printfulId: printfulProduct.id,
      externalId: printfulProduct.external_id,
      name: printfulProduct.name,
      thumbnailUrl: printfulProduct.thumbnail_url,
      description: printfulProduct.description,
      category: printfulProduct.category,
      tags: printfulProduct.tags,
      metadata: printfulProduct.metadata,
      isIgnored: printfulProduct.is_ignored,
      syncedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existingProduct[0]) {
      // Update existing product
      const [updatedProduct] = await db
        .update(products)
        .set(productData)
        .where(eq(products.id, existingProduct[0].id))
        .returning();

      return updatedProduct;
    } else {
      // Create new product
      const [newProduct] = await db
        .insert(products)
        .values(productData)
        .returning();

      return newProduct;
    }
  }

  /**
   * Create or update variants for a product
   */
  async upsertVariants(productId: string, printfulVariants: PrintfulVariant[]): Promise<Variant[]> {
    const existingVariants = await db
      .select()
      .from(variants)
      .where(eq(variants.productId, productId));

    const existingVariantIds = existingVariants.map(v => v.printfulId);
    const incomingVariantIds = printfulVariants.map(v => v.id);

    // Delete variants that no longer exist in Printful
    const variantsToDelete = existingVariants.filter(v => !incomingVariantIds.includes(v.printfulId));
    if (variantsToDelete.length > 0) {
      await db
        .delete(variants)
        .where(inArray(variants.id, variantsToDelete.map(v => v.id)));
    }

    // Upsert variants
    const upsertedVariants: Variant[] = [];

    for (const printfulVariant of printfulVariants) {
      const existingVariant = existingVariants.find(v => v.printfulId === printfulVariant.id);

      const variantData: NewVariant = {
        productId,
        printfulId: printfulVariant.id,
        externalId: printfulVariant.external_id,
        name: printfulVariant.name,
        retailPrice: printfulVariant.retail_price,
        currency: printfulVariant.currency,
        size: printfulVariant.size,
        color: printfulVariant.color,
        isEnabled: printfulVariant.is_enabled,
        inStock: printfulVariant.in_stock,
        isIgnored: printfulVariant.is_ignored,
        files: printfulVariant.files,
        options: printfulVariant.options,
        syncedAt: new Date(),
        updatedAt: new Date(),
      };

      if (existingVariant) {
        // Update existing variant
        const [updatedVariant] = await db
          .update(variants)
          .set(variantData)
          .where(eq(variants.id, existingVariant.id))
          .returning();

        upsertedVariants.push(updatedVariant);
      } else {
        // Create new variant
        const [newVariant] = await db
          .insert(variants)
          .values(variantData)
          .returning();

        upsertedVariants.push(newVariant);
      }
    }

    return upsertedVariants;
  }

  /**
   * Create or update product enhancement
   */
  async upsertEnhancement(productId: string, enhancementData: Partial<NewProductEnhancement>): Promise<DBProductEnhancement> {
    const existingEnhancement = await db
      .select()
      .from(productEnhancements)
      .where(eq(productEnhancements.productId, productId))
      .limit(1);

    const enhancement: NewProductEnhancement = {
      productId,
      description: enhancementData.description || null,
      shortDescription: enhancementData.shortDescription || null,
      features: enhancementData.features || null,
      specifications: enhancementData.specifications || null,
      additionalImages: enhancementData.additionalImages || null,
      seo: enhancementData.seo || null,
      defaultVariantId: enhancementData.defaultVariantId || null,
      isActive: true,
      updatedAt: new Date(),
    };

    if (existingEnhancement[0]) {
      // Update existing enhancement
      const [updatedEnhancement] = await db
        .update(productEnhancements)
        .set(enhancement)
        .where(eq(productEnhancements.id, existingEnhancement[0].id))
        .returning();

      return updatedEnhancement;
    } else {
      // Create new enhancement
      const [newEnhancement] = await db
        .insert(productEnhancements)
        .values(enhancement)
        .returning();

      return newEnhancement;
    }
  }

  /**
   * Delete a product and all its related data
   */
  async deleteProduct(productId: string): Promise<void> {
    await db.delete(products).where(eq(products.id, productId));
  }

  /**
   * Toggle product visibility
   */
  async toggleProductVisibility(productId: string): Promise<Product> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product[0]) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    const [updatedProduct] = await db
      .update(products)
      .set({ 
        isActive: !product[0].isActive,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();

    return updatedProduct;
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categorySlug: string): Promise<ProductWithVariants[]> {
    const categoryProducts = await db
      .select({
        productId: productCategories.productId,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(eq(categories.slug, categorySlug));

    const productIds = categoryProducts.map(p => p.productId);
    
    if (productIds.length === 0) return [];

    const dbProducts = await db
      .select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ));

    const productsWithVariants: ProductWithVariants[] = [];

    for (const product of dbProducts) {
      const productVariants = await db
        .select()
        .from(variants)
        .where(eq(variants.productId, product.id));

      const enhancement = await db
        .select()
        .from(productEnhancements)
        .where(and(
          eq(productEnhancements.productId, product.id),
          eq(productEnhancements.isActive, true)
        ))
        .limit(1);

      const productCategoriesData = await db
        .select({
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          color: categories.color,
        })
        .from(categories)
        .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
        .where(eq(productCategories.productId, product.id));

      productsWithVariants.push({
        ...product,
        variants: productVariants,
        enhancement: enhancement[0],
        categories: productCategoriesData,
      });
    }

    return productsWithVariants;
  }

  /**
   * Create a sync log entry
   */
  async createSyncLog(logData: Omit<NewSyncLog, 'id' | 'startedAt'>): Promise<SyncLog> {
    const [syncLog] = await db
      .insert(syncLogs)
      .values(logData)
      .returning();

    return syncLog;
  }

  /**
   * Update a sync log entry
   */
  async updateSyncLog(id: string, updates: Partial<NewSyncLog>): Promise<SyncLog> {
    const [updatedLog] = await db
      .update(syncLogs)
      .set({
        ...updates,
        completedAt: new Date(),
        duration: updates.duration || 0,
      })
      .where(eq(syncLogs.id, id))
      .returning();

    return updatedLog;
  }

  /**
   * Get recent sync logs
   */
  async getRecentSyncLogs(limit: number = 10): Promise<SyncLog[]> {
    return db
      .select()
      .from(syncLogs)
      .orderBy(desc(syncLogs.startedAt))
      .limit(limit);
  }
}

// Export singleton instance
export const productService = new ProductService();
