import type { NextApiRequest, NextApiResponse } from "next";

import { printful } from "../../../lib/printful-client";
import { validateData, TaxCalculationRequestSchema } from "../../../lib/validation";
import type { SnipcartTaxItem, PrintfulShippingItem } from "../../../types";

interface SnipcartRequest extends NextApiRequest {
  body: {
    eventName: string;
    mode: string;
    createdOn: string;
    content: { [key: string]: any };
  };
}

type Data = {
  /** An array of tax rates. */
  taxes: SnipcartTaxItem[];
};

type Error = {
  errors: { key: string; message: string }[];
};

export default async function handler(
  req: SnipcartRequest,
  res: NextApiResponse<Data | Error>
) {
  console.log('🧮 Tax API called:', {
    method: req.method,
    eventName: req.body?.eventName,
    hasItems: req.body?.content?.items?.length > 0,
    hasAddress: !!req.body?.content?.shippingAddress,
    timestamp: new Date().toISOString()
  });

  // Validate request body
  const validatedBody = validateData(TaxCalculationRequestSchema, req.body);
  const { eventName, content } = validatedBody;

  if (eventName !== "taxes.calculate") return res.status(200).end();

  if (content.items.length === 0)
    return res.status(200).json({
      errors: [
        {
          key: "no_items",
          message: "No items in cart to calculate taxes.",
        },
      ],
    });

  const {
    items: cartItems,
    shippingAddress,
    shippingRateUserDefinedId,
  } = content;

  if (!shippingAddress)
    return res.status(200).json({
      errors: [
        {
          key: "no_address",
          message: "No address to calculate taxes.",
        },
      ],
    });

  const { address1, address2, city, country, province, postalCode, phone } =
    shippingAddress;

  const recipient = {
    ...(address1 && { address1 }),
    ...(address2 && { address2 }),
    ...(city && { city: city }),
    ...(country && { country_code: country }),
    ...(province && { state_code: province }),
    ...(postalCode && { zip: postalCode }),
    ...(phone && { phone }),
  };

  const items: PrintfulShippingItem[] = cartItems.map(
    (item): PrintfulShippingItem => ({
      external_variant_id: item.id,
      quantity: item.quantity,
    })
  );

  try {
    const { result } = await printful.post("orders/estimate-costs", {
      shipping: shippingRateUserDefinedId,
      recipient,
      items,
    });

    // Check if VAT is actually calculated
    if (result.costs && result.costs.vat > 0) {
      // Debug: Log what Printful is returning
      console.log('🧮 Printful costs data:', {
        vat: result.costs.vat,
        subtotal: result.costs.subtotal,
        total: result.costs.total,
        shipping: result.costs.shipping
      });
      
      // Calculate the tax rate based on the VAT amount and subtotal
      const subtotal = result.costs.subtotal || (result.costs.total - result.costs.vat);
      const taxRate = subtotal > 0 ? (result.costs.vat / subtotal) * 100 : 0;
      
      console.log('🧮 Tax calculation:', {
        vat: result.costs.vat,
        subtotal: subtotal,
        calculatedRate: taxRate,
        roundedRate: Math.round(taxRate)
      });
      
      res.status(200).json({
        taxes: [
          {
            name: "VAT",
            amount: result.costs.vat,
            rate: Math.round(taxRate), // Round to whole number for percentage
          },
        ],
      });
    } else {
      // No VAT applicable
      res.status(200).json({
        taxes: [],
      });
    }
  } catch (err) {
    console.error('Tax API error:', err);
    
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
          message: error?.message || 'An error occurred while calculating taxes',
        },
      ],
    });
  }
}
