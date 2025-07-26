import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

async function checkEnvironments() {
  // Source database connection
  const sourceClient = postgres('postgresql://postgres:postgres@localhost:5432/arc_studio');
  const sourceDb = drizzle(sourceClient);

  try {
    console.log('Checking for environments table in source database...');
    
    // Check if environments table exists
    const tables = await sourceDb.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%environment%'
      ORDER BY table_name;
    `);
    
    console.log('\nTables containing "environment":', tables);

    // If environments table exists, get its structure
    const checkTable = await sourceDb.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'environments'
      );
    `);
    
    if (checkTable[0]?.exists) {
      console.log('\nFound environments table!');
      
      // Get column info
      const columns = await sourceDb.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'environments'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nColumns:', columns);
      
      // Get sample data
      const data = await sourceDb.execute(sql`
        SELECT * FROM environments LIMIT 5;
      `);
      
      console.log('\nSample data:', data);
      
      // Get count
      const count = await sourceDb.execute(sql`
        SELECT COUNT(*) as count FROM environments;
      `);
      
      console.log('\nTotal records:', count[0]?.count);
    } else {
      console.log('\nNo "environments" table found in the database.');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sourceClient.end();
  }
}

checkEnvironments();