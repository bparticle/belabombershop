import { useState, useCallback } from "react";
import Link from "next/link";
import { PrintfulProduct } from "../types";
import SafeImage from "./SafeImage";
import CategoryBadge from "./CategoryBadge";
import ColorCircle from "./ColorCircle";
import { useResponsiveInteraction } from "../hooks/useResponsiveInteraction";
import { extractVariantThumbnails, VariantThumbnail } from "../lib/variant-utils";

interface ProductCardProps {
  product: PrintfulProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { id, name, variants, category } = product;
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  // Get unique variant thumbnails
  const thumbnailsData = extractVariantThumbnails(variants);
  const currentVariant = thumbnailsData[selectedVariantIndex];
  const hasMultipleVariants = thumbnailsData.length > 1;

  // Extract unique colors from variants
  const uniqueColors = useCallback(() => {
    const colors = new Set<string>();
    variants.forEach(variant => {
      if (variant.color) {
        colors.add(variant.color);
      }
    });
    return Array.from(colors);
  }, [variants])();

  // Handle variant selection
  const handleVariantSelect = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedVariantIndex(index);
  }, []);

  // Handle color hover (preview variant)
  const handleColorHover = useCallback((colorName: string) => {
    // Find the first variant with this color
    const colorIndex = thumbnailsData.findIndex(variant => variant.color === colorName);
    if (colorIndex !== -1) {
      setSelectedVariantIndex(colorIndex);
    }
  }, [thumbnailsData]);

  // Handle color click (navigate to detail page with selected variant)
  const handleColorClick = useCallback((colorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Find the variant with this color to pass to detail page
    const colorIndex = thumbnailsData.findIndex(variant => variant.color === colorName);
    if (colorIndex !== -1) {
      const variant = thumbnailsData[colorIndex];
      // Navigate to detail page with variant external_id
      window.location.href = `/product/${id}?variant=${variant.external_id}`;
    }
  }, [thumbnailsData, id]);

  // Use custom hook for responsive interaction
  const {
    isHovering,
    isMobileExpanded,
    handleMouseEnter,
    handleMouseLeave,
    handleCardClick,
  } = useResponsiveInteraction({
    onDesktopLeave: () => setSelectedVariantIndex(0),
  });

  // Determine if we should show color circles
  const shouldShowColors = (isHovering || isMobileExpanded) && uniqueColors.length > 1;

  return (
    <article 
      className="group cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <Link href={`/product/${id}`} className="block">
        <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 relative">
          {currentVariant?.imageUrl ? (
            <div className="w-full h-full relative">
              <SafeImage
                src={currentVariant.imageUrl}
                alt={`${name} - ${currentVariant.color || ''} ${currentVariant.size || ''}`}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
                             {/* Color circles overlay */}
               {shouldShowColors && (
                 <div className="absolute bottom-3 left-3 flex gap-1">
                   {uniqueColors.slice(0, 4).map((colorName) => {
                     const isSelected = currentVariant?.color === colorName;
                     return (
                       <div
                         key={colorName}
                         onMouseEnter={() => handleColorHover(colorName)}
                         onMouseLeave={() => handleColorHover(currentVariant?.color || uniqueColors[0])}
                       >
                                                   <ColorCircle
                            colorName={colorName}
                            isSelected={isSelected}
                            isAvailable={true}
                            onClick={(e) => handleColorClick(colorName, e!)}
                            size="sm"
                            showLabel={false}
                            className="shadow-lg cursor-pointer"
                          />
                       </div>
                     );
                   })}
                   {uniqueColors.length > 4 && (
                     <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 font-medium shadow-lg">
                       +{uniqueColors.length - 4}
                     </div>
                   )}
                 </div>
               )}
              
              {/* Variant indicator */}
              {hasMultipleVariants && !shouldShowColors && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {selectedVariantIndex + 1}/{thumbnailsData.length}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>
      </Link>

      {/* Product info */}
      <div className="mt-3 space-y-1">
        <Link href={`/product/${id}`} className="block">
          <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors overflow-hidden text-ellipsis whitespace-nowrap">
            {name}
          </h3>
        </Link>
        
        {category && (
          <div className="flex items-center justify-between">
            <CategoryBadge categoryId={category} size="sm" />
            <span className="text-sm text-gray-500">
              {uniqueColors.length} color{uniqueColors.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
