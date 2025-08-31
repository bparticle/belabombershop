import { NextApiRequest, NextApiResponse } from 'next';
import { tagService } from '../../../lib/database/services/tag-service';
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
        return await handleGetTags(req, res);
      case 'POST':
        return await handleCreateTag(req, res);
      case 'PUT':
        return await handleUpdateTag(req, res);
      case 'DELETE':
        return await handleDeleteTag(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Tag API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGetTags(req: NextApiRequest, res: NextApiResponse) {
  const { 
    includeInactive = 'false',
    limit,
    offset,
    sortBy = 'name',
    sortOrder = 'asc',
    search,
    withStats = 'false'
  } = req.query;

  try {
    if (search && typeof search === 'string') {
      const tags = await tagService.searchTags(search, limit ? parseInt(limit as string) : 10);
      return res.status(200).json({ tags });
    }

    if (withStats === 'true') {
      const tagsWithStats = await tagService.getTagsWithStats();
      return res.status(200).json({ tags: tagsWithStats });
    }

    const tags = await tagService.getAllTags({
      includeInactive: includeInactive === 'true',
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      sortBy: sortBy as 'name' | 'usageCount' | 'createdAt',
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    return res.status(200).json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return res.status(500).json({ error: 'Failed to fetch tags' });
  }
}

async function handleCreateTag(req: NextApiRequest, res: NextApiResponse) {
  const { name, description, slug, color } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  try {
    // Check if tag already exists
    const existingTag = await tagService.getTagByName(name);
    if (existingTag) {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }

    const existingSlug = await tagService.getTagBySlug(slug);
    if (existingSlug) {
      return res.status(400).json({ error: 'Tag with this slug already exists' });
    }

    const tag = await tagService.createTag({
      name,
      description,
      slug,
      color,
      isActive: true,
      usageCount: 0,
    });

    return res.status(201).json({ tag });
  } catch (error) {
    console.error('Error creating tag:', error);
    return res.status(500).json({ error: 'Failed to create tag' });
  }
}

async function handleUpdateTag(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const updateData = req.body;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Tag ID is required' });
  }

  try {
    const tag = await tagService.updateTag(id, updateData);
    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    return res.status(200).json({ tag });
  } catch (error) {
    console.error('Error updating tag:', error);
    return res.status(500).json({ error: 'Failed to update tag' });
  }
}

async function handleDeleteTag(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Tag ID is required' });
  }

  try {
    const success = await tagService.deleteTag(id);
    if (!success) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    return res.status(200).json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Failed to delete tag' });
  }
}
