/**
 * Environment Configuration Manager
 * 
 * This module provides a centralized way to manage environment-specific configurations
 * while maintaining security best practices.
 */

export type Environment = 'development' | 'production' | 'test';

export interface EnvironmentConfig {
  // Database configuration
  database: {
    host: string;
    port: number;
    name: string;
    ssl: boolean;
  };
  
  // API URLs
  urls: {
    site: string;
    api: string;
  };
  
  // CORS configuration
  cors: {
    allowedOrigins: string[];
  };
  
  // Feature flags
  features: {
    enableDebugLogging: boolean;
    enableQueryLogging: boolean;
    enablePerformanceMonitoring: boolean;
  };
  
  // Snipcart configuration
  snipcart: {
    mode: 'test' | 'live';
  };
}

/**
 * Development environment configuration
 */
const developmentConfig: EnvironmentConfig = {
  database: {
    host: process.env.DATABASE_HOST_DEV || 'localhost',
    port: parseInt(process.env.DATABASE_PORT_DEV || '5432'),
    name: process.env.DATABASE_NAME_DEV || 'belabomberman_dev',
    ssl: process.env.DATABASE_SSL_DEV === 'true' || false,
  },
  urls: {
    site: process.env.NEXT_PUBLIC_SITE_URL_DEV || 'http://localhost:3000',
    api: process.env.NEXT_PUBLIC_API_URL_DEV || 'http://localhost:3000/api',
  },
  cors: {
    allowedOrigins: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001', // For potential dev server variations
    ],
  },
  features: {
    enableDebugLogging: true,
    enableQueryLogging: true,
    enablePerformanceMonitoring: true,
  },
  snipcart: {
    mode: 'test',
  },
};

/**
 * Production environment configuration
 */
const productionConfig: EnvironmentConfig = {
  database: {
    host: process.env.DATABASE_HOST_PROD || process.env.DATABASE_HOST || '',
    port: parseInt(process.env.DATABASE_PORT_PROD || process.env.DATABASE_PORT || '5432'),
    name: process.env.DATABASE_NAME_PROD || process.env.DATABASE_NAME || '',
    ssl: (process.env.DATABASE_SSL_PROD || process.env.DATABASE_SSL) === 'true',
  },
  urls: {
    site: process.env.NEXT_PUBLIC_SITE_URL_PROD || process.env.NEXT_PUBLIC_SITE_URL || '',
    api: process.env.NEXT_PUBLIC_API_URL_PROD || process.env.NEXT_PUBLIC_API_URL || '',
  },
  cors: {
    allowedOrigins: (
      process.env.ALLOWED_ORIGINS_PROD || 
      process.env.ALLOWED_ORIGINS || 
      ''
    ).split(',').filter(Boolean),
  },
  features: {
    enableDebugLogging: false,
    enableQueryLogging: false,
    enablePerformanceMonitoring: false,
  },
  snipcart: {
    mode: 'live',
  },
};

/**
 * Test environment configuration
 */
const testConfig: EnvironmentConfig = {
  ...developmentConfig,
  database: {
    ...developmentConfig.database,
    name: process.env.DATABASE_NAME_TEST || 'belabomberman_test',
  },
  features: {
    enableDebugLogging: false,
    enableQueryLogging: false,
    enablePerformanceMonitoring: false,
  },
};

/**
 * Get the current environment
 */
export function getCurrentEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;
  
  if (!env || !['development', 'production', 'test'].includes(env)) {
    console.warn(`Invalid NODE_ENV: ${env}. Defaulting to development.`);
    return 'development';
  }
  
  return env;
}

/**
 * Get configuration for the current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getCurrentEnvironment();
  
  switch (env) {
    case 'production':
      return productionConfig;
    case 'test':
      return testConfig;
    case 'development':
    default:
      return developmentConfig;
  }
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return getCurrentEnvironment() === 'development';
}

/**
 * Check if we're in production mode
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Check if we're in test mode
 */
export function isTest(): boolean {
  return getCurrentEnvironment() === 'test';
}

/**
 * Get environment-specific Snipcart API key
 */
export function getSnipcartApiKey(): string {
  const env = getCurrentEnvironment();
  
  // Try environment-specific keys first
  const envKey = env === 'production' 
    ? process.env.NEXT_PUBLIC_SNIPCART_API_KEY_PROD
    : process.env.NEXT_PUBLIC_SNIPCART_API_KEY_DEV;
    
  // Fall back to generic key
  return envKey || process.env.NEXT_PUBLIC_SNIPCART_API_KEY || '';
}

/**
 * Get environment-specific Snipcart secret key
 */
export function getSnipcartSecretKey(): string {
  const env = getCurrentEnvironment();
  
  // Try environment-specific keys first
  const envKey = env === 'production' 
    ? process.env.SNIPCART_SECRET_KEY_PROD
    : process.env.SNIPCART_SECRET_KEY_DEV;
    
  // Fall back to generic key
  return envKey || process.env.SNIPCART_SECRET_KEY || '';
}

/**
 * Get environment-specific database connection string
 */
export function getDatabaseConfig() {
  const config = getEnvironmentConfig();
  const env = getCurrentEnvironment();
  
  // Try environment-specific credentials first
  const username = env === 'production'
    ? process.env.DATABASE_USERNAME_PROD || process.env.DATABASE_USERNAME
    : process.env.DATABASE_USERNAME_DEV || process.env.DATABASE_USERNAME;
    
  const password = env === 'production'
    ? process.env.DATABASE_PASSWORD_PROD || process.env.DATABASE_PASSWORD
    : process.env.DATABASE_PASSWORD_DEV || process.env.DATABASE_PASSWORD;
  
  return {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    username: username || '',
    password: password || '',
    ssl: config.database.ssl,
  };
}
