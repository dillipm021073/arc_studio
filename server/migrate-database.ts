import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

// Target database configuration
const targetConfig = {
  connectionString: 'postgresql://env10:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

// Create connection pools
const sourcePool = new Pool(sourceConfig);
const targetPool = new Pool(targetConfig);

// List of tables to copy
const tablesToCopy = [
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

async function getTableRowCount(pool: Pool, tableName: string): Promise<number> {
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM "${tableName}"`);
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`Error counting rows in ${tableName}:`, error);
    return -1;
  }
}

async function copyTableData(sourcePool: Pool, targetPool: Pool, tableName: string) {
  try {
    // Check if target table is empty
    const targetRowCount = await getTableRowCount(targetPool, tableName);
    
    if (targetRowCount === -1) {
      console.log(`❌ Table ${tableName} doesn't exist in target database`);
      return;
    }
    
    if (targetRowCount > 0) {
      console.log(`⏭️  Skipping ${tableName} - already has ${targetRowCount} rows`);
      return;
    }

    // Get source data
    const sourceResult = await sourcePool.query(`SELECT * FROM "${tableName}"`);
    const sourceRowCount = sourceResult.rows.length;
    
    if (sourceRowCount === 0) {
      console.log(`⏭️  Skipping ${tableName} - no data in source`);
      return;
    }

    console.log(`📋 Copying ${sourceRowCount} rows to ${tableName}...`);

    // Get column names
    const columns = Object.keys(sourceResult.rows[0]);
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    // Begin transaction
    await targetPool.query('BEGIN');

    try {
      // Insert data in batches
      const batchSize = 100;
      for (let i = 0; i < sourceResult.rows.length; i += batchSize) {
        const batch = sourceResult.rows.slice(i, i + batchSize);
        
        for (const row of batch) {
          const values = columns.map(col => row[col]);
          await targetPool.query(
            `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`  Inserted ${Math.min(i + batchSize, sourceResult.rows.length)}/${sourceRowCount} rows`);
      }

      // Commit transaction
      await targetPool.query('COMMIT');
      console.log(`✅ Successfully copied ${sourceRowCount} rows to ${tableName}`);

      // Reset sequences if table has id column
      if (columns.includes('id')) {
        const maxId = await targetPool.query(`SELECT MAX(id) FROM "${tableName}"`);
        const maxIdValue = maxId.rows[0].max || 0;
        await targetPool.query(
          `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), $1, true)`,
          [maxIdValue]
        );
        console.log(`  Reset sequence for ${tableName}.id to ${maxIdValue}`);
      }

    } catch (error) {
      await targetPool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error(`❌ Error copying ${tableName}:`, error);
  }
}

async function migrateDatabase() {
  console.log('🚀 Starting database migration...\n');
  console.log('Source:', sourceConfig.connectionString);
  console.log('Target:', targetConfig.connectionString, '\n');

  try {
    // Test connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database');
    
    await targetPool.query('SELECT 1');
    console.log('✅ Connected to target database\n');

    // Copy each table
    for (const table of tablesToCopy) {
      await copyTableData(sourcePool, targetPool, table);
    }

    console.log('\n🎉 Migration completed!');

    // Show summary
    console.log('\n📊 Summary:');
    for (const table of tablesToCopy) {
      const targetCount = await getTableRowCount(targetPool, table);
      if (targetCount > 0) {
        console.log(`  ${table}: ${targetCount} rows`);
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    await sourcePool.end();
    await targetPool.end();
  }
}

// Run migration
migrateDatabase().catch(console.error);