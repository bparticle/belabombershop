import { db } from '../config';
import { categories, productCategories, categoryMappingRules, products } from '../schema';
import { eq, and, or, desc, asc, like, inArray, isNull, count, sql } from 'drizzle-orm';
import type { Category, NewCategory, CategoryMappingRule, NewCategoryMappingRule } from '../schema';

export class CategoryService {
  /**
   * Get all categories with optional filtering
   */
  async getAllCategories(options: {
    includeInactive?: boolean;
    includeSystem?: boolean;
    parentId?: string | null;
  } = {}): Promise<Category[]> {
    const { includeInactive = false, includeSystem = true, parentId } = options;
    
    const conditions = [];
    
    if (!includeInactive) {
      conditions.push(eq(categories.isActive, true));
    }
    
    if (!includeSystem) {
      conditions.push(eq(categories.isSystem, false));
    }
    
    if (parentId !== undefined) {
      if (parentId === null) {
        conditions.push(isNull(categories.parentId));
      } else {
        conditions.push(eq(categories.parentId, parentId));
      }
    }
    
    return await db
      .select()
      .from(categories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const result = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create a new category
   */
  async createCategory(categoryData: Omit<NewCategory, 'id'>): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(categoryData)
      .returning();
    
    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, categoryData: Partial<NewCategory>): Promise<Category | null> {
    const result = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Delete a category (only if it's not a system category and has no products)
   */
  async deleteCategory(id: string): Promise<boolean> {
    // Check if it's a system category
    const category = await this.getCategoryById(id);
    if (!category || category.isSystem) {
      throw new Error('Cannot delete system categories');
    }

    // Check if category has products
    const productCount = await this.getProductCountForCategory(id);
    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    // Check if category has child categories
    const childCategories = await this.getAllCategories({ parentId: id });
    if (childCategories.length > 0) {
      throw new Error('Cannot delete category with child categories');
    }

    const result = await db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get hierarchical category tree
   */
  async getCategoryTree(): Promise<Array<Category & { children: Category[] }>> {
    const allCategories = await this.getAllCategories({ includeInactive: false });
    
    // Build tree structure
    const categoryMap = new Map<string, Category & { children: Category[] }>();
    const rootCategories: Array<Category & { children: Category[] }> = [];
    
    // Initialize all categories with empty children array
    allCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });
    
    // Build parent-child relationships
    allCategories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId);
        if (parent) {
          parent.children.push(categoryWithChildren);
        }
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });
    
    return rootCategories;
  }

  /**
   * Get products for a category
   */
  async getProductsForCategory(categoryId: string, options: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<Array<{ product: any; isPrimary: boolean }>> {
    const { includeInactive = false, limit, offset } = options;
    
    let query = db
      .select({
        product: products,
        isPrimary: productCategories.isPrimary,
      })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(eq(productCategories.categoryId, categoryId));
    
    if (!includeInactive) {
      query = query.where(eq(products.isActive, true));
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    return await query.orderBy(desc(products.createdAt));
  }

  /**
   * Get product count for a category
   */
  async getProductCountForCategory(categoryId: string, includeInactive = false): Promise<number> {
    let query = db
      .select({ count: count() })
      .from(productCategories)
      .innerJoin(products, eq(productCategories.productId, products.id))
      .where(eq(productCategories.categoryId, categoryId));
    
    if (!includeInactive) {
      query = query.where(eq(products.isActive, true));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Assign category to product
   */
  async assignCategoryToProduct(productId: string, categoryId: string, isPrimary = false): Promise<void> {
    // If this is a primary category, unset other primary categories for this product
    if (isPrimary) {
      await db
        .update(productCategories)
        .set({ isPrimary: false })
        .where(and(
          eq(productCategories.productId, productId),
          eq(productCategories.isPrimary, true)
        ));
    }
    
    // Insert or update the category assignment
    await db
      .insert(productCategories)
      .values({
        productId,
        categoryId,
        isPrimary,
      })
      .onConflictDoUpdate({
        target: [productCategories.productId, productCategories.categoryId],
        set: { isPrimary },
      });
  }

  /**
   * Remove category from product
   */
  async removeCategoryFromProduct(productId: string, categoryId: string): Promise<void> {
    await db
      .delete(productCategories)
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.categoryId, categoryId)
      ));
  }

  /**
   * Get all categories for a product
   */
  async getCategoriesForProduct(productId: string): Promise<Array<Category & { isPrimary: boolean }>> {
    return await db
      .select({
        ...categories,
        isPrimary: productCategories.isPrimary,
      })
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(eq(productCategories.productId, productId))
      .orderBy(desc(productCategories.isPrimary), asc(categories.name));
  }

  /**
   * Get primary category for a product
   */
  async getPrimaryCategoryForProduct(productId: string): Promise<Category | null> {
    const result = await db
      .select(categories)
      .from(productCategories)
      .innerJoin(categories, eq(productCategories.categoryId, categories.id))
      .where(and(
        eq(productCategories.productId, productId),
        eq(productCategories.isPrimary, true)
      ))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create category mapping rule
   */
  async createMappingRule(ruleData: Omit<NewCategoryMappingRule, 'id'>): Promise<CategoryMappingRule> {
    const [rule] = await db
      .insert(categoryMappingRules)
      .values(ruleData)
      .returning();
    
    return rule;
  }

  /**
   * Get all mapping rules for a category
   */
  async getMappingRulesForCategory(categoryId: string): Promise<CategoryMappingRule[]> {
    return await db
      .select()
      .from(categoryMappingRules)
      .where(eq(categoryMappingRules.categoryId, categoryId))
      .orderBy(desc(categoryMappingRules.priority), asc(categoryMappingRules.ruleValue));
  }

  /**
   * Delete a mapping rule
   */
  async deleteMappingRule(id: string): Promise<boolean> {
    const result = await db
      .delete(categoryMappingRules)
      .where(eq(categoryMappingRules.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Automatically categorize a product based on mapping rules
   */
  async autoCategorizeProduct(product: any): Promise<string | null> {
    const rules = await db
      .select()
      .from(categoryMappingRules)
      .where(eq(categoryMappingRules.isActive, true))
      .orderBy(desc(categoryMappingRules.priority));
    
    for (const rule of rules) {
      const category = await this.getCategoryById(rule.categoryId);
      if (!category || !category.isActive) continue;
      
      let matches = false;
      
      switch (rule.ruleType) {
        case 'name_keyword':
          matches = product.name.toLowerCase().includes(rule.ruleValue.toLowerCase());
          break;
        case 'tag_keyword':
          if (product.tags && Array.isArray(product.tags)) {
            matches = product.tags.some((tag: string) => 
              tag.toLowerCase().includes(rule.ruleValue.toLowerCase())
            );
          }
          break;
        case 'metadata_key':
          if (product.metadata && product.metadata[rule.ruleValue]) {
            matches = true;
          }
          break;
      }
      
      if (matches) {
        return rule.categoryId;
      }
    }
    
    return null;
  }

  /**
   * Initialize default categories from the old system
   */
  async initializeDefaultCategories(): Promise<void> {
    const defaultCategories = [
      {
        name: 'Children',
        description: 'Products designed for kids and children',
        slug: 'children',
        color: '#FF6B6B',
        icon: '👶',
        isSystem: true,
        sortOrder: 1,
      },
      {
        name: 'Adults',
        description: 'Products designed for adults',
        slug: 'adults',
        color: '#4ECDC4',
        icon: '👨‍💼',
        isSystem: true,
        sortOrder: 2,
      },
      {
        name: 'Accessories',
        description: 'Fashion accessories and add-ons',
        slug: 'accessories',
        color: '#96CEB4',
        icon: '👜',
        isSystem: true,
        sortOrder: 3,
      },
      {
        name: 'Home & Living',
        description: 'Home decor and lifestyle products',
        slug: 'home-living',
        color: '#FFA726',
        icon: '🏠',
        isSystem: true,
        sortOrder: 4,
      },
    ];

    for (const categoryData of defaultCategories) {
      const existing = await this.getCategoryBySlug(categoryData.slug);
      if (!existing) {
        await this.createCategory(categoryData);
      }
    }

    // Initialize default mapping rules
    await this.initializeDefaultMappingRules();
  }

  /**
   * Initialize default mapping rules
   */
  async initializeDefaultMappingRules(): Promise<void> {
    const childrenCategory = await this.getCategoryBySlug('children');
    const adultsCategory = await this.getCategoryBySlug('adults');
    const accessoriesCategory = await this.getCategoryBySlug('accessories');
    const homeLivingCategory = await this.getCategoryBySlug('home-living');

    const defaultRules = [
      // Children rules
      ...(childrenCategory ? [
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'kids', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'child', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'children', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'baby', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'toddler', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'youth', priority: 10 },
        { categoryId: childrenCategory.id, ruleType: 'name_keyword', ruleValue: 'junior', priority: 10 },
      ] : []),

      // Adults rules
      ...(adultsCategory ? [
        { categoryId: adultsCategory.id, ruleType: 'name_keyword', ruleValue: 'adult', priority: 10 },
        { categoryId: adultsCategory.id, ruleType: 'name_keyword', ruleValue: 'men', priority: 10 },
        { categoryId: adultsCategory.id, ruleType: 'name_keyword', ruleValue: 'women', priority: 10 },
        { categoryId: adultsCategory.id, ruleType: 'name_keyword', ruleValue: 'grown', priority: 10 },
        { categoryId: adultsCategory.id, ruleType: 'name_keyword', ruleValue: 'mature', priority: 10 },
      ] : []),

      // Accessories rules
      ...(accessoriesCategory ? [
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'bag', priority: 10 },
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'backpack', priority: 10 },
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'hat', priority: 10 },
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'cap', priority: 10 },
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'accessory', priority: 10 },
        { categoryId: accessoriesCategory.id, ruleType: 'name_keyword', ruleValue: 'accessories', priority: 10 },
      ] : []),

      // Home & Living rules
      ...(homeLivingCategory ? [
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'home', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'living', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'decor', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'decoration', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'house', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'room', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'wall', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'cushion', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'pillow', priority: 10 },
        { categoryId: homeLivingCategory.id, ruleType: 'name_keyword', ruleValue: 'blanket', priority: 10 },
      ] : []),
    ];

    for (const ruleData of defaultRules) {
      // Check if rule already exists
      const existingRules = await this.getMappingRulesForCategory(ruleData.categoryId);
      const ruleExists = existingRules.some(rule => 
        rule.ruleType === ruleData.ruleType && rule.ruleValue === ruleData.ruleValue
      );
      
      if (!ruleExists) {
        await this.createMappingRule(ruleData);
      }
    }
  }
}

export const categoryService = new CategoryService();
