import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Target database connection
const targetConnectionString = 'postgresql://env10:OnlyForTest123@incetks154:5432/paaspg';

async function createSchema() {
  console.log('Creating schema in target database...');
  
  const client = postgres(targetConnectionString);
  const db = drizzle(client, { schema });

  try {
    // Create tables in order of dependencies
    const createTableQueries = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Applications table
      `CREATE TABLE IF NOT EXISTS applications (
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
      `CREATE TABLE IF NOT EXISTS interfaces (
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
      `CREATE TABLE IF NOT EXISTS "changeRequests" (
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
      `CREATE TABLE IF NOT EXISTS "changeRequestApplications" (
        id SERIAL PRIMARY KEY,
        change_request_id INTEGER REFERENCES "changeRequests"(id) ON DELETE CASCADE,
        application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
        impact_type VARCHAR(50)
      )`,
      
      // Change Request Interfaces junction table
      `CREATE TABLE IF NOT EXISTS "changeRequestInterfaces" (
        id SERIAL PRIMARY KEY,
        change_request_id INTEGER REFERENCES "changeRequests"(id) ON DELETE CASCADE,
        interface_id INTEGER REFERENCES interfaces(id) ON DELETE CASCADE,
        impact_type VARCHAR(50)
      )`,
      
      // Business Processes table
      `CREATE TABLE IF NOT EXISTS "businessProcesses" (
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
      `CREATE TABLE IF NOT EXISTS "interfaceBusinessProcesses" (
        id SERIAL PRIMARY KEY,
        interface_id INTEGER REFERENCES interfaces(id) ON DELETE CASCADE,
        business_process_id INTEGER REFERENCES "businessProcesses"(id) ON DELETE CASCADE,
        sequence_number INTEGER,
        consumer_description TEXT,
        consumer_response TEXT
      )`,
      
      // Interface Builder Projects table
      `CREATE TABLE IF NOT EXISTS "interfaceBuilderProjects" (
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
      `CREATE TABLE IF NOT EXISTS "auditLogs" (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
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
      await client.unsafe(query);
      const tableName = query.match(/CREATE TABLE IF NOT EXISTS "?(\w+)"?/)?.[1];
      console.log(`✅ Created table: ${tableName}`);
    }

    // Create indexes
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_applications_name ON applications(name)`,
      `CREATE INDEX IF NOT EXISTS idx_interfaces_iml ON interfaces("imlNumber")`,
      `CREATE INDEX IF NOT EXISTS idx_change_requests_cr ON "changeRequests"("crNumber")`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON "auditLogs"(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON "auditLogs"(entity_type, entity_id)`
    ];

    for (const query of indexQueries) {
      await client.unsafe(query);
    }
    console.log('✅ Created indexes');

    console.log('\n🎉 Schema created successfully in target database!');

  } catch (error) {
    console.error('❌ Error creating schema:', error);
  } finally {
    await client.end();
  }
}

createSchema().catch(console.error);