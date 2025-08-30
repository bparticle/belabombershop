# Printful API v2 Webhook Implementation

## Overview

This implementation updates the order.completed webhook to use Printful's API v2 while keeping all other Printful interactions intact with v1. The v2 API provides better error handling, standardized response formats, and improved order creation flexibility.

## Changes Made

### 1. New v2 Order Creation Function
- **File**: `src/lib/create-order-v2.ts`
- **Purpose**: Handles order creation using Printful API v2
- **Key Features**:
  - Uses Bearer token authentication
  - Implements v2 API structure with `catalog_variant_id`
  - Better error handling and logging
  - Robust data validation

### 2. Updated Webhook Handler
- **File**: `src/pages/api/snipcart/webhook.ts`
- **Changes**:
  - Import changed from `createOrder` to `createOrderV2`
  - Function call updated to use v2 implementation
  - All other functionality remains the same

## API v2 Structure

### Order Data Structure
```typescript
{
  external_id: string,           // Snipcart invoice number
  recipient: {
    name: string,
    company?: string,
    address1: string,
    address2?: string,
    city: string,
    state_code: string,
    state_name: string,
    country_code: string,
    country_name: string,
    zip: string,
    phone?: string,
    email: string,
    tax_number?: string
  },
  items: [{
    source: "catalog",
    catalog_variant_id: number,  // Printful variant ID
    quantity: number,
    name?: string,
    price?: string,
    retail_price?: string,
    currency: string,
    retail_currency: string
  }],
  retail_costs: {
    currency: string,
    subtotal: string,
    discount: string,
    shipping: string,
    tax: string,
    vat: string,
    total: string
  },
  shipping: string
}
```

### Key Differences from v1
1. **Authentication**: Bearer token instead of API key in URL
2. **Variant IDs**: Uses `catalog_variant_id` instead of `variant_id`
3. **Source Field**: Explicitly specifies `source: "catalog"`
4. **External ID**: Uses Snipcart invoice number as external reference
5. **Enhanced Error Handling**: Better error messages and logging

## Testing

### Test Script
Run the test script to verify the implementation:
```bash
node scripts/dev/test-webhook-v2.js
```

### Manual Testing
1. Start the development server: `npm run dev`
2. Make a test order through Snipcart
3. Check server logs for webhook processing
4. Verify order appears in Printful dashboard

## Error Handling

The v2 implementation includes comprehensive error handling:

1. **Validation Errors**: Checks for required fields and valid data types
2. **API Errors**: Detailed logging of Printful API responses
3. **Network Errors**: Proper error propagation
4. **Debug Logging**: Extensive logging for troubleshooting

## Environment Variables

Required environment variables:
- `PRINTFUL_API_KEY`: Your Printful API key (used as Bearer token)
- `SNIPCART_SECRET_KEY`: For webhook verification (optional but recommended)

## Monitoring

### Logs to Watch
- Order creation attempts
- API response status
- Error messages
- Successful order confirmations

### Success Indicators
- HTTP 200 response from webhook
- Order appears in Printful dashboard
- No error messages in server logs

## Troubleshooting

### Common Issues
1. **500 Error**: Check Printful API key and network connectivity
2. **Validation Errors**: Verify Snipcart webhook data structure
3. **Variant ID Issues**: Ensure variant IDs are valid Printful catalog IDs

### Debug Steps
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with the provided test script
4. Check Printful API documentation for endpoint status

## Rollback Plan

If issues arise, you can quickly rollback to v1:
1. Change import in webhook.ts back to `createOrder`
2. Update function call back to `createOrder(orderData)`
3. Remove `create-order-v2.ts` file

## Future Enhancements

Potential improvements for the v2 implementation:
1. Add retry logic for failed API calls
2. Implement webhook signature verification
3. Add order status tracking
4. Enhanced error reporting to monitoring systems
