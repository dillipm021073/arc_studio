import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

// Database connection
const connectionString = "postgresql://postgres:postgres@localhost:5432/arc_studio";

async function checkDatabaseStatus() {
  console.log("Connecting to database:", connectionString);
  console.log("=".repeat(80));

  try {
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    // Check if we can connect
    const result = await client`SELECT current_database(), current_user, version()`;
    console.log("Database connection successful!");
    console.log("Database:", result[0].current_database);
    console.log("User:", result[0].current_user);
    console.log("PostgreSQL version:", result[0].version);
    console.log("=".repeat(80));

    // Get all tables in the public schema
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;

    console.log("\nExisting tables in database:");
    console.log("-".repeat(40));
    
    const tableNames = tables.map(t => t.table_name);
    tableNames.forEach(name => console.log(`  - ${name}`));
    
    console.log(`\nTotal tables: ${tableNames.length}`);
    console.log("=".repeat(80));

    // Check row counts for each table
    console.log("\nRow counts per table:");
    console.log("-".repeat(40));
    
    for (const tableName of tableNames) {
      try {
        const countResult = await client`SELECT COUNT(*) as count FROM ${client(tableName)}`;
        console.log(`  ${tableName}: ${countResult[0].count} rows`);
      } catch (err) {
        console.log(`  ${tableName}: Error counting rows`);
      }
    }

    console.log("=".repeat(80));

    // Required tables based on CLAUDE.md
    const requiredTables = [
      // Core tables
      { name: "applications", desc: "AML - Application Master List" },
      { name: "interfaces", desc: "IML - Interface Master List" },
      { name: "business_processes", desc: "Business Processes" },
      { name: "change_requests", desc: "Change Requests" },
      { name: "users", desc: "Users for authentication" },
      
      // Relationship tables
      { name: "business_process_interfaces", desc: "IML-BP relationship with sequence" },
      { name: "change_request_applications", desc: "CR impact on applications" },
      { name: "change_request_interfaces", desc: "CR impact on interfaces" },
      
      // Additional functionality
      { name: "iml_diagrams", desc: "Diagram storage for IML visualizations" },
      { name: "internal_activities", desc: "Internal activities within applications" },
      { name: "technical_processes", desc: "Technical processes" },
      
      // Version control tables
      { name: "initiatives", desc: "Version control initiatives" },
      { name: "artifact_versions", desc: "Version tracking for all artifacts" },
      { name: "version_conflicts", desc: "Conflict tracking between versions" },
      
      // RBAC tables
      { name: "roles", desc: "User roles" },
      { name: "permissions", desc: "System permissions" },
      { name: "role_permissions", desc: "Role-permission mapping" },
      { name: "user_roles", desc: "User-role mapping" },
    ];

    console.log("\nRequired tables status:");
    console.log("-".repeat(60));
    
    const missingTables: string[] = [];
    
    for (const reqTable of requiredTables) {
      const exists = tableNames.includes(reqTable.name);
      const status = exists ? "✅ EXISTS" : "❌ MISSING";
      console.log(`  ${status} - ${reqTable.name.padEnd(35)} - ${reqTable.desc}`);
      
      if (!exists) {
        missingTables.push(reqTable.name);
      }
    }

    console.log("=".repeat(80));
    
    if (missingTables.length > 0) {
      console.log("\n⚠️  Missing tables detected!");
      console.log("The following tables need to be created:");
      missingTables.forEach(t => console.log(`  - ${t}`));
      
      console.log("\nTo create missing tables, run:");
      console.log("  npm run db:push");
      console.log("  npm run db:seed");
    } else {
      console.log("\n✅ All required tables exist!");
    }

    // Check for version control tables specifically
    const versionControlTables = [
      "initiatives",
      "artifact_versions", 
      "version_conflicts",
      "initiative_participants",
      "artifact_locks",
      "version_dependencies",
      "initiative_comments",
      "baseline_history",
      "initiative_approvals"
    ];

    const missingVCTables = versionControlTables.filter(t => !tableNames.includes(t));
    
    if (missingVCTables.length > 0) {
      console.log("\n⚠️  Version control tables missing:");
      missingVCTables.forEach(t => console.log(`  - ${t}`));
      console.log("\nRun the version control migration:");
      console.log("  psql -U postgres -d arc_studio -f migrations/add_version_control_tables.sql");
    }

    await client.end();
    
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("Error:", error);
    console.error("\nMake sure PostgreSQL is running and the database exists.");
    console.error("To create the database, run:");
    console.error("  createdb -U postgres arc_studio");
  }
}

// Run the check
checkDatabaseStatus().catch(console.error);