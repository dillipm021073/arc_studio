import { Pool } from 'pg';

const targetConfig = {
  connectionString: 'postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg',
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
    console.log('Checking with env10o/OnlyForTest123 credentials...\n');
    
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
      console.log(`  ${row.schema_name}: ${row.can_create ? '✅ CAN create tables' : '❌ CANNOT create tables'}`);
    });

    // Check if our tables exist in any schema
    console.log('\nLooking for our application tables:');
    
    let foundTables = 0;
    for (const table of ourTables) {
      const result = await pool.query(`
        SELECT 
          schemaname, 
          tablename
        FROM pg_tables 
        WHERE tablename = $1
        ORDER BY schemaname
      `, [table]);
      
      if (result.rows.length > 0) {
        foundTables++;
        console.log(`✅ Table "${table}" found:`);
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
      }
    }

    if (foundTables === 0) {
      console.log('❌ None of our application tables exist yet');
    }

    // Test if we can create a table
    console.log('\n\nTesting CREATE permission:');
    try {
      await pool.query('CREATE TABLE IF NOT EXISTS test_permission_check (id INT)');
      console.log('✅ Successfully created test table - we have CREATE permissions!');
      await pool.query('DROP TABLE IF EXISTS test_permission_check');
      console.log('✅ Cleaned up test table');
      
      console.log('\n🎉 Good news! We can create tables with these credentials.');
      console.log('We can proceed with the migration.');
    } catch (error: any) {
      console.log('❌ Cannot create tables:', error.message);
    }

  } catch (error: any) {
    console.error('Error connecting:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables().catch(console.error);