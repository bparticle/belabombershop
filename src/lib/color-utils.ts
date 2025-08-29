import { COLOR_MAPPING } from './color-mapping';

// Color categories for better organization
export const COLOR_CATEGORIES = {
  basics: ['Black', 'White', 'Navy', 'Royal', 'Red', 'Charcoal', 'Sport Grey', 'Natural'],
  heathers: [
    'Heather Grey', 'Heather Navy', 'Heather Black', 'Heather Red', 'Heather Blue',
    'Heather Green', 'Heather Purple', 'Heather Orange', 'Heather Yellow', 'Heather Pink',
    'Heather Brown', 'Heather Maroon', 'Heather Burgundy', 'Heather Forest', 'Heather Olive',
    'Heather Tan', 'Heather Cream', 'Heather Mint', 'Heather Lavender', 'Heather Coral',
    'Heather Teal', 'Heather Indigo', 'Heather Violet', 'Heather Rose', 'Heather Peach',
    'Heather Sky', 'Heather Emerald', 'Heather Ruby', 'Heather Sapphire', 'Heather Amethyst',
    'Heather Topaz', 'Heather Pearl', 'Heather Silver', 'Heather Bronze', 'Heather Copper',
    'Heather Steel', 'Heather Gunmetal', 'Heather Ash', 'Heather Stone', 'Heather Sand',
    'Heather Beige', 'Heather Ivory', 'Heather Off-White', 'Heather Warm White',
    'Heather Cool White', 'Heather Antique White', 'Heather Eggshell', 'Heather Linen',
    'Heather Bone', 'Heather Vanilla', 'Heather Blush', 'Heather Mauve', 'Heather Lilac',
    'Heather Periwinkle', 'Heather Turquoise', 'Heather Aqua', 'Heather Cyan',
    'Heather Magenta', 'Heather Fuchsia', 'Heather Hot Pink', 'Heather Deep Pink',
    'Heather Crimson', 'Heather Dark Maroon', 'Heather Dark Red', 'Heather Fire Brick',
    'Heather Indian Red', 'Heather Light Coral', 'Heather Salmon', 'Heather Dark Salmon',
    'Heather Light Salmon', 'Heather Orange Red', 'Heather Tomato', 'Heather Dark Orange',
    'Heather Bright Orange', 'Heather Dark Golden Rod', 'Heather Golden Rod',
    'Heather Pale Golden Rod', 'Heather Dark Khaki', 'Heather Khaki', 'Heather Bright Yellow',
    'Heather Dark Yellow', 'Heather Light Yellow', 'Heather Lemon Chiffon',
    'Heather Light Golden Rod Yellow', 'Heather Papaya Whip', 'Heather Moccasin',
    'Heather Peach Puff', 'Heather Misty Rose', 'Heather Lavender Blush',
    'Heather Light Linen', 'Heather Old Lace', 'Heather Sea Shell', 'Heather Corn Silk',
    'Heather Light Ivory', 'Heather Honey Dew', 'Heather Mint Cream', 'Heather Azure',
    'Heather Alice Blue', 'Heather Ghost White', 'Heather White Smoke',
    'Heather Light Beige', 'Heather Floral White', 'Heather White', 'Heather Snow',
    'Heather Gainsboro', 'Heather Light Gray', 'Heather Bright Silver', 'Heather Dark Gray',
    'Heather Gray', 'Heather Dim Gray', 'Heather Light Slate Gray', 'Heather Slate Gray',
    'Heather Dark Slate Gray', 'Heather Pure Black'
  ],
  newColors: [
    'Heather Midnight Navy', 'Heather Deep Teal', 'Aqua', 'Heather Mauve', 'Steel Blue',
    'Tan', 'Heather Yellow Gold', 'Heather Dust', 'Ash', 'Vintage White', 'Solid White Blend',
    'Heather Charcoal', 'Heather Slate', 'Heather Stone', 'Heather Sand', 'Heather Cream',
    'Heather Ivory', 'Heather Pearl', 'Heather Silver', 'Heather Bronze', 'Heather Copper',
    'Heather Gunmetal'
  ],
  pastels: ['Light Blue', 'Light Pink', 'Azalea', 'Gold']
};

// Function to get all available colors
export const getAllColors = (): string[] => {
  return Object.keys(COLOR_MAPPING);
};

// Function to get colors by category
export const getColorsByCategory = (category: keyof typeof COLOR_CATEGORIES): string[] => {
  return COLOR_CATEGORIES[category] || [];
};

// Function to get new colors specifically
export const getNewColors = (): string[] => {
  return COLOR_CATEGORIES.newColors;
};

// Function to check if a color is new
export const isNewColor = (colorName: string): boolean => {
  return COLOR_CATEGORIES.newColors.includes(colorName);
};

// Function to get color suggestions based on selected color
export const getColorSuggestions = (selectedColor: string, count: number = 4): string[] => {
  const allColors = getAllColors();
  const selectedIndex = allColors.indexOf(selectedColor);
  
  if (selectedIndex === -1) {
    return allColors.slice(0, count);
  }
  
  const suggestions: string[] = [];
  const totalColors = allColors.length;
  
  // Add colors around the selected color
  for (let i = 1; i <= count; i++) {
    const index = (selectedIndex + i) % totalColors;
    suggestions.push(allColors[index]);
  }
  
  return suggestions;
};

// Function to sort colors by popularity or preference
export const sortColorsByPreference = (colors: string[]): string[] => {
  const preferenceOrder = [
    'Black', 'White', 'Navy', 'Charcoal', 'Sport Grey',
    'Heather Grey', 'Heather Navy', 'Heather Black',
    'Red', 'Royal', 'Natural',
    ...COLOR_CATEGORIES.newColors,
    ...COLOR_CATEGORIES.pastels
  ];
  
  return colors.sort((a, b) => {
    const aIndex = preferenceOrder.indexOf(a);
    const bIndex = preferenceOrder.indexOf(b);
    
    // If both colors are in preference order, sort by that
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one is in preference order, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Otherwise, sort alphabetically
    return a.localeCompare(b);
  });
};
