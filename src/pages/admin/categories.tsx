import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getAdminToken, removeAdminToken } from '../../lib/auth';
import { useTheme } from '../../context/theme';
import ThemeToggle from '../../components/ThemeToggle';

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
  children?: Category[];
  productCount?: number;
}

interface CategoryMappingRule {
  id: string;
  categoryId: string;
  ruleType: 'name_keyword' | 'tag_keyword' | 'metadata_key';
  ruleValue: string;
  priority: number;
  isActive: boolean;
}

export default function CategoriesPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingRules, setEditingRules] = useState<CategoryMappingRule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#3B82F6',
    icon: '',
    parentId: '',
    sortOrder: 0,
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch('/api/admin/categories?tree=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          slug: '',
          color: '#3B82F6',
          icon: '',
          parentId: '',
          sortOrder: 0,
        });
        loadCategories();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`/api/admin/categories?id=${editingCategory.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
        }),
      });

      if (response.ok) {
        setEditingCategory(null);
        setFormData({
          name: '',
          description: '',
          slug: '',
          color: '#3B82F6',
          icon: '',
          parentId: '',
          sortOrder: 0,
        });
        loadCategories();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`/api/admin/categories?id=${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadCategories();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      color: category.color || '#3B82F6',
      icon: category.icon || '',
      parentId: category.parentId || '',
      sortOrder: category.sortOrder,
    });
  };

  const handleLogout = () => {
    removeAdminToken();
    router.push('/admin/login');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const renderCategoryTree = (categoryList: Category[], level = 0) => {
    return categoryList.map((category) => (
      <div key={category.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className={`border rounded-lg p-4 mb-2 transition-colors ${
          selectedCategory === category.id 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } ${!category.isActive ? 'opacity-60' : ''}`}>
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">/{category.slug}</p>
                {category.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{category.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  {category.isSystem && (
                    <span className="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 text-xs px-2 py-1 rounded">
                      System
                    </span>
                  )}
                  {category.productCount !== undefined && (
                    <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded">
                      {category.productCount} products
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleEditCategory(category)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Edit
              </button>
              {!category.isSystem && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
        {category.children && category.children.length > 0 && (
          renderCategoryTree(category.children, level + 1)
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-900 dark:text-white">Loading categories...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Category Management</h1>
            <div className="flex space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Add Category
              </button>
              <a
                href="/admin"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Back to Admin
              </a>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Categories ({categories.length})</h2>
              <div className="space-y-2">
                {renderCategoryTree(categories)}
              </div>
            </div>
          </div>
        </div>

        {/* Create/Edit Category Modal */}
        {(showCreateForm || editingCategory) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Icon (emoji)</label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCategory(null);
                    setFormData({
                      name: '',
                      description: '',
                      slug: '',
                      color: '#3B82F6',
                      icon: '',
                      parentId: '',
                      sortOrder: 0,
                    });
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    props: {},
  };
};
