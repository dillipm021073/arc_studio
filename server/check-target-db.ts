import { Pool } from 'pg';

const targetConfig = {
  connectionString: 'postgresql://env10:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

const pool = new Pool(targetConfig);

async function checkDatabase() {
  try {
    console.log('Checking target database...\n');
    
    // Get current schema
    const schemaResult = await pool.query('SELECT current_schema()');
    console.log('Current schema:', schemaResult.rows[0].current_schema);
    
    // Get all schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schema_name
    `);
    console.log('\nAvailable schemas:');
    schemasResult.rows.forEach(row => console.log('  -', row.schema_name));
    
    // Get all tables in current schema
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = current_schema()
      ORDER BY tablename
    `);
    console.log('\nTables in current schema:');
    if (tablesResult.rows.length === 0) {
      console.log('  (no tables found)');
    } else {
      tablesResult.rows.forEach(row => console.log('  -', row.tablename));
    }
    
    // Check if our tables exist in any schema
    const ourTables = ['users', 'applications', 'interfaces', 'changeRequests'];
    console.log('\nChecking for our tables in any schema:');
    
    for (const table of ourTables) {
      const result = await pool.query(`
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE tablename = $1
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`  - ${table}: found in schema '${result.rows[0].schemaname}'`);
      } else {
        console.log(`  - ${table}: not found`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase().catch(console.error);