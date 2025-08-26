import * as React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { useRouter } from "next/router";

import { printful } from "../../lib/printful-client";
import { formatVariantName } from "../../lib/format-variant-name";
import { PrintfulProduct } from "../../types";
import { determineProductCategory } from "../../lib/category-config";
import { enhanceProductData, getDefaultDescription } from "../../lib/product-enhancements";
import VariantPicker from "../../components/VariantPicker";
import ProductVariants from "../../components/ProductVariants";
import ColorSizeSelector from "../../components/ColorSizeSelector";
import ErrorBoundary from "../../components/ErrorBoundary";
import SafeImage from "../../components/SafeImage";
import CategoryBadge from "../../components/CategoryBadge";
import ProductEnhancements from "../../components/ProductEnhancements";
import useWishlistDispatch from "../../hooks/useWishlistDispatch";
import useWishlistState from "../../hooks/useWishlistState";

type ProductDetailPageProps = {
  product: PrintfulProduct & { enhancement?: any };
};

const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ product }) => {
  const router = useRouter();
  const { addItem } = useWishlistDispatch();
  const { isSaved } = useWishlistState();

  // Wrap everything in a try-catch to prevent any rendering errors
  try {

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
  
  const [firstVariant] = variants;
  const [activeVariantExternalId, setActiveVariantExternalId] = React.useState(
    firstVariant?.external_id || ''
  );

  const activeVariant = variants.find(
    (v) => v.external_id === activeVariantExternalId
  );

  const activeVariantFile = activeVariant?.files?.find(
    ({ type }) => type === "preview"
  );

  // Get all unique images from the product variants with strict validation
  // Only show actual product photos, not design files
  const allImages = React.useMemo(() => {
    return variants
      .flatMap(variant => variant.files || [])
      .filter(file => file && file.type && file.type === "preview") // Only show preview images (actual product photos)
      .filter(file => file.preview_url && typeof file.preview_url === 'string' && file.preview_url.trim() !== '')
      .filter(file => file.preview_url.startsWith('http')) // Only allow valid HTTP URLs
      .map(file => ({
        url: file.preview_url,
        type: file.type,
        alt: `${name} - ${file.type} view`
      }))
      .filter((image, index, self) => 
        index === self.findIndex(img => img.url === image.url)
      );
  }, [variants, name]);

  const [selectedImage, setSelectedImage] = React.useState(() => {
    // Validate activeVariantFile URL
    const activeVariantUrl = activeVariantFile?.preview_url;
    if (activeVariantUrl && typeof activeVariantUrl === 'string' && activeVariantUrl.trim() !== '' && activeVariantUrl.startsWith('http')) {
      return activeVariantUrl;
    }
    
    // Fallback to first valid image
    const firstValidImage = allImages[0];
    if (firstValidImage && firstValidImage.url && firstValidImage.url.startsWith('http')) {
      return firstValidImage.url;
    }
    
    return '';
  });

  const addToWishlist = () => addItem(product);
  const onWishlist = isSaved(id);

  // Update selected image when variant changes
  React.useEffect(() => {
    const activeVariantUrl = activeVariantFile?.preview_url;
    if (activeVariantUrl && typeof activeVariantUrl === 'string' && activeVariantUrl.trim() !== '' && activeVariantUrl.startsWith('http')) {
      setSelectedImage(activeVariantUrl);
    } else {
      // Fallback to first valid image for this variant
      const variantImages = activeVariant?.files?.filter(file => 
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
  }, [activeVariantFile, activeVariant]);

  // Get unique colors and sizes
  const colors = Array.from(new Set(variants.map(v => v.color).filter(Boolean)));
  const sizes = Array.from(new Set(variants.map(v => v.size).filter(Boolean)));

  // If no valid images found, show a placeholder
  const hasValidImages = allImages.length > 0;

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
                 <SafeImage
                   src={selectedImage}
                   alt={`${name} - ${activeVariant?.color || ''} ${activeVariant?.size || ''}`}
                   fill
                   className="object-contain"
                   sizes="(max-width: 768px) 100vw, 50vw"
                   onError={(e) => {
                     console.error('Image failed to load:', selectedImage);
                     e.currentTarget.style.display = 'none';
                   }}
                 />
               ) : (
                 <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
                   No image available
                 </div>
               )}
             </div>

            {/* Image Gallery */}
            {allImages.length > 1 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-900">Product Views</h3>
                <div className="grid grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image.url)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === image.url 
                          ? 'border-blue-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                                         >
                       {image.url && (
                         <SafeImage
                           src={image.url}
                           alt={image.alt}
                           fill
                           className="object-cover"
                           sizes="(max-width: 768px) 25vw, 12.5vw"
                           onError={(e) => {
                             console.error('Gallery image failed to load:', image.url);
                             e.currentTarget.style.display = 'none';
                           }}
                         />
                       )}
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                        {image.type}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
              <ProductEnhancements enhancement={enhancement} />
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
             <button
               className="snipcart-add-item w-full transition flex-shrink-0 py-4 px-6 border border-transparent shadow-sm text-lg font-medium bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 focus:outline-none rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
               data-item-id={activeVariantExternalId}
               data-item-price={activeVariant?.retail_price || 0}
               data-item-url={`/api/products/${activeVariantExternalId}`}
               data-item-description={`${name} - ${activeVariant?.color || ''} ${activeVariant?.size || ''}`}
               data-item-image={activeVariantFile?.preview_url && activeVariantFile.preview_url.trim() !== '' && activeVariantFile.preview_url.startsWith('http') ? activeVariantFile.preview_url : ''}
               data-item-name={`${name} (${activeVariant?.color || ''} ${activeVariant?.size || ''})`}
               data-item-custom1-value={activeVariant?.color || ''}
               data-item-custom1-name="Color"
               data-item-custom2-value={activeVariant?.size || ''}
               data-item-custom2-name="Size"
               disabled={!activeVariant || !activeVariant.retail_price}
             >
               {activeVariant && activeVariant.retail_price ? `Add to Cart - €${activeVariant.retail_price}` : 'Unavailable'}
             </button>

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
       </div>
      </ErrorBoundary>
   );
       } catch (error) {
      console.error('Error rendering product detail page:', error);
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">We encountered an error while loading this product.</p>
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
 };

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { result: productIds } = await printful.get("sync/products");
    
    const paths = productIds.map(({ id }) => ({
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
            ? variant.files.filter(file => 
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
      revalidate: 60, // Revalidate every minute
    };
  } catch (error) {
    console.error('Error in getStaticProps:', error);
    return {
      notFound: true,
    };
  }
};

export default ProductDetailPage;
