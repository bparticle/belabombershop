import { printful } from "./printful-client";

export default async function createOrder({
  invoiceNumber,
  email,
  shippingAddress,
  items,
  shippingRateUserDefinedId,
}: {
  invoiceNumber: string;
  email: string;
  shippingAddress: any;
  items: any[];
  shippingRateUserDefinedId: string;
}) {
  const recipient = {
    name: shippingAddress.name,
    address1: shippingAddress.address1,
    address2: shippingAddress.address2,
    city: shippingAddress.city,
    state_code: shippingAddress.province,
    country_code: shippingAddress.country,
    zip: shippingAddress.postalCode,
    phone: shippingAddress.phone,
    email,
  };

  const printfulItems = items.map((item) => ({
    variant_id: item.id,
    quantity: item.quantity,
  }));

  const orderData = {
    recipient,
    items: printfulItems,
    retail_costs: {
      currency: "USD",
    },
    shipping: shippingRateUserDefinedId,
  };

  const result = await printful.post("orders", orderData);
  return result;
}
