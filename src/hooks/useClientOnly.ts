import { useState, useEffect } from 'react';

/**
 * Hook to ensure certain operations only happen on the client side
 * This helps prevent hydration mismatches between server and client
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook to safely get a value that might differ between server and client
 * @param serverValue - The value to use during server-side rendering
 * @param clientValue - The value to use on the client side
 * @returns The appropriate value based on whether we're on server or client
 */
export function useHydrationSafeValue<T>(serverValue: T, clientValue: T): T {
  const isClient = useClientOnly();
  return isClient ? clientValue : serverValue;
}
