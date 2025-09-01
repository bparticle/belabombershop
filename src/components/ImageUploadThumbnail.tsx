import React, { useState, useRef } from 'react';
import { CloudinaryImage, validateImageFile } from '../lib/cloudinary-client';
import { getAdminToken } from '../lib/auth';

interface ImageUploadThumbnailProps {
  imageUrl?: string;
  alt?: string;
  onImageUploaded: (image: CloudinaryImage) => void;
  onError?: (error: string) => void;
  className?: string;
  accept?: string;
  maxSize?: number; // in MB
  folder?: string;
}

const ImageUploadThumbnail: React.FC<ImageUploadThumbnailProps> = ({
  imageUrl,
  alt,
  onImageUploaded,
  onError,
  className = '',
  accept = 'image/*',
  maxSize = 10, // 10MB default
  folder,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate file using robust validation
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'Invalid file');
      return;
    }

    // Additional size check for component-level maxSize
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Get admin token for authorization
      const token = getAdminToken();
      if (!token) {
        throw new Error('Admin authentication required');
      }

      // Upload to Cloudinary
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          image: base64,
          filename: file.name,
          folder,
          alt: file.name.split('.')[0].replace(/-/g, ' '),
        }),
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        onImageUploaded(result.image);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      onError?.(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 overflow-hidden
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          ${imageUrl ? 'border-solid border-gray-200' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600">{uploadProgress}%</span>
              </div>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="group relative w-full h-full">
            <img
              src={imageUrl}
              alt={alt || 'Product image'}
              className="w-full h-full object-cover rounded"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center rounded">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white text-center">
                <svg
                  className="w-6 h-6 mx-auto mb-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-xs">Replace</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-2">
            <svg
              className="w-8 h-8 mb-1"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-xs text-center">
              <div>Upload</div>
              <div>Image</div>
            </div>
          </div>
        )}
      </div>
      
      {dragActive && (
        <div className="absolute inset-0 border-2 border-blue-500 border-dashed rounded-lg bg-blue-50 bg-opacity-50 flex items-center justify-center">
          <div className="text-blue-600 text-sm font-medium">Drop image here</div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadThumbnail;
