import { Pool } from 'pg';

const targetConfig = {
  connectionString: 'postgresql://env10:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

const pool = new Pool(targetConfig);

// Our application tables
const ourTables = [
  'users',
  'applications',
  'interfaces',
  'changeRequests',
  'changeRequestApplications',
  'changeRequestInterfaces',
  'businessProcesses',
  'interfaceBusinessProcesses',
  'interfaceBuilderProjects',
  'auditLogs'
];

async function checkTables() {
  try {
    console.log('Checking for existing tables in target database...\n');
    
    // Get current user and schema
    const userResult = await pool.query('SELECT current_user, current_schema()');
    console.log('Current user:', userResult.rows[0].current_user);
    console.log('Current schema:', userResult.rows[0].current_schema, '\n');

    // Check permissions
    const permResult = await pool.query(`
      SELECT schema_name, has_schema_privilege(current_user, schema_name, 'CREATE') as can_create
      FROM information_schema.schemata
      WHERE schema_name IN ('public', 'env10o', current_schema())
    `);
    console.log('Schema permissions:');
    permResult.rows.forEach(row => {
      console.log(`  ${row.schema_name}: ${row.can_create ? 'CAN create tables' : 'CANNOT create tables'}`);
    });

    // Check if our tables exist in any schema
    console.log('\nLooking for our application tables:');
    
    for (const table of ourTables) {
      const result = await pool.query(`
        SELECT 
          schemaname, 
          tablename,
          (SELECT COUNT(*) FROM pg_tables WHERE tablename = $1) as total_count
        FROM pg_tables 
        WHERE tablename = $1
        ORDER BY schemaname
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`\n✅ Table "${table}" found:`);
        for (const row of result.rows) {
          // Get row count for this specific table
          try {
            const countResult = await pool.query(
              `SELECT COUNT(*) as count FROM "${row.schemaname}"."${row.tablename}"`
            );
            console.log(`   - ${row.schemaname}.${row.tablename}: ${countResult.rows[0].count} rows`);
          } catch (e) {
            console.log(`   - ${row.schemaname}.${row.tablename}: (unable to count rows)`);
          }
        }
      } else {
        console.log(`❌ Table "${table}" not found in any schema`);
      }
    }

    // Check if we can query the env10o schema tables
    console.log('\n\nTrying to access tables in env10o schema:');
    try {
      await pool.query('SET search_path TO env10o');
      const testResult = await pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'env10o'");
      console.log(`Can access env10o schema - found ${testResult.rows[0].count} tables`);
    } catch (error: any) {
      console.log('Cannot access env10o schema:', error.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);