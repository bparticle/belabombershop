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
  // Validate the image URL
  const isValidUrl = React.useMemo(() => {
    if (!src || typeof src !== 'string') return false;
    if (src.trim() === '') return false;
    if (!src.startsWith('http')) return false;
    return true;
  }, [src]);

  // If URL is invalid, don't render the image
  if (!isValidUrl) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center text-gray-500 ${className || ''}`}>
        <span className="text-sm">Invalid image</span>
      </div>
    );
  }

  // Render the image with proper props
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        width={width || 300}
        height={height || 300}
        className={className}
        sizes={sizes}
        onError={onError}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={className}
      onError={onError}
    />
  );
};

export default SafeImage;
