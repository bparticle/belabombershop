import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getEnv } from '../env-validation';

// Validate environment variables early
const env = getEnv();

// Create the postgres connection
const connectionString = `postgresql://${env.DATABASE_USERNAME}:${env.DATABASE_PASSWORD}@${env.DATABASE_HOST}:${env.DATABASE_PORT}/${env.DATABASE_NAME}?sslmode=${env.DATABASE_SSL ? 'require' : 'disable'}`;

// Create the postgres client
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create the drizzle database instance
export const db = drizzle(client);

// Export the client for direct access if needed
export { client as postgresClient };
