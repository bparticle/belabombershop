import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

import ErrorBoundary from '../components/ErrorBoundary';

const SuccessPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to ensure Snipcart has finished processing
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing your order...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Head>
        <title>Order Successful - Bela Bomberman</title>
        <meta name="description" content="Thank you for your order!" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6">
            <svg
              className="h-8 w-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Order Successful!
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for your purchase! You will receive an email confirmation shortly with your order details.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Continue Shopping
            </Link>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <p>Need help? Contact us at support@belabomberman.com</p>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SuccessPage;
