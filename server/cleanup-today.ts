import postgres from "postgres";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function safeDelete(query: () => Promise<any>, description: string) {
  try {
    await query();
    console.log(`✅ ${description}`);
  } catch (error: any) {
    if (error.code === '42P01') {
      console.log(`⚠️  ${description} - table does not exist, skipping`);
    } else {
      console.log(`❌ ${description} - ${error.message}`);
    }
  }
}

async function cleanupTodayArtifacts() {
  console.log("Starting cleanup of artifacts created today...");
  
  const today = new Date().toISOString().split('T')[0];
  console.log(`Today's date: ${today}`);

  try {
    // Delete change requests
    await safeDelete(
      () => sql`DELETE FROM change_requests WHERE DATE(created_at) = ${today}`,
      "Deleted change requests"
    );

    // Delete conversations
    await safeDelete(
      () => sql`DELETE FROM conversation_links WHERE conversation_id IN (SELECT id FROM conversations WHERE DATE(created_at) = ${today})`,
      "Deleted conversation links"
    );
    
    await safeDelete(
      () => sql`DELETE FROM comments WHERE conversation_id IN (SELECT id FROM conversations WHERE DATE(created_at) = ${today})`,
      "Deleted comments"
    );
    
    await safeDelete(
      () => sql`DELETE FROM conversations WHERE DATE(created_at) = ${today}`,
      "Deleted conversations"
    );

    // Delete internal activities
    await safeDelete(
      () => sql`DELETE FROM internal_activities WHERE DATE(created_at) = ${today}`,
      "Deleted internal activities"
    );

    // Delete technical processes
    await safeDelete(
      () => sql`DELETE FROM technical_processes WHERE DATE(created_at) = ${today}`,
      "Deleted technical processes"
    );

    // Delete business processes
    await safeDelete(
      () => sql`DELETE FROM business_process_relationships 
                WHERE parent_process_id IN (SELECT id FROM business_processes WHERE DATE(created_at) = ${today})
                   OR child_process_id IN (SELECT id FROM business_processes WHERE DATE(created_at) = ${today})`,
      "Deleted business process relationships"
    );
    
    await safeDelete(
      () => sql`DELETE FROM business_processes WHERE DATE(created_at) = ${today}`,
      "Deleted business processes"
    );

    // Delete interfaces
    await safeDelete(
      () => sql`DELETE FROM interfaces WHERE DATE(created_at) = ${today}`,
      "Deleted interfaces"
    );

    // Delete applications
    await safeDelete(
      () => sql`DELETE FROM application_capabilities WHERE application_id IN (SELECT id FROM applications WHERE DATE(created_at) = ${today})`,
      "Deleted application capabilities"
    );
    
    await safeDelete(
      () => sql`DELETE FROM applications WHERE DATE(created_at) = ${today}`,
      "Deleted applications"
    );

    // Clean up version control
    await safeDelete(
      () => sql`DELETE FROM version_control_locks WHERE DATE(created_at) = ${today}`,
      "Deleted version control locks"
    );

    await safeDelete(
      () => sql`DELETE FROM initiative_changes WHERE DATE(created_at) = ${today}`,
      "Deleted initiative changes"
    );

    console.log("\n✅ Cleanup completed!");
    
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the cleanup
cleanupTodayArtifacts()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed:", error);
    process.exit(1);
  });