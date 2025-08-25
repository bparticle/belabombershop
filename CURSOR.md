# Headless Dropshipping Starter - Codebase Documentation

## 🏗️ Project Overview

This is a **headless eCommerce storefront** built with Next.js that integrates **Printful** (print-on-demand fulfillment) with **Snipcart** (shopping cart & checkout) to create a complete dropshipping solution. The application allows users to sell custom merchandise without holding inventory.

**Live Demo**: https://demo.headlessdropshipping.com  
**Creator**: Jamie Barton (@notrab) - https://notrab.dev

## 🛠️ Tech Stack

### Core Technologies
- **Next.js 12.1.0** - React framework with SSR/SSG
- **React 17.0.2** - UI library
- **TypeScript 4.5.5** - Type safety
- **Tailwind CSS 3.3.2** - Utility-first CSS framework

### Key Dependencies
- **printful-request 2.0.0** - Printful API client
- **next-seo 4.28.1** - SEO optimization
- **classcat 5.0.4** - CSS class utilities
- **lodash.shuffle 4.2.0** - Array shuffling for product display

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🏛️ Architecture

### File Structure
```
src/
├── components/          # React components
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions & API clients
├── pages/              # Next.js pages & API routes
├── styles/             # Global styles
└── types.ts            # TypeScript type definitions
```

### Key Components

#### Core Components
- **Layout.tsx** - Main layout wrapper with header, navigation, and footer
- **ProductGrid.tsx** - Displays products in a responsive grid
- **Product.tsx** - Individual product card with variant selection
- **VariantPicker.tsx** - Product variant selector (size, color, etc.)
- **Hero.tsx** - Landing page hero section

#### Context & State Management
- **wishlist.tsx** - Wishlist functionality with localStorage persistence
- **useLocalStorage.tsx** - Custom hook for localStorage operations
- **useSnipcartCount.tsx** - Cart item count tracking
- **useWishlistDispatch.ts** - Wishlist actions
- **useWishlistState.ts** - Wishlist state management

## 🔌 Third-Party Integrations

### 1. Printful Integration
**Purpose**: Print-on-demand fulfillment service

**Key Features**:
- Product catalog management
- Real-time shipping rate calculation
- Automatic order fulfillment
- VAT/tax calculation
- Product variant management

**API Endpoints Used**:
- `GET /sync/products` - Fetch all products
- `GET /sync/products/{id}` - Get specific product details
- `GET /store/variants/{id}` - Get variant information
- `POST /shipping/rates` - Calculate shipping costs
- `POST /orders` - Create new orders
- `POST /orders/estimate-costs` - Calculate order costs including taxes

**Configuration**:
- Requires `PRINTFUL_API_KEY` environment variable
- Products must be configured in Printful dashboard
- Shipping preferences configured in Printful settings

### 2. Snipcart Integration
**Purpose**: Shopping cart and checkout system

**Key Features**:
- Shopping cart functionality
- Secure payment processing
- Webhook-based order management
- Real-time shipping calculation
- Tax calculation
- Customer account management

**API Endpoints**:
- `/api/snipcart/webhook` - Order completion webhook
- `/api/snipcart/shipping` - Shipping rate calculation
- `/api/snipcart/tax` - Tax calculation

**Configuration**:
- Requires `NEXT_PUBLIC_SNIPCART_API_KEY` environment variable
- Webhook URLs must be configured in Snipcart dashboard
- Payment gateways (Stripe, etc.) must be connected

## 🛍️ E-commerce Flow

### 1. Product Display
- Products fetched from Printful API at build time (`getStaticProps`)
- Products displayed in responsive grid layout
- Each product shows variants (size, color, etc.)
- Wishlist functionality with localStorage persistence

### 2. Shopping Cart
- Snipcart handles cart functionality via JavaScript SDK
- Products added via `snipcart-add-item` data attributes
- Real-time cart updates and item count display
- Cart persists across browser sessions

### 3. Checkout Process
- Snipcart provides secure checkout interface
- Real-time shipping rates calculated via Printful API
- Tax calculation (VAT) handled by Printful
- Multiple payment methods supported

### 4. Order Fulfillment
- Order completion triggers webhook to `/api/snipcart/webhook`
- Order automatically created in Printful via API
- Printful handles printing, packaging, and shipping
- Customer receives tracking information

## 🔧 API Routes

### Product API
- `GET /api/products/[id]` - Returns product variant information for Snipcart

### Snipcart Webhooks
- `POST /api/snipcart/webhook` - Handles order completion
- `POST /api/snipcart/shipping` - Calculates shipping rates
- `POST /api/snipcart/tax` - Calculates taxes (VAT)

## 🎨 UI/UX Features

### Design System
- **Tailwind CSS** for styling
- **Inter font** for typography
- **Responsive design** for mobile/desktop
- **Modern card-based layout**

### User Experience
- **Wishlist functionality** with heart icons
- **Variant selection** (size, color picker)
- **Real-time cart updates** with visual indicators
- **Smooth transitions** and hover effects
- **Accessibility features** (ARIA labels, keyboard navigation)

### Navigation
- **Header navigation** with About and Terms links
- **User account** access via Snipcart
- **Wishlist page** for saved items
- **Cart checkout** button with item count

## 🔐 Security & Configuration

### Environment Variables
```bash
PRINTFUL_API_KEY=your_printful_api_key
NEXT_PUBLIC_SNIPCART_API_KEY=your_snipcart_public_key
```

### Security Features
- **Webhook validation** (currently disabled in code)
- **API key protection** (server-side only)
- **HTTPS enforcement** (production)
- **Input validation** on API routes

## 🚀 Deployment

### Vercel Deployment
- **One-click deploy** available
- **Automatic builds** from Git
- **Environment variables** configuration
- **CDN optimization** for images

### Local Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

## 📊 Performance Optimizations

### Next.js Features
- **Static Site Generation** for product pages
- **Image optimization** with Next.js Image component
- **Code splitting** and lazy loading
- **Caching headers** for API responses

### SEO Features
- **next-seo** for meta tags
- **Structured data** for products
- **Sitemap generation** (if configured)
- **Open Graph** tags

## 🔄 Data Flow

1. **Build Time**: Products fetched from Printful and statically generated
2. **Runtime**: User interactions handled by React state and Snipcart
3. **Checkout**: Snipcart processes payment and triggers webhook
4. **Fulfillment**: Webhook creates order in Printful for automatic fulfillment

## 🛠️ Customization Points

### Styling
- Modify `tailwind.config.js` for theme customization
- Update `src/styles/app.css` for global styles
- Component-specific styles in individual component files

### Functionality
- Add new product types in Printful
- Customize shipping rules in Printful dashboard
- Modify tax calculation logic in `/api/snipcart/tax`
- Add new payment methods in Snipcart

### Features
- Wishlist functionality can be extended
- Product filtering and search can be added
- Customer reviews and ratings system
- Inventory management features

## 📝 Development Notes

### Current Limitations
- Webhook validation is disabled (commented out)
- Limited product filtering/search
- No inventory management
- Basic error handling

### Potential Improvements
- Add product search and filtering
- Implement webhook validation
- Add customer reviews
- Enhanced error handling and logging
- Analytics integration
- A/B testing capabilities

## 🔗 External Resources

- **Printful API Documentation**: https://developers.printful.com/
- **Snipcart Documentation**: https://docs.snipcart.com/
- **Next.js Documentation**: https://nextjs.org/docs
- **Tailwind CSS Documentation**: https://tailwindcss.com/docs

---

*This documentation serves as a comprehensive reference for understanding and working with the Headless Dropshipping Starter codebase.*
