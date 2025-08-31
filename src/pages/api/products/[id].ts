import type { NextApiRequest, NextApiResponse } from "next";

import { productService } from "../../../lib/database/services/product-service";
import { validateData, VariantIdSchema } from "../../../lib/validation";
import { createRateLimiter, RATE_LIMITS } from "../../../lib/rate-limit";
import { corsHandler, CORS_CONFIGS } from "../../../lib/cors";

type Data = {
  id: string;
  price: number;
  url: string;
};

type Error = {
  errors: { key: string; message: string }[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | Error>
) {
  // Apply rate limiting
  const identifier = (req.headers['x-forwarded-for'] as string) || 
                    (req.connection?.remoteAddress as string) || 
                    (req.socket?.remoteAddress as string) || 
                    'unknown';
  const rateLimiter = createRateLimiter(RATE_LIMITS.API);
  const rateLimitResult = rateLimiter(identifier);
  
  if (!rateLimitResult.allowed) {
    res.setHeader('Retry-After', Math.ceil(RATE_LIMITS.API.windowMs / 1000));
    return res.status(429).json({
      errors: [
        {
          key: 'rate_limit_exceeded',
          message: 'Rate limit exceeded. Please try again later.',
        },
      ],
    });
  }

  // Validate product ID
  const validatedId = validateData(VariantIdSchema, req.query.id);

  try {
    // Try to find the variant by external ID
    const product = await productService.getProductByExternalId(validatedId);
    
    if (!product) {
      return res.status(404).json({
        errors: [
          {
            key: 'product_not_found',
            message: 'Product not found',
          },
        ],
      });
    }

    // Find the specific variant
    const variant = product.variants.find(v => v.externalId === validatedId);
    
    if (!variant) {
      return res.status(404).json({
        errors: [
          {
            key: 'variant_not_found',
            message: 'Product variant not found',
          },
        ],
      });
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");

    res.status(200).json({
      id: validatedId,
      price: parseFloat(variant.retailPrice),
      url: `/api/products/${validatedId}`,
    });
  } catch (err) {
    console.error('Product API error:', err);
    
    // Handle validation errors specifically
    if (err instanceof Error && err.message.includes('Validation failed')) {
      return res.status(400).json({
        errors: [
          {
            key: 'validation_error',
            message: err.message,
          },
        ],
      });
    }
    
    // Handle other errors
    const error = err as any;
    res.status(404).json({
      errors: [
        {
          key: error?.message || 'unknown_error',
          message: error?.message || 'An error occurred while fetching the product',
        },
      ],
    });
  }
}

export default corsHandler(handler, CORS_CONFIGS.PUBLIC);