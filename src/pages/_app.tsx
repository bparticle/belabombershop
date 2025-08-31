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
import { validateClientEnvironmentVariables } from "../lib/client-env-validation";

function MyApp({ Component, pageProps }: AppProps) {
  // Validate client-side environment variables on app startup
  try {
    validateClientEnvironmentVariables();
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
    // Function to setup Snipcart event handlers
    const setupSnipcartHandlers = () => {
      if (window.Snipcart && typeof window.Snipcart.subscribe === 'function') {
        try {
          // Handle order completion
          window.Snipcart.subscribe('order.completed', (order: any) => {
            // Clear any potential routing conflicts
            setTimeout(() => {
              window.location.href = '/success';
            }, 100);
          });
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Snipcart event handlers setup successfully');
          }
          return true;
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error setting up Snipcart handlers:', error);
          }
          return false;
        }
      }
      return false;
    };

    // Try to setup handlers immediately
    if (!setupSnipcartHandlers()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Snipcart not ready immediately, waiting for load event...');
      }
      
      // If not ready, wait for load event and then poll
      window.addEventListener('load', () => {
        // Try immediately after load
        if (!setupSnipcartHandlers()) {
          if (process.env.NODE_ENV === 'development') {
            console.log('Snipcart still not ready after load, starting polling...');
          }
          
          // If still not ready, poll every 100ms for up to 5 seconds
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          
          const pollInterval = setInterval(() => {
            attempts++;
            if (setupSnipcartHandlers()) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`Snipcart ready after ${attempts * 100}ms`);
              }
              clearInterval(pollInterval);
            } else if (attempts >= maxAttempts) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('Snipcart failed to load within 5 seconds');
              }
              clearInterval(pollInterval);
            }
          }, 100);
        }
      });
    }
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
