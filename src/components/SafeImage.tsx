import React from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  sizes,
  onError,
}) => {
  // Fix image path for local images that might be missing the proper prefix
  const fixedSrc = React.useMemo(() => {
    if (!src || typeof src !== 'string') return src;
    
    // If it's already a proper local path, return as is
    if (src.startsWith('/images/products/')) return src;
    
    // If it's just a filename, add the proper prefix
    if (!src.startsWith('/') && !src.startsWith('http')) {
      return `/images/products/${src}`;
    }
    
    return src;
  }, [src]);

  // Validate the image URL
  const isValidUrl = React.useMemo(() => {
    if (!fixedSrc || typeof fixedSrc !== 'string') return false;
    if (fixedSrc.trim() === '') return false;
    // Allow both external URLs (http/https) and local paths (starting with /)
    if (!fixedSrc.startsWith('http') && !fixedSrc.startsWith('/')) return false;
    return true;
  }, [fixedSrc]);

  // Debug logging
  React.useEffect(() => {
    console.log('SafeImage debug:', { originalSrc: src, fixedSrc, isValidUrl });
  }, [src, fixedSrc, isValidUrl]);

  // If URL is invalid, don't render the image
  if (!isValidUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center text-gray-500 ${className || ''}`}>
        <span className="text-sm">Invalid image: {src}</span>
      </div>
    );
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Image failed to load:', fixedSrc, e);
    if (onError) {
      onError(e);
    }
  };

  // For local images (starting with /), use regular img tag to avoid Next.js optimization issues
  if (fixedSrc.startsWith('/')) {
    if (fill) {
      return (
        <img
          src={fixedSrc}
          alt={alt}
          className={`w-full h-full object-cover ${className || ''}`}
          onError={handleError}
        />
      );
    }
    
    return (
      <img
        src={fixedSrc}
        alt={alt}
        width={width || 300}
        height={height || 300}
        className={className}
        onError={handleError}
      />
    );
  }

  // For external images, use Next.js Image component
  if (fill) {
    return (
      <Image
        src={fixedSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        onError={handleError}
      />
    );
  }

  return (
    <Image
      src={fixedSrc}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={className}
      sizes={sizes}
      onError={handleError}
    />
  );
};

export default SafeImage;
