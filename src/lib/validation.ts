import { z } from 'zod';

/**
 * Validation Schemas
 * 
 * This module contains Zod schemas for validating API requests,
 * form inputs, and other user data throughout the application.
 */

// Product ID validation
export const ProductIdSchema = z.string().min(1, 'Product ID is required');

// Variant ID validation
export const VariantIdSchema = z.string().min(1, 'Variant ID is required');

// Snipcart webhook event validation
export const SnipcartWebhookEventSchema = z.enum([
  'order.completed',
  'order.status.changed',
  'order.paymentStatus.changed',
  'order.trackingNumber.changed',
  'order.refund.created',
  'order.notification.created',
  'subscription.created',
  'subscription.cancelled',
  'subscription.paused',
  'subscription.resumed',
  'subscription.invoice.created',
  'shippingrates.fetch',
  'taxes.calculate',
  'customauth:customer_updated',
]);

// Snipcart webhook content validation
export const SnipcartWebhookContentSchema = z.object({
  discounts: z.record(z.any()).optional(),
  items: z.record(z.any()).optional(),
  shippingAddress: z.object({
    fullName: z.string(),
    firstName: z.string().optional(),
    name: z.string(),
    company: z.string().optional(),
    address1: z.string(),
    address2: z.string().optional(),
    fullAddress: z.string(),
    city: z.string(),
    country: z.string(),
    postalCode: z.string(),
    province: z.string(),
    phone: z.string().optional(),
  }).optional(),
  shippingRateUserDefinedId: z.string().optional(),
}).passthrough();

// Snipcart webhook request validation
export const SnipcartWebhookRequestSchema = z.object({
  eventName: SnipcartWebhookEventSchema,
  mode: z.string(),
  createdOn: z.string(),
  content: SnipcartWebhookContentSchema,
});

// Shipping rate request validation
export const ShippingRateRequestSchema = z.object({
  eventName: z.literal('shippingrates.fetch'),
  content: z.object({
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number().positive(),
    })).min(1, 'At least one item is required'),
    shippingAddress1: z.string().optional(),
    shippingAddress2: z.string().optional(),
    shippingAddressCity: z.string().optional(),
    shippingAddressCountry: z.string().optional(),
    shippingAddressProvince: z.string().optional(),
    shippingAddressPostalCode: z.string().optional(),
    shippingAddressPhone: z.string().optional(),
  }),
});

// Tax calculation request validation
export const TaxCalculationRequestSchema = z.object({
  eventName: z.literal('taxes.calculate'),
  content: z.object({
    items: z.array(z.object({
      id: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    })).min(1, 'At least one item is required'),
    shippingAddress: z.object({
      address1: z.string().optional(),
      address2: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      province: z.string().optional(),
      postalCode: z.string().optional(),
      phone: z.string().optional(),
    }).optional(),
    shippingRateUserDefinedId: z.string().optional(),
  }),
});

// Search query validation
export const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Pagination validation
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * Validates data against a schema and returns the parsed data
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns The parsed and validated data
 * @throws Error if validation fails
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation failed: ${errorMessage}`);
    }
    throw error;
  }
}

/**
 * Safely validates data and returns a result object
 * @param schema - The Zod schema to validate against
 * @param data - The data to validate
 * @returns Object with success status and data or error
 */
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): 
  | { success: true; data: T }
  | { success: false; error: string } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      return { success: false, error: errorMessage };
    }
    return { success: false, error: 'Validation failed' };
  }
}
