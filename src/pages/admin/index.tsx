import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { productService } from '../../lib/database/services/product-service';
import type { ProductWithVariants, SyncLog } from '../../lib/database/services/product-service';
import { getAdminToken, removeAdminToken } from '../../lib/auth';

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
  const [products, setProducts] = useState(initialProducts);
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<any>(null);

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

  const triggerMigration = async () => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    setIsMigrating(true);
    try {
      const response = await fetch('/api/admin/enhancements?action=migrate', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const results = await response.json();
        setMigrationResults(results);
        refreshData(); // Refresh to show new enhancements
      } else {
        console.error('Failed to trigger migration');
      }
    } catch (error) {
      console.error('Error triggering migration:', error);
    } finally {
      setIsMigrating(false);
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
                     <div className="flex justify-between items-center">
             <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
             <div className="flex space-x-4">
               <a
                 href="/admin/enhancements"
                 className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
               >
                 Manage Enhancements
               </a>
               <button
                 onClick={triggerMigration}
                 disabled={isMigrating}
                 className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
               >
                 {isMigrating ? 'Migrating...' : 'Migrate Enhancements'}
               </button>
               <button
                 onClick={triggerSync}
                 disabled={isSyncing}
                 className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
               >
                 {isSyncing ? 'Syncing...' : 'Sync Products'}
               </button>
               <button
                 onClick={handleLogout}
                 className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
               >
                 Logout
               </button>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Products ({products.length})</h2>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedProduct === product.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      } ${!product.isActive ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{product.name}</h3>
                          <p className="text-sm text-gray-500">ID: {product.printfulId}</p>
                          <p className="text-sm text-gray-500">Variants: {product.variants.length}</p>
                          {product.enhancement && (
                            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                              Enhanced
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProductVisibility(product.id);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Toggle
                          </button>
                        </div>
                      </div>
                      
                      {selectedProduct === product.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <strong>External ID:</strong> {product.externalId}
                            </div>
                            <div>
                              <strong>Category:</strong> {product.category || 'None'}
                            </div>
                            <div>
                              <strong>Created:</strong> {formatDate(product.createdAt)}
                            </div>
                            <div>
                              <strong>Last Synced:</strong> {formatDate(product.syncedAt)}
                            </div>
                          </div>
                          
                          {product.enhancement && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-900 mb-2">Enhancement</h4>
                              <div className="bg-gray-50 p-3 rounded space-y-3">
                                {product.enhancement.shortDescription && (
                                  <div>
                                    <strong className="text-sm text-gray-700">Short Description:</strong>
                                    <p className="text-sm text-gray-600 mt-1">{product.enhancement.shortDescription}</p>
                                  </div>
                                )}
                                {product.enhancement.description && (
                                  <div>
                                    <strong className="text-sm text-gray-700">Description:</strong>
                                    <p className="text-sm text-gray-600 mt-1">{product.enhancement.description}</p>
                                  </div>
                                )}
                                {product.enhancement.features && product.enhancement.features.length > 0 && (
                                  <div>
                                    <strong className="text-sm text-gray-700">Features:</strong>
                                    <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                                      {product.enhancement.features.map((feature, index) => (
                                        <li key={index}>{feature}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                                                 {product.enhancement.defaultVariantId && (
                                   <div>
                                     <strong className="text-sm text-gray-700">Default Variant ID:</strong>
                                     <p className="text-sm text-gray-600 mt-1">{product.enhancement.defaultVariantId}</p>
                                   </div>
                                 )}
                                 {product.enhancement.specifications && Object.keys(product.enhancement.specifications).length > 0 && (
                                   <div>
                                     <strong className="text-sm text-gray-700">Specifications:</strong>
                                     <div className="text-sm text-gray-600 mt-1">
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
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Syncs</h2>
                <div className="space-y-3">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-gray-200 pl-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{log.operation}</p>
                          <p className={`text-sm ${getStatusColor(log.status)}`}>
                            {log.status}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(log.startedAt)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Products: {log.productsCreated} created, {log.productsUpdated} updated, {log.productsDeleted} deleted</p>
                        <p>Variants: {log.variantsCreated} created, {log.variantsUpdated} updated, {log.variantsDeleted} deleted</p>
                        {log.duration && (
                          <p>Duration: {log.duration}ms</p>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="mt-1 text-xs text-red-600">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Migration Results */}
        {migrationResults && (
          <div className="mt-6 px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Migration Results</h2>
                
                <div className="mb-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-green-800 font-medium">Total</div>
                      <div className="text-green-600">{migrationResults.summary.total}</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="text-blue-800 font-medium">Migrated</div>
                      <div className="text-blue-600">{migrationResults.summary.migrated}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-yellow-800 font-medium">Skipped</div>
                      <div className="text-yellow-600">{migrationResults.summary.skipped}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-red-800 font-medium">Errors</div>
                      <div className="text-red-600">{migrationResults.summary.errors}</div>
                    </div>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {migrationResults.results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded text-sm ${
                          result.status === 'migrated'
                            ? 'bg-green-50 text-green-800'
                            : result.status === 'skipped'
                            ? 'bg-yellow-50 text-yellow-800'
                            : 'bg-red-50 text-red-800'
                        }`}
                      >
                        <div className="font-medium">{result.externalId}</div>
                        <div>{result.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const [products, syncLogs] = await Promise.all([
      productService.getAllProducts(),
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
