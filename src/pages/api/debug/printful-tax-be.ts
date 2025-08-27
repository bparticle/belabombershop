import type { NextApiRequest, NextApiResponse } from "next";
import { printful } from "../../../lib/printful-client";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { result } = await printful.post("orders/estimate-costs", {
      shipping: "standard",
      recipient: {
        address1: "14 Gaston Lejeunestraat",
        city: "Koksijde",
        country_code: "BE",
        zip: "8670",
        state_code: "WV"
      },
      items: [
        {
          external_variant_id: "68ad4d02631253",
          quantity: 1
        }
      ]
    });

    console.log('🔍 Full Printful response for Belgium:', JSON.stringify(result, null, 2));

    res.status(200).json({
      message: 'Printful response for Belgium logged to console',
      costs: result.costs,
      calculation: {
        vat: result.costs?.vat,
        subtotal: result.costs?.subtotal,
        total: result.costs?.total,
        shipping: result.costs?.shipping,
        calculatedRate: result.costs?.subtotal && result.costs?.vat ? (result.costs.vat / result.costs.subtotal) * 100 : 'N/A'
      }
    });
  } catch (error) {
    console.error('Debug endpoint error for Belgium:', error);
    res.status(500).json({ 
      error: 'Failed to call Printful API for Belgium',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
