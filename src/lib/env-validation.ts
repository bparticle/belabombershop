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
  // Database configuration
  DATABASE_CLIENT: string;
  DATABASE_HOST: string;
  DATABASE_PORT: string;
  DATABASE_NAME: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_SSL: boolean;
}

interface ClientEnvironmentVariables {
  NEXT_PUBLIC_SNIPCART_API_KEY?: string;
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
    // Database variables
    DATABASE_CLIENT: process.env.DATABASE_CLIENT,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_PORT: process.env.DATABASE_PORT,
    DATABASE_NAME: process.env.DATABASE_NAME,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
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

  // Validate database port (should be a number)
  const port = parseInt(requiredVars.DATABASE_PORT);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid DATABASE_PORT: ${requiredVars.DATABASE_PORT}. Must be a valid port number (1-65535)`);
  }

  // Validate DATABASE_SSL (should be a boolean)
  const ssl = process.env.DATABASE_SSL === 'true';

  // Require SNIPCART_SECRET_KEY in production
  if (requiredVars.NODE_ENV === 'production' && !optionalVars.SNIPCART_SECRET_KEY) {
    throw new Error('SNIPCART_SECRET_KEY is required in production for webhook security');
  }

  return {
    ...requiredVars,
    ...optionalVars,
    DATABASE_SSL: ssl,
  } as EnvironmentVariables;
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

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(clientVars.NODE_ENV)) {
    throw new Error(
      `Invalid NODE_ENV: ${clientVars.NODE_ENV}. Must be one of: development, production, test`
    );
  }

  return clientVars as ClientEnvironmentVariables;
}

/**
 * Get validated environment variables
 * @returns Validated environment variables object
 */
export function getEnv(): EnvironmentVariables {
  return validateEnvironmentVariables();
}

/**
 * Get validated client-side environment variables
 * @returns Validated client-side environment variables object
 */
export function getClientEnv(): ClientEnvironmentVariables {
  return validateClientEnvironmentVariables();
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
