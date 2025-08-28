import type { NextApiResponse } from "next";

import createOrder from "../../../lib/create-order";
import { validateData, SnipcartWebhookRequestSchema } from "../../../lib/validation";

import type { SnipcartRequest, SnipcartWebhookEvent } from "../../../types";

export default async function handler(
  req: SnipcartRequest,
  res: NextApiResponse
) {
  const allowedEvents: SnipcartWebhookEvent[] = [
    "order.completed",
    "customauth:customer_updated",
  ];

  const token = req.headers["x-snipcart-requesttoken"];

  // Validate request body with error handling
  let validatedBody;
  try {
    validatedBody = validateData(SnipcartWebhookRequestSchema, req.body);
  } catch (err) {
    return res.status(400).json({ 
      message: "Validation failed",
      error: err instanceof Error ? err.message : 'Unknown validation error'
    });
  }
  
  const { eventName, content } = validatedBody;

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  if (!allowedEvents.includes(eventName))
    return res.status(400).json({ message: "This event is not permitted" });

  // Verify webhook token using Snipcart's Basic Authentication
  if (!token) {
    return res.status(401).json({ 
      message: "Not Authorized - Missing webhook token"
    });
  }

  const secretKey = process.env.SNIPCART_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ 
      message: "Server configuration error"
    });
  }

  try {
    // Create Basic Auth header as per Snipcart documentation
    const credentials = `${secretKey}:`;
    const base64Credentials = Buffer.from(credentials).toString('base64');
    
    const verifyToken = await fetch(
      `https://app.snipcart.com/api/requestvalidation/${token}`,
      {
        headers: {
          'Authorization': `Basic ${base64Credentials}`,
          'Accept': 'application/json'
        }
      }
    );

    if (!verifyToken.ok) {
      return res.status(401).json({ 
        message: "Not Authorized - Invalid webhook token"
      });
    }
  } catch (err) {
    return res.status(500).json({ 
      message: "Unable to verify Snipcart webhook token"
    });
  }

  try {
    switch (eventName) {
      case "order.completed":
        // Extract data from the correct locations in the Snipcart payload
        const orderData = {
          invoiceNumber: req.body.invoiceNumber || '',
          email: req.body.email || '',
          shippingAddress: content.shippingAddress,
          items: content.items || [],
          shippingRateUserDefinedId: content.shippingRateUserDefinedId || 'standard',
        };
        
        try {
          await createOrder(orderData);
        } catch (orderError) {
          throw orderError;
        }
        break;
      case "customauth:customer_updated":
        return res
          .status(200)
          .json({ message: "Customer updated - no action taken" });
      default:
        throw new Error("No such event handler exists");
    }

    res.status(200).json({ message: "Done" });
  } catch (err) {
    // Handle validation errors specifically
    if (err instanceof Error && err.message.includes('Validation failed')) {
      return res.status(400).json({ 
        message: "Invalid request data",
        error: err.message 
      });
    }
    
    // Return generic error for security
    res.status(500).json({ 
      message: "Something went wrong"
    });
  }
}
