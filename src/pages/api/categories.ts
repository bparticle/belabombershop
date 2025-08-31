import { NextApiRequest, NextApiResponse } from 'next';
import { categoryService } from '../../lib/database/services/category-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });
  }

  try {
    const { 
      includeInactive = 'false', 
      includeSystem = 'true',
      id,
      slug 
    } = req.query;

    // If specific ID is requested
    if (id && typeof id === 'string') {
      const category = await categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.status(200).json({ category });
    }

    // If specific slug is requested
    if (slug && typeof slug === 'string') {
      const category = await categoryService.getCategoryBySlug(slug);
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.status(200).json({ category });
    }

    // Get all categories
    const categories = await categoryService.getAllCategories({
      includeInactive: includeInactive === 'true',
      includeSystem: includeSystem === 'true',
    });

    return res.status(200).json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
}
