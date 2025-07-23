import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {
  apiTestEnvironments,
  apiTestEnvironmentVariables,
  apiTestCollections,
  apiTestRequests,
  apiTestHistory,
  apiTestGlobalVariables
} from '../shared/schema';
import { sql } from 'drizzle-orm';

// Source database (current local database)
const SOURCE_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/arc_studio';

// Target database
const TARGET_DATABASE_URL = 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml';

async function migrateApiTestData() {
  console.log('Starting API Test data migration...');
  
  // Create connections
  const sourceClient = postgres(SOURCE_DATABASE_URL);
  const targetClient = postgres(TARGET_DATABASE_URL);
  
  const sourceDb = drizzle(sourceClient);
  const targetDb = drizzle(targetClient);
  
  try {
    // 1. Migrate Collections
    console.log('\n1. Migrating API Test Collections...');
    const collections = await sourceDb.select().from(apiTestCollections);
    console.log(`Found ${collections.length} collections to migrate`);
    
    if (collections.length > 0) {
      // Clear existing collections in target (optional - comment out if you want to keep existing data)
      await targetDb.delete(apiTestCollections);
      
      // Insert collections
      for (const collection of collections) {
        await targetDb.insert(apiTestCollections).values(collection);
      }
      console.log(`✓ Migrated ${collections.length} collections`);
    }
    
    // 2. Migrate Environments
    console.log('\n2. Migrating API Test Environments...');
    const environments = await sourceDb.select().from(apiTestEnvironments);
    console.log(`Found ${environments.length} environments to migrate`);
    
    if (environments.length > 0) {
      // Clear existing environments in target (optional)
      await targetDb.delete(apiTestEnvironments);
      
      // Insert environments
      for (const environment of environments) {
        await targetDb.insert(apiTestEnvironments).values(environment);
      }
      console.log(`✓ Migrated ${environments.length} environments`);
    }
    
    // 3. Migrate Environment Variables
    console.log('\n3. Migrating API Test Environment Variables...');
    const envVariables = await sourceDb.select().from(apiTestEnvironmentVariables);
    console.log(`Found ${envVariables.length} environment variables to migrate`);
    
    if (envVariables.length > 0) {
      // Clear existing variables in target (optional)
      await targetDb.delete(apiTestEnvironmentVariables);
      
      // Insert environment variables
      for (const variable of envVariables) {
        await targetDb.insert(apiTestEnvironmentVariables).values(variable);
      }
      console.log(`✓ Migrated ${envVariables.length} environment variables`);
    }
    
    // 4. Migrate Requests
    console.log('\n4. Migrating API Test Requests...');
    const requests = await sourceDb.select().from(apiTestRequests);
    console.log(`Found ${requests.length} requests to migrate`);
    
    if (requests.length > 0) {
      // Clear existing requests in target (optional)
      await targetDb.delete(apiTestRequests);
      
      // Insert requests
      for (const request of requests) {
        await targetDb.insert(apiTestRequests).values(request);
      }
      console.log(`✓ Migrated ${requests.length} requests`);
    }
    
    // 5. Migrate History (optional - can be large)
    console.log('\n5. Migrating API Test History...');
    const history = await sourceDb.select().from(apiTestHistory);
    console.log(`Found ${history.length} history records to migrate`);
    
    if (history.length > 0) {
      // Clear existing history in target (optional)
      await targetDb.delete(apiTestHistory);
      
      // Insert history records in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < history.length; i += batchSize) {
        const batch = history.slice(i, i + batchSize);
        for (const record of batch) {
          await targetDb.insert(apiTestHistory).values(record);
        }
        console.log(`  Migrated ${Math.min(i + batchSize, history.length)} / ${history.length} history records`);
      }
      console.log(`✓ Migrated ${history.length} history records`);
    }
    
    // 6. Migrate Global Variables
    console.log('\n6. Migrating API Test Global Variables...');
    const globalVars = await sourceDb.select().from(apiTestGlobalVariables);
    console.log(`Found ${globalVars.length} global variables to migrate`);
    
    if (globalVars.length > 0) {
      // Clear existing global variables in target (optional)
      await targetDb.delete(apiTestGlobalVariables);
      
      // Insert global variables
      for (const variable of globalVars) {
        await targetDb.insert(apiTestGlobalVariables).values(variable);
      }
      console.log(`✓ Migrated ${globalVars.length} global variables`);
    }
    
    console.log('\n✅ Migration completed successfully!');
    
    // Verify migration by counting records in target
    console.log('\nVerifying migration in target database:');
    const targetCounts = {
      collections: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestCollections),
      environments: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestEnvironments),
      envVariables: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestEnvironmentVariables),
      requests: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestRequests),
      history: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestHistory),
      globalVars: await targetDb.select({ count: sql<number>`count(*)` }).from(apiTestGlobalVariables)
    };
    
    console.log('Target database now contains:');
    console.log(`- Collections: ${targetCounts.collections[0].count}`);
    console.log(`- Environments: ${targetCounts.environments[0].count}`);
    console.log(`- Environment Variables: ${targetCounts.envVariables[0].count}`);
    console.log(`- Requests: ${targetCounts.requests[0].count}`);
    console.log(`- History: ${targetCounts.history[0].count}`);
    console.log(`- Global Variables: ${targetCounts.globalVars[0].count}`);
    
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
migrateApiTestData()
  .then(() => {
    console.log('\n🎉 Migration script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });