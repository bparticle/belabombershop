/**
 * Enhanced Environment Variable Validation
 * 
 * This module provides environment validation with support for environment-specific
 * configurations and graceful fallbacks.
 */

import { 
  getCurrentEnvironment, 
  getEnvironmentConfig, 
  getDatabaseConfig, 
  getSnipcartApiKey, 
  getSnipcartSecretKey,
  type Environment 
} from '../../config/environments';

interface ValidatedEnvironment {
  // Core environment
  NODE_ENV: Environment;
  
  // Database configuration
  database: {
    client: string;
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
    ssl: boolean;
  };
  
  // API Keys
  PRINTFUL_API_KEY: string;
  snipcart: {
    publicKey: string;
    secretKey?: string;
  };
  
  // Cloudinary
  cloudinary: {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    publicCloudName: string;
  };
  
  // Authentication
  JWT_SECRET: string;
  ADMIN_PASSWORD?: string;
  
  // URLs and CORS
  urls: {
    site: string;
    api: string;
  };
  cors: {
    allowedOrigins: string[];
  };
}

/**
 * Validates environment variables with environment-specific support
 */
export function validateEnvironmentVariables(): ValidatedEnvironment {
  const env = getCurrentEnvironment();
  const config = getEnvironmentConfig();
  const dbConfig = getDatabaseConfig();
  
  // Core required variables
  const coreVars = {
    PRINTFUL_API_KEY: process.env.PRINTFUL_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  
  // Database variables (with environment-specific fallbacks)
  const databaseVars = {
    DATABASE_CLIENT: process.env.DATABASE_CLIENT || 'postgres',
    ...dbConfig,
  };
  
  // Cloudinary variables
  const cloudinaryVars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  };
  
  // Snipcart variables (environment-aware)
  const snipcartPublicKey = getSnipcartApiKey();
  const snipcartSecretKey = getSnipcartSecretKey();
  
  // Check required core variables
  const missingCoreVars = Object.entries(coreVars)
    .filter(([_, value]) => !value || value.trim() === '')
    .map(([key]) => key);
    
  // Check required database variables
  const missingDbVars = Object.entries(databaseVars)
    .filter(([key, value]) => key !== 'ssl' && (!value || value.toString().trim() === ''))
    .map(([key]) => key);
    
  // Check required Cloudinary variables
  const missingCloudinaryVars = Object.entries(cloudinaryVars)
    .filter(([_, value]) => !value || value.trim() === '')
    .map(([key]) => key);
  
  const allMissingVars = [...missingCoreVars, ...missingDbVars, ...missingCloudinaryVars];
  
  if (allMissingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for ${env}: ${allMissingVars.join(', ')}`
    );
  }
  
  // Validate Snipcart configuration
  if (!snipcartPublicKey && env !== 'test') {
    console.warn(`⚠️  No Snipcart public key found for ${env} environment`);
  }
  
  if (env === 'production' && !snipcartSecretKey) {
    throw new Error('SNIPCART_SECRET_KEY is required in production for webhook security');
  }
  
  // Validate database port
  const port = parseInt(databaseVars.port?.toString() || '5432');
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid DATABASE_PORT: ${databaseVars.port}. Must be a valid port number (1-65535)`);
  }
  
  // Get CORS origins
  const allowedOrigins = config.cors.allowedOrigins.length > 0 
    ? config.cors.allowedOrigins 
    : (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
  
  return {
    NODE_ENV: env,
    database: {
      client: databaseVars.DATABASE_CLIENT,
      host: databaseVars.host,
      port,
      name: databaseVars.database,
      username: databaseVars.username,
      password: databaseVars.password,
      ssl: databaseVars.ssl,
    },
    PRINTFUL_API_KEY: coreVars.PRINTFUL_API_KEY!,
    snipcart: {
      publicKey: snipcartPublicKey,
      secretKey: snipcartSecretKey,
    },
    cloudinary: {
      cloudName: cloudinaryVars.CLOUDINARY_CLOUD_NAME!,
      apiKey: cloudinaryVars.CLOUDINARY_API_KEY!,
      apiSecret: cloudinaryVars.CLOUDINARY_API_SECRET!,
      publicCloudName: cloudinaryVars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
    },
    JWT_SECRET: coreVars.JWT_SECRET!,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    urls: {
      site: config.urls.site,
      api: config.urls.api,
    },
    cors: {
      allowedOrigins,
    },
  };
}

/**
 * Get validated environment variables
 */
export function getEnv(): ValidatedEnvironment {
  return validateEnvironmentVariables();
}

/**
 * Log environment configuration (safely, without secrets)
 */
export function logEnvironmentInfo(): void {
  const env = getCurrentEnvironment();
  const config = getEnvironmentConfig();
  
  console.log(`🌍 Environment: ${env}`);
  console.log(`🗄️  Database: ${config.database.name} on ${config.database.host}`);
  console.log(`🔗 Site URL: ${config.urls.site}`);
  console.log(`🛒 Snipcart Mode: ${config.snipcart.mode}`);
  console.log(`🔧 Debug Logging: ${config.features.enableDebugLogging ? 'enabled' : 'disabled'}`);
}
