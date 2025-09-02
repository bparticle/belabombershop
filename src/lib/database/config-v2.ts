/**
 * Environment-Aware Database Configuration
 * 
 * This module provides database configuration with support for environment-specific
 * database connections and settings.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv, logEnvironmentInfo } from '../env-validation-v2';
import { getEnvironmentConfig } from '../../../config/environments';

// Validate environment variables early
const env = getEnv();
const config = getEnvironmentConfig();

// Log environment info in development
if (env.NODE_ENV === 'development') {
  logEnvironmentInfo();
}

// Create the postgres connection string
const connectionString = `postgresql://${env.database.username}:${env.database.password}@${env.database.host}:${env.database.port}/${env.database.name}?sslmode=${env.database.ssl ? 'require' : 'disable'}`;

// Environment-specific postgres client configuration
const clientConfig = {
  // Connection pool settings
  max: env.NODE_ENV === 'development' ? 5 : 20, // More connections in production
  idle_timeout: env.NODE_ENV === 'development' ? 30 : 20,
  connect_timeout: 10,
  
  // Debug settings
  debug: config.features.enableDebugLogging,
  
  // SSL configuration
  ssl: env.database.ssl ? {
    rejectUnauthorized: env.NODE_ENV === 'production',
  } : false,
  
  // Connection retry settings
  connection: {
    max_retries: env.NODE_ENV === 'production' ? 3 : 1,
    retry_delay: 1000,
  },
  
  // Performance settings
  prepare: env.NODE_ENV === 'production', // Use prepared statements in production
  transform: {
    undefined: null, // Transform undefined to null for PostgreSQL
  },
};

// Create the postgres client
const client = postgres(connectionString, clientConfig);

// Create the drizzle database instance with conditional logging
export const db = drizzle(client, {
  logger: config.features.enableQueryLogging ? {
    logQuery: (query: string, params: unknown[]) => {
      const timestamp = new Date().toISOString();
      const environment = env.NODE_ENV.toUpperCase();
      console.log(`🗄️  [${timestamp}] [${environment}] Database Query:`, query);
      if (params && params.length > 0) {
        console.log(`📋 Parameters:`, params);
      }
    },
  } : undefined,
});

// Performance monitoring helper
export const logQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  // Skip performance monitoring if disabled
  if (!config.features.enablePerformanceMonitoring) {
    return queryFn();
  }

  const startTime = performance.now();
  const environment = env.NODE_ENV.toUpperCase();
  console.log(`⚡ [${environment}] Starting query: ${queryName}`);
  
  try {
    const result = await queryFn();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`✅ [${environment}] Query completed: ${queryName} (${duration}ms)`);
    
    // Warn about slow queries
    const slowQueryThreshold = env.NODE_ENV === 'production' ? 2000 : 1000;
    if (duration > slowQueryThreshold) {
      console.warn(`🐌 [${environment}] Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    console.error(`❌ [${environment}] Query failed: ${queryName} (${duration}ms)`, error);
    throw error;
  }
};

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await logQueryPerformance('connection-test', async () => {
      const result = await client`SELECT 1 as test`;
      return result;
    });
    
    console.log(`✅ Database connection successful to ${env.database.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Database connection failed to ${env.database.name}:`, error);
    return false;
  }
}

/**
 * Get database connection info (safe for logging)
 */
export function getDatabaseInfo() {
  return {
    environment: env.NODE_ENV,
    host: env.database.host,
    database: env.database.name,
    port: env.database.port,
    ssl: env.database.ssl,
    features: {
      debugging: config.features.enableDebugLogging,
      queryLogging: config.features.enableQueryLogging,
      performanceMonitoring: config.features.enablePerformanceMonitoring,
    },
  };
}

// Export the client for direct access if needed
export { client as postgresClient };

// Environment-specific connection health check
if (env.NODE_ENV === 'development') {
  // Test connection on startup in development
  testDatabaseConnection().catch(console.error);
}
