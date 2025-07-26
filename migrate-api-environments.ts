import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function migrateApiEnvironments() {
  // Source database connection
  const sourceClient = postgres('postgresql://postgres:postgres@localhost:5432/arc_studio');
  const sourceDb = drizzle(sourceClient);

  // Target database connection
  const targetClient = postgres('postgresql://postgres:postgres@10.236.82.22:31543/arc_studio');
  const targetDb = drizzle(targetClient);

  try {
    console.log('Connecting to databases...');
    
    // Check if api_test_environments exists in source
    const sourceCheck = await sourceDb.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'api_test_environments'
      );
    `);
    
    if (!sourceCheck[0]?.exists) {
      console.log('No api_test_environments table found in source database.');
      return;
    }

    // Get data from source
    console.log('\nFetching api_test_environments from source database...');
    const environments = await sourceDb.execute(sql`
      SELECT * FROM api_test_environments ORDER BY id;
    `);
    
    console.log(`Found ${environments.length} environment records`);

    // Also get related environment variables
    console.log('\nFetching api_test_environment_variables...');
    const variables = await sourceDb.execute(sql`
      SELECT * FROM api_test_environment_variables ORDER BY id;
    `);
    
    console.log(`Found ${variables.length} environment variable records`);

    if (environments.length > 0) {
      // Check if target table exists
      const targetCheck = await targetDb.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'api_test_environments'
        );
      `);
      
      if (!targetCheck[0]?.exists) {
        console.log('\nTarget database does not have api_test_environments table. Please ensure the target database schema is up to date.');
        return;
      }

      // Clear existing data in target
      console.log('\nClearing existing data in target database...');
      await targetDb.execute(sql`DELETE FROM api_test_environment_variables;`);
      await targetDb.execute(sql`DELETE FROM api_test_environments;`);

      // Insert environments
      console.log('\nInserting environments into target database...');
      for (const env of environments) {
        await targetDb.execute(sql`
          INSERT INTO api_test_environments (
            id, collection_id, name, display_name, description, 
            is_active, is_default, color, sort_order, created_at, updated_at
          ) VALUES (
            ${env.id}, ${env.collection_id}, ${env.name}, ${env.display_name}, 
            ${env.description}, ${env.is_active}, ${env.is_default}, 
            ${env.color}, ${env.sort_order}, ${env.created_at}, ${env.updated_at}
          );
        `);
      }

      // Insert environment variables
      if (variables.length > 0) {
        console.log('\nInserting environment variables into target database...');
        for (const variable of variables) {
          await targetDb.execute(sql`
            INSERT INTO api_test_environment_variables (
              id, environment_id, key, value, type, is_secret, 
              description, created_at, updated_at
            ) VALUES (
              ${variable.id}, ${variable.environment_id}, ${variable.key}, 
              ${variable.value}, ${variable.type}, ${variable.is_secret}, 
              ${variable.description}, ${variable.created_at}, ${variable.updated_at}
            );
          `);
        }
      }

      // Update sequences
      console.log('\nUpdating sequences...');
      await targetDb.execute(sql`
        SELECT setval('api_test_environments_id_seq', 
          (SELECT MAX(id) FROM api_test_environments), true);
      `);
      
      if (variables.length > 0) {
        await targetDb.execute(sql`
          SELECT setval('api_test_environment_variables_id_seq', 
            (SELECT MAX(id) FROM api_test_environment_variables), true);
        `);
      }

      // Verify migration
      const targetCount = await targetDb.execute(sql`
        SELECT COUNT(*) as count FROM api_test_environments;
      `);
      
      const targetVarCount = await targetDb.execute(sql`
        SELECT COUNT(*) as count FROM api_test_environment_variables;
      `);
      
      console.log(`\nMigration complete!`);
      console.log(`Target database now has ${targetCount[0]?.count} environments`);
      console.log(`Target database now has ${targetVarCount[0]?.count} environment variables`);
    } else {
      console.log('\nNo data to migrate.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

migrateApiEnvironments();