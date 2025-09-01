import { eq, and, inArray, desc } from 'drizzle-orm';
import { db, logQueryPerformance } from '../config';
import { 
  products, 
  variants, 
  productEnhancements, 
  categories, 
  productCategories,
  tags,
  productTags,
  syncLogs,
  type Product,
  type NewProduct,
  type Variant,
  type NewVariant,
  type ProductEnhancement as DBProductEnhancement,
  type NewProductEnhancement,
  type Tag,
  type SyncLog,
  type NewSyncLog
} from '../schema';
import { printful } from '../../printful-client';
import type { PrintfulProduct, PrintfulVariant } from '../../../types';
import { categoryService } from './category-service';
import { tagService } from './tag-service';
import { SyncProgressUpdate, DEFAULT_SYNC_PROGRESS, type SyncStatus } from '../../sync-progress';

export interface ProductWithVariants extends Omit<Product, 'tags'> {
  variants: Variant[];
  enhancement?: DBProductEnhancement;
  categories: Array<{ id: string; name: string; slug: string; color?: string; isPrimary: boolean }>;
  tags: Tag[];
}

export interface ProductWithEnhancement extends Product {
  enhancement?: DBProductEnhancement;
  variants: Variant[];
}

export class ProductService {
  /**
   * Get all active products with their variants and enhancements (for frontend)
   * OPTIMIZED: Uses JOIN queries instead of N+1 pattern for better performance
   */
  async getActiveProducts(): Promise<ProductWithVariants[]> {
    return logQueryPerformance('getActiveProducts', async () => {
    // Step 1: Get all active products in one query
    const dbProducts = await db
      .select()
      .from(products)
      .where(eq(products.isActive, true))
      .orderBy(desc(products.createdAt));

    if (dbProducts.length === 0) {
      return [];
    }

    const productIds = dbProducts.map(p => p.id);

    // Step 2: Get all variants for all products in one query
    const allVariants = await db
      .select()
      .from(variants)
      .where(inArray(variants.productId, productIds));

    // Step 3: Get all enhancements for all products in one query
    const allEnhancements = await db
      .select()
      .from(productEnhancements)
      .where(and(
        inArray(productEnhancements.productId, productIds),
        eq(productEnhancements.isActive, true)
      ));

    // Step 4: Get all categories for all products in one query
    const allProductCategories = await db
      .select({
        productId: productCategories.productId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        color: categories.color,
        isPrimary: productCategories.isPrimary,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(inArray(productCategories.productId, productIds));

    // Step 5: Get all tags for all products in one query
    const allProductTags = await db
      .select({
        productId: productTags.productId,
        id: tags.id,
        name: tags.name,
        description: tags.description,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        slug: tags.slug,
        color: tags.color,
        usageCount: tags.usageCount,
      })
      .from(productTags)
      .innerJoin(tags, eq(tags.id, productTags.tagId))
      .where(inArray(productTags.productId, productIds));

    // Step 6: Group the related data by product ID for efficient lookup
    const variantsByProduct = new Map<string, typeof allVariants>();
    const enhancementsByProduct = new Map<string, typeof allEnhancements[0] | undefined>();
    const categoriesByProduct = new Map<string, typeof allProductCategories>();
    const tagsByProduct = new Map<string, typeof allProductTags>();

    // Group variants
    for (const variant of allVariants) {
      if (!variantsByProduct.has(variant.productId)) {
        variantsByProduct.set(variant.productId, []);
      }
      variantsByProduct.get(variant.productId)!.push(variant);
    }

    // Group enhancements (only one per product)
    for (const enhancement of allEnhancements) {
      enhancementsByProduct.set(enhancement.productId, enhancement);
    }

    // Group categories
    for (const category of allProductCategories) {
      if (!categoriesByProduct.has(category.productId)) {
        categoriesByProduct.set(category.productId, []);
      }
      categoriesByProduct.get(category.productId)!.push(category);
    }

    // Group tags
    for (const tag of allProductTags) {
      if (!tagsByProduct.has(tag.productId)) {
        tagsByProduct.set(tag.productId, []);
      }
      tagsByProduct.get(tag.productId)!.push(tag);
    }

    // Step 7: Combine all data into final result
    const productsWithVariants: ProductWithVariants[] = dbProducts.map(product => ({
      ...product,
      variants: variantsByProduct.get(product.id) || [],
      enhancement: enhancementsByProduct.get(product.id),
      categories: (categoriesByProduct.get(product.id) || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        isPrimary: cat.isPrimary ?? false,
      })),
      tags: tagsByProduct.get(product.id) || [],
    }));

    return productsWithVariants;
    });
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
          isPrimary: productCategories.isPrimary,
        })
        .from(categories)
        .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
        .where(eq(productCategories.productId, product.id));

      const productTagsData = await db
        .select({
          id: tags.id,
          name: tags.name,
          description: tags.description,
          isActive: tags.isActive,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
          slug: tags.slug,
          color: tags.color,
          usageCount: tags.usageCount,
        })
        .from(tags)
        .innerJoin(productTags, eq(tags.id, productTags.tagId))
        .where(eq(productTags.productId, product.id));

      productsWithVariants.push({
        ...product,
        variants: productVariants,
        enhancement: enhancement[0],
        categories: productCategoriesData.map(cat => ({
          ...cat,
          isPrimary: cat.isPrimary ?? false,
        })),
        tags: productTagsData,
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
   * OPTIMIZED: Uses optimized queries for single product lookup
   */
  async getProductById(id: string): Promise<ProductWithEnhancement | null> {
    return logQueryPerformance(`getProductById(${id})`, async () => {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!product[0]) return null;

      // Use parallel queries instead of sequential for better performance
      const [productVariants, enhancement] = await Promise.all([
        db
          .select()
          .from(variants)
          .where(eq(variants.productId, id)),
        
        db
          .select()
          .from(productEnhancements)
          .where(and(
            eq(productEnhancements.productId, id),
            eq(productEnhancements.isActive, true)
          ))
          .limit(1)
      ]);

      return {
        ...product[0],
        variants: productVariants,
        enhancement: enhancement[0],
      };
    });
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
   * Get a product by external ID with full category and tag information
   */
  async getProductByExternalIdWithFullInfo(externalId: string): Promise<ProductWithVariants | null> {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.externalId, externalId))
      .limit(1);

    if (!product[0]) return null;

    return this.getProductWithFullInfo(product[0].id);
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
   * Handles cascading deletes for variants, enhancements, categories, and tags
   */
  async deleteProduct(productId: string): Promise<void> {
    try {
      // Delete in proper order to handle any potential foreign key issues
      // Even though we have CASCADE, let's be explicit for reliability
      
      // 1. Delete product-category relationships
      await db.delete(productCategories).where(eq(productCategories.productId, productId));
      
      // 2. Delete product-tag relationships  
      await db.delete(productTags).where(eq(productTags.productId, productId));
      
      // 3. Delete product enhancements
      await db.delete(productEnhancements).where(eq(productEnhancements.productId, productId));
      
      // 4. Delete variants (should cascade automatically, but being explicit)
      await db.delete(variants).where(eq(variants.productId, productId));
      
      // 5. Finally delete the main product record
      const result = await db.delete(products).where(eq(products.id, productId));
      
      console.log(`✅ Successfully deleted product ${productId} and all related data`);
      
    } catch (error) {
      console.error(`❌ Error deleting product ${productId}:`, error);
      throw error;
    }
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
   * OPTIMIZED: Uses JOIN queries instead of N+1 pattern for better performance
   */
  async getProductsByCategory(categorySlug: string): Promise<ProductWithVariants[]> {
    return logQueryPerformance(`getProductsByCategory(${categorySlug})`, async () => {
    // Step 1: Get product IDs for the category
    const categoryProducts = await db
      .select({
        productId: productCategories.productId,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(eq(categories.slug, categorySlug));

    const productIds = categoryProducts.map(p => p.productId);
    
    if (productIds.length === 0) return [];

    // Step 2: Get all active products for this category in one query
    const dbProducts = await db
      .select()
      .from(products)
      .where(and(
        inArray(products.id, productIds),
        eq(products.isActive, true)
      ))
      .orderBy(desc(products.createdAt));

    if (dbProducts.length === 0) return [];

    const filteredProductIds = dbProducts.map(p => p.id);

    // Step 3: Get all variants for these products in one query
    const allVariants = await db
      .select()
      .from(variants)
      .where(inArray(variants.productId, filteredProductIds));

    // Step 4: Get all enhancements for these products in one query
    const allEnhancements = await db
      .select()
      .from(productEnhancements)
      .where(and(
        inArray(productEnhancements.productId, filteredProductIds),
        eq(productEnhancements.isActive, true)
      ));

    // Step 5: Get all categories for these products in one query
    const allProductCategories = await db
      .select({
        productId: productCategories.productId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        color: categories.color,
        isPrimary: productCategories.isPrimary,
      })
      .from(productCategories)
      .innerJoin(categories, eq(categories.id, productCategories.categoryId))
      .where(inArray(productCategories.productId, filteredProductIds));

    // Step 6: Get all tags for these products in one query
    const allProductTags = await db
      .select({
        productId: productTags.productId,
        id: tags.id,
        name: tags.name,
        description: tags.description,
        isActive: tags.isActive,
        createdAt: tags.createdAt,
        updatedAt: tags.updatedAt,
        slug: tags.slug,
        color: tags.color,
        usageCount: tags.usageCount,
      })
      .from(productTags)
      .innerJoin(tags, eq(tags.id, productTags.tagId))
      .where(inArray(productTags.productId, filteredProductIds));

    // Step 7: Group the related data by product ID for efficient lookup
    const variantsByProduct = new Map<string, typeof allVariants>();
    const enhancementsByProduct = new Map<string, typeof allEnhancements[0] | undefined>();
    const categoriesByProduct = new Map<string, typeof allProductCategories>();
    const tagsByProduct = new Map<string, typeof allProductTags>();

    // Group variants
    for (const variant of allVariants) {
      if (!variantsByProduct.has(variant.productId)) {
        variantsByProduct.set(variant.productId, []);
      }
      variantsByProduct.get(variant.productId)!.push(variant);
    }

    // Group enhancements (only one per product)
    for (const enhancement of allEnhancements) {
      enhancementsByProduct.set(enhancement.productId, enhancement);
    }

    // Group categories
    for (const category of allProductCategories) {
      if (!categoriesByProduct.has(category.productId)) {
        categoriesByProduct.set(category.productId, []);
      }
      categoriesByProduct.get(category.productId)!.push(category);
    }

    // Group tags
    for (const tag of allProductTags) {
      if (!tagsByProduct.has(tag.productId)) {
        tagsByProduct.set(tag.productId, []);
      }
      tagsByProduct.get(tag.productId)!.push(tag);
    }

    // Step 8: Combine all data into final result
    const productsWithVariants: ProductWithVariants[] = dbProducts.map(product => ({
      ...product,
      variants: variantsByProduct.get(product.id) || [],
      enhancement: enhancementsByProduct.get(product.id),
      categories: (categoriesByProduct.get(product.id) || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        color: cat.color,
        isPrimary: cat.isPrimary ?? false,
      })),
      tags: tagsByProduct.get(product.id) || [],
    }));

    return productsWithVariants;
    });
  }

  /**
   * Create a sync log entry with enhanced progress tracking
   */
  async createSyncLog(logData: Omit<NewSyncLog, 'id' | 'startedAt'>): Promise<SyncLog> {
    const enhancedLogData = {
      ...DEFAULT_SYNC_PROGRESS,
      ...logData,
    };

    const [syncLog] = await db
      .insert(syncLogs)
      .values(enhancedLogData)
      .returning();

    return syncLog;
  }

  /**
   * Update a sync log entry with progress information
   */
  async updateSyncLog(id: string, updates: Partial<NewSyncLog>): Promise<SyncLog> {
    const updateData: Partial<NewSyncLog> = {
      ...updates,
      lastUpdated: new Date(),
    };

    // Only set completedAt if the status indicates completion
    if (updates.status && ['success', 'error', 'partial', 'cancelled'].includes(updates.status)) {
      updateData.completedAt = new Date();
    }

    const [updatedLog] = await db
      .update(syncLogs)
      .set(updateData)
      .where(eq(syncLogs.id, id))
      .returning();

    return updatedLog;
  }

  /**
   * Update sync progress with detailed tracking
   */
  async updateSyncProgress(progressUpdate: SyncProgressUpdate): Promise<SyncLog> {
    const updateData: Partial<NewSyncLog> = {
      lastUpdated: new Date(),
    };

    // Map progress update fields to database fields
    if (progressUpdate.status) updateData.status = progressUpdate.status;
    if (progressUpdate.currentStep) updateData.currentStep = progressUpdate.currentStep;
    if (typeof progressUpdate.progress === 'number') updateData.progress = progressUpdate.progress;
    if (typeof progressUpdate.totalProducts === 'number') updateData.totalProducts = progressUpdate.totalProducts;
    if (typeof progressUpdate.currentProductIndex === 'number') updateData.currentProductIndex = progressUpdate.currentProductIndex;
    if (progressUpdate.currentProductName) updateData.currentProductName = progressUpdate.currentProductName;
    if (typeof progressUpdate.estimatedTimeRemaining === 'number') updateData.estimatedTimeRemaining = progressUpdate.estimatedTimeRemaining;
    
    // Statistics updates (accumulative)
    if (typeof progressUpdate.productsProcessed === 'number') updateData.productsProcessed = progressUpdate.productsProcessed;
    if (typeof progressUpdate.productsCreated === 'number') updateData.productsCreated = progressUpdate.productsCreated;
    if (typeof progressUpdate.productsUpdated === 'number') updateData.productsUpdated = progressUpdate.productsUpdated;
    if (typeof progressUpdate.productsDeleted === 'number') updateData.productsDeleted = progressUpdate.productsDeleted;
    if (typeof progressUpdate.variantsProcessed === 'number') updateData.variantsProcessed = progressUpdate.variantsProcessed;
    if (typeof progressUpdate.variantsCreated === 'number') updateData.variantsCreated = progressUpdate.variantsCreated;
    if (typeof progressUpdate.variantsUpdated === 'number') updateData.variantsUpdated = progressUpdate.variantsUpdated;
    if (typeof progressUpdate.variantsDeleted === 'number') updateData.variantsDeleted = progressUpdate.variantsDeleted;
    
    // Error and warning handling
    if (progressUpdate.errorMessage) updateData.errorMessage = progressUpdate.errorMessage;
    if (progressUpdate.warnings && progressUpdate.warnings.length > 0) {
      updateData.warnings = JSON.stringify(progressUpdate.warnings);
    }

    // Set completion time for final statuses
    if (progressUpdate.status && ['success', 'error', 'partial', 'cancelled'].includes(progressUpdate.status)) {
      updateData.completedAt = new Date();
    }

    return this.updateSyncLog(progressUpdate.syncLogId, updateData);
  }

  /**
   * Get a specific sync log by ID with full progress information
   */
  async getSyncLogById(id: string): Promise<SyncLog | null> {
    const result = await db
      .select()
      .from(syncLogs)
      .where(eq(syncLogs.id, id))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Get recent sync logs with enhanced filtering
   */
  async getRecentSyncLogs(limit: number = 10, includeActive: boolean = true): Promise<SyncLog[]> {
    let query = db
      .select()
      .from(syncLogs)
      .orderBy(desc(syncLogs.startedAt));

    if (!includeActive) {
      query = query.where(
        inArray(syncLogs.status, ['success', 'error', 'partial', 'cancelled'])
      );
    }

    return query.limit(limit);
  }

  /**
   * Get currently active sync operations
   */
  async getActiveSyncLogs(): Promise<SyncLog[]> {
    return db
      .select()
      .from(syncLogs)
      .where(
        inArray(syncLogs.status, ['queued', 'fetching_products', 'processing_products', 'finalizing'])
      )
      .orderBy(desc(syncLogs.startedAt));
  }

  /**
   * Cancel an active sync operation
   */
  async cancelSync(syncLogId: string): Promise<SyncLog> {
    return this.updateSyncLog(syncLogId, {
      status: 'cancelled',
      currentStep: 'Sync cancelled by user',
      errorMessage: 'Operation cancelled by user request',
    });
  }

  /**
   * Update product categories
   */
  async updateProductCategories(productId: string, categoryIds: string[], primaryCategoryId?: string): Promise<ProductWithVariants> {
    // Remove existing category assignments
    await db
      .delete(productCategories)
      .where(eq(productCategories.productId, productId));

    // Add new category assignments
    if (categoryIds.length > 0) {
      const assignments = categoryIds.map(categoryId => ({
        productId,
        categoryId,
        isPrimary: primaryCategoryId ? categoryId === primaryCategoryId : false,
      }));

      await db
        .insert(productCategories)
        .values(assignments);
    }

    // Return the updated product with full information
    const updatedProduct = await this.getProductWithFullInfo(productId);
    if (!updatedProduct) {
      throw new Error('Product not found after update');
    }
    return updatedProduct;
  }

  /**
   * Update product tags
   */
  async updateProductTags(productId: string, tagIds: string[]): Promise<void> {
    await tagService.assignTagsToProduct(productId, tagIds);
  }

  /**
   * Auto-categorize and auto-tag a product during sync
   */
  async autoCategorizeAndTagProduct(product: any): Promise<void> {
    // Auto-categorize
    const suggestedCategoryId = await categoryService.autoCategorizeProduct(product);
    if (suggestedCategoryId) {
      await categoryService.assignCategoryToProduct(product.id, suggestedCategoryId, true);
    }

    // Auto-tag
    const autoTagIds = await tagService.autoTagProduct(product);
    if (autoTagIds.length > 0) {
      await tagService.assignTagsToProduct(product.id, autoTagIds);
    }
  }

  /**
   * Get product with full category and tag information
   * OPTIMIZED: Uses direct JOIN queries instead of calling multiple service methods
   */
  async getProductWithFullInfo(productId: string): Promise<ProductWithVariants | null> {
    return logQueryPerformance(`getProductWithFullInfo(${productId})`, async () => {
      // Step 1: Get the product basic info
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product[0]) return null;

      // Step 2: Use parallel queries to get all related data efficiently
      const [productVariants, enhancement, productCategoriesData, productTagsData] = await Promise.all([
        // Get variants
        db
          .select()
          .from(variants)
          .where(eq(variants.productId, productId)),
        
        // Get enhancement
        db
          .select()
          .from(productEnhancements)
          .where(and(
            eq(productEnhancements.productId, productId),
            eq(productEnhancements.isActive, true)
          ))
          .limit(1),
        
        // Get categories with JOIN
        db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
            color: categories.color,
            isPrimary: productCategories.isPrimary,
          })
          .from(productCategories)
          .innerJoin(categories, eq(categories.id, productCategories.categoryId))
          .where(eq(productCategories.productId, productId)),
        
        // Get tags with JOIN
        db
          .select({
            id: tags.id,
            name: tags.name,
            description: tags.description,
            isActive: tags.isActive,
            createdAt: tags.createdAt,
            updatedAt: tags.updatedAt,
            slug: tags.slug,
            color: tags.color,
            usageCount: tags.usageCount,
          })
          .from(productTags)
          .innerJoin(tags, eq(tags.id, productTags.tagId))
          .where(eq(productTags.productId, productId))
      ]);

      return {
        ...product[0],
        variants: productVariants,
        enhancement: enhancement[0],
        categories: productCategoriesData.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          isPrimary: cat.isPrimary ?? false,
        })),
        tags: productTagsData,
      };
    });
  }
}

// Export singleton instance
export const productService = new ProductService();
