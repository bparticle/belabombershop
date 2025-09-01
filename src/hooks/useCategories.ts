import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  icon?: string;
  parentId?: string | null;
  sortOrder: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseCategoriesOptions {
  includeInactive?: boolean;
  includeSystem?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (options.includeInactive) params.append('includeInactive', 'true');
        if (options.includeSystem) params.append('includeSystem', 'true');

        const response = await fetch(`/api/categories?${params.toString()}`, {
          // Add caching headers for better performance
          headers: {
            'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        
        if (!isCancelled) {
          setCategories(data.categories || []);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          console.error('Error fetching categories:', err);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isCancelled = true;
    };
  }, [options.includeInactive, options.includeSystem]);

  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  };

  const getCategoryBySlug = (slug: string): Category | undefined => {
    return categories.find(cat => cat.slug === slug);
  };

  return {
    categories,
    loading,
    error,
    getCategoryById,
    getCategoryBySlug,
  };
}
