import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { productService } from '../../lib/database/services/product-service';
import type { ProductWithVariants, SyncLog } from '../../lib/database/services/product-service';

interface AdminDashboardProps {
  products: ProductWithVariants[];
  syncLogs: SyncLog[];
}

export default function AdminDashboard({ products: initialProducts, syncLogs: initialSyncLogs }: AdminDashboardProps) {
  const [products, setProducts] = useState(initialProducts);
  const [syncLogs, setSyncLogs] = useState(initialSyncLogs);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const triggerSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer your-admin-token', // Replace with proper auth
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
    try {
      const [productsResponse, syncLogsResponse] = await Promise.all([
        fetch('/api/admin/products?includeInactive=true', {
          headers: {
            'Authorization': 'Bearer your-admin-token', // Replace with proper auth
          },
        }),
        fetch('/api/admin/sync?limit=5', {
          headers: {
            'Authorization': 'Bearer your-admin-token', // Replace with proper auth
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
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer your-admin-token', // Replace with proper auth
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

  const formatDate = (date: Date) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md"
            >
              {isSyncing ? 'Syncing...' : 'Sync Products'}
            </button>
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
                              <div className="bg-gray-50 p-3 rounded">
                                <p className="text-sm text-gray-700">
                                  {product.enhancement.shortDescription || product.enhancement.description}
                                </p>
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

    return {
      props: {
        products,
        syncLogs,
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
