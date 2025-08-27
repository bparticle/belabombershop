import type { NextApiRequest, NextApiResponse } from "next";

import { printful } from "../../../lib/printful-client";
import { validateData, ShippingRateRequestSchema } from "../../../lib/validation";
import type {
  SnipcartShippingRate,
  PrintfulShippingItem,
} from "../../../types";

interface SnipcartRequest extends NextApiRequest {
  body: {
    eventName: string;
    mode: string;
    createdOn: string;
    content: { [key: string]: any };
  };
}

type Data = {
  /** An array of shipping rates. */
  rates: SnipcartShippingRate[];
};

type Error = {
  errors: { key: string; message: string }[];
};

export default async function handler(
  req: SnipcartRequest,
  res: NextApiResponse<Data | Error>
) {
  // Validate request body
  const validatedBody = validateData(ShippingRateRequestSchema, req.body);
  const { eventName, content } = validatedBody;

  if (eventName !== "shippingrates.fetch") return res.status(200).end();
  if (content.items.length === 0) return res.status(200).end();

  const {
    items: cartItems,
    shippingAddress1,
    shippingAddress2,
    shippingAddressCity,
    shippingAddressCountry,
    shippingAddressProvince,
    shippingAddressPostalCode,
    shippingAddressPhone,
  } = content;

  const recipient = {
    ...(shippingAddress1 && { address1: shippingAddress1 }),
    ...(shippingAddress2 && { address2: shippingAddress2 }),
    ...(shippingAddressCity && { city: shippingAddressCity }),
    ...(shippingAddressCountry && { country_code: shippingAddressCountry }),
    ...(shippingAddressProvince && { state_code: shippingAddressProvince }),
    ...(shippingAddressPostalCode && { zip: shippingAddressPostalCode }),
    ...(shippingAddressPhone && { phone: shippingAddressPhone }),
  };

  const items: PrintfulShippingItem[] = cartItems.map(
    (item: any): PrintfulShippingItem => ({
      external_variant_id: item.id,
      quantity: item.quantity,
    })
  );

  try {
    const { result } = await printful.post("shipping/rates", {
      recipient,
      items,
    });

    res.status(200).json({
      rates: result.map((rate: any) => {
        // Use Printful's rate ID as the unique shipping method identifier
        // This ensures each shipping method has a unique ID that Snipcart can validate
        const userDefinedId = `RATE_${rate.id}`;

        return {
          cost: rate.rate,
          description: rate.name,
          userDefinedId: userDefinedId,
          guaranteedDaysToDelivery: rate.maxDeliveryDays,
        };
      }),
    });
  } catch (err) {
    console.error('Shipping API error:', err);
    
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
    res.status(200).json({
      errors: [
        {
          key: error?.reason || 'unknown_error',
          message: error?.message || 'An error occurred while calculating shipping rates',
        },
      ],
    });
  }
}
