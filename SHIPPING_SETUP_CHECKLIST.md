# Shipping & Order Setup Checklist

## ✅ Environment Variables
- [ ] `PRINTFUL_API_KEY` is set in `.env.local`
- [ ] `NEXT_PUBLIC_SNIPCART_API_KEY` is set in `.env.local`
- [ ] `SNIPCART_SECRET_KEY` is set (optional but recommended)

## ✅ Snipcart Configuration
- [ ] **Shipping Webhook**: Configured at `https://yourdomain.com/api/snipcart/shipping`
- [ ] **Order Webhook**: Configured at `https://yourdomain.com/api/snipcart/webhook`
- [ ] **Domain**: Your domain is properly configured in Snipcart
- [ ] **Payment Gateway**: Connected (Stripe, etc.)

## ✅ Printful Configuration
- [ ] **API Key**: Valid and active
- [ ] **Store**: Created with "Manual order platform / API"
- [ ] **Products**: Added to inventory with proper variant IDs
- [ ] **Shipping**: Configured shipping preferences
- [ ] **Billing**: Payment method added for order fulfillment

## ✅ Testing Steps
1. [ ] Start development server: `npm run dev`
2. [ ] Run test script: `npm run test:shipping`
3. [ ] Test shipping calculation in store
4. [ ] Test complete order flow
5. [ ] Verify order appears in Printful dashboard

## 🔧 Quick Fixes

### If shipping rates don't appear:
1. Check Snipcart shipping webhook configuration
2. Verify your domain is accessible
3. Check server logs for errors
4. Ensure Printful API key is valid

### If orders don't go to Printful:
1. Check Snipcart order webhook configuration
2. Verify webhook endpoint is accessible
3. Check server logs for webhook errors
4. Ensure Printful API key has correct permissions

### If webhook verification fails:
1. Add `SNIPCART_SECRET_KEY` to environment variables
2. Verify the secret key matches your Snipcart account
3. Check that webhook URLs are correct

## 📞 Need Help?

If you're still having issues:
1. Check the detailed setup guide: `setup-shipping-and-orders.md`
2. Run the test script: `npm run test:shipping`
3. Check your server logs for error messages
4. Verify all environment variables are set correctly
