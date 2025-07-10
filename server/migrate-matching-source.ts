import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

// Target database configuration - using env10o credentials
const targetConfig = {
  connectionString: 'postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg',
  ssl: false
};

// Create connection pools
const sourcePool = new Pool(sourceConfig);
const targetPool = new Pool(targetConfig);

// List of tables that actually exist in source
const tablesToCopy = [
  'users',
  'applications',
  'interfaces'
];

async function createTablesMatchingSource() {
  console.log('Creating tables in env10o schema matching source structure...\n');

  try {
    // Drop existing tables if they exist to start fresh
    console.log('Dropping existing tables if they exist...');
    for (const table of tablesToCopy.reverse()) {
      await targetPool.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
    tablesToCopy.reverse(); // Restore original order

    // Create tables matching source schema exactly
    const createTableQueries = [
      // Users table - matching source
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Applications table - matching source
      `CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        aml_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        lob TEXT,
        os TEXT,
        deployment TEXT,
        uptime NUMERIC,
        purpose TEXT,
        provides_ext_interface BOOLEAN DEFAULT false,
        prov_interface_type TEXT,
        consumes_ext_interfaces BOOLEAN DEFAULT false,
        cons_interface_type TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        first_active_date TIMESTAMP,
        last_change_date TIMESTAMP DEFAULT NOW(),
        decommission_date TIMESTAMP,
        decommission_reason TEXT,
        decommissioned_by TEXT,
        x_position NUMERIC,
        y_position NUMERIC,
        layer TEXT,
        criticality TEXT,
        team TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Interfaces table - matching source
      `CREATE TABLE IF NOT EXISTS interfaces (
        id SERIAL PRIMARY KEY,
        iml_number TEXT NOT NULL UNIQUE,
        description TEXT,
        provider_application_id INTEGER REFERENCES applications(id),
        consumer_application_id INTEGER REFERENCES applications(id),
        interface_type TEXT NOT NULL,
        middleware TEXT DEFAULT 'None',
        version TEXT NOT NULL DEFAULT '1.0',
        lob TEXT,
        last_change_date TIMESTAMP DEFAULT NOW(),
        business_process_name TEXT,
        customer_focal TEXT,
        provider_owner TEXT,
        consumer_owner TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        sample_code TEXT,
        connectivity_steps TEXT,
        interface_test_steps TEXT,
        data_flow TEXT,
        protocol TEXT,
        frequency TEXT,
        data_volume TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    // Execute each create table query
    for (let i = 0; i < createTableQueries.length; i++) {
      await targetPool.query(createTableQueries[i]);
      console.log(`✅ Created table: ${tablesToCopy[i]}`);
    }

    // Create indexes matching likely source indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_applications_aml ON applications(aml_number)`,
      `CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name)`,
      `CREATE INDEX IF NOT EXISTS idx_interfaces_iml ON interfaces(iml_number)`,
      `CREATE INDEX IF NOT EXISTS idx_interfaces_provider ON interfaces(provider_application_id)`,
      `CREATE INDEX IF NOT EXISTS idx_interfaces_consumer ON interfaces(consumer_application_id)`
    ];

    for (const query of indexQueries) {
      await targetPool.query(query);
    }
    console.log('✅ Created indexes');

    return true;
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    return false;
  }
}

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
    // Get source data
    const sourceResult = await sourcePool.query(`SELECT * FROM "${tableName}" ORDER BY id`);
    const sourceRowCount = sourceResult.rows.length;
    
    if (sourceRowCount === 0) {
      console.log(`⏭️  Skipping ${tableName} - no data in source`);
      return;
    }

    console.log(`📋 Copying ${sourceRowCount} rows to ${tableName}...`);

    // Get column names from first row
    const columns = Object.keys(sourceResult.rows[0]);
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(', ');

    // Begin transaction
    await targetPool.query('BEGIN');

    try {
      // Insert data
      for (let i = 0; i < sourceResult.rows.length; i++) {
        const row = sourceResult.rows[i];
        const values = columns.map(col => row[col]);
        
        await targetPool.query(
          `INSERT INTO "${tableName}" (${columnNames}) VALUES (${placeholders})`,
          values
        );
        
        if ((i + 1) % 10 === 0 || i === sourceResult.rows.length - 1) {
          console.log(`  Inserted ${i + 1}/${sourceRowCount} rows`);
        }
      }

      // Commit transaction
      await targetPool.query('COMMIT');
      console.log(`✅ Successfully copied ${sourceRowCount} rows to ${tableName}`);

      // Reset sequence to max id
      const maxId = Math.max(...sourceResult.rows.map(r => r.id));
      await targetPool.query(
        `SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), $1, true)`,
        [maxId]
      );
      console.log(`  Reset sequence for ${tableName}.id to ${maxId}`);

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
  console.log('Target:', targetConfig.connectionString, '(env10o schema)\n');

  try {
    // Test connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database');
    
    await targetPool.query('SELECT 1');
    console.log('✅ Connected to target database\n');

    // Create tables
    const tablesCreated = await createTablesMatchingSource();
    if (!tablesCreated) {
      console.error('Failed to create tables. Aborting migration.');
      return;
    }

    console.log('\n📊 Starting data migration...\n');

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

    // Update the application to use these credentials
    console.log('\n📝 Next steps:');
    console.log('1. Update your .env file with:');
    console.log('   DATABASE_URL=postgresql://env10o:OnlyForTest123@incetks154:5432/paaspg');
    console.log('2. The application will now use the env10o schema automatically');
    console.log('3. All tables have been created and data has been copied');

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