/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are present
 * and have the correct format. It should be imported early in the application
 * to fail fast if any required variables are missing.
 */

interface EnvironmentVariables {
  PRINTFUL_API_KEY: string;
  NEXT_PUBLIC_SNIPCART_API_KEY?: string;
  SNIPCART_SECRET_KEY?: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

/**
 * Validates that all required environment variables are present
 * @throws Error if any required environment variables are missing
 */
export function validateEnvironmentVariables(): EnvironmentVariables {
  const requiredVars = {
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY,
    NODE_ENV: process.env.NODE_ENV as EnvironmentVariables['NODE_ENV'],
  };

  const optionalVars = {
    NEXT_PUBLIC_SNIPCART_API_KEY: process.env.NEXT_PUBLIC_SNIPCART_API_KEY,
    SNIPCART_SECRET_KEY: process.env.SNIPCART_SECRET_KEY,
  };

  // Check required variables
  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(requiredVars.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${requiredVars.NODE_ENV}. Must be one of: development, production, test`
    );
  }

  // Validate PRINTFUL_API_KEY format (should be a non-empty string)
  if (!requiredVars.PRINTFUL_API_KEY || requiredVars.PRINTFUL_API_KEY.trim() === '') {
    throw new Error('PRINTFUL_API_KEY must be a non-empty string');
  }

  return {
    ...requiredVars,
    ...optionalVars,
  } as EnvironmentVariables;
}

/**
 * Get validated environment variables
 * @returns Validated environment variables object
 */
export function getEnv(): EnvironmentVariables {
  return validateEnvironmentVariables();
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
