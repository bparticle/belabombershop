import { useState, useCallback } from "react";
import Link from "next/link";
import { PrintfulProduct } from "../types";
import SafeImage from "./SafeImage";
import CategoryBadge from "./CategoryBadge";
import ColorCircle from "./ColorCircle";
import { useResponsiveInteraction } from "../hooks/useResponsiveInteraction";
interface ProductCardProps {
  product: PrintfulProduct;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { id, name, variants, category, thumbnail_url } = product;
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  // Extract unique colors from variants
  const uniqueColors = (() => {
    const colors = new Set<string>();
    variants.forEach((variant: any) => {
      if (variant.color) {
        colors.add(variant.color);
      }
    });
    return Array.from(colors);
  })();

  // Get current color
  const currentColor = uniqueColors[selectedColorIndex] || uniqueColors[0];
  const hasMultipleColors = uniqueColors.length > 1;

  // Handle color hover (preview color)
  const handleColorHover = useCallback((colorName: string) => {
    // Find the color index
    const colorIndex = uniqueColors.findIndex(color => color === colorName);
    if (colorIndex !== -1) {
      setSelectedColorIndex(colorIndex);
    }
  }, [uniqueColors]);

  // Handle color click (navigate to detail page with selected variant)
  const handleColorClick = useCallback((colorName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Find the variant with this color to pass to detail page
    const variantWithColor = variants.find((variant: any) => variant.color === colorName);
    if (variantWithColor) {
      // Navigate to detail page with variant external_id
      window.location.href = `/product/${id}?variant=${variantWithColor.external_id}`;
    }
  }, [variants, id]);

  // Use custom hook for responsive interaction
  const {
    isHovering,
    isMobileExpanded,
    handleMouseEnter,
    handleMouseLeave,
    handleCardClick,
  } = useResponsiveInteraction({
    onDesktopLeave: () => setSelectedColorIndex(0),
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
          {thumbnail_url ? (
            <div className="w-full h-full relative">
              <SafeImage
                src={thumbnail_url}
                alt={`${name} - ${currentColor || ''}`}
                width={400}
                height={400}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              
              {/* Color circles overlay */}
              {shouldShowColors && (
                <div className="absolute bottom-3 left-3 flex gap-1">
                  {uniqueColors.slice(0, 4).map((colorName: string) => {
                    const isSelected = currentColor === colorName;
                     return (
                       <div
                         key={colorName}
                         onMouseEnter={() => handleColorHover(colorName)}
                         onMouseLeave={() => handleColorHover(currentColor || uniqueColors[0])}
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
              
                             {/* Color indicator */}
               {hasMultipleColors && !shouldShowColors && (
                 <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                   {uniqueColors.length} colors
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
