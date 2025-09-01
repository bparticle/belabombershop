import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '../env-validation';

// Validate environment variables early
const env = getEnv();

// Create the postgres connection
const connectionString = `postgresql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}?sslmode=${env.DATABASE_SSL ? 'require' : 'disable'}`;

// Configure postgres client with optimized settings
const client = postgres(connectionString, {
  max: env.NODE_ENV === 'development' ? 5 : 10, // Reduce connections in dev
  idle_timeout: env.NODE_ENV === 'development' ? 30 : 20, // Longer timeout in dev
  connect_timeout: 10, // Connection timeout in seconds
  debug: env.NODE_ENV === 'development', // Enable query logging in development
});

// Create the drizzle database instance with optional logging
export const db = drizzle(client, {
  logger: env.NODE_ENV === 'development' ? {
    logQuery: (query: string, params: unknown[]) => {
      const timestamp = new Date().toISOString();
      console.log(`🗄️  [${timestamp}] Database Query:`, query);
      if (params && params.length > 0) {
        console.log(`📋 Parameters:`, params);
      }
    },
  } : undefined,
});

// Performance monitoring helper for development
export const logQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  // In production, just execute the query without logging
  if (env.NODE_ENV !== 'development') {
    return queryFn();
  }

  const startTime = performance.now();
  console.log(`⚡ Starting query: ${queryName}`);
  
  try {
    const result = await queryFn();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    console.log(`✅ Query completed: ${queryName} (${duration}ms)`);
    
    // Warn about slow queries in development only
    if (duration > 1000) {
      console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    console.error(`❌ Query failed: ${queryName} (${duration}ms)`, error);
    throw error;
  }
};

// Export the client for direct access if needed
export { client as postgresClient };
