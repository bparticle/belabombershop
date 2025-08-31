import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import type { ProductWithVariants } from '../../lib/database/services/product-service';
import { getAdminToken, removeAdminToken } from '../../lib/auth';

interface EnhancementPageProps {
  products: ProductWithVariants[];
}

export default function EnhancementPage({ products: initialProducts }: EnhancementPageProps) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [editingEnhancement, setEditingEnhancement] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleEditEnhancement = (product: ProductWithVariants) => {
    setSelectedProduct(product.id);
    setEditingEnhancement({
      productId: product.id,
      description: product.enhancement?.description || '',
      shortDescription: product.enhancement?.shortDescription || '',
      features: product.enhancement?.features || [],
      specifications: product.enhancement?.specifications || {},
      additionalImages: product.enhancement?.additionalImages || [],
      seo: product.enhancement?.seo || { keywords: [], metaDescription: '' },
      defaultVariantId: product.enhancement?.defaultVariantId || '',
    });
  };

  const handleSaveEnhancement = async () => {
    if (!editingEnhancement) return;

    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/enhancements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingEnhancement),
      });

      if (response.ok) {
        // Refresh the products list
        const productsResponse = await fetch('/api/admin/products?includeInactive=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          setProducts(productsData.products);
        }

        setEditingEnhancement(null);
        setSelectedProduct(null);
      } else {
        console.error('Failed to save enhancement');
      }
    } catch (error) {
      console.error('Error saving enhancement:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addFeature = () => {
    setEditingEnhancement({
      ...editingEnhancement,
      features: [...(editingEnhancement.features || []), ''],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(editingEnhancement.features || [])];
    newFeatures[index] = value;
    setEditingEnhancement({
      ...editingEnhancement,
      features: newFeatures,
    });
  };

  const removeFeature = (index: number) => {
    const newFeatures = editingEnhancement.features.filter((_: any, i: number) => i !== index);
    setEditingEnhancement({
      ...editingEnhancement,
      features: newFeatures,
    });
  };

  // Additional Images functions
  const addAdditionalImage = () => {
    setEditingEnhancement({
      ...editingEnhancement,
      additionalImages: [...(editingEnhancement.additionalImages || []), { url: '', alt: '', caption: '' }],
    });
  };

  const updateAdditionalImage = (index: number, field: string, value: string) => {
    const newImages = [...(editingEnhancement.additionalImages || [])];
    newImages[index] = { ...newImages[index], [field]: value };
    setEditingEnhancement({
      ...editingEnhancement,
      additionalImages: newImages,
    });
  };

  const removeAdditionalImage = (index: number) => {
    const newImages = editingEnhancement.additionalImages.filter((_: any, i: number) => i !== index);
    setEditingEnhancement({
      ...editingEnhancement,
      additionalImages: newImages,
    });
  };

  // Specifications functions
  const addSpecification = () => {
    setEditingEnhancement({
      ...editingEnhancement,
      specifications: { ...(editingEnhancement.specifications || {}), '': '' },
    });
  };

  const updateSpecification = (oldKey: string, newKey: string, value: string) => {
    const newSpecs = { ...(editingEnhancement.specifications || {}) };
    if (oldKey !== newKey) {
      delete newSpecs[oldKey];
    }
    newSpecs[newKey] = value;
    setEditingEnhancement({
      ...editingEnhancement,
      specifications: newSpecs,
    });
  };

  const removeSpecification = (key: string) => {
    const newSpecs = { ...(editingEnhancement.specifications || {}) };
    delete newSpecs[key];
    setEditingEnhancement({
      ...editingEnhancement,
      specifications: newSpecs,
    });
  };

  const handleLogout = () => {
    removeAdminToken();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
                     <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-gray-900">Product Enhancements</h1>
             <div className="flex space-x-2">
               <a
                 href="/admin"
                 className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
               >
                 Back to Admin
               </a>
               <button
                 onClick={handleLogout}
                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
               >
                 Logout
               </button>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Products List */}
          <div>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Products</h2>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProduct === product.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleEditEnhancement(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">ID: {product.printfulId}</p>
                          <p className="text-sm text-gray-500">External ID: {product.externalId}</p>
                          {product.enhancement ? (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                              Enhanced
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mt-1">
                              No Enhancement
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Enhancement Editor */}
          <div>
            {editingEnhancement ? (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Enhancement</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Short Description</label>
                      <textarea
                        value={editingEnhancement.shortDescription}
                        onChange={(e) => setEditingEnhancement({
                          ...editingEnhancement,
                          shortDescription: e.target.value
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        value={editingEnhancement.description}
                        onChange={(e) => setEditingEnhancement({
                          ...editingEnhancement,
                          description: e.target.value
                        })}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        rows={5}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Features</label>
                      <div className="space-y-2">
                        {editingEnhancement.features?.map((feature: string, index: number) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={feature}
                              onChange={(e) => updateFeature(index, e.target.value)}
                              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                              onClick={() => removeFeature(index)}
                              className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={addFeature}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          Add Feature
                        </button>
                      </div>
                    </div>

                                         <div>
                       <label className="block text-sm font-medium text-gray-700">Default Variant ID</label>
                       <input
                         type="text"
                         value={editingEnhancement.defaultVariantId}
                         onChange={(e) => setEditingEnhancement({
                           ...editingEnhancement,
                           defaultVariantId: e.target.value
                         })}
                         className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                       />
                     </div>

                     {/* Additional Images */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Additional Images</label>
                       <div className="space-y-3">
                         {editingEnhancement.additionalImages?.map((image: any, index: number) => (
                           <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
                             <div className="flex justify-between items-center">
                               <span className="text-sm font-medium text-gray-600">Image {index + 1}</span>
                               <button
                                 onClick={() => removeAdditionalImage(index)}
                                 className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                               >
                                 Remove
                               </button>
                             </div>
                             <div className="grid grid-cols-1 gap-2">
                                                               <input
                                  type="text"
                                  placeholder="Filename (e.g., product-image.jpg)"
                                  value={image.url ? image.url.replace('/images/products/', '') : ''}
                                  onChange={(e) => updateAdditionalImage(index, 'url', `/images/products/${e.target.value}`)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                                />
                               <input
                                 type="text"
                                 placeholder="Alt text"
                                 value={image.alt || ''}
                                 onChange={(e) => updateAdditionalImage(index, 'alt', e.target.value)}
                                 className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                               />
                               <input
                                 type="text"
                                 placeholder="Caption (optional)"
                                 value={image.caption || ''}
                                 onChange={(e) => updateAdditionalImage(index, 'caption', e.target.value)}
                                 className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                               />
                             </div>
                           </div>
                         ))}
                         <button
                           onClick={addAdditionalImage}
                           className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                         >
                           Add Image
                         </button>
                       </div>
                     </div>

                     {/* Specifications */}
                     <div>
                       <label className="block text-sm font-medium text-gray-700">Specifications</label>
                       <div className="space-y-3">
                         {Object.entries(editingEnhancement.specifications || {}).map(([key, value], index) => (
                           <div key={index} className="flex space-x-2">
                             <input
                               type="text"
                               placeholder="Specification name (e.g., material)"
                               value={key}
                               onChange={(e) => updateSpecification(key, e.target.value, value as string)}
                               className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                             />
                             <input
                               type="text"
                               placeholder="Value (e.g., 100% Cotton)"
                               value={value as string}
                               onChange={(e) => updateSpecification(key, key, e.target.value)}
                               className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                             />
                             <button
                               onClick={() => removeSpecification(key)}
                               className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
                             >
                               Remove
                             </button>
                           </div>
                         ))}
                         <button
                           onClick={addSpecification}
                           className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                         >
                           Add Specification
                         </button>
                       </div>
                     </div>

                     <div className="flex space-x-4 pt-4">
                      <button
                        onClick={handleSaveEnhancement}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
                      >
                        {isSaving ? 'Saving...' : 'Save Enhancement'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingEnhancement(null);
                          setSelectedProduct(null);
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Enhancement Editor</h2>
                  <p className="text-gray-500">Select a product from the list to edit its enhancement.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Import productService only on server side
    const { productService } = await import('../../lib/database/services/product-service');
    
    const products = await productService.getAllProducts();

    // Convert Date objects to ISO strings for JSON serialization
    const serializedProducts = products.map(product => ({
      ...product,
      syncedAt: product.syncedAt?.toISOString() || null,
      createdAt: product.createdAt?.toISOString() || null,
      updatedAt: product.updatedAt?.toISOString() || null,
      variants: product.variants.map(variant => ({
        ...variant,
        syncedAt: variant.syncedAt?.toISOString() || null,
        createdAt: variant.createdAt?.toISOString() || null,
        updatedAt: variant.updatedAt?.toISOString() || null,
      })),
      enhancement: product.enhancement ? {
        ...product.enhancement,
        createdAt: product.enhancement.createdAt?.toISOString() || null,
        updatedAt: product.enhancement.updatedAt?.toISOString() || null,
      } : null,
    }));

    return {
      props: {
        products: serializedProducts,
      },
    };
  } catch (error) {
    console.error('Error fetching enhancement data:', error);
    return {
      props: {
        products: [],
      },
    };
  }
};
