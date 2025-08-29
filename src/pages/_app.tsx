import { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import "tailwindcss/tailwind.css";
import "../styles/app.css";

import { defaultSEO } from "../../next-seo.config";
import { WishlistProvider } from "../context/wishlist";
import { ThemeProvider } from "../context/theme";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <WishlistProvider>
          <Layout>
            <DefaultSeo {...defaultSEO} />
            <Component {...pageProps} />
          </Layout>
        </WishlistProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
