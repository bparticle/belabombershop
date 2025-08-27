# Tax Webhook Debugging Guide

## Issue: Snipcart Tax Webhook Not Being Called

You've configured the Snipcart tax webhook, but it's not being called when customers enter addresses in your store.

## Step 1: Verify Webhook Configuration

### 1.1 Check Snipcart Tax Webhook Settings

1. Go to your [Snipcart Dashboard](https://app.snipcart.com/dashboard/settings/taxes)
2. Navigate to **Settings > Taxes**
3. Verify:
   - ✅ **Custom Taxes** is enabled
   - ✅ **Endpoint URL** is set to: `https://belabomberman.netlify.app/api/snipcart/tax`
   - ✅ **Webhook is active** (should show as enabled)

### 1.2 Check Domain Configuration

1. Go to **Settings > Domains**
2. Verify your domain `belabomberman.netlify.app` is properly configured
3. Make sure it's set as the **Default Website Domain**

## Step 2: Test Webhook Manually

### 2.1 Test with Real Variant ID

Run this command in WSL to test your tax endpoint:

```bash
curl -X POST https://belabomberman.netlify.app/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "taxes.calculate",
    "content": {
      "items": [
        {
          "id": "68ad4d02631253",
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

**Expected Response:**
```json
{
  "taxes": [
    {
      "name": "VAT",
      "amount": 0.74,
      "rate": 20
    }
  ]
}
```

## Step 3: Check Server Logs

### 3.1 Monitor Your Server Logs

1. Start your development server: `npm run dev`
2. Watch the console for tax API calls
3. Look for this log message: `🧮 Tax API called:`

### 3.2 Check Production Logs

If deployed to Netlify:
1. Go to your Netlify dashboard
2. Check **Functions** logs
3. Look for API calls to `/api/snipcart/tax`

## Step 4: Common Issues and Solutions

### Issue 1: Domain Mismatch

**Problem**: Snipcart webhook URL doesn't match your actual domain

**Solution**: 
- Verify the webhook URL is exactly: `https://belabomberman.netlify.app/api/snipcart/tax`
- Make sure there are no typos or extra characters

### Issue 2: HTTPS Required

**Problem**: Snipcart requires HTTPS for webhooks

**Solution**:
- ✅ Your domain already uses HTTPS
- Make sure the webhook URL starts with `https://`

### Issue 3: Webhook Not Enabled

**Problem**: Custom taxes webhook is not properly enabled

**Solution**:
1. Go to Snipcart Dashboard → Settings → Taxes
2. Make sure **Custom Taxes** is toggled ON
3. Verify the endpoint URL is saved
4. Test the webhook connection

### Issue 4: Address Format Issues

**Problem**: Snipcart might not be sending the right address format

**Solution**:
- Check that customers are entering complete addresses
- Verify country codes are correct (GB, DE, FR, etc.)

## Step 5: Debugging Steps

### 5.1 Test in Development

1. Start your dev server: `npm run dev`
2. Go to your local store: `http://localhost:3001`
3. Add items to cart
4. Enter a UK address
5. Check server logs for tax API calls

### 5.2 Test in Production

1. Go to your live store: `https://belabomberman.netlify.app`
2. Add items to cart
3. Enter a UK address
4. Check Netlify function logs

### 5.3 Check Snipcart Webhook Logs

1. Go to Snipcart Dashboard → Settings → Webhooks
2. Look for any failed webhook attempts
3. Check webhook delivery status

## Step 6: Alternative Testing

### 6.1 Test with Different Addresses

Try these addresses in your store:

**UK Address (should trigger VAT):**
- Address: 123 Test St
- City: London
- Country: United Kingdom
- Postal Code: SW1A 1AA

**German Address (should trigger VAT):**
- Address: 123 Test St
- City: Berlin
- Country: Germany
- Postal Code: 10115

**US Address (no VAT):**
- Address: 123 Test St
- City: New York
- Country: United States
- Postal Code: 10001

### 6.2 Check Cart Items

Make sure you're testing with items that have valid variant IDs:
- Use variant ID: `68ad4d02631253` (Bomberman Youth Long Sleeve / Black / S)
- Or any other variant ID from your Printful store

## Step 7: Snipcart Configuration Checklist

- [ ] **Custom Taxes** enabled in Snipcart
- [ ] **Webhook URL** set to: `https://belabomberman.netlify.app/api/snipcart/tax`
- [ ] **Domain** properly configured in Snipcart
- [ ] **Webhook is active** and not disabled
- [ ] **No webhook delivery failures** in Snipcart logs

## Step 8: Next Steps

If the webhook still isn't being called:

1. **Contact Snipcart Support** - They can check webhook delivery logs
2. **Check Snipcart Documentation** - Verify tax webhook requirements
3. **Test with a different address** - Some addresses might not trigger tax calculation
4. **Verify product configuration** - Make sure products are properly set up

## Quick Test Commands

### Test Tax Endpoint:
```bash
curl -X POST https://belabomberman.netlify.app/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{"eventName": "taxes.calculate", "content": {"items": [{"id": "68ad4d02631253", "quantity": 1, "price": 25.00}], "shippingAddress": {"address1": "123 Test St", "city": "London", "country": "GB", "postalCode": "SW1A 1AA", "province": "England"}, "shippingRateUserDefinedId": "standard"}}'
```

### Check if Endpoint is Accessible:
```bash
curl -I https://belabomberman.netlify.app/api/snipcart/tax
```

Let me know what you find from these debugging steps!
