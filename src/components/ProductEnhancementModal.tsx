import { useState, useEffect } from 'react';
import type { ProductWithVariants } from '../lib/database/services/product-service';
import { getAdminToken } from '../lib/auth';

interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

interface CategoryManagerProps {
  product: ProductWithVariants;
  onUpdate: (product: ProductWithVariants) => void;
}

interface ProductEnhancementModalProps {
  product: ProductWithVariants;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdate: (product: ProductWithVariants) => void;
}

function CategoryManager({ product, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    product.categories?.map(cat => cat.id) || []
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryToggle = async (categoryId: string) => {
    const newSelectedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];

    setSelectedCategories(newSelectedCategories);
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryIds: newSelectedCategories
        }),
      });

      if (response.ok) {
        const updatedProduct = await response.json();
        onUpdate(updatedProduct);
      } else {
        // Revert on error
        setSelectedCategories(product.categories?.map(cat => cat.id) || []);
        alert('Failed to update categories');
      }
    } catch (error) {
      console.error('Error updating categories:', error);
      // Revert on error
      setSelectedCategories(product.categories?.map(cat => cat.id) || []);
      alert('Error updating categories');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        Select categories for this product:
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          return (
            <label
              key={category.id}
              className={`flex items-center p-2 rounded-md border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleCategoryToggle(category.id)}
                disabled={saving}
                className="mr-3"
              />
              <div className="flex items-center flex-1">
                {category.icon && (
                  <span className="mr-2 text-lg">{category.icon}</span>
                )}
                <span className="text-sm font-medium">{category.name}</span>
                {category.color && (
                  <div
                    className="ml-2 w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: category.color }}
                  />
                )}
              </div>
            </label>
          );
        })}
      </div>

      {saving && (
        <div className="text-sm text-blue-600">Saving...</div>
      )}

      {categories.length === 0 && (
        <div className="text-sm text-gray-500">
          No categories available. Create categories in the Categories section first.
        </div>
      )}
    </div>
  );
}

export default function ProductEnhancementModal({ 
  product: initialProduct, 
  isOpen, 
  onClose, 
  onProductUpdate 
}: ProductEnhancementModalProps) {
  const [product, setProduct] = useState<ProductWithVariants>(initialProduct);
  const [enhancement, setEnhancement] = useState({
    description: initialProduct.enhancement?.description || '',
    shortDescription: initialProduct.enhancement?.shortDescription || '',
    features: initialProduct.enhancement?.features || [],
    specifications: initialProduct.enhancement?.specifications || {},
    additionalImages: initialProduct.enhancement?.additionalImages || [],
    seo: initialProduct.enhancement?.seo || { keywords: [], metaDescription: '' },
    defaultVariantId: initialProduct.enhancement?.defaultVariantId || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Update local state when product prop changes
  useEffect(() => {
    setProduct(initialProduct);
    setEnhancement({
      description: initialProduct.enhancement?.description || '',
      shortDescription: initialProduct.enhancement?.shortDescription || '',
      features: initialProduct.enhancement?.features || [],
      specifications: initialProduct.enhancement?.specifications || {},
      additionalImages: initialProduct.enhancement?.additionalImages || [],
      seo: initialProduct.enhancement?.seo || { keywords: [], metaDescription: '' },
      defaultVariantId: initialProduct.enhancement?.defaultVariantId || '',
    });
  }, [initialProduct]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/products?id=${product.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAdminToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enhancement }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Enhancement saved successfully!' });
        // Refresh product data
        const refreshResponse = await fetch(`/api/admin/products?id=${product.id}`, {
          headers: {
            'Authorization': `Bearer ${getAdminToken()}`,
          },
        });
        if (refreshResponse.ok) {
          const updatedProduct = await refreshResponse.json();
          setProduct(updatedProduct);
          onProductUpdate(updatedProduct);
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to save enhancement' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving enhancement' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProductUpdate = (updatedProduct: ProductWithVariants) => {
    setProduct(updatedProduct);
    onProductUpdate(updatedProduct);
  };

  const addFeature = () => {
    setEnhancement(prev => ({
      ...prev,
      features: [...prev.features, ''],
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setEnhancement(prev => ({
      ...prev,
      features: prev.features.map((feature, i) => i === index ? value : feature),
    }));
  };

  const removeFeature = (index: number) => {
    setEnhancement(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const addSpecification = () => {
    setEnhancement(prev => ({
      ...prev,
      specifications: { ...prev.specifications, '': '' },
    }));
  };

  const updateSpecification = (key: string, value: string) => {
    setEnhancement(prev => ({
      ...prev,
      specifications: { ...prev.specifications, [key]: value },
    }));
  };

  const removeSpecification = (key: string) => {
    setEnhancement(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[key];
      return { ...prev, specifications: newSpecs };
    });
  };

  const addImage = () => {
    setEnhancement(prev => ({
      ...prev,
      additionalImages: [...prev.additionalImages, { url: '', alt: '', caption: '' }],
    }));
  };

  const updateImage = (index: number, field: 'url' | 'alt' | 'caption', value: string) => {
    setEnhancement(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.map((image, i) => 
        i === index ? { ...image, [field]: value } : image
      ),
    }));
  };

  const removeImage = (index: number) => {
    setEnhancement(prev => ({
      ...prev,
      additionalImages: prev.additionalImages.filter((_, i) => i !== index),
    }));
  };

  const addKeyword = () => {
    setEnhancement(prev => ({
      ...prev,
      seo: { ...prev.seo, keywords: [...prev.seo.keywords, ''] },
    }));
  };

  const updateKeyword = (index: number, value: string) => {
    setEnhancement(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.map((keyword, i) => i === index ? value : keyword),
      },
    }));
  };

  const removeKeyword = (index: number) => {
    setEnhancement(prev => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((_, i) => i !== index),
      },
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600">Product Enhancement Editor</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {isSaving ? 'Saving...' : 'Save Enhancement'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-md border border-gray-300"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* Top Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Product Information</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>Printful ID:</strong> {product.printfulId}
                  </div>
                  <div>
                    <strong>External ID:</strong> {product.externalId}
                  </div>
                  <div>
                    <strong>Categories:</strong> {product.categories && product.categories.length > 0 
                      ? product.categories.map(cat => cat.name).join(', ')
                      : 'None'
                    }
                  </div>
                  <div>
                    <strong>Variants:</strong> {product.variants?.length || 0}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <span className={`ml-2 ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Management */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Category Management</h2>
                <CategoryManager product={product} onUpdate={handleProductUpdate} />
              </div>

              {/* Default Variant */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Default Variant</h2>
                <select
                  value={enhancement.defaultVariantId}
                  onChange={(e) => setEnhancement(prev => ({ ...prev, defaultVariantId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select default variant</option>
                  {product.variants?.map((variant) => (
                    <option key={variant.id} value={variant.externalId}>
                      {variant.name} - {variant.color} {variant.size}
                    </option>
                  )) || []}
                </select>
              </div>
            </div>

            {/* Enhancement Form */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Enhancement</h2>
              
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={enhancement.description}
                    onChange={(e) => setEnhancement(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter product description..."
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  <textarea
                    value={enhancement.shortDescription}
                    onChange={(e) => setEnhancement(prev => ({ ...prev, shortDescription: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter short description..."
                  />
                </div>

                {/* Features */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Features
                    </label>
                    <button
                      onClick={addFeature}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {enhancement.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Enter feature..."
                        />
                        <button
                          onClick={() => removeFeature(index)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Specifications
                    </label>
                    <button
                      onClick={addSpecification}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Specification
                    </button>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(enhancement.specifications).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => {
                            const newSpecs = { ...enhancement.specifications };
                            delete newSpecs[key];
                            newSpecs[e.target.value] = value;
                            setEnhancement(prev => ({ ...prev, specifications: newSpecs }));
                          }}
                          className="w-1/3 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Specification name..."
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateSpecification(key, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                          placeholder="Specification value..."
                        />
                        <button
                          onClick={() => removeSpecification(key)}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Images */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Additional Images
                    </label>
                    <button
                      onClick={addImage}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Image
                    </button>
                  </div>
                  <div className="space-y-4">
                    {enhancement.additionalImages.map((image, index) => (
                      <div key={index} className="border border-gray-200 rounded-md p-4">
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            value={image.url}
                            onChange={(e) => updateImage(index, 'url', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Image URL..."
                          />
                          <input
                            type="text"
                            value={image.alt}
                            onChange={(e) => updateImage(index, 'alt', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Alt text..."
                          />
                          <input
                            type="text"
                            value={image.caption}
                            onChange={(e) => updateImage(index, 'caption', e.target.value)}
                            className="border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Caption..."
                          />
                        </div>
                        <button
                          onClick={() => removeImage(index)}
                          className="mt-2 text-red-600 hover:text-red-800"
                        >
                          Remove Image
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SEO */}
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-2">SEO</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      value={enhancement.seo.metaDescription}
                      onChange={(e) => setEnhancement(prev => ({
                        ...prev,
                        seo: { ...prev.seo, metaDescription: e.target.value }
                      }))}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter meta description..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Keywords
                      </label>
                      <button
                        onClick={addKeyword}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Keyword
                      </button>
                    </div>
                    <div className="space-y-2">
                      {enhancement.seo.keywords.map((keyword, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={keyword}
                            onChange={(e) => updateKeyword(index, e.target.value)}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Enter keyword..."
                          />
                          <button
                            onClick={() => removeKeyword(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
