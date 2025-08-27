# Shipping and Order Processing Setup Guide

## Current Issues Identified

Based on your description, you have two main issues:
1. **No shipping charges** - Shipping is not being calculated or charged
2. **No automatic orders to Printful** - Orders are not being sent to Printful automatically

## Step 1: Environment Variables Setup

First, make sure your `.env.local` file has the correct variables:

```bash
# Required for Printful integration
PRINTFUL_API_KEY=your_printful_api_key_here

# Required for Snipcart integration
NEXT_PUBLIC_SNIPCART_API_KEY=your_snipcart_public_key_here

# Optional: For webhook verification (recommended for production)
SNIPCART_SECRET_KEY=your_snipcart_secret_key_here
```

## Step 2: Snipcart Configuration

### 2.1 Enable Shipping Webhooks

1. Go to your [Snipcart Dashboard](https://app.snipcart.com/dashboard/settings/shipping)
2. Navigate to **Settings > Shipping**
3. Under **Custom Shipping**, click **Configure**
4. Set the **Endpoint URL** to: `https://yourdomain.com/api/snipcart/shipping`
5. **Save** the configuration

### 2.2 Enable Order Webhooks

1. Go to your [Snipcart Dashboard](https://app.snipcart.com/dashboard/settings/webhooks)
2. Navigate to **Settings > Webhooks**
3. Click **Add Webhook**
4. Set the **Endpoint URL** to: `https://yourdomain.com/api/snipcart/webhook`
5. Select the following events:
   - ✅ `order.completed`
   - ✅ `customauth:customer_updated`
6. **Save** the webhook

### 2.3 Verify Domain Configuration

1. Go to **Settings > Domains**
2. Make sure your domain is properly configured
3. The domain should match your live site URL

## Step 3: Printful Configuration

### 3.1 Verify API Key

1. Go to your [Printful Dashboard](https://www.printful.com/dashboard/stores)
2. Navigate to **Settings > API**
3. Verify your API key is active and has the correct permissions

### 3.2 Configure Shipping Preferences

1. Go to **Settings > Stores > Shipping**
2. Configure your shipping preferences for different regions
3. Make sure you have shipping methods set up

### 3.3 Add Billing Method

1. Go to **Billing > Billing Methods**
2. Add a payment method for order fulfillment
3. This is required for Printful to process orders

## Step 4: Testing the Setup

### 4.1 Test Shipping Calculation

1. Start your development server: `npm run dev`
2. Go to your store and add items to cart
3. Proceed to checkout
4. Enter a shipping address
5. You should see shipping rates appear

### 4.2 Test Order Processing

1. Complete a test order with a test payment method
2. Check your server logs for webhook activity
3. Verify the order appears in your Printful dashboard

## Step 5: Debugging Common Issues

### Issue: No Shipping Rates

**Symptoms**: No shipping costs shown during checkout

**Solutions**:
1. Check Snipcart shipping webhook configuration
2. Verify your domain is properly configured in Snipcart
3. Check server logs for shipping API errors
4. Ensure Printful API key is valid

### Issue: Orders Not Sent to Printful

**Symptoms**: Orders appear in Snipcart but not in Printful

**Solutions**:
1. Check Snipcart order webhook configuration
2. Verify webhook endpoint is accessible
3. Check server logs for webhook errors
4. Ensure Printful API key has correct permissions

### Issue: Webhook Verification Fails

**Symptoms**: 401 Unauthorized errors in logs

**Solutions**:
1. Add `SNIPCART_SECRET_KEY` to your environment variables
2. Verify the secret key matches your Snipcart account
3. Check that webhook URLs are correct

## Step 6: Production Deployment

### 6.1 Update Webhook URLs

When deploying to production, update your webhook URLs:

- **Shipping**: `https://yourdomain.com/api/snipcart/shipping`
- **Orders**: `https://yourdomain.com/api/snipcart/webhook`

### 6.2 Environment Variables

Make sure to set all environment variables in your production environment:

```bash
PRINTFUL_API_KEY=your_production_printful_key
NEXT_PUBLIC_SNIPCART_API_KEY=your_production_snipcart_key
SNIPCART_SECRET_KEY=your_production_snipcart_secret
```

## Step 7: Monitoring and Logs

### 7.1 Check Server Logs

Monitor your server logs for:
- Webhook requests from Snipcart
- API calls to Printful
- Error messages

### 7.2 Snipcart Dashboard

Check your Snipcart dashboard for:
- Webhook delivery status
- Failed webhook attempts
- Order processing status

### 7.3 Printful Dashboard

Check your Printful dashboard for:
- Incoming orders
- Order processing status
- Fulfillment tracking

## Troubleshooting Commands

### Test Shipping API
```bash
curl -X POST https://yourdomain.com/api/snipcart/shipping \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "shippingrates.fetch",
    "content": {
      "items": [{"id": "test-variant-id", "quantity": 1}],
      "shippingAddressCountry": "US",
      "shippingAddressPostalCode": "10001"
    }
  }'
```

### Test Webhook Endpoint
```bash
curl -X POST https://yourdomain.com/api/snipcart/webhook \
  -H "Content-Type: application/json" \
  -H "x-snipcart-requesttoken: test-token" \
  -d '{
    "eventName": "order.completed",
    "content": {
      "invoiceNumber": "test-order-123",
      "email": "test@example.com"
    }
  }'
```

## Next Steps

After completing this setup:

1. **Test thoroughly** with small orders
2. **Monitor** the first few real orders closely
3. **Verify** shipping calculations are correct
4. **Confirm** orders are being sent to Printful
5. **Check** fulfillment is working as expected

If you encounter any specific errors during this process, please share the error messages and I can help you troubleshoot further.
