import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import type { ProductWithVariants } from '../../lib/database/services/product-service';
import type { SyncLog } from '../../lib/database/schema';
import { getAdminToken, removeAdminToken } from '../../lib/auth';
import { useTheme } from '../../context/theme';
import ThemeToggle from '../../components/ThemeToggle';

// Types for serialized data from getServerSideProps
type SerializedProductWithVariants = Omit<ProductWithVariants, 'syncedAt' | 'createdAt' | 'updatedAt'> & {
  syncedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  variants: Array<Omit<ProductWithVariants['variants'][0], 'syncedAt' | 'createdAt' | 'updatedAt'> & {
    syncedAt: string | null;
    createdAt: string | null;
    updatedAt: string | null;
  }>;
  enhancement: Omit<ProductWithVariants['enhancement'], 'createdAt' | 'updatedAt'> & {
    createdAt: string | null;
    updatedAt: string | null;
  } | null;
};

type SerializedSyncLog = Omit<SyncLog, 'startedAt' | 'completedAt'> & {
  startedAt: string | null;
  completedAt: string | null;
};

interface AdminDashboardProps {
  products: SerializedProductWithVariants[];
  syncLogs: SerializedSyncLog[];
}

export default function AdminDashboard({ products: initialProducts, syncLogs: initialSyncLogs }: AdminDashboardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [products, setProducts] = useState(initialProducts);
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Check authentication on component mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  const triggerSync = async () => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Poll for sync completion
        setTimeout(() => {
          refreshData();
        }, 5000);
      } else {
        console.error('Failed to trigger sync');
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

    const refreshData = async () => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const [productsResponse, syncLogsResponse] = await Promise.all([
        fetch('/api/admin/products?includeInactive=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/admin/sync?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products);
      }

      if (syncLogsResponse.ok) {
        const syncLogsData = await syncLogsResponse.json();
        setSyncLogs(syncLogsData.syncLogs);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  const toggleProductVisibility = async (productId: string) => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }), // This will toggle the current state
      });

      if (response.ok) {
        refreshData();
      }
    } catch (error) {
      console.error('Error toggling product visibility:', error);
    }
  };



  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleLogout = () => {
    removeAdminToken();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
            <div className="flex space-x-4">
              <ThemeToggle />
              <a
                href="/admin/enhancements"
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Manage Enhancements
              </a>
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Sync Products'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Products ({products.length})</h2>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProduct === product.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      } ${!product.isActive ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Product Thumbnail */}
                        <div className="flex-shrink-0">
                          {product.variants.length > 0 && 
                           product.variants[0].files && 
                           product.variants[0].files.length > 0 && 
                           product.variants[0].files[0].preview_url ? (
                            <img
                              src={product.variants[0].files[0].preview_url}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                              <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {product.printfulId}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Variants: {product.variants.length}</p>
                              {product.enhancement && (
                                <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-xs px-2 py-1 rounded mt-1">
                                  Enhanced
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${product.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductVisibility(product.id);
                                }}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              >
                                Toggle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedProduct === product.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong className="text-gray-900 dark:text-white">External ID:</strong> <span className="text-gray-600 dark:text-gray-300">{product.externalId}</span>
                            </div>
                            <div>
                              <strong className="text-gray-900 dark:text-white">Category:</strong> <span className="text-gray-600 dark:text-gray-300">{product.category || 'None'}</span>
                            </div>
                            <div>
                              <strong className="text-gray-900 dark:text-white">Created:</strong> <span className="text-gray-600 dark:text-gray-300">{formatDate(product.createdAt)}</span>
                            </div>
                            <div>
                              <strong className="text-gray-900 dark:text-white">Last Synced:</strong> <span className="text-gray-600 dark:text-gray-300">{formatDate(product.syncedAt)}</span>
                            </div>
                          </div>
                          
                          {product.enhancement && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Enhancement</h4>
                              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded space-y-3">
                                                                {product.enhancement.shortDescription && (
                                  <div>
                                    <strong className="text-sm text-gray-700 dark:text-gray-300">Short Description:</strong>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.enhancement.shortDescription}</p>
                                  </div>
                                )}
                                {product.enhancement.description && (
                                  <div>
                                    <strong className="text-sm text-gray-700 dark:text-gray-300">Description:</strong>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.enhancement.description}</p>
                                  </div>
                                )}
                                {product.enhancement.features && product.enhancement.features.length > 0 && (
                                  <div>
                                    <strong className="text-sm text-gray-700 dark:text-gray-300">Features:</strong>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 mt-1 list-disc list-inside">
                                      {product.enhancement.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                 {product.enhancement.defaultVariantId && (
                                   <div>
                                     <strong className="text-sm text-gray-700 dark:text-gray-300">Default Variant ID:</strong>
                                     <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{product.enhancement.defaultVariantId}</p>
                                   </div>
                                 )}
                                 {product.enhancement.specifications && Object.keys(product.enhancement.specifications).length > 0 && (
                                   <div>
                                     <strong className="text-sm text-gray-700 dark:text-gray-300">Specifications:</strong>
                                     <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                       {Object.entries(product.enhancement.specifications).map(([key, value]) => (
                                         <div key={key} className="flex justify-between">
                                           <span className="font-medium">{key}:</span>
                                           <span>{value as string}</span>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                                 {product.enhancement.additionalImages && product.enhancement.additionalImages.length > 0 && (
                                   <div>
                                     <strong className="text-sm text-gray-700">Additional Images:</strong>
                                     <div className="text-sm text-gray-600 mt-1 space-y-1">
                                       {product.enhancement.additionalImages.map((image: any, index: number) => (
                                         <div key={index} className="flex items-center space-x-2">
                                           <span className="text-xs bg-gray-100 px-2 py-1 rounded">Image {index + 1}</span>
                                           <span className="truncate">{image.url}</span>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sync Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Syncs</h2>
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-200 dark:border-gray-700 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{log.operation}</p>
                          <p className={`text-sm ${getStatusColor(log.status)}`}>
                            {log.status}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(log.startedAt)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <p>Products: {log.productsCreated} created, {log.productsUpdated} updated, {log.productsDeleted} deleted</p>
                        <p>Variants: {log.variantsCreated} created, {log.variantsUpdated} updated, {log.variantsDeleted} deleted</p>
                        {log.duration && (
                          <p>Duration: {log.duration}ms</p>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
    
    const [products, syncLogs] = await Promise.all([
      productService.getAllProductsForAdmin(),
      productService.getRecentSyncLogs(5),
    ]);

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

    const serializedSyncLogs = syncLogs.map(log => ({
      ...log,
      startedAt: log.startedAt?.toISOString() || null,
      completedAt: log.completedAt?.toISOString() || null,
    }));

    return {
      props: {
        products: serializedProducts,
        syncLogs: serializedSyncLogs,
      },
    };
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return {
      props: {
        products: [],
        syncLogs: [],
      },
    };
  }
};
