import { printful } from "./printful-client";

import type { SnipcartWebhookContent, PrintfulShippingItem } from "../types";

const createOrder = async ({
  invoiceNumber,
  email,
  shippingAddress,
  items,
  shippingRateUserDefinedId,
}: SnipcartWebhookContent) => {
  console.log('Creating order for:', invoiceNumber);
  console.log('Email:', email);
  console.log('Items:', items);
  
  const recipient = {
    ...(shippingAddress?.name && { name: shippingAddress.name }),
    ...(shippingAddress?.address1 && { address1: shippingAddress.address1 }),
    ...(shippingAddress?.address2 && { address2: shippingAddress.address2 }),
    ...(shippingAddress?.city && { city: shippingAddress.city }),
    ...(shippingAddress?.country && { country_code: shippingAddress.country }),
    ...(shippingAddress?.province && {
      state_code: shippingAddress.province,
    }),
    ...(shippingAddress?.postalCode && { zip: shippingAddress.postalCode }),
    ...(shippingAddress?.phone && { phone: shippingAddress.phone }),
    email,
  };

  console.log('Recipient:', recipient);

  const printfulItems: PrintfulShippingItem[] = (items || []).map(
    (item: any): PrintfulShippingItem => ({
      external_variant_id: item.id,
      quantity: item.quantity,
    })
  );

  console.log('Printful items:', printfulItems);

  const orderData = {
    external_id: invoiceNumber,
    recipient,
    items: printfulItems,
    // Remove shipping method for now - let Printful use default
    // shipping: shippingRateUserDefinedId,
  };

  console.log('Sending to Printful:', orderData);

  const { result } = await printful.post("orders", orderData);

  console.log('Printful response:', result);
  return result;
};

export default createOrder;
