import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Source database configuration
const sourceConfig = {
  connectionString: 'postgresql://postgres:postgres@10.236.82.22:31543/aml_iml',
  ssl: false
};

const sourcePool = new Pool(sourceConfig);

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

function escapeValue(value: any): string {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return `'${value.toISOString()}'`;
  
  // Escape single quotes in strings
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

async function generateMigrationSQL() {
  const outputFile = path.join(process.cwd(), 'migration-scripts.sql');
  let sqlContent = `-- Migration script generated on ${new Date().toISOString()}
-- Source: postgresql://postgres:postgres@10.236.82.22:31543/aml_iml
-- Target: env10o schema in paaspg database

-- Set the target schema
SET search_path TO env10o;

-- Create tables
`;

  try {
    console.log('🚀 Generating migration SQL scripts...\n');

    // Add CREATE TABLE statements
    sqlContent += `
-- Users table
CREATE TABLE IF NOT EXISTS env10o.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Applications table
CREATE TABLE IF NOT EXISTS env10o.applications (
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
);

-- Interfaces table
CREATE TABLE IF NOT EXISTS env10o.interfaces (
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
);

-- Change Requests table
CREATE TABLE IF NOT EXISTS env10o."changeRequests" (
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
);

-- Change Request Applications junction table
CREATE TABLE IF NOT EXISTS env10o."changeRequestApplications" (
  id SERIAL PRIMARY KEY,
  change_request_id INTEGER REFERENCES env10o."changeRequests"(id) ON DELETE CASCADE,
  application_id INTEGER REFERENCES env10o.applications(id) ON DELETE CASCADE,
  impact_type VARCHAR(50)
);

-- Change Request Interfaces junction table
CREATE TABLE IF NOT EXISTS env10o."changeRequestInterfaces" (
  id SERIAL PRIMARY KEY,
  change_request_id INTEGER REFERENCES env10o."changeRequests"(id) ON DELETE CASCADE,
  interface_id INTEGER REFERENCES env10o.interfaces(id) ON DELETE CASCADE,
  impact_type VARCHAR(50)
);

-- Business Processes table
CREATE TABLE IF NOT EXISTS env10o."businessProcesses" (
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
);

-- Interface Business Processes junction table
CREATE TABLE IF NOT EXISTS env10o."interfaceBusinessProcesses" (
  id SERIAL PRIMARY KEY,
  interface_id INTEGER REFERENCES env10o.interfaces(id) ON DELETE CASCADE,
  business_process_id INTEGER REFERENCES env10o."businessProcesses"(id) ON DELETE CASCADE,
  sequence_number INTEGER,
  consumer_description TEXT,
  consumer_response TEXT
);

-- Interface Builder Projects table
CREATE TABLE IF NOT EXISTS env10o."interfaceBuilderProjects" (
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
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS env10o."auditLogs" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES env10o.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_applications_name ON env10o.applications(name);
CREATE INDEX IF NOT EXISTS idx_interfaces_iml ON env10o.interfaces("imlNumber");
CREATE INDEX IF NOT EXISTS idx_change_requests_cr ON env10o."changeRequests"("crNumber");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON env10o."auditLogs"(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON env10o."auditLogs"(entity_type, entity_id);

-- Insert data
`;

    // Connect to source and generate INSERT statements
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database\n');

    for (const table of tablesToCopy) {
      console.log(`Processing ${table}...`);
      
      try {
        const result = await sourcePool.query(`SELECT * FROM "${table}" ORDER BY id`);
        
        if (result.rows.length === 0) {
          sqlContent += `\n-- No data to insert for ${table}\n`;
          console.log(`  ⏭️  No data in ${table}`);
          continue;
        }

        sqlContent += `\n-- Insert data for ${table} (${result.rows.length} rows)\n`;
        
        // Generate INSERT statements
        for (const row of result.rows) {
          const columns = Object.keys(row);
          const columnNames = columns.map(col => `"${col}"`).join(', ');
          const values = columns.map(col => escapeValue(row[col])).join(', ');
          
          sqlContent += `INSERT INTO env10o."${table}" (${columnNames}) VALUES (${values});\n`;
        }

        // Add sequence reset if table has id column
        if (result.rows.length > 0 && 'id' in result.rows[0]) {
          const maxId = Math.max(...result.rows.map(r => r.id));
          sqlContent += `SELECT setval(pg_get_serial_sequence('env10o."${table}"', 'id'), ${maxId}, true);\n`;
        }

        console.log(`  ✅ Generated ${result.rows.length} INSERT statements`);
        
      } catch (error) {
        console.error(`  ❌ Error processing ${table}:`, error);
        sqlContent += `\n-- Error processing ${table}: ${error}\n`;
      }
    }

    // Add commit at the end
    sqlContent += '\n-- Commit the transaction\nCOMMIT;\n';

    // Write to file
    fs.writeFileSync(outputFile, sqlContent);
    console.log(`\n✅ Migration script saved to: ${outputFile}`);
    console.log('\n📌 Instructions for database administrator:');
    console.log('1. Review the generated SQL script');
    console.log('2. Connect to the target database as a user with CREATE permissions');
    console.log('3. Run the script to create tables and insert data');
    console.log('4. Verify the migration was successful');

  } catch (error) {
    console.error('❌ Error generating migration script:', error);
  } finally {
    await sourcePool.end();
  }
}

generateMigrationSQL().catch(console.error);