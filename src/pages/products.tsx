import { useEffect } from 'react';
import { useRouter } from 'next/router';

/**
 * Products redirect page
 * 
 * Redirects users to the homepage which now shows all products with filters
 * to maintain backwards compatibility
 */
const ProductsPage = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect to homepage which now shows all products with filters
    router.replace('/');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Redirecting to Our Collection...
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we take you to our complete product collection.
        </p>
      </div>
    </div>
  );
};

export default ProductsPage;
