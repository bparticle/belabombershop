import * as React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";

import { printful } from "../../lib/printful-client";
import { formatVariantName } from "../../lib/format-variant-name";
import { PrintfulProduct, ProductImage } from "../../types";
import { determineProductCategory } from "../../lib/category-config";
import { enhanceProductData, getDefaultDescription } from "../../lib/product-enhancements";
import VariantPicker from "../../components/VariantPicker";
import ProductVariants from "../../components/ProductVariants";
import ColorSizeSelector from "../../components/ColorSizeSelector";
import ErrorBoundary from "../../components/ErrorBoundary";
import SafeImage from "../../components/SafeImage";
import CategoryBadge from "../../components/CategoryBadge";
import ProductEnhancements from "../../components/ProductEnhancements";
import ImageGalleryModal from "../../components/ImageGalleryModal";
import ProductImageGallery from "../../components/ProductImageGallery";
import AdditionalViewsGallery from "../../components/AdditionalViewsGallery";
import useWishlistDispatch from "../../hooks/useWishlistDispatch";
import useWishlistState from "../../hooks/useWishlistState";
import { useProductGallery } from "../../hooks/useProductGallery";

type ProductDetailPageProps = {
  product: PrintfulProduct & { enhancement?: any };
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
  const router = useRouter();
  const { addItem } = useWishlistDispatch();
  const { isSaved } = useWishlistState();

  // All hooks must be called before any conditional returns
  const [firstVariant] = product?.variants || [];
  const [activeVariantExternalId, setActiveVariantExternalId] = React.useState(
    firstVariant?.external_id || ''
  );

  const activeVariant = product?.variants?.find(
    (v) => v.external_id === activeVariantExternalId
  );

  const activeVariantFile = activeVariant?.files?.find(
    ({ type }) => type === "preview"
  );

  // Get all unique images from the product variants with strict validation
  // Only show actual product photos, not design files
  const printfulImages = React.useMemo(() => {
    if (!product || !product.variants) return [];
    
    return product.variants
      .flatMap(variant => variant.files || [])
      .filter((file: any) => file && file.type && file.type === "preview") // Only show preview images (actual product photos)
      .filter((file: any) => file.preview_url && typeof file.preview_url === 'string' && file.preview_url.trim() !== '')
      .filter((file: any) => file.preview_url.startsWith('http')) // Only allow valid HTTP URLs
      .map((file: any) => ({
        url: file.preview_url,
        type: file.type,
        alt: `${product.name} - ${file.type} view`
      }))
      .filter((image: any, index: number, self: any[]) => 
        index === self.findIndex((img: any) => img.url === image.url)
      );
  }, [product]);

  // Get enhancement images
  const enhancementImages = React.useMemo(() => {
    return product?.enhancement?.additionalImages || [];
  }, [product?.enhancement?.additionalImages]);

  // Use custom hook for gallery management
  const {
    selectedImage,
    allGalleryImages,
    setSelectedImage,
    openGallery,
    handleEnhancementImageClick,
    galleryOpen,
    galleryStartIndex,
    setGalleryOpen
  } = useProductGallery({
    printfulImages,
    enhancementImages,
    initialSelectedImage: activeVariantFile?.preview_url
  });

  // Update selected image when variant changes
  React.useEffect(() => {
    const activeVariantUrl = activeVariantFile?.preview_url;
    if (activeVariantUrl && typeof activeVariantUrl === 'string' && activeVariantUrl.trim() !== '' && activeVariantUrl.startsWith('http')) {
      setSelectedImage(activeVariantUrl);
    } else {
      // Fallback to first valid image for this variant
      const variantImages = activeVariant?.files?.filter((file: any) => 
        file && file.type === "preview" && 
        file.preview_url && 
        typeof file.preview_url === 'string' && 
        file.preview_url.trim() !== '' && 
        file.preview_url.startsWith('http')
      ) || [];
      
      if (variantImages.length > 0) {
        setSelectedImage(variantImages[0].preview_url);
      }
    }
  }, [activeVariantFile, activeVariant, setSelectedImage]);

  // Validate product data
  if (!product || !product.id || !product.name || !product.variants) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The requested product could not be loaded.</p>
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Products
          </button>
        </div>
      </div>
    );
  }

  const { id, name, variants, category, description, enhancement } = product;

  const addToWishlist = () => addItem(product);
  const onWishlist = isSaved(id);

  // Gallery handlers
  const handleMainImageClick = () => {
    if (allGalleryImages.length > 0) {
      const currentImageIndex = allGalleryImages.findIndex(img => img.url === selectedImage);
      openGallery(currentImageIndex >= 0 ? currentImageIndex : 0);
    }
  };

  // Get unique colors and sizes
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  // If no valid images found, show a placeholder
  const hasValidImages = printfulImages.length > 0;

  if (router.isFallback) {
    return (
      <ErrorBoundary>
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li>
              <button
                onClick={() => router.push('/')}
                className="hover:text-blue-600 transition-colors"
              >
                Home
              </button>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <button
                onClick={() => router.push('/')}
                className="hover:text-blue-600 transition-colors"
              >
                Products
              </button>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="text-gray-900 font-medium">{name}</li>
          </ol>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
                                     {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
              {hasValidImages && selectedImage ? (
                <button
                  onClick={handleMainImageClick}
                  className="w-full h-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="View larger image"
                >
                  <SafeImage
                    src={selectedImage}
                    alt={`${name} - ${activeVariant?.color || ''} ${activeVariant?.size || ''}`}
                    fill
                    className="object-contain cursor-pointer hover:opacity-95 transition-opacity"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    onError={(e) => {
                      console.error('Image failed to load:', selectedImage);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  {/* Click indicator */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </button>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>

             {/* Product Image Gallery */}
             <ProductImageGallery
               images={printfulImages}
               selectedImage={selectedImage}
               onImageSelect={setSelectedImage}
               onGalleryOpen={openGallery}
               maxVisibleThumbnails={6}
             />

             {/* Additional Views Gallery */}
             <AdditionalViewsGallery
               images={enhancementImages}
               onImageClick={handleEnhancementImageClick}
               maxVisibleThumbnails={3}
             />


          </div>

          {/* Product Info */}
          <div className="space-y-6">
                         {/* Header */}
             <div className="flex items-start justify-between">
               <div>
                 <h1 className="text-3xl font-bold text-gray-900 mb-2">{name}</h1>
                 {category && (
                   <div className="mt-2">
                     <CategoryBadge categoryId={category} size="md" />
                   </div>
                 )}
               </div>
              <button
                aria-label="Add to wishlist"
                className="appearance-none text-gray-300 focus:text-gray-500 hover:text-red-500 transition focus:outline-none"
                onClick={addToWishlist}
              >
                {onWishlist ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-8 h-8 fill-current text-red-500"
                  >
                    <path fill="none" d="M0 0H24V24H0z" />
                    <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228z" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-8 h-8 fill-current"
                  >
                    <path fill="none" d="M0 0H24V24H0z" />
                    <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Product Description */}
            <div className="prose prose-sm text-gray-600">
              <p>{description}</p>
            </div>

            {/* Product Enhancements */}
            {enhancement && (
              <ProductEnhancements 
                enhancement={enhancement} 
                onImageClick={handleEnhancementImageClick}
              />
            )}

            

                         {/* Color and Size Selector */}
             <div className="mb-6">
               <ColorSizeSelector
                 variants={variants}
                 activeVariantExternalId={activeVariantExternalId}
                 onVariantChange={setActiveVariantExternalId}
               />
             </div>

                         {/* Add to Cart Button */}
             {activeVariant && activeVariantExternalId && (
                               <button
                  className="snipcart-add-item w-full transition flex-shrink-0 py-4 px-6 border border-transparent shadow-sm text-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:outline-none rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  data-item-id={activeVariantExternalId}
                  data-item-price={activeVariant?.retail_price ? parseFloat(activeVariant.retail_price) : 0}
                  data-item-url={`/product/${id}`}
                  data-item-description={`${name} - ${activeVariant?.color || ''} ${activeVariant?.size || ''}`}
                  data-item-image={activeVariantFile?.preview_url && activeVariantFile.preview_url.trim() !== '' ? activeVariantFile.preview_url : ''}
                  data-item-name={`${name} (${activeVariant?.color || ''} ${activeVariant?.size || ''})`}
                  data-item-custom1-value={activeVariant?.color || ''}
                  data-item-custom1-name="Color"
                  data-item-custom2-value={activeVariant?.size || ''}
                  data-item-custom2-name="Size"
                  disabled={!activeVariant.retail_price}
                >
                 {activeVariant.retail_price ? `Add to Cart - €${activeVariant.retail_price}` : 'Unavailable'}
               </button>
             )}

                         {/* Back to Products */}
             <div className="pt-4 border-t border-gray-200">
               <button
                 onClick={() => router.back()}
                 className="text-blue-600 hover:text-blue-800 transition-colors"
               >
                 ← Back to Products
               </button>
             </div>
           </div>
         </div>

         {/* Unified Image Gallery Modal */}
         {allGalleryImages.length > 0 && (
           <ImageGalleryModal
             images={allGalleryImages}
             initialIndex={galleryStartIndex}
             isOpen={galleryOpen}
             onClose={() => setGalleryOpen(false)}
           />
         )}

         {/* Hidden Snipcart elements for all variants - required for cart validation */}
         <div style={{ display: 'none' }}>
           {variants.map((variant) => {
             const variantFile = variant.files?.find(
               ({ type }) => type === "preview"
             );
             return (
               <div
                 key={variant.external_id}
                 className="snipcart-add-item"
                 data-item-id={variant.external_id}
                 data-item-price={variant.retail_price ? parseFloat(variant.retail_price) : 0}
                 data-item-url={`/product/${id}`}
                 data-item-description={`${name} - ${variant.color || ''} ${variant.size || ''}`}
                 data-item-image={variantFile?.preview_url && variantFile.preview_url.trim() !== '' ? variantFile.preview_url : ''}
                 data-item-name={`${name} (${variant.color || ''} ${variant.size || ''})`}
                 data-item-custom1-value={variant.color || ''}
                 data-item-custom1-name="Color"
                 data-item-custom2-value={variant.size || ''}
                 data-item-custom2-name="Size"
               />
             );
           })}
         </div>
       </div>
     </ErrorBoundary>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { result: productIds } = await printful.get("sync/products");
    
    const paths = productIds.map(({ id }: { id: string }) => ({
      params: { id: id.toString() },
    }));

    return {
      paths,
      fallback: true,
    };
  } catch (error) {
    console.error('Error in getStaticPaths:', error);
    return {
      paths: [],
      fallback: true,
    };
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  try {
    const productId = params?.id as string;
    
    if (!productId) {
      return { notFound: true };
    }

    const { result: { sync_product, sync_variants } } = await printful.get(`sync/products/${productId}`);

    // Validate the response data
    if (!sync_product || !sync_variants || !Array.isArray(sync_variants)) {
      console.error('Invalid product data received from Printful');
      return { notFound: true };
    }

    // Determine product category based on metadata, tags, and name
    const productCategory = determineProductCategory({
      name: sync_product.name || '',
      tags: sync_product.tags || [],
      metadata: sync_product.metadata || {}
    });

    // Create base product object
    const baseProduct = {
      id: sync_product.id?.toString() || '',
      external_id: sync_product.external_id || '',
      name: sync_product.name || 'Unnamed Product',
      thumbnail_url: sync_product.thumbnail_url || '',
      is_ignored: sync_product.is_ignored ?? false,
      category: productCategory,
      tags: sync_product.tags || [],
      metadata: sync_product.metadata || {},
      description: getDefaultDescription(sync_product.name || 'Product', productCategory),
      variants: sync_variants
        .filter((variant: any) => variant && variant.id) // Only include valid variants
        .map((variant: any) => ({
          id: variant.id || 0,
          external_id: variant.external_id || '',
          name: formatVariantName(variant.name, variant.options, variant.size, variant.color),
          retail_price: variant.retail_price || '0',
          currency: variant.currency || 'USD',
          files: Array.isArray(variant.files) 
            ? variant.files.filter((file: any) => 
                file && 
                file.type === "preview" && // Only include preview images (actual product photos)
                file.preview_url && 
                typeof file.preview_url === 'string' && 
                file.preview_url.trim() !== '' && 
                file.preview_url.startsWith('http')
              ) 
            : [],
          options: Array.isArray(variant.options) ? variant.options : [],
          size: variant.size || null,
          color: variant.color || null,
          is_enabled: variant.is_enabled ?? true,
          in_stock: variant.in_stock ?? true,
          is_ignored: variant.is_ignored ?? false,
        })),
    };

    // Enhance product with local data
    const product = enhanceProductData(baseProduct);

    // Ensure we have at least one valid variant
    if (product.variants.length === 0) {
      console.error('No valid variants found for product:', productId);
      return { notFound: true };
    }

    return {
      props: {
        product,
      },
      // Revalidate every 10 minutes to keep data fresh
      revalidate: 600,
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true,
    };
  }
};

export default ProductDetailPage;
