import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  apiTestEnvironments,
  apiTestEnvironmentVariables
} from '../shared/schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Source database (current database from environment variable)
const SOURCE_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/arc_studio';

// Target database - schema will be set via search_path
const TARGET_DATABASE_URL = 'postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg';

async function migrateEnvironmentsOnly() {
  console.log('Starting Environments-only migration...');
  console.log(`Source DB: ${SOURCE_DATABASE_URL.replace(/:[^@]+@/, ':****@')}`);
  console.log(`Target DB: ${TARGET_DATABASE_URL.replace(/:[^@]+@/, ':****@')}`);
  
  // Create connections
  const sourceClient = postgres(SOURCE_DATABASE_URL);
  const targetClient = postgres(TARGET_DATABASE_URL);
  
  const sourceDb = drizzle(sourceClient);
  const targetDb = drizzle(targetClient);
  
  try {
    // Set the schema for the target database
    await targetClient`SET search_path TO env10o`;
    console.log('Set schema to env10o for target database');
    
    // 1. Migrate Environments
    console.log('\n1. Migrating API Test Environments...');
    const environments = await sourceDb.select().from(apiTestEnvironments);
    console.log(`Found ${environments.length} environments to migrate`);
    
    if (environments.length > 0) {
      // First, check if environments already exist in target
      const existingEnvs = await targetDb.select().from(apiTestEnvironments);
      console.log(`Target database already has ${existingEnvs.length} environments`);
      
      // For now, we'll skip clearing existing data
      // If you want to clear existing data, uncomment the lines below:
      // await targetDb.delete(apiTestEnvironments);
      // console.log('Cleared existing environments in target database');
      
      // Insert environments
      for (const environment of environments) {
        try {
          await targetDb.insert(apiTestEnvironments).values(environment);
          console.log(`✓ Migrated environment: ${environment.displayName} (${environment.name})`);
        } catch (error) {
          console.error(`❌ Failed to migrate environment ${environment.name}:`, error);
        }
      }
      console.log(`✓ Migrated ${environments.length} environments`);
    }
    
    // 2. Migrate Environment Variables
    console.log('\n2. Migrating API Test Environment Variables...');
    const envVariables = await sourceDb.select().from(apiTestEnvironmentVariables);
    console.log(`Found ${envVariables.length} environment variables to migrate`);
    
    if (envVariables.length > 0) {
      // If you want to clear existing variables, uncomment the lines below:
      // await targetDb.delete(apiTestEnvironmentVariables);
      // console.log('Cleared existing environment variables in target database');
      
      // Insert environment variables
      for (const variable of envVariables) {
        try {
          await targetDb.insert(apiTestEnvironmentVariables).values(variable);
          console.log(`✓ Migrated variable: ${variable.key} for environment ID ${variable.environmentId}`);
        } catch (error) {
          console.error(`❌ Failed to migrate variable ${variable.key}:`, error);
        }
      }
      console.log(`✓ Migrated ${envVariables.length} environment variables`);
    }
    
    console.log('\n✅ Environment migration completed successfully!');
    
    // Verify migration by counting records in target
    console.log('\nVerifying migration in target database:');
    const targetEnvCount = await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestEnvironments);
    const targetVarCount = await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestEnvironmentVariables);
    
    console.log('Target database now contains:');
    console.log(`- Environments: ${targetEnvCount[0].count}`);
    console.log(`- Environment Variables: ${targetVarCount[0].count}`);
    
    // Show environment details
    const targetEnvironments = await targetDb.select().from(apiTestEnvironments);
    console.log('\nEnvironments in target database:');
    for (const env of targetEnvironments) {
      const varCount = await targetDb
        .select({ count: sql<number>`count(*)` })
        .from(apiTestEnvironmentVariables)
        .where(sql`${apiTestEnvironmentVariables.environmentId} = ${env.id}`);
      
      console.log(`- ${env.displayName} (${env.name}): ${varCount[0].count} variables`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Close connections
    await sourceClient.end();
    await targetClient.end();
  }
}

// Run migration
migrateEnvironmentsOnly()
  .then(() => {
    console.log('\n🎉 Environment migration completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Environment migration failed:', error);
    process.exit(1);
  });