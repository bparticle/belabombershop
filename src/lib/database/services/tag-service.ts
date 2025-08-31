import { db } from '../config';
import { tags, productTags, products } from '../schema';
import { eq, and, or, desc, asc, like, inArray, count, sql } from 'drizzle-orm';
import type { Tag, NewTag } from '../schema';

export class TagService {
  /**
   * Get all tags with optional filtering
   */
  async getAllTags(options: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'usageCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Tag[]> {
    const { 
      includeInactive = false, 
      limit, 
      offset, 
      sortBy = 'name', 
      sortOrder = 'asc' 
    } = options;
    
    let query = db.select().from(tags);
    
    if (!includeInactive) {
      query = query.where(eq(tags.isActive, true));
    }
    
    // Apply sorting
    const sortColumn = sortBy === 'usageCount' ? tags.usageCount : 
                      sortBy === 'createdAt' ? tags.createdAt : tags.name;
    const sortDirection = sortOrder === 'desc' ? desc : asc;
    
    query = query.orderBy(sortDirection(sortColumn));
    
    if (limit) {
      query = query.limit(limit);
    }
    
    if (offset) {
      query = query.offset(offset);
    }
    
    return await query;
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: string): Promise<Tag | null> {
    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get tag by slug
   */
  async getTagBySlug(slug: string): Promise<Tag | null> {
    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.slug, slug))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Get tag by name
   */
  async getTagByName(name: string): Promise<Tag | null> {
    const result = await db
      .select()
      .from(tags)
      .where(eq(tags.name, name))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * Create a new tag
   */
  async createTag(tagData: Omit<NewTag, 'id'>): Promise<Tag> {
    const [tag] = await db
      .insert(tags)
      .values(tagData)
      .returning();
    
    return tag;
  }

  /**
   * Create tag if it doesn't exist, or return existing one
   */
  async createTagIfNotExists(tagData: Omit<NewTag, 'id'>): Promise<Tag> {
    const existing = await this.getTagByName(tagData.name);
    if (existing) {
      return existing;
    }
    
    return await this.createTag(tagData);
  }

  /**
   * Update a tag
   */
  async updateTag(id: string, tagData: Partial<NewTag>): Promise<Tag | null> {
    const result = await db
      .update(tags)
      .set({ ...tagData, updatedAt: new Date() })
      .where(eq(tags.id, id))
      .returning();
    
    return result[0] || null;
  }

  /**
   * Delete a tag (only if it has no products)
   */
  async deleteTag(id: string): Promise<boolean> {
    // Check if tag has products
    const usageCount = await this.getTagUsageCount(id);
    if (usageCount > 0) {
      throw new Error('Cannot delete tag with associated products');
    }

    const result = await db
      .delete(tags)
      .where(eq(tags.id, id))
      .returning();
    
    return result.length > 0;
  }

  /**
   * Get products for a tag
   */
  async getProductsForTag(tagId: string, options: {
    includeInactive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { includeInactive = false, limit, offset } = options;
    
    let query = db
      .select(products)
      .from(productTags)
      .innerJoin(products, eq(productTags.productId, products.id))
      .where(eq(productTags.tagId, tagId));
    
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
   * Get product count for a tag
   */
  async getTagUsageCount(tagId: string, includeInactive = false): Promise<number> {
    let query = db
      .select({ count: count() })
      .from(productTags)
      .innerJoin(products, eq(productTags.productId, products.id))
      .where(eq(productTags.tagId, tagId));
    
    if (!includeInactive) {
      query = query.where(eq(products.isActive, true));
    }
    
    const result = await query;
    return result[0]?.count || 0;
  }

  /**
   * Assign tag to product
   */
  async assignTagToProduct(productId: string, tagId: string): Promise<void> {
    await db
      .insert(productTags)
      .values({
        productId,
        tagId,
      })
      .onConflictDoNothing();
    
    // Update usage count
    await this.updateTagUsageCount(tagId);
  }

  /**
   * Remove tag from product
   */
  async removeTagFromProduct(productId: string, tagId: string): Promise<void> {
    await db
      .delete(productTags)
      .where(and(
        eq(productTags.productId, productId),
        eq(productTags.tagId, tagId)
      ));
    
    // Update usage count
    await this.updateTagUsageCount(tagId);
  }

  /**
   * Get all tags for a product
   */
  async getTagsForProduct(productId: string): Promise<Tag[]> {
    return await db
      .select(tags)
      .from(productTags)
      .innerJoin(tags, eq(productTags.tagId, tags.id))
      .where(eq(productTags.productId, productId))
      .orderBy(asc(tags.name));
  }

  /**
   * Assign multiple tags to product
   */
  async assignTagsToProduct(productId: string, tagIds: string[]): Promise<void> {
    // Remove existing tags
    await db
      .delete(productTags)
      .where(eq(productTags.productId, productId));
    
    // Add new tags
    if (tagIds.length > 0) {
      await db
        .insert(productTags)
        .values(tagIds.map(tagId => ({ productId, tagId })));
      
      // Update usage counts for all affected tags
      for (const tagId of tagIds) {
        await this.updateTagUsageCount(tagId);
      }
    }
  }

  /**
   * Update tag usage count
   */
  async updateTagUsageCount(tagId: string): Promise<void> {
    const usageCount = await this.getTagUsageCount(tagId, true); // Include inactive products for accurate count
    
    await db
      .update(tags)
      .set({ usageCount, updatedAt: new Date() })
      .where(eq(tags.id, tagId));
  }

  /**
   * Search tags by name
   */
  async searchTags(query: string, limit = 10): Promise<Tag[]> {
    return await db
      .select()
      .from(tags)
      .where(and(
        eq(tags.isActive, true),
        like(tags.name, `%${query}%`)
      ))
      .orderBy(desc(tags.usageCount), asc(tags.name))
      .limit(limit);
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit = 20): Promise<Tag[]> {
    return await db
      .select()
      .from(tags)
      .where(eq(tags.isActive, true))
      .orderBy(desc(tags.usageCount), asc(tags.name))
      .limit(limit);
  }

  /**
   * Get recently created tags
   */
  async getRecentTags(limit = 10): Promise<Tag[]> {
    return await db
      .select()
      .from(tags)
      .where(eq(tags.isActive, true))
      .orderBy(desc(tags.createdAt))
      .limit(limit);
  }

  /**
   * Suggest tags based on product data
   */
  async suggestTagsForProduct(product: any): Promise<Tag[]> {
    const suggestions: Tag[] = [];
    
    // Extract potential tags from product name
    const nameWords = product.name.toLowerCase().split(/\s+/);
    for (const word of nameWords) {
      if (word.length > 2) { // Only consider words longer than 2 characters
        const existingTag = await this.getTagByName(word);
        if (existingTag) {
          suggestions.push(existingTag);
        }
      }
    }
    
    // Extract tags from product tags (if they exist)
    if (product.tags && Array.isArray(product.tags)) {
      for (const tagName of product.tags) {
        const existingTag = await this.getTagByName(tagName);
        if (existingTag) {
          suggestions.push(existingTag);
        }
      }
    }
    
    // Add popular tags as suggestions
    const popularTags = await this.getPopularTags(5);
    suggestions.push(...popularTags);
    
    // Remove duplicates and return
    const uniqueSuggestions = suggestions.filter((tag, index, self) => 
      index === self.findIndex(t => t.id === tag.id)
    );
    
    return uniqueSuggestions.slice(0, 10); // Limit to 10 suggestions
  }

  /**
   * Auto-tag product based on its data
   */
  async autoTagProduct(product: any): Promise<string[]> {
    const suggestedTags = await this.suggestTagsForProduct(product);
    const autoTags: string[] = [];
    
    // Auto-tag based on product name keywords
    const nameKeywords = ['new', 'trending', 'popular', 'best', 'top', 'featured'];
    const nameLower = product.name.toLowerCase();
    
    for (const keyword of nameKeywords) {
      if (nameLower.includes(keyword)) {
        const tag = await this.createTagIfNotExists({
          name: keyword.charAt(0).toUpperCase() + keyword.slice(1),
          slug: keyword,
          description: `Auto-generated tag for ${keyword} products`,
          color: '#6B7280',
        });
        autoTags.push(tag.id);
      }
    }
    
    // Auto-tag based on product tags from Printful
    if (product.tags && Array.isArray(product.tags)) {
      for (const tagName of product.tags.slice(0, 3)) { // Limit to first 3 tags
        const tag = await this.createTagIfNotExists({
          name: tagName,
          slug: tagName.toLowerCase().replace(/\s+/g, '-'),
          description: `Auto-generated tag from Printful`,
          color: '#3B82F6',
        });
        autoTags.push(tag.id);
      }
    }
    
    return autoTags;
  }

  /**
   * Bulk update tag usage counts
   */
  async updateAllTagUsageCounts(): Promise<void> {
    const allTags = await this.getAllTags({ includeInactive: true });
    
    for (const tag of allTags) {
      await this.updateTagUsageCount(tag.id);
    }
  }

  /**
   * Get tags with usage statistics
   */
  async getTagsWithStats(): Promise<Array<Tag & { productCount: number }>> {
    const allTags = await this.getAllTags({ includeInactive: false });
    
    return await Promise.all(
      allTags.map(async (tag) => ({
        ...tag,
        productCount: await this.getTagUsageCount(tag.id),
      }))
    );
  }
}

export const tagService = new TagService();
