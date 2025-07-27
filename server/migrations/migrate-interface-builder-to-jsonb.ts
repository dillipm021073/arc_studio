import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Load environment variables
config();

async function migrateInterfaceBuilderToJsonb() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error("DATABASE_URL not found in environment variables");
    process.exit(1);
  }

  console.log("🔄 Starting migration to JSONB for interface_builder_projects...");
  
  // Create postgres connection
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  try {
    // Check if columns are already JSONB
    const checkQuery = sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interface_builder_projects' 
      AND column_name IN ('nodes', 'edges', 'metadata')
    `;
    
    const columns = await db.execute(checkQuery);
    
    const needsMigration = columns.some((col: any) => col.data_type === 'text');
    
    if (!needsMigration) {
      console.log("✅ Columns are already JSONB. No migration needed.");
      await client.end();
      return;
    }

    console.log("📋 Current column types:");
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Use postgres.js transaction
    await client.begin(async (sql) => {
      console.log("🔧 Converting nodes column to JSONB...");
      await sql`
        ALTER TABLE interface_builder_projects 
        ALTER COLUMN nodes TYPE JSONB 
        USING nodes::JSONB
      `;

      console.log("🔧 Converting edges column to JSONB...");
      await sql`
        ALTER TABLE interface_builder_projects 
        ALTER COLUMN edges TYPE JSONB 
        USING edges::JSONB
      `;

      console.log("🔧 Converting metadata column to JSONB...");
      await sql`
        ALTER TABLE interface_builder_projects 
        ALTER COLUMN metadata TYPE JSONB 
        USING CASE 
          WHEN metadata IS NULL THEN NULL 
          ELSE metadata::JSONB 
        END
      `;

      console.log("📊 Creating GIN indexes for better JSONB performance...");
      
      // Create indexes for better performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_interface_builder_projects_nodes 
        ON interface_builder_projects USING GIN (nodes)
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_interface_builder_projects_edges 
        ON interface_builder_projects USING GIN (edges)
      `;
    });

    console.log("✅ Migration completed successfully!");

    // Verify the migration
    const verifyQuery = sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'interface_builder_projects' 
      AND column_name IN ('nodes', 'edges', 'metadata')
    `;
    
    const newColumns = await db.execute(verifyQuery);
    
    console.log("\n📋 New column types:");
    newColumns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // Get row count
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM interface_builder_projects
    `);
    
    console.log(`\n📊 Total projects in database: ${countResult[0].count}`);

    // Optional: Create the assets table for future use
    console.log("\n🔧 Creating interface_builder_assets table for future binary storage...");
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS interface_builder_assets (
        id SERIAL PRIMARY KEY,
        asset_id TEXT NOT NULL UNIQUE,
        project_id TEXT NOT NULL REFERENCES interface_builder_projects(project_id) ON DELETE CASCADE,
        node_id TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_interface_builder_assets_project 
      ON interface_builder_assets(project_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_interface_builder_assets_node 
      ON interface_builder_assets(project_id, node_id)
    `);

    console.log("✅ Assets table created successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    // Transaction automatically rolls back on error with postgres.js
    console.log("🔄 Transaction automatically rolled back");
    
    await client.end();
    process.exit(1);
  }

  // Close connection
  await client.end();
  console.log("\n✅ Database connection closed");
  console.log("🎉 Migration completed successfully!");
}

// Run the migration
migrateInterfaceBuilderToJsonb().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});