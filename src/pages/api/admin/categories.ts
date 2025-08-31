import { NextApiRequest, NextApiResponse } from 'next';
import { categoryService } from '../../../lib/database/services/category-service';
import { verifyAdminToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify admin authentication
  const token = verifyAdminToken(req);
  if (!token || token.role !== 'admin') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        return await handleGetCategories(req, res);
      case 'POST':
        return await handleCreateCategory(req, res);
      case 'PUT':
        return await handleUpdateCategory(req, res);
      case 'DELETE':
        return await handleDeleteCategory(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Category API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetCategories(req: NextApiRequest, res: NextApiResponse) {
  const { 
    includeInactive = 'false', 
    includeSystem = 'true', 
    parentId,
    tree = 'false' 
  } = req.query;

  try {
    if (tree === 'true') {
      const categoryTree = await categoryService.getCategoryTree();
      return res.status(200).json({ categories: categoryTree });
    }

    const categories = await categoryService.getAllCategories({
      includeInactive: includeInactive === 'true',
      includeSystem: includeSystem === 'true',
      parentId: parentId === 'null' ? null : parentId as string,
    });

    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function handleCreateCategory(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, slug, color, icon, parentId, sortOrder } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  try {
    // Check if slug already exists
    const existingCategory = await categoryService.getCategoryBySlug(slug);
    if (existingCategory) {
      return res.status(400).json({ error: 'Category with this slug already exists' });
    }

    const category = await categoryService.createCategory({
      name,
      description,
      slug,
      color,
      icon,
      parentId: parentId || null,
      sortOrder: sortOrder || 0,
      isActive: true,
      isSystem: false,
    });

    return res.status(201).json({ category });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ error: 'Failed to create category' });
  }
}

async function handleUpdateCategory(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  // Ensure parentId is properly handled (empty string -> null)
  if (updateData.parentId === '') {
    updateData.parentId = null;
  }

  try {
    const category = await categoryService.updateCategory(id, updateData);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json({ category });
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ error: 'Failed to update category' });
  }
}

async function handleDeleteCategory(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    const success = await categoryService.deleteCategory(id);
    if (!success) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete category' });
  }
}
