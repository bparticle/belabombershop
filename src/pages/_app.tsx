import type { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import "tailwindcss/tailwind.css";
import "../styles/app.css";

import { defaultSEO } from "../../next-seo.config";
import { WishlistProvider } from "../context/wishlist";
import { ThemeProvider } from "../context/theme";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import { useSnipcartTheme } from "../hooks/useSnipcartTheme";
import { validateEnvironmentVariables } from "../lib/env-validation";

function MyApp({ Component, pageProps }: AppProps) {
  // Validate environment variables on app startup
  try {
    validateEnvironmentVariables();
  } catch (error) {
    // In production, this should cause the app to fail fast
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    // In development, log the error but don't crash
    if (process.env.NODE_ENV === 'development') {
      console.error('Environment validation failed:', error);
    }
  }

  // Add Snipcart event handling and theme sync
  if (typeof window !== 'undefined') {
    // Ensure Snipcart is loaded
    window.addEventListener('load', () => {
      if (window.Snipcart) {
        // Handle order completion
        window.Snipcart.subscribe('order.completed', (order: any) => {
          // Clear any potential routing conflicts
          setTimeout(() => {
            window.location.href = '/success';
          }, 100);
        });
      }
    });
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WishlistProvider>
          <SnipcartThemeSync />
          <Layout>
            <DefaultSeo {...defaultSEO} />
            <Component {...pageProps} />
          </Layout>
        </WishlistProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to handle Snipcart theme synchronization
function SnipcartThemeSync() {
  useSnipcartTheme();
  return null;
}

export default MyApp;
