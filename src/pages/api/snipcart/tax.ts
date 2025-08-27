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

              // Calculate VAT based on retail prices, not Printful's wholesale costs
     // Get the total retail value from cart items
     const retailSubtotal = cartItems.reduce((total, item) => {
       return total + (item.price * item.quantity);
     }, 0);
     
     console.log('🧮 Retail calculation:', {
       retailSubtotal: retailSubtotal,
       cartItems: cartItems.map(item => ({ id: item.id, price: item.price, quantity: item.quantity }))
     });
     
     // Determine VAT rate based on country
     let vatRate = 0;
     const country = recipient.country_code;
     
     // Common EU VAT rates (you may need to adjust based on your business requirements)
     const vatRates: { [key: string]: number } = {
       'GB': 20, // UK VAT
       'BE': 21, // Belgium VAT
       'DE': 19, // Germany VAT
       'FR': 20, // France VAT
       'NL': 21, // Netherlands VAT
       'IT': 22, // Italy VAT
       'ES': 21, // Spain VAT
       // Add more countries as needed
     };
     
     vatRate = country ? (vatRates[country] || 0) : 0;
     
     console.log('🧮 VAT rate lookup:', {
       country: country,
       vatRate: vatRate,
       availableRates: Object.keys(vatRates)
     });
     
     if (vatRate > 0) {
       // Calculate VAT amount based on retail price
       const vatAmount = (retailSubtotal * vatRate) / 100;
       
       console.log('🧮 VAT calculation:', {
         retailSubtotal: retailSubtotal,
         vatRate: vatRate,
         vatAmount: vatAmount
       });
       
       res.status(200).json({
         taxes: [
           {
             name: "VAT",
             amount: Math.round(vatAmount * 100) / 100, // Round to 2 decimal places
             rate: vatRate,
           },
         ],
       });
           } else {
        // No VAT applicable for this country
        console.log('🧮 No VAT applicable for country:', country);
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
