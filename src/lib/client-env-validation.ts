/**
 * Client-Side Environment Variable Validation
 * 
 * This module validates only client-side environment variables.
 * It should be imported in client-side code to avoid bundling server-side secrets.
 */

interface ClientEnvironmentVariables {
  NEXT_PUBLIC_SNIPCART_API_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates client-side environment variables only
 * This function is safe to call on the client side
 * @throws Error if any required client-side environment variables are missing
 */
export function validateClientEnvironmentVariables(): ClientEnvironmentVariables {
  const clientVars = {
    NEXT_PUBLIC_SNIPCART_API_KEY: process.env.NEXT_PUBLIC_SNIPCART_API_KEY,
    NODE_ENV: process.env.NODE_ENV as ClientEnvironmentVariables['NODE_ENV'],
  };

  // Check required variables
  const missingVars = Object.entries(clientVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required client environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(clientVars.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${clientVars.NODE_ENV}. Must be one of: development, production, test`
    );
  }

  return clientVars;
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}
