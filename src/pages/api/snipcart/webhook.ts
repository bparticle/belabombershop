import type { NextApiResponse } from "next";

import createOrder from "../../../lib/create-order";
import { validateData, SnipcartWebhookRequestSchema } from "../../../lib/validation";

import type { SnipcartRequest, SnipcartWebhookEvent } from "../../../types";

export default async function handler(
  req: SnipcartRequest,
  res: NextApiResponse
) {
  console.log('Webhook received:', {
    method: req.method,
    eventName: req.body?.eventName,
    hasContent: !!req.body?.content,
    hasInvoiceNumber: !!req.body?.invoiceNumber,
    hasEmail: !!req.body?.email
  });

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
    console.error('Validation error:', err);
    return res.status(400).json({ 
      message: "Validation failed",
      error: err instanceof Error ? err.message : 'Unknown validation error',
      receivedData: req.body
    });
  }
  
  const { eventName, content } = validatedBody;

  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  if (!allowedEvents.includes(eventName))
    return res.status(400).json({ message: "This event is not permitted" });

  // Verify webhook token using Snipcart's Basic Authentication
  if (!token) {
    console.error('Missing webhook token');
    return res.status(401).json({ 
      message: "Not Authorized - Missing webhook token",
      error: "x-snipcart-requesttoken header is required"
    });
  }

  const secretKey = process.env.SNIPCART_SECRET_KEY;
  if (!secretKey) {
    console.error('Missing SNIPCART_SECRET_KEY environment variable');
    return res.status(500).json({ 
      message: "Server configuration error",
      error: "SNIPCART_SECRET_KEY not configured"
    });
  }

  try {
    console.log('Verifying webhook token with Basic Auth...');
    
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

    console.log('Verification response:', {
      status: verifyToken.status,
      statusText: verifyToken.statusText,
      ok: verifyToken.ok
    });

    if (!verifyToken.ok) {
      console.error('Token verification failed:', verifyToken.status, verifyToken.statusText);
      return res.status(401).json({ 
        message: "Not Authorized - Invalid webhook token",
        error: `Token verification failed: ${verifyToken.status} ${verifyToken.statusText}`
      });
    }
    
    console.log('Webhook token verified successfully');
  } catch (err) {
    console.error('Webhook verification error:', err);
    return res.status(500).json({ 
      message: "Unable to verify Snipcart webhook token",
      error: err instanceof Error ? err.message : 'Unknown verification error'
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
          items: content.items,
          shippingRateUserDefinedId: content.shippingRateUserDefinedId,
        };
        console.log('Extracted order data:', orderData);
        
        try {
          await createOrder(orderData);
          console.log('Order created successfully');
        } catch (orderError) {
          console.error('createOrder error:', orderError);
          console.error('createOrder error type:', typeof orderError);
          console.error('createOrder error keys:', Object.keys(orderError || {}));
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
    console.error('Webhook handler error:', err);
    console.error('Error type:', typeof err);
    console.error('Error constructor:', err?.constructor?.name);
    console.error('Error stringified:', JSON.stringify(err, null, 2));
    
    // Handle validation errors specifically
    if (err instanceof Error && err.message.includes('Validation failed')) {
      return res.status(400).json({ 
        message: "Invalid request data",
        error: err.message 
      });
    }
    
    // Return the actual error for debugging
    let errorMessage = 'Unknown error';
    let errorStack = '';
    let errorDetails = {};
    
    if (err instanceof Error) {
      errorMessage = err.message;
      errorStack = err.stack || '';
    } else if (typeof err === 'string') {
      errorMessage = err;
    } else if (err && typeof err === 'object') {
      const errorObj = err as any;
      errorMessage = errorObj.message || errorObj.error || 'Object error';
      errorDetails = err;
    }
    
    res.status(500).json({ 
      message: "Something went wrong",
      error: errorMessage,
      stack: errorStack,
      details: errorDetails
    });
  }
}
