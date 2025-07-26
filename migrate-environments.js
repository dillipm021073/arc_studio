import { PrismaClient } from '@prisma/client';

async function migrateEnvironments() {
  // Source database
  const sourceDb = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@localhost:5432/arc_studio'
      }
    }
  });

  // Target database
  const targetDb = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:postgres@10.236.82.22:31543/arc_studio'
      }
    }
  });

  try {
    console.log('Connecting to source database...');
    await sourceDb.$connect();
    
    console.log('Connecting to target database...');
    await targetDb.$connect();

    console.log('Fetching environments from source database...');
    const environments = await sourceDb.environment.findMany();
    
    console.log(`Found ${environments.length} environments to migrate`);

    if (environments.length > 0) {
      console.log('Clearing existing environments in target database...');
      await targetDb.environment.deleteMany({});

      console.log('Inserting environments into target database...');
      const result = await targetDb.environment.createMany({
        data: environments,
        skipDuplicates: true
      });

      console.log(`Successfully migrated ${result.count} environments`);
    } else {
      console.log('No environments found to migrate');
    }

    // Verify migration
    const targetCount = await targetDb.environment.count();
    console.log(`\nVerification: Target database now has ${targetCount} environments`);

    // Show sample data
    const sample = await targetDb.environment.findFirst();
    if (sample) {
      console.log('\nSample migrated environment:');
      console.log(sample);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
  }
}

migrateEnvironments();