export const formatVariantName = (
  variantName: string, 
  options?: Array<{id: string, value: string}>,
  size?: string | null,
  color?: string | null
): string => {
  // If we have direct size and color properties, use those
  if (size && color) {
    return `${size} - ${color}`;
  }
  
  // If we have options (size, color), format them nicely
  if (options && options.length > 0) {
    const sizeOption = options.find(opt => opt.id === 'Size');
    const colorOption = options.find(opt => opt.id === 'Color');
    
    const parts = [];
    if (sizeOption) parts.push(sizeOption.value);
    if (colorOption) parts.push(colorOption.value);
    
    if (parts.length > 0) {
      return parts.join(' - ');
    }
  }
  
  // Fallback to original logic - extract from variant name
  const parts = variantName.split(" / ");
  if (parts.length >= 3) {
    // Format: "Product Name / Color / Size"
    return `${parts[2]} - ${parts[1]}`; // Size - Color
  }
  
  // Last fallback
  const [, name] = variantName.split(" - ");
  return name ? name : "One style";
};
