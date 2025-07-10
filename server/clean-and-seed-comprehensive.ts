import 'dotenv/config';
import { db } from "./db";
import { sql } from "drizzle-orm";
import seedComprehensiveTestData from "./seed-comprehensive-test-data";

async function cleanAndSeedComprehensive() {
  try {
    console.log("🧹 Cleaning database (keeping users)...");
    
    // Delete in reverse order of dependencies
    await db.execute(sql`DELETE FROM conversation_participants`);
    await db.execute(sql`DELETE FROM conversation_links`);
    await db.execute(sql`DELETE FROM conversations`);
    
    await db.execute(sql`DELETE FROM change_request_technical_processes`);
    await db.execute(sql`DELETE FROM change_request_interfaces`);
    await db.execute(sql`DELETE FROM change_request_applications`);
    await db.execute(sql`DELETE FROM change_request_internal_activities`);
    await db.execute(sql`DELETE FROM change_requests`);
    
    await db.execute(sql`DELETE FROM technical_process_dependencies`);
    await db.execute(sql`DELETE FROM technical_process_interfaces`);
    await db.execute(sql`DELETE FROM technical_processes`);
    
    await db.execute(sql`DELETE FROM business_process_interfaces`);
    await db.execute(sql`DELETE FROM business_process_relationships`);
    await db.execute(sql`DELETE FROM business_processes`);
    
    await db.execute(sql`DELETE FROM internal_activities`);
    await db.execute(sql`DELETE FROM interfaces`);
    await db.execute(sql`DELETE FROM applications`);
    
    await db.execute(sql`DELETE FROM user_activity_log`);
    await db.execute(sql`DELETE FROM permission_audit_log`);
    
    console.log("✅ All data cleaned except users");
    
    // Seed comprehensive test data
    console.log("🌱 Seeding comprehensive test data...");
    await seedComprehensiveTestData();
    
    console.log("🎉 Clean and comprehensive seed completed!");
  } catch (error) {
    console.error("❌ Error during clean and seed:", error);
    throw error;
  }
}

// Run the function
cleanAndSeedComprehensive()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to clean and seed:", error);
    process.exit(1);
  });