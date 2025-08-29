# Dark Mode Implementation Guide

## Overview

This document outlines the comprehensive dark mode system implemented for the Bela Bomberman e-commerce site. The system provides automatic system preference detection, manual theme switching, and seamless integration with iPad and other devices.

## Features

### 🎯 Core Features
- **Manual Theme Toggle**: Users can manually switch between light and dark modes
- **Persistent Storage**: Theme preference is saved in localStorage and persists across sessions
- **Real-time Updates**: Theme changes are applied immediately without page refresh
- **iPad Compatibility**: Optimized for iPad system-wide dark mode settings

### 🎨 Visual Enhancements
- **Dynamic Logo Switching**: Automatically switches between black and white logo versions
- **Image Visibility**: Enhanced image contrast and brightness for dark mode
- **Snipcart Integration**: Full dark mode support for shopping cart and checkout
- **Smooth Transitions**: All theme changes include smooth color transitions

## Technical Implementation

### 1. Theme Context System

**File**: `src/context/theme.tsx`

The theme system uses React Context to manage theme state across the entire application:

```typescript
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isSystem: boolean;
}
```

**Key Features**:
- System preference detection using `window.matchMedia('(prefers-color-scheme: dark)')`
- Automatic theme application to document root
- localStorage persistence
- Real-time system preference change listening

### 2. Tailwind Configuration

**File**: `tailwind.config.js`

```javascript
module.exports = {
  darkMode: "class", // Enable class-based dark mode
  // ... other config
}
```

**Benefits**:
- Class-based approach for better control
- No flash of unstyled content (FOUC)
- Consistent with Tailwind's design system

### 3. Theme Toggle Component

**File**: `src/components/ThemeToggle.tsx`

A dropdown toggle component that provides:
- Minimal SVG icons for light and dark modes
- Dropdown menu for theme selection
- Keyboard accessibility
- Click-outside-to-close functionality

## Component Updates

### Layout Component
- **Dynamic Logo**: Switches between `bomberlogo_black.svg` and `bomberlogo_white.svg`
- **Background Colors**: Dark backgrounds for header, main, and footer
- **Text Colors**: Proper contrast for all text elements
- **Theme Toggle**: Integrated in the header navigation

### Product Detail Page
- **Image Containers**: Dark backgrounds for product images
- **Image Enhancement**: CSS filters for better visibility in dark mode
- **Text Contrast**: All text elements have proper dark mode colors
- **Interactive Elements**: Buttons and links with dark mode hover states

### Product Grid & Cards
- **Card Backgrounds**: Dark backgrounds for product cards
- **Image Visibility**: Enhanced contrast for product thumbnails
- **Color Indicators**: Dark mode compatible color circles and badges

## CSS Enhancements

### Snipcart Integration
**File**: `src/styles/app.css`

Comprehensive dark mode styles for the shopping cart:
- Modal backgrounds and text colors
- Form inputs and buttons
- Shipping and payment sections
- Error states and validation

### Image Handling
```css
/* Ensure images are visible in dark mode */
.dark img {
  filter: brightness(1.1) contrast(1.1);
}

/* Product images specific dark mode handling */
.dark .product-image-container {
  @apply bg-gray-800;
}

.dark .product-image-container img {
  filter: brightness(1.05);
}
```

## File Structure

```
src/
├── context/
│   └── theme.tsx              # Theme context and provider
├── components/
│   ├── ThemeToggle.tsx        # Theme toggle component
│   ├── Layout.tsx             # Updated with dark mode
│   ├── ProductCard.tsx        # Updated with dark mode
│   └── ProductGrid.tsx        # Updated with dark mode
├── pages/
│   ├── _app.tsx              # ThemeProvider wrapper
│   ├── index.tsx             # Updated with dark mode
│   └── product/[id].tsx      # Updated with dark mode
└── styles/
    └── app.css               # Dark mode CSS overrides

public/
├── bomberlogo_black.svg      # Light mode logo
└── bomberlogo_white.svg      # Dark mode logo
```

## Usage Examples

### Using the Theme Hook
```typescript
import { useTheme } from '../context/theme';

function MyComponent() {
  const { theme, setTheme, isDark } = useTheme();
  
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <p>Current theme: {theme}</p>
      <p>Is dark mode: {isDark ? 'Yes' : 'No'}</p>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
}
```

### Conditional Logo Rendering
```typescript
import { useTheme } from '../context/theme';

function Logo() {
  const { isDark } = useTheme();
  
  return (
    <img 
      src={isDark ? "/bomberlogo_white.svg" : "/bomberlogo_black.svg"}
      alt="Logo"
    />
  );
}
```

## iPad and Mobile Optimization

### System Integration
- **Automatic Detection**: Detects iPad system-wide dark mode setting
- **Real-time Updates**: Responds to system preference changes
- **Smooth Transitions**: No jarring color changes when switching themes

### Image Visibility
- **Enhanced Contrast**: Product images are automatically brightened in dark mode
- **Background Fixes**: Dark backgrounds prevent image blending issues
- **Consistent Experience**: Same visual quality across all devices

## Testing

### Manual Testing Checklist
- [ ] System preference detection works
- [ ] Manual theme switching works
- [ ] Theme persists across page refreshes
- [ ] Images are visible in dark mode
- [ ] Snipcart components work in dark mode
- [ ] iPad system dark mode integration works
- [ ] All text has proper contrast
- [ ] Smooth transitions between themes

### Browser Testing
- [ ] Chrome (desktop and mobile)
- [ ] Safari (desktop and iPad)
- [ ] Firefox
- [ ] Edge

## Future Enhancements

### Potential Improvements
1. **Animation Preferences**: Respect user's motion preferences
2. **Custom Color Schemes**: Allow users to customize accent colors
3. **High Contrast Mode**: Additional accessibility option
4. **Theme Scheduling**: Automatic theme switching based on time
5. **Export/Import**: Allow users to share theme preferences

### Performance Optimizations
1. **CSS-in-JS**: Consider moving to CSS-in-JS for better tree-shaking
2. **Image Optimization**: WebP format for logos
3. **Bundle Splitting**: Separate theme-specific code

## Troubleshooting

### Common Issues

**Images not visible in dark mode**
- Check if `.dark img` CSS rules are applied
- Verify image containers have proper background colors
- Ensure CSS filters are working correctly

**Theme not persisting**
- Check localStorage implementation
- Verify ThemeProvider is wrapping the app
- Ensure theme context is properly initialized

**Snipcart not themed**
- Verify dark mode CSS classes are applied
- Check if Snipcart styles are being overridden
- Ensure proper CSS specificity

### Debug Commands
```javascript
// Check current theme
console.log(localStorage.getItem('theme'));

// Check system preference
console.log(window.matchMedia('(prefers-color-scheme: dark)').matches);

// Force theme change
document.documentElement.classList.add('dark');
```

## Conclusion

The dark mode implementation provides a comprehensive, user-friendly experience that respects system preferences while offering manual control. The system is optimized for iPad and mobile devices, ensuring consistent functionality across all platforms.

The modular architecture makes it easy to maintain and extend, while the comprehensive documentation ensures future developers can understand and modify the system as needed.
