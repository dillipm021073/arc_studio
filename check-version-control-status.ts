import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

const connectionString = "postgresql://postgres:postgres@localhost:5432/arc_studio";

async function checkVersionControlStatus() {
  console.log("Checking Version Control System Status");
  console.log("=".repeat(80));

  try {
    const client = postgres(connectionString, { max: 1 });
    const db = drizzle(client, { schema });

    // Check if baseline versions exist
    console.log("\n1. Checking baseline versions:");
    console.log("-".repeat(40));
    
    const baselineCount = await client`
      SELECT 
        artifact_type,
        COUNT(*) as count,
        COUNT(CASE WHEN is_baseline = true THEN 1 END) as baseline_count
      FROM artifact_versions
      GROUP BY artifact_type
    `;

    if (baselineCount.length === 0) {
      console.log("❌ No artifact versions found!");
      console.log("   Baseline initialization needed.");
    } else {
      baselineCount.forEach(row => {
        console.log(`  ${row.artifact_type}: ${row.count} versions (${row.baseline_count} baselines)`);
      });
    }

    // Check what artifacts exist that need baselines
    console.log("\n2. Artifacts needing baseline versions:");
    console.log("-".repeat(40));

    const applications = await client`SELECT COUNT(*) as count FROM applications`;
    const interfaces = await client`SELECT COUNT(*) as count FROM interfaces`;
    const businessProcesses = await client`SELECT COUNT(*) as count FROM business_processes`;
    const technicalProcesses = await client`SELECT COUNT(*) as count FROM technical_processes`;

    console.log(`  Applications: ${applications[0].count}`);
    console.log(`  Interfaces: ${interfaces[0].count}`);
    console.log(`  Business Processes: ${businessProcesses[0].count}`);
    console.log(`  Technical Processes: ${technicalProcesses[0].count}`);

    // Check initiatives
    console.log("\n3. Initiative Status:");
    console.log("-".repeat(40));
    
    const initiatives = await client`
      SELECT status, COUNT(*) as count 
      FROM initiatives 
      GROUP BY status
    `;

    if (initiatives.length === 0) {
      console.log("  No initiatives created yet");
    } else {
      initiatives.forEach(row => {
        console.log(`  ${row.status}: ${row.count}`);
      });
    }

    // Check for version control activity
    console.log("\n4. Version Control Activity:");
    console.log("-".repeat(40));

    const conflicts = await client`SELECT COUNT(*) as count FROM version_conflicts`;
    const locks = await client`SELECT COUNT(*) as count FROM artifact_locks`;
    const comments = await client`SELECT COUNT(*) as count FROM initiative_comments`;
    const approvals = await client`SELECT COUNT(*) as count FROM initiative_approvals`;

    console.log(`  Version Conflicts: ${conflicts[0].count}`);
    console.log(`  Artifact Locks: ${locks[0].count}`);
    console.log(`  Initiative Comments: ${comments[0].count}`);
    console.log(`  Initiative Approvals: ${approvals[0].count}`);

    // Check if baseline initialization is needed
    console.log("\n" + "=".repeat(80));
    
    const needsInit = baselineCount.length === 0 && 
                      (Number(applications[0].count) > 0 || 
                       Number(interfaces[0].count) > 0 || 
                       Number(businessProcesses[0].count) > 0);

    if (needsInit) {
      console.log("\n⚠️  VERSION CONTROL INITIALIZATION NEEDED!");
      console.log("\nThe system has data but no baseline versions created.");
      console.log("\nTo initialize baselines, you can either:");
      console.log("1. Run the SQL script directly:");
      console.log("   psql -U postgres -d arc_studio -c \"");
      console.log("     -- Create baseline for applications");
      console.log("     INSERT INTO artifact_versions (artifact_type, artifact_id, version_number, is_baseline, baseline_date, artifact_data, created_by)");
      console.log("     SELECT 'application', id, 1, true, NOW(), row_to_json(applications.*), 1");
      console.log("     FROM applications");
      console.log("     WHERE NOT EXISTS (SELECT 1 FROM artifact_versions WHERE artifact_type = 'application' AND artifact_id = applications.id);");
      console.log("   \"");
      console.log("\n2. Or run the full migration script:");
      console.log("   psql -U postgres -d arc_studio -f migrations/add_version_control_tables.sql");
    } else if (baselineCount.length > 0) {
      console.log("\n✅ Version control system is initialized with baseline versions!");
    } else {
      console.log("\n📝 No data to create baselines for. System is ready for use.");
    }

    await client.end();
    
  } catch (error) {
    console.error("❌ Error checking version control status!");
    console.error("Error:", error);
  }
}

checkVersionControlStatus().catch(console.error);