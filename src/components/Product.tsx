import { useState } from "react";
import Link from "next/link";

import useWishlistDispatch from "../hooks/useWishlistDispatch";
import useWishlistState from "../hooks/useWishlistState";

import VariantPicker from "./VariantPicker";
import SafeImage from "./SafeImage";
import CategoryBadge from "./CategoryBadge";

const Product = (product) => {
  const { addItem } = useWishlistDispatch();
  const { isSaved } = useWishlistState();

  const { id, name, variants, category } = product;
  
  const [firstVariant] = variants;
  const [activeVariantExternalId, setActiveVariantExternalId] = useState(
    firstVariant?.external_id || ''
  );

  const activeVariant = variants.find(
    (v) => v.external_id === activeVariantExternalId
  );

  const activeVariantFile = activeVariant?.files?.find(
    ({ type }) => type === "preview"
  );

  const addToWishlist = () => addItem(product);

  const onWishlist = isSaved(id);

  return (
    <article className="border border-gray-200 rounded bg-white flex flex-col relative group hover:shadow-lg transition-shadow cursor-pointer">
      <button
        aria-label="Add to wishlist"
        className="appearance-none absolute top-0 right-0 mt-3 mr-3 text-gray-300 focus:text-gray-500 hover:text-red-500 transition focus:outline-none z-10"
        onClick={addToWishlist}
      >
        {onWishlist ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-current text-red-500"
          >
            <path fill="none" d="M0 0H24V24H0z" />
            <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="w-6 h-6 fill-current"
          >
            <path fill="none" d="M0 0H24V24H0z" />
            <path d="M12.001 4.529c2.349-2.109 5.979-2.039 8.242.228 2.262 2.268 2.34 5.88.236 8.236l-8.48 8.492-8.478-8.492c-2.104-2.356-2.025-5.974.236-8.236 2.265-2.264 5.888-2.34 8.244-.228zm6.826 1.641c-1.5-1.502-3.92-1.563-5.49-.153l-1.335 1.198-1.336-1.197c-1.575-1.412-3.99-1.35-5.494.154-1.49 1.49-1.565 3.875-.192 5.451L12 18.654l7.02-7.03c1.374-1.577 1.299-3.959-.193-5.454z" />
          </svg>
        )}
      </button>
      
      <Link href={`/product/${id}`}>
        <div className="flex items-center justify-center flex-1 sm:flex-shrink-0 w-full p-6 cursor-pointer">
          {activeVariantFile && activeVariantFile.preview_url ? (
            <div className="w-full h-64 flex items-center justify-center image-container-height-constrained p-4">
              <SafeImage
                src={activeVariantFile.preview_url}
                alt={`${activeVariant?.name || 'Product'} ${name}`}
                width={300}
                height={300}
                className="group-hover:scale-105 transition-transform duration-200 object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-gray-500">
              No image available
            </div>
          )}
        </div>
      </Link>
      
      <Link href={`/product/${id}`}>
        <div className="flex-1 p-6 pt-0 cursor-pointer">
          <div className="text-center">
            <p className="mb-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors group-hover:text-blue-600">{name}</p>
            {category && (
              <div className="mt-2">
                <CategoryBadge categoryId={category} size="sm" />
              </div>
            )}
          </div>
        </div>
      </Link>
      <div className="p-6 pt-0 space-y-3">
        <VariantPicker
          variants={variants}
          onVariantChange={setActiveVariantExternalId}
          className="mb-4"
        />
        
        <div className="flex gap-2">
                     <button
             className="snipcart-add-item flex-1 transition flex-shrink-0 py-3 px-6 border border-gray-300 hover:border-transparent shadow-sm text-sm font-medium bg-white text-gray-900 focus:text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:outline-none rounded disabled:opacity-50 disabled:cursor-not-allowed"
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
             {activeVariant && activeVariant.retail_price ? 'Add to Cart' : 'Unavailable'}
           </button>
        </div>
      </div>
    </article>
  );
};

export default Product;
