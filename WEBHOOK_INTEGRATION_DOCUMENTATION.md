# Snipcart → Printful Webhook Integration Documentation

## Overview

This document outlines the complete webhook integration between Snipcart and Printful, enabling automatic order fulfillment when customers complete purchases.

## Architecture

```
Snipcart Order Completed → Webhook → Printful API v1 → Order Created
```

## Technical Specifications

### API Versions
- **Snipcart Webhook**: Latest version (as of 2025)
- **Printful API**: **v1** (stable, production-ready)
- **Next.js API Routes**: Pages Router (`/api/snipcart/webhook`)

### Authentication
- **Snipcart Webhook Authentication**: Enabled with token verification
- **Printful API Authentication**: Bearer token via `PRINTFUL_API_KEY`
- **Security**: All webhook requests validated against Snipcart's validation endpoint

## Implementation Details

### 1. Webhook Endpoint
**File**: `src/pages/api/snipcart/webhook.ts`

**Key Features**:
- Validates Snipcart webhook tokens
- Processes `order.completed` events
- Maps sync variant external IDs to internal IDs
- Creates orders using Printful v1 API
- Comprehensive error handling and logging

**Supported Events**:
- `order.completed` - Creates Printful order
- `customauth:customer_updated` - No action taken

### 2. Order Creation Logic
**File**: `src/lib/create-order-v1.ts`

**Key Features**:
- Uses Printful API v1 structure
- Maps shipping methods from Snipcart to Printful
- Handles sync variant ID resolution
- Comprehensive validation and error handling

### 3. Variant Mapping
**File**: `src/lib/create-order-v1.ts` (embedded function)

**Process**:
1. Receives sync variant external ID from Snipcart
2. Queries Printful API: `GET /store/variants/@{external_id}`
3. Extracts internal sync variant ID
4. Uses internal ID for order creation

## API Data Flow

### Snipcart → Webhook
```json
{
  "eventName": "order.completed",
  "content": {
    "items": [
      {
        "id": "68b2fd4bbab7b4", // Sync variant external ID
        "name": "Product Name",
        "quantity": 1,
        "price": 20.00
      }
    ],
    "shippingAddress": {
      "name": "Customer Name",
      "address1": "Street Address",
      "city": "City",
      "country": "BE",
      "postalCode": "12345",
      "province": "BE",
      "phone": "1234567890"
    },
    "invoiceNumber": "SNIP-1234",
    "email": "customer@example.com",
    "shippingRateUserDefinedId": "RATE_STANDARD"
  }
}
```

### Webhook → Printful v1 API
```json
{
  "recipient": {
    "name": "Customer Name",
    "address1": "Street Address",
    "city": "City",
    "state_code": "BE",
    "country_code": "BE",
    "zip": "12345",
    "phone": "1234567890",
    "email": "customer@example.com"
  },
  "items": [
    {
      "sync_variant_id": 4948910026, // Internal sync variant ID
      "quantity": 1
    }
  ],
  "retail_costs": {
    "currency": "USD"
  },
  "shipping": "STANDARD"
}
```

## Environment Variables

### Required
- `PRINTFUL_API_KEY` - Printful API authentication token
- `SNIPCART_SECRET_KEY` - Snipcart webhook validation secret

### Optional (for testing)
- `SNIPCART_TEST_TOKEN` - Real Snipcart webhook token for testing

## Shipping Method Mapping

| Snipcart Method | Printful Method |
|----------------|-----------------|
| `standard` | `STANDARD` |
| `RATE_STANDARD` | `STANDARD` |
| `express` | `EXPRESS` |
| `RATE_EXPRESS` | `EXPRESS` |
| `priority` | `PRIORITY` |
| `RATE_PRIORITY` | `PRIORITY` |
| `overnight` | `OVERNIGHT` |
| `RATE_OVERNIGHT` | `OVERNIGHT` |
| `economy` | `ECONOMY` |
| `RATE_ECONOMY` | `ECONOMY` |

## Error Handling

### Webhook Validation Errors
- **400**: Invalid request data or unsupported events
- **401**: Missing or invalid webhook token
- **405**: Invalid HTTP method
- **500**: Server errors or Printful API failures

### Printful API Errors
- **400**: Invalid order data (missing fields, invalid variants)
- **401**: Invalid API key
- **429**: Rate limit exceeded
- **500**: Printful server errors

## Testing

### Available Test Scripts
- `npm run test:webhook-auth` - Test authentication
- `npm run getVariants` - List all product variants
- `npm run testFileStructure` - Test file structure validation

### Test Data
- **Test Variant ID**: `68b2fd4bbab7b4` (Fireskull Youth classic tee - Gold L)
- **Test Customer**: Bruno Patyn (Belgium address)
- **Test Order**: Single item, standard shipping

## Production Deployment

### Requirements
1. Valid `PRINTFUL_API_KEY` in environment
2. Valid `SNIPCART_SECRET_KEY` in environment
3. Webhook URL configured in Snipcart dashboard
4. SSL certificate (required for webhook security)

### Webhook URL Configuration
```
https://yourdomain.com/api/snipcart/webhook
```

### Monitoring
- Check webhook logs in Snipcart dashboard
- Monitor Printful orders for successful creation
- Review server logs for any errors

## Security Considerations

1. **Token Validation**: All webhook requests validated against Snipcart
2. **HTTPS Required**: Webhook endpoint must use SSL
3. **Environment Variables**: Sensitive keys stored securely
4. **Error Messages**: Generic error responses to prevent information leakage
5. **Rate Limiting**: Consider implementing rate limiting for production

## Troubleshooting

### Common Issues

1. **"Property 'placements' is required"**
   - **Cause**: Using v2 API instead of v1
   - **Solution**: Ensure using `createOrderV1` function

2. **"sync_variant_id must have a numeric value"**
   - **Cause**: Using external ID instead of internal ID
   - **Solution**: Ensure proper variant mapping

3. **"Not Authorized - Invalid webhook token"**
   - **Cause**: Invalid or missing webhook token
   - **Solution**: Check Snipcart webhook configuration

4. **"Unable to find sync variant"**
   - **Cause**: Invalid sync variant external ID
   - **Solution**: Verify product configuration in Printful

### Debug Steps
1. Check webhook logs in Snipcart dashboard
2. Review server logs for detailed error messages
3. Test with `npm run testOrderCreation` to verify API connectivity
4. Verify environment variables are correctly set

## Performance Considerations

- **Variant Mapping**: Cached for 5 minutes to reduce API calls
- **Error Handling**: Graceful degradation with detailed logging
- **Rate Limiting**: Respects Printful API rate limits (120 calls/minute)
- **Async Processing**: Non-blocking webhook responses

## Future Enhancements

1. **Order Status Updates**: Implement webhook for order status changes
2. **Inventory Sync**: Real-time inventory updates
3. **Multi-currency Support**: Handle different currencies
4. **Advanced Shipping**: Support for complex shipping rules
5. **Analytics**: Order tracking and reporting

## Version History

- **v1.0.0** (2025-08-31): Initial implementation with Printful v1 API
- **v1.1.0** (2025-08-31): Added comprehensive authentication
- **v1.2.0** (2025-08-31): Complete test suite and documentation

---

**Last Updated**: August 31, 2025  
**Status**: Production Ready ✅  
**API Version**: Printful v1  
**Authentication**: Enabled ✅
