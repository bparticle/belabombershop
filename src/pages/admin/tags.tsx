import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { getAdminToken, removeAdminToken } from '../../lib/auth';
import { useTheme } from '../../context/theme';
import ThemeToggle from '../../components/ThemeToggle';

interface Tag {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  productCount?: number;
}

export default function TagsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'usageCount' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#3B82F6',
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  // Load tags
  useEffect(() => {
    loadTags();
  }, [sortBy, sortOrder]);

  const loadTags = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const params = new URLSearchParams({
        sortBy,
        sortOrder,
        withStats: 'true',
      });

      const response = await fetch(`/api/admin/tags?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTags();
      return;
    }

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`/api/admin/tags?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTags(data.tags);
      }
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const handleCreateTag = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: '',
          description: '',
          slug: '',
          color: '#3B82F6',
        });
        loadTags();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error creating tag:', error);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag) return;

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`/api/admin/tags?id=${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingTag(null);
        setFormData({
          name: '',
          description: '',
          slug: '',
          color: '#3B82F6',
        });
        loadTags();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error updating tag:', error);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag?')) return;

    try {
      const token = getAdminToken();
      if (!token) return;

      const response = await fetch(`/api/admin/tags?id=${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadTags();
      } else {
        const error = await response.json();
        alert(error.error);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  };

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      description: tag.description || '',
      slug: tag.slug,
      color: tag.color || '#3B82F6',
    });
  };

  const handleLogout = () => {
    removeAdminToken();
    router.push('/admin/login');
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const getUsageColor = (count: number) => {
    if (count === 0) return 'text-gray-400';
    if (count <= 5) return 'text-blue-600';
    if (count <= 20) return 'text-green-600';
    return 'text-purple-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-gray-900 dark:text-white">Loading tags...</div>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tag Management</h1>
            <div className="flex space-x-2">
              <ThemeToggle />
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Add Tag
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

        {/* Search and Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Search tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-r-md transition-colors"
                    >
                      Search
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'name' | 'usageCount' | 'createdAt')}
                    className="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  >
                    <option value="name">Name</option>
                    <option value="usageCount">Usage</option>
                    <option value="createdAt">Created</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                    className="border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  >
                    <option value="asc">Asc</option>
                    <option value="desc">Desc</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags List */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Tags ({tags.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      !tag.isActive ? 'opacity-60' : ''
                    } border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <h3 className="font-medium text-gray-900 dark:text-white">{tag.name}</h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">#{tag.slug}</p>
                        {tag.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{tag.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-3">
                          <span className={`text-sm font-medium ${getUsageColor(tag.usageCount)}`}>
                            {tag.usageCount} products
                          </span>
                          {!tag.isActive && (
                            <span className="inline-block bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs px-2 py-1 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditTag(tag)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTag(tag.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {tags.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No tags found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create/Edit Tag Modal */}
        {(showCreateForm || editingTag) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md transition-colors duration-200">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {editingTag ? 'Edit Tag' : 'Create Tag'}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors duration-200"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  {editingTag ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTag(null);
                    setFormData({
                      name: '',
                      description: '',
                      slug: '',
                      color: '#3B82F6',
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
