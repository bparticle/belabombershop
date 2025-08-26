import type { NextApiRequest, NextApiResponse } from "next";
import { printful } from "../../../lib/printful-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get all products
    const { result: productIds } = await printful.get("sync/products");
    
    // Get detailed data for the first product
    const firstProductId = productIds[0]?.id;
    if (!firstProductId) {
      return res.status(200).json({
        message: "No products found",
        productIds: []
      });
    }

    const productDetail = await printful.get(`sync/products/${firstProductId}`);
    
    // Get variant details
    const variantDetails = await Promise.all(
      productDetail.result.sync_variants.map(async (variant: any) => {
        try {
          const variantDetail = await printful.get(`store/variants/@${variant.external_id}`);
          return {
            sync_variant: variant,
            store_variant: variantDetail.result
          };
        } catch (error: any) {
          return {
            sync_variant: variant,
            store_variant_error: error?.message || 'Unknown error'
          };
        }
      })
    );

    res.status(200).json({
      productIds,
      firstProduct: productDetail.result,
      variantDetails,
      rawSyncVariants: productDetail.result.sync_variants,
      rawSyncProduct: productDetail.result.sync_product
    });
  } catch (error: any) {
    console.error('Debug API Error:', error);
    res.status(500).json({
      error: error?.message || 'Unknown error',
      stack: error?.stack
    });
  }
}
