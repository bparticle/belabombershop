import { NextApiRequest, NextApiResponse } from 'next';
import { withAdminAuth } from '../../../lib/auth';
import { uploadImage, createCloudinaryImage, validateImageFile, CLOUDINARY_CONSTANTS } from '../../../lib/cloudinary';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default withAdminAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image, filename, folder, alt, caption } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    // Validate image data
    if (typeof image !== 'string' || !image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format. Expected base64 data URL' });
    }

    // Extract file information from base64
    const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid base64 image format' });
    }

    const [, format, base64Data] = matches;
    
    // Validate format
    if (!CLOUDINARY_CONSTANTS.SUPPORTED_FORMATS.includes(format.toLowerCase() as any)) {
      return res.status(400).json({ 
        error: `Unsupported image format. Supported formats: ${CLOUDINARY_CONSTANTS.SUPPORTED_FORMATS.join(', ')}` 
      });
    }

    // Convert base64 to buffer
    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid base64 data' });
    }

    // Validate file size
    if (imageBuffer.length > CLOUDINARY_CONSTANTS.MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `File size exceeds maximum allowed size of ${CLOUDINARY_CONSTANTS.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      });
    }

    // Prepare upload options
    const uploadOptions = {
      folder: folder || CLOUDINARY_CONSTANTS.FOLDERS.PRODUCTS,
      public_id: filename ? filename.split('.')[0] : undefined,
      resource_type: 'image' as const,
      type: 'upload' as const,
      overwrite: true,
      invalidate: true,
      eager: [
        {
          width: 1000,
          height: 1000,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        {
          width: 600,
          height: 600,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
        {
          width: 300,
          height: 300,
          crop: 'limit',
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      ],
      eager_async: true,
    };

    // Upload to Cloudinary
    const uploadResult = await uploadImage(imageBuffer, uploadOptions);

    // Create Cloudinary image object
    const cloudinaryImage = createCloudinaryImage(
      uploadResult,
      alt || filename || 'Product image',
      caption
    );

    // Return success response
    return res.status(200).json({
      success: true,
      image: cloudinaryImage,
      uploadResult: {
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
      },
    });

  } catch (error) {
    console.error('Image upload error:', error);
    
    // Handle specific Cloudinary errors
    if (error instanceof Error) {
      if (error.message.includes('File size')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Invalid file')) {
        return res.status(400).json({ error: error.message });
      }
      if (error.message.includes('Cloudinary upload failed')) {
        return res.status(500).json({ error: 'Failed to upload image to Cloudinary' });
      }
    }

    return res.status(500).json({ error: 'Internal server error during image upload' });
  }
});
