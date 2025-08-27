# Tax/VAT Setup Guide

## Current Issue Analysis

You have shipping working but taxes are showing as 0%. This is likely due to one or more of these issues:

1. **Snipcart Tax Webhook Not Configured** - The tax endpoint isn't being called
2. **Printful VAT Configuration** - VAT settings in Printful need adjustment
3. **Tax API Logic Issues** - The tax calculation might have bugs
4. **Address Validation** - Tax calculation requires proper address format

## Step 1: Snipcart Tax Webhook Configuration

### 1.1 Enable Tax Webhooks in Snipcart

1. Go to your [Snipcart Dashboard](https://app.snipcart.com/dashboard/settings/taxes)
2. Navigate to **Settings > Taxes**
3. Under **Custom Taxes**, click **Configure**
4. Set the **Endpoint URL** to: `https://yourdomain.com/api/snipcart/tax`
5. **Save** the configuration

### 1.2 Verify Tax Webhook Events

Make sure the following events are enabled:
- ✅ `taxes.calculate`

## Step 2: Printful VAT Configuration

### 2.1 Check VAT Settings in Printful

1. Go to your [Printful Dashboard](https://www.printful.com/dashboard/stores)
2. Navigate to **Settings > Stores > [Your Store]**
3. Click on **Selling Preferences**
4. Verify **VAT Settings**:
   - **VAT Registration**: Should be enabled if you're VAT registered
   - **VAT ID**: Should be set if you have a VAT number
   - **VAT Collection**: Should be enabled for EU customers

### 2.2 Configure VAT for Different Regions

1. In **Selling Preferences**, check:
   - **EU VAT**: Should be enabled for EU customers
   - **US Sales Tax**: Configure if selling to US customers
   - **Other Regions**: Configure as needed

### 2.3 Verify Store Location

1. Make sure your store's **Country** is set correctly
2. This affects VAT calculation rules

## Step 3: Test Tax API Endpoint

### 3.1 Manual Test

Test your tax endpoint directly:

```bash
curl -X POST http://localhost:3000/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "taxes.calculate",
    "content": {
      "items": [
        {
          "id": "your-variant-id",
          "quantity": 1,
          "price": 25.00
        }
      ],
      "shippingAddress": {
        "address1": "123 Test St",
        "city": "London",
        "country": "GB",
        "postalCode": "SW1A 1AA",
        "province": "England"
      },
      "shippingRateUserDefinedId": "standard"
    }
  }'
```

### 3.2 Expected Response

You should get a response like:
```json
{
  "taxes": [
    {
      "name": "VAT",
      "amount": 5.00,
      "rate": 20
    }
  ]
}
```

## Step 4: Debug Tax Calculation Issues

### 4.1 Check Server Logs

Look for these in your server logs:
- Tax API calls from Snipcart
- Printful API responses
- Error messages

### 4.2 Common Issues and Fixes

#### Issue: Tax API Not Being Called
**Symptoms**: No tax API calls in server logs

**Solutions**:
1. Verify Snipcart tax webhook is configured
2. Check webhook URL is correct
3. Ensure `taxes.calculate` event is enabled

#### Issue: Printful Returns 0 VAT
**Symptoms**: Tax API responds but VAT amount is 0

**Solutions**:
1. Check Printful VAT settings
2. Verify customer address is in VAT-eligible region
3. Ensure products have proper tax settings in Printful

#### Issue: Invalid Address Format
**Symptoms**: Tax calculation fails due to address validation

**Solutions**:
1. Ensure address fields match expected format
2. Check country codes are correct (e.g., "GB" for UK, "DE" for Germany)
3. Verify postal codes are valid

## Step 5: Enhanced Tax API (Optional)

The current tax API has a potential issue. Here's an improved version:

```typescript
// Enhanced tax calculation with better error handling
try {
  const { result } = await printful.post("orders/estimate-costs", {
    shipping: shippingRateUserDefinedId,
    recipient,
    items,
  });

  // Check if VAT is actually calculated
  if (result.costs && result.costs.vat > 0) {
    res.status(200).json({
      taxes: [
        {
          name: "VAT",
          amount: result.costs.vat,
          rate: (result.costs.vat / (result.costs.total - result.costs.vat)) * 100,
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
  console.error('Tax calculation error:', err);
  res.status(200).json({
    taxes: [],
  });
}
```

## Step 6: Testing Checklist

### 6.1 Basic Tax Test
- [ ] Add items to cart
- [ ] Enter EU address (e.g., UK, Germany, France)
- [ ] Check if VAT appears in cart
- [ ] Verify VAT amount is correct

### 6.2 Different Regions Test
- [ ] Test with UK address (20% VAT)
- [ ] Test with German address (19% VAT)
- [ ] Test with US address (no VAT, but sales tax if configured)
- [ ] Test with non-EU address (no VAT)

### 6.3 Edge Cases
- [ ] Test with invalid address
- [ ] Test with missing address fields
- [ ] Test with zero-value items

## Step 7: Production Considerations

### 7.1 Environment Variables
Make sure these are set in production:
```bash
PRINTFUL_API_KEY=your_production_key
NEXT_PUBLIC_SNIPCART_API_KEY=your_production_key
```

### 7.2 Webhook URLs
Update webhook URLs for production:
- **Tax**: `https://yourdomain.com/api/snipcart/tax`
- **Shipping**: `https://yourdomain.com/api/snipcart/shipping`
- **Orders**: `https://yourdomain.com/api/snipcart/webhook`

### 7.3 Monitoring
- Monitor tax calculation logs
- Check for failed tax API calls
- Verify VAT amounts are correct

## Troubleshooting Commands

### Test Tax API with Different Addresses

**UK Address (20% VAT)**:
```bash
curl -X POST http://localhost:3000/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "taxes.calculate",
    "content": {
      "items": [{"id": "test-variant", "quantity": 1, "price": 25.00}],
      "shippingAddress": {
        "address1": "123 Test St",
        "city": "London",
        "country": "GB",
        "postalCode": "SW1A 1AA"
      }
    }
  }'
```

**German Address (19% VAT)**:
```bash
curl -X POST http://localhost:3000/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "taxes.calculate",
    "content": {
      "items": [{"id": "test-variant", "quantity": 1, "price": 25.00}],
      "shippingAddress": {
        "address1": "123 Test St",
        "city": "Berlin",
        "country": "DE",
        "postalCode": "10115"
      }
    }
  }'
```

## Next Steps

1. **Configure Snipcart tax webhook** (most likely missing piece)
2. **Verify Printful VAT settings**
3. **Test with EU addresses**
4. **Check server logs for tax API calls**
5. **Monitor tax calculations in production**

If you're still having issues after following this guide, please share:
- Your server logs showing tax API calls
- The response from the manual tax API test
- Your Printful VAT configuration settings
