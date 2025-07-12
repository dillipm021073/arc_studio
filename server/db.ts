import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from "@shared/schema";
import * as versionControlSchema from "@shared/schema-version-control";
import * as umlSchema from "@shared/schema-uml";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create a standard PostgreSQL pool for local development
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: false // Disable SSL for local development
});

// Combine all schemas
const combinedSchema = {
  ...schema,
  ...versionControlSchema,
  ...umlSchema
};

export const db = drizzle(pool, { schema: combinedSchema });