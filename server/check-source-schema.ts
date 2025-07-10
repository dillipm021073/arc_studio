import { Pool } from 'pg';

const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

const sourcePool = new Pool(sourceConfig);

const tablesToCheck = [
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

async function checkSourceSchema() {
  try {
    console.log('Checking source database schema...\n');
    
    for (const table of tablesToCheck) {
      console.log(`\n📋 Table: ${table}`);
      console.log('━'.repeat(50));
      
      try {
        // Get column information
        const columnResult = await sourcePool.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);
        
        if (columnResult.rows.length === 0) {
          console.log('❌ Table not found');
          continue;
        }
        
        console.log('Columns:');
        columnResult.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
        });
        
        // Get row count
        const countResult = await sourcePool.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`\nRow count: ${countResult.rows[0].count}`);
        
      } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sourcePool.end();
  }
}

checkSourceSchema().catch(console.error);