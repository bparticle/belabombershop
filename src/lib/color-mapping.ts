// Color mapping for t-shirt colors
// These are common color values used in apparel manufacturing
export const COLOR_MAPPING: Record<string, string> = {
  // Basic colors
  'Black': '#000000',
  'White': '#FFFFFF',
  'Navy': '#1B365D',
  'Royal': '#1E3A8A',
  'Red': '#DC2626',
  'Charcoal': '#374151',
  'Sport Grey': '#9CA3AF',
  'Natural': '#F5F5DC',
  
  // New colors from the latest product
  'Heather Midnight Navy': '#1B365D', // Dark navy with heather effect
  'Heather Deep Teal': '#0F766E', // Deep teal color
  'Aqua': '#00FFFF', // Bright aqua
  'Heather Mauve': '#E0B0FF', // Light purple/mauve
  'Steel Blue': '#4682B4', // Steel blue
  'Tan': '#D2B48C', // Tan/beige
  'Heather Yellow Gold': '#F59E0B', // Gold with heather effect
  'Heather Dust': '#A8A8A8', // Dusty gray
  'Ash': '#8B8B8B', // Ash gray
  'Vintage White': '#F5F5DC', // Off-white with vintage tint
  'Solid White Blend': '#FFFFFF', // Pure white
  
  // Additional heather variations that might be used
  'Heather Charcoal': '#374151',
  'Heather Slate': '#64748B',
  'Heather Stone': '#78716C',
  'Heather Sand': '#D6D3D1',
  'Heather Cream': '#FEF3C7',
  'Heather Ivory': '#FFFFF0',
  'Heather Pearl': '#F3F4F6',
  'Heather Silver': '#9CA3AF',
  'Heather Bronze': '#CD7F32',
  'Heather Copper': '#B87333',
  'Heather Gunmetal': '#374151',
  
  // Pastel colors
  'Light Blue': '#93C5FD',
  'Light Pink': '#FBCFE8',
  'Azalea': '#F472B6',
  'Gold': '#F59E0B',
  
  // Additional colors that might be used
  'Heather Grey': '#6B7280',
  'Heather Navy': '#1F2937',
  'Heather Black': '#111827',
  'Heather Red': '#B91C1C',
  'Heather Blue': '#3B82F6',
  'Heather Green': '#059669',
  'Heather Purple': '#7C3AED',
  'Heather Orange': '#EA580C',
  'Heather Yellow': '#EAB308',
  'Heather Pink': '#EC4899',
  'Heather Brown': '#92400E',
  'Heather Maroon': '#991B1B',
  'Heather Burgundy': '#9F1239',
  'Heather Forest': '#166534',
  'Heather Olive': '#3F6212',
  'Heather Tan': '#A16207',
  'Heather Mint': '#10B981',
  'Heather Lavender': '#A855F7',
  'Heather Coral': '#F97316',
  'Heather Teal': '#14B8A6',
  'Heather Indigo': '#6366F1',
  'Heather Violet': '#8B5CF6',
  'Heather Rose': '#F43F5E',
  'Heather Peach': '#FB7185',
  'Heather Sky': '#0EA5E9',
  'Heather Emerald': '#10B981',
  'Heather Ruby': '#EF4444',
  'Heather Sapphire': '#3B82F6',
  'Heather Amethyst': '#8B5CF6',
  'Heather Topaz': '#F59E0B',
  'Heather Steel': '#6B7280',
  'Heather Ash': '#9CA3AF',
  'Heather Beige': '#F5F5DC',
  'Heather Off-White': '#FAFAFA',
  'Heather Warm White': '#FEFEFE',
  'Heather Cool White': '#F8FAFC',
  'Heather Antique White': '#FAEBD7',
  'Heather Eggshell': '#F0EAD6',
  'Heather Linen': '#FAF0E6',
  'Heather Bone': '#F9F6EE',
  'Heather Vanilla': '#F3E5AB',
  'Heather Blush': '#FFB6C1',
  'Heather Lilac': '#C8A2C8',
  'Heather Periwinkle': '#CCCCFF',
  'Heather Turquoise': '#40E0D0',
  'Heather Aqua': '#00FFFF',
  'Heather Cyan': '#008B8B',
  'Heather Magenta': '#FF00FF',
  'Heather Fuchsia': '#C71585',
  'Heather Hot Pink': '#FF69B4',
  'Heather Deep Pink': '#FF1493',
  'Heather Crimson': '#DC143C',
  'Heather Dark Maroon': '#800000',
  'Heather Dark Red': '#8B0000',
  'Heather Fire Brick': '#B22222',
  'Heather Indian Red': '#CD5C5C',
  'Heather Light Coral': '#F08080',
  'Heather Salmon': '#FA8072',
  'Heather Dark Salmon': '#E9967A',
  'Heather Light Salmon': '#FFA07A',
  'Heather Orange Red': '#FF4500',
  'Heather Tomato': '#FF6347',
  'Heather Dark Orange': '#FF8C00',
  'Heather Bright Orange': '#FFA500',
  'Heather Dark Golden Rod': '#B8860B',
  'Heather Golden Rod': '#DAA520',
  'Heather Pale Golden Rod': '#EEE8AA',
  'Heather Dark Khaki': '#BDB76B',
  'Heather Khaki': '#F0E68C',
  'Heather Bright Yellow': '#FFFF00',
  'Heather Dark Yellow': '#D4AF37',
  'Heather Light Yellow': '#FFFFE0',
  'Heather Lemon Chiffon': '#FFFACD',
  'Heather Light Golden Rod Yellow': '#FAFAD2',
  'Heather Papaya Whip': '#FFEFD5',
  'Heather Moccasin': '#FFE4B5',
  'Heather Peach Puff': '#FFDAB9',
  'Heather Misty Rose': '#FFE4E1',
  'Heather Lavender Blush': '#FFF0F5',
  'Heather Light Linen': '#FAF0E6',
  'Heather Old Lace': '#FDF5E6',
  'Heather Sea Shell': '#FFF5EE',
  'Heather Corn Silk': '#FFF8DC',
  'Heather Light Ivory': '#FFFFF0',
  'Heather Honey Dew': '#F0FFF0',
  'Heather Mint Cream': '#F5FFFA',
  'Heather Azure': '#F0FFFF',
  'Heather Alice Blue': '#F0F8FF',
  'Heather Ghost White': '#F8F8FF',
  'Heather White Smoke': '#F5F5F5',
  'Heather Light Beige': '#F5F5DC',
  'Heather Floral White': '#FFFAF0',
  'Heather White': '#FFFFFF',
  'Heather Snow': '#FFFAFA',
  'Heather Gainsboro': '#DCDCDC',
  'Heather Light Gray': '#D3D3D3',
  'Heather Bright Silver': '#C0C0C0',
  'Heather Dark Gray': '#A9A9A9',
  'Heather Gray': '#808080',
  'Heather Dim Gray': '#696969',
  'Heather Light Slate Gray': '#778899',
  'Heather Slate Gray': '#708090',
  'Heather Dark Slate Gray': '#2F4F4F',
  'Heather Pure Black': '#000000'
};

// Function to get color hex value with fallback
export const getColorHex = (colorName: string): string => {
  const normalizedColor = colorName.trim();
  return COLOR_MAPPING[normalizedColor] || '#CCCCCC'; // Default fallback
};

// Function to check if a color is light or dark for accessibility
export const isLightColor = (hexColor: string): boolean => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5;
};

// Function to get appropriate border color for selection state
export const getBorderColor = (isSelected: boolean, isAvailable: boolean = true): string => {
  if (!isAvailable) return 'border-gray-200';
  if (isSelected) return 'border-blue-500';
  return 'border-gray-300';
};

// Function to get appropriate ring color for focus state
export const getRingColor = (isSelected: boolean, isAvailable: boolean = true): string => {
  if (!isAvailable) return 'focus:ring-gray-200';
  if (isSelected) return 'focus:ring-blue-500';
  return 'focus:ring-gray-400';
};
