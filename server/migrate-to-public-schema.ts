import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

// Target database configuration - using public schema
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

async function createTablesInPublicSchema() {
  console.log('Creating tables in public schema...\n');

  try {
    // Set schema to public
    await targetPool.query('SET search_path TO public');

    // Create tables in order of dependencies
    const createTableQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Applications table
      `CREATE TABLE IF NOT EXISTS public.applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        "OS" VARCHAR(255),
        deployment VARCHAR(255),
        uptime DECIMAL(5,2),
        purpose TEXT,
        provides_ext_interface BOOLEAN DEFAULT false,
        prov_interface_type VARCHAR(255),
        consumes_ext_interfaces BOOLEAN DEFAULT false,
        cons_interface_type VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        "firstActiveDate" TIMESTAMP,
        "lastChangeDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Interfaces table
      `CREATE TABLE IF NOT EXISTS public.interfaces (
        id SERIAL PRIMARY KEY,
        provider_application_name VARCHAR(255),
        consumer_application_name VARCHAR(255),
        "imlNumber" VARCHAR(50) UNIQUE,
        "interfaceType" VARCHAR(50),
        version VARCHAR(50),
        "businessProcessName" VARCHAR(255),
        "customerFocal" VARCHAR(255),
        "providerOwner" VARCHAR(255),
        "consumerOwner" VARCHAR(255),
        status VARCHAR(50) DEFAULT 'active',
        "lastChangeDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Change Requests table
      `CREATE TABLE IF NOT EXISTS public."changeRequests" (
        id SERIAL PRIMARY KEY,
        "crNumber" VARCHAR(50) UNIQUE,
        description TEXT,
        reason TEXT,
        benefit TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        status_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Change Request Applications junction table
      `CREATE TABLE IF NOT EXISTS public."changeRequestApplications" (
        id SERIAL PRIMARY KEY,
        change_request_id INTEGER REFERENCES public."changeRequests"(id) ON DELETE CASCADE,
        application_id INTEGER REFERENCES public.applications(id) ON DELETE CASCADE,
        impact_type VARCHAR(50)
      )`,
      
      // Change Request Interfaces junction table
      `CREATE TABLE IF NOT EXISTS public."changeRequestInterfaces" (
        id SERIAL PRIMARY KEY,
        change_request_id INTEGER REFERENCES public."changeRequests"(id) ON DELETE CASCADE,
        interface_id INTEGER REFERENCES public.interfaces(id) ON DELETE CASCADE,
        impact_type VARCHAR(50)
      )`,
      
      // Business Processes table
      `CREATE TABLE IF NOT EXISTS public."businessProcesses" (
        id SERIAL PRIMARY KEY,
        "businessProcess" VARCHAR(255) NOT NULL,
        "LOB" VARCHAR(255),
        product VARCHAR(255),
        version VARCHAR(50),
        "domainOwner" VARCHAR(255),
        "itOwner" VARCHAR(255),
        "vendorFocal" VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Interface Business Processes junction table
      `CREATE TABLE IF NOT EXISTS public."interfaceBusinessProcesses" (
        id SERIAL PRIMARY KEY,
        interface_id INTEGER REFERENCES public.interfaces(id) ON DELETE CASCADE,
        business_process_id INTEGER REFERENCES public."businessProcesses"(id) ON DELETE CASCADE,
        sequence_number INTEGER,
        consumer_description TEXT,
        consumer_response TEXT
      )`,
      
      // Interface Builder Projects table
      `CREATE TABLE IF NOT EXISTS public."interfaceBuilderProjects" (
        id SERIAL PRIMARY KEY,
        "projectId" VARCHAR(255) UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        nodes TEXT,
        edges TEXT,
        viewport TEXT,
        metadata TEXT,
        "isTeamProject" BOOLEAN DEFAULT false,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Audit Logs table
      `CREATE TABLE IF NOT EXISTS public."auditLogs" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(id),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50),
        entity_id INTEGER,
        changes JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Execute each create table query
    for (const query of createTableQueries) {
      await targetPool.query(query);
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS public\."?(\w+)"?/)?.[1];
      console.log(`✅ Created table: public.${tableName}`);
    }

    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_applications_name ON public.applications(name)`,
      `CREATE INDEX IF NOT EXISTS idx_interfaces_iml ON public.interfaces("imlNumber")`,
      `CREATE INDEX IF NOT EXISTS idx_change_requests_cr ON public."changeRequests"("crNumber")`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public."auditLogs"(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public."auditLogs"(entity_type, entity_id)`
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

async function getTableRowCount(pool: Pool, schema: string, tableName: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM ${schema}."${tableName}"`
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error(`Error counting rows in ${schema}.${tableName}:`, error);
    return -1;
  }
}

async function copyTableData(sourcePool: Pool, targetPool: Pool, tableName: string) {
  try {
    // Check if target table is empty
    const targetRowCount = await getTableRowCount(targetPool, 'public', tableName);
    
    if (targetRowCount === -1) {
      console.log(`❌ Table public.${tableName} doesn't exist in target database`);
      return;
    }
    
    if (targetRowCount > 0) {
      console.log(`⏭️  Skipping public.${tableName} - already has ${targetRowCount} rows`);
      return;
    }

    // Get source data
    const sourceResult = await sourcePool.query(`SELECT * FROM "${tableName}"`);
    const sourceRowCount = sourceResult.rows.length;
    
    if (sourceRowCount === 0) {
      console.log(`⏭️  Skipping ${tableName} - no data in source`);
      return;
    }

    console.log(`📋 Copying ${sourceRowCount} rows to public.${tableName}...`);

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
            `INSERT INTO public."${tableName}" (${columnNames}) VALUES (${placeholders})`,
            values
          );
        }
        
        console.log(`  Inserted ${Math.min(i + batchSize, sourceResult.rows.length)}/${sourceRowCount} rows`);
      }

      // Commit transaction
      await targetPool.query('COMMIT');
      console.log(`✅ Successfully copied ${sourceRowCount} rows to public.${tableName}`);

      // Reset sequences if table has id column
      if (columns.includes('id')) {
        const maxId = await targetPool.query(`SELECT MAX(id) FROM public."${tableName}"`);
        const maxIdValue = maxId.rows[0].max || 0;
        await targetPool.query(
          `SELECT setval(pg_get_serial_sequence('public."${tableName}"', 'id'), $1, true)`,
          [maxIdValue]
        );
        console.log(`  Reset sequence for public.${tableName}.id to ${maxIdValue}`);
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
  console.log('🚀 Starting database migration to public schema...\n');
  console.log('Source:', sourceConfig.connectionString);
  console.log('Target:', targetConfig.connectionString, '(public schema)\n');

  try {
    // Test connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database');
    
    await targetPool.query('SELECT 1');
    console.log('✅ Connected to target database\n');

    // Create tables in public schema
    const tablesCreated = await createTablesInPublicSchema();
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
      const targetCount = await getTableRowCount(targetPool, 'public', table);
      if (targetCount > 0) {
        console.log(`  public.${table}: ${targetCount} rows`);
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