import { AppProps } from "next/app";
import { DefaultSeo } from "next-seo";

import "tailwindcss/tailwind.css";
import "../styles/app.css";

import { defaultSEO } from "../../next-seo.config";
import { WishlistProvider } from "../context/wishlist";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <WishlistProvider>
        <Layout>
          <DefaultSeo {...defaultSEO} />
          <Component {...pageProps} />
        </Layout>
      </WishlistProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
