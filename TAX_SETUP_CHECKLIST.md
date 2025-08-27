# Tax/VAT Setup Checklist

## ✅ Snipcart Tax Configuration
- [ ] **Tax Webhook**: Configured at `https://yourdomain.com/api/snipcart/tax`
- [ ] **Tax Events**: `taxes.calculate` event is enabled
- [ ] **Domain**: Your domain is properly configured in Snipcart

## ✅ Printful VAT Configuration
- [ ] **VAT Registration**: Enabled if you're VAT registered
- [ ] **VAT ID**: Set if you have a VAT number
- [ ] **EU VAT**: Enabled for EU customers
- [ ] **Store Location**: Country is set correctly
- [ ] **Selling Preferences**: VAT collection is configured

## ✅ Environment Variables
- [ ] `PRINTFUL_API_KEY` is set and valid
- [ ] `NEXT_PUBLIC_SNIPCART_API_KEY` is set
- [ ] API keys have correct permissions

## ✅ Testing Steps
1. [ ] Start development server: `npm run dev`
2. [ ] Run tax test script: `npm run test:tax`
3. [ ] Test with EU address in store (UK, Germany, France)
4. [ ] Verify VAT appears in cart
5. [ ] Check server logs for tax API calls

## 🔧 Quick Fixes

### If no VAT is calculated for EU addresses:
1. **Check Snipcart tax webhook** - Most common issue
2. **Verify Printful VAT settings** - Enable EU VAT collection
3. **Check address format** - Ensure country codes are correct (GB, DE, FR, etc.)
4. **Test with different EU addresses** - UK (20%), Germany (19%), France (20%)

### If tax API is not being called:
1. **Configure Snipcart tax webhook** at Settings > Taxes
2. **Verify webhook URL** is correct and accessible
3. **Check domain configuration** in Snipcart
4. **Enable `taxes.calculate` event**

### If tax calculation fails:
1. **Check server logs** for API errors
2. **Verify Printful API key** has correct permissions
3. **Test tax endpoint manually** with curl commands
4. **Check address validation** - all required fields present

## 📊 Expected Results

### EU Addresses (Should show VAT):
- **UK**: 20% VAT
- **Germany**: 19% VAT  
- **France**: 20% VAT
- **Italy**: 22% VAT
- **Spain**: 21% VAT

### Non-EU Addresses (No VAT):
- **US**: No VAT (sales tax if configured)
- **Canada**: No VAT
- **Australia**: No VAT
- **Japan**: No VAT

## 🧪 Test Commands

### Run Tax Test Suite:
```bash
npm run test:tax
```

### Manual Tax API Test:
```bash
curl -X POST http://localhost:3000/api/snipcart/tax \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "taxes.calculate",
    "content": {
      "items": [{"id": "your-variant-id", "quantity": 1, "price": 25.00}],
      "shippingAddress": {
        "address1": "123 Test St",
        "city": "London",
        "country": "GB",
        "postalCode": "SW1A 1AA"
      }
    }
  }'
```

## 📞 Need Help?

If you're still having issues:
1. Check the detailed guide: `TAX_SETUP_GUIDE.md`
2. Run the test script: `npm run test:tax`
3. Check server logs for error messages
4. Verify all webhook configurations in Snipcart
5. Test with different EU addresses
