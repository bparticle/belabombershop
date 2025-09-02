import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import type { ProductWithVariants } from '../../lib/database/services/product-service';
import type { SyncLog } from '../../lib/database/schema';
import { getAdminToken, removeAdminToken } from '../../lib/auth';
import { useTheme } from '../../context/theme';
import ThemeToggle from '../../components/ThemeToggle';
import ProductEnhancementModal from '../../components/ProductEnhancementModal';
import SyncProgressBar from '../../components/SyncProgressBar';
import ToggleSwitch from '../../components/ToggleSwitch';
import { formatDate } from '../../lib/date-utils';
import { getProductThumbnail, getProductIndicators } from '../../lib/admin-utils';
import { useSyncProgress } from '../../hooks/useSyncProgress';

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

type SerializedSyncLog = Omit<SyncLog, 'startedAt' | 'completedAt' | 'lastUpdated'> & {
  startedAt: string | null;
  completedAt: string | null;
  lastUpdated: string | null;
};

interface AdminDashboardProps {
  products: SerializedProductWithVariants[];
  syncLogs: SerializedSyncLog[];
}

export default function AdminDashboard({ products: initialProducts, syncLogs: initialSyncLogs }: AdminDashboardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<ProductWithVariants | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshingProducts, setIsRefreshingProducts] = useState(false);
  const [showCompletedSync, setShowCompletedSync] = useState(false);

  // Enhanced sync progress management
  const {
    activeSyncLog,
    recentSyncLogs,
    isLoading: isSyncLoading,
    error: syncError,
    triggerSync,
    cancelSync,
    refresh: refreshSyncData,
    startPolling,
    stopPolling,
  } = useSyncProgress({
    activePollInterval: 2000, // Poll every 2 seconds during active sync
    inactivePollInterval: 10000, // Poll every 10 seconds when inactive
    maxRecentLogs: 5,
    autoStart: false, // Don't auto-start polling, only poll when manually triggered
  });

  // Determine if there's an active sync
  const hasActiveSync = activeSyncLog && ['queued', 'fetching_products', 'processing_products', 'finalizing'].includes(activeSyncLog.status);
  const hasCompletedSync = activeSyncLog && ['success', 'error', 'partial', 'cancelled'].includes(activeSyncLog.status);
  const shouldShowSyncProgress = hasActiveSync || (hasCompletedSync && showCompletedSync);
  const isSyncing = hasActiveSync || isSyncLoading;

  // Check authentication on component mount
  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
    }
  }, [router]);

  // Auto-refresh product data when sync completes
  useEffect(() => {
    if (!activeSyncLog) return;
    
    const isCompleted = ['success', 'error', 'partial', 'cancelled'].includes(activeSyncLog.status);
    
    // Stop polling when sync completes
    if (isCompleted) {
      console.log(`🏁 Sync completed with status: ${activeSyncLog.status}, stopping polling...`);
      stopPolling();
      
      // Show completed sync status for different durations based on status
      const displayDuration = activeSyncLog.status === 'cancelled' ? 2000 : 4000;
      setShowCompletedSync(true);
      
      const hideTimeoutId = setTimeout(() => {
        setShowCompletedSync(false);
      }, displayDuration);
      
      // Only refresh if sync completed successfully with product changes
      if (activeSyncLog.status === 'success' && (
          (activeSyncLog.productsCreated && activeSyncLog.productsCreated > 0) ||
          (activeSyncLog.productsUpdated && activeSyncLog.productsUpdated > 0) ||
          (activeSyncLog.productsDeleted && activeSyncLog.productsDeleted > 0))) {
        // Small delay to ensure database updates are complete
        const refreshTimeoutId = setTimeout(async () => {
          console.log('🔄 Sync completed with product changes, refreshing data...');
          setIsRefreshingProducts(true);
          try {
            await refreshData();
          } catch (error) {
            console.error('Error refreshing data:', error);
          } finally {
            setIsRefreshingProducts(false);
          }
        }, 1500); // Slightly longer delay for database consistency
        
        return () => {
          clearTimeout(hideTimeoutId);
          clearTimeout(refreshTimeoutId);
        };
      }
      
      return () => clearTimeout(hideTimeoutId);
    }
  }, [activeSyncLog?.status, activeSyncLog?.productsCreated, activeSyncLog?.productsUpdated, activeSyncLog?.productsDeleted, stopPolling]);

  const handleTriggerSync = async () => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    // Clear any existing completed sync display when starting a new sync
    setShowCompletedSync(false);
    
    const result = await triggerSync();
    if (result.error) {
      console.error('Failed to trigger sync:', result.error);
      // Show error to user - you might want to add a toast notification here
    } else {
      console.log('Sync started successfully:', result.syncLogId);
      // Start polling to monitor the sync progress
      startPolling();
      // Note: refreshData() will be called automatically when sync completes
      // via the useEffect that watches for sync completion
    }
  };

  const handleCancelSync = async () => {
    if (!activeSyncLog) return;
    
    console.log('🔄 Cancelling sync:', activeSyncLog.id);
    const result = await cancelSync(activeSyncLog.id);
    if (result.error) {
      console.error('❌ Failed to cancel sync:', result.error);
    } else {
      console.log('✅ Sync cancelled successfully');
      // Force stop polling and clear completed sync display
      stopPolling();
      setShowCompletedSync(true);
      
      // Hide the completed sync display after a short delay
      setTimeout(() => {
        setShowCompletedSync(false);
      }, 3000);
    }
  };

  const refreshData = async () => {
    const token = getAdminToken();
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const productsResponse = await fetch('/api/admin/products?includeInactive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products);
      }

      // Refresh sync data through the hook
      await refreshSyncData();
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

    // Optimistically update the UI
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === productId 
          ? { ...product, isActive: !product.isActive }
          : product
      )
    );

    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: true }), // Any boolean value triggers the toggle
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Product visibility toggled successfully:', result);
        // Refresh data to ensure consistency
        refreshData();
      } else {
        const errorData = await response.json();
        console.error('Failed to toggle product visibility:', response.status, errorData);
        // Revert optimistic update on error
        setProducts(prevProducts => 
          prevProducts.map(product => 
            product.id === productId 
              ? { ...product, isActive: !product.isActive }
              : product
          )
        );
      }
    } catch (error) {
      console.error('Error toggling product visibility:', error);
      // Revert optimistic update on error
      setProducts(prevProducts => 
        prevProducts.map(product => 
          product.id === productId 
            ? { ...product, isActive: !product.isActive }
            : product
        )
      );
    }
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

  const openProductModal = (product: SerializedProductWithVariants) => {
    // Convert serialized product back to ProductWithVariants
    const deserializedProduct: ProductWithVariants = {
      ...product,
      syncedAt: product.syncedAt ? new Date(product.syncedAt) : null,
      createdAt: product.createdAt ? new Date(product.createdAt) : null,
      updatedAt: product.updatedAt ? new Date(product.updatedAt) : null,
      variants: product.variants.map(variant => ({
        ...variant,
        syncedAt: variant.syncedAt ? new Date(variant.syncedAt) : null,
        createdAt: variant.createdAt ? new Date(variant.createdAt) : null,
        updatedAt: variant.updatedAt ? new Date(variant.updatedAt) : null,
      })),
      enhancement: product.enhancement ? {
        ...product.enhancement,
        createdAt: product.enhancement.createdAt ? new Date(product.enhancement.createdAt) : null,
        updatedAt: product.enhancement.updatedAt ? new Date(product.enhancement.updatedAt) : null,
      } : undefined,
    };
    setModalProduct(deserializedProduct);
    setIsModalOpen(true);
  };

  const handleProductUpdate = (updatedProduct: ProductWithVariants) => {
    // Update the products in state without triggering sync refresh
    setProducts(prevProducts => 
      prevProducts.map(p => 
        p.id === updatedProduct.id ? 
        {
          ...p,
          enhancement: updatedProduct.enhancement ? {
            ...updatedProduct.enhancement,
            createdAt: updatedProduct.enhancement.createdAt?.toISOString() || null,
            updatedAt: updatedProduct.enhancement.updatedAt?.toISOString() || null,
          } : null
        } as SerializedProductWithVariants : p
      )
    );
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
                href="/admin/categories"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Manage Categories
              </a>
              <a
                href="/admin/tags"
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Manage Tags
              </a>

              <div className="flex space-x-2">
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors flex items-center space-x-2"
                >
                  {isSyncing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Syncing...</span>
                    </>
                  ) : (
                    <span>Sync Products</span>
                  )}
                </button>
                
                {hasActiveSync && (
                  <button
                    onClick={handleCancelSync}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                    title="Cancel sync"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Sync Progress Display */}
        {shouldShowSyncProgress && (
          <div className="mb-6">
            <SyncProgressBar 
              syncLog={activeSyncLog} 
              isActive={shouldShowSyncProgress}
              className="shadow-lg"
            />
          </div>
        )}

        {/* Error Display */}
        {syncError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <span className="text-red-600 dark:text-red-400">❌</span>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                  Sync Error
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {syncError}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Products ({products.length})
                  </h2>
                  {isRefreshingProducts && (
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Default variant set</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Main product image</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${selectedProduct === product.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        } ${!product.isActive ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Product Thumbnail */}
                        <div className="flex-shrink-0 relative">
                          {(() => {
                            const thumbnailUrl = getProductThumbnail(product);
                            const indicators = getProductIndicators(product);

                            return thumbnailUrl ? (
                              <div className="relative">
                                <img
                                  src={thumbnailUrl}
                                  alt={product.name}
                                  className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                                />
                                {/* Indicator badges */}
                                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                  {indicators.hasDefaultVariant && (
                                    <div
                                      className="w-3 h-3 bg-green-500 rounded-full border border-white dark:border-gray-800"
                                      title="Has default variant set"
                                    />
                                  )}
                                  {indicators.hasMainImage && (
                                    <div
                                      className="w-3 h-3 bg-blue-500 rounded-full border border-white dark:border-gray-800"
                                      title="Has main product image"
                                    />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">No Image</span>
                              </div>
                            );
                          })()}
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
                              <ToggleSwitch
                                enabled={!!product.isActive}
                                onChange={() => toggleProductVisibility(product.id)}
                                size="sm"
                                aria-label={`Toggle ${product.name} visibility`}
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProductModal(product);
                                }}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                title="Manage product enhancements"
                                aria-label="Manage product enhancements"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
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
                              <strong className="text-gray-900 dark:text-white">Categories:</strong> <span className="text-gray-600 dark:text-gray-300">
                                {product.categories && product.categories.length > 0
                                  ? product.categories.map(cat => cat.name).join(', ')
                                  : 'None'
                                }
                              </span>
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
                  {recentSyncLogs.map((log) => (
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

        {/* Product Enhancement Modal */}
        {modalProduct && (
          <ProductEnhancementModal
            product={modalProduct}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setModalProduct(null);
            }}
            onProductUpdate={handleProductUpdate}
          />
        )}
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
      productService.getRecentSyncLogs(5, false), // Exclude active syncs from initial load
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
      lastUpdated: log.lastUpdated?.toISOString() || null,
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
