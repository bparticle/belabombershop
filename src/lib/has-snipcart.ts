export const hasSnipcart = () =>
  typeof window !== "undefined" && 
  window.Snipcart && 
  typeof window.Snipcart.subscribe === 'function';
