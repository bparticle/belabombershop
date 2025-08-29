import { PrintfulVariant } from "../types";
import SafeImage from "./SafeImage";
import { extractVariantThumbnails, VariantThumbnail } from "../lib/variant-utils";

interface VariantThumbnailsProps {
  variants: PrintfulVariant[];
  selectedIndex: number;
  onVariantSelect: (index: number, e: React.MouseEvent) => void;
  productName: string;
}

const VariantThumbnails: React.FC<VariantThumbnailsProps> = ({
  variants,
  selectedIndex,
  onVariantSelect,
  productName,
}) => {
  const thumbnails = extractVariantThumbnails(variants);
  const hasMultipleVariants = thumbnails.length > 1;

  if (!hasMultipleVariants) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-gray-600">
        Available in different variants
      </p>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {thumbnails.map((variant, index) => (
          <button
            key={variant.id}
            onClick={(e) => onVariantSelect(index, e)}
            className={`flex-shrink-0 w-12 h-12 border-2 rounded overflow-hidden transition-all ${
              index === selectedIndex 
                ? 'border-blue-500 shadow-md' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            aria-label={`Select ${variant.color || ''} ${variant.size || ''} variant`}
          >
            <SafeImage
              src={variant.imageUrl}
              alt={`${productName} - ${variant.color || ''} ${variant.size || ''}`}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
        {thumbnails.length > 5 && (
          <div className="flex-shrink-0 w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center text-xs text-gray-500">
            +{thumbnails.length - 5}
          </div>
        )}
      </div>
    </div>
  );
};

export default VariantThumbnails;
