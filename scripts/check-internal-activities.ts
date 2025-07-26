import { config } from "dotenv";
import path from "path";

// Load environment variables
config({ path: path.resolve(__dirname, "../.env") });

import { db } from "../server/db";
import { internalActivities, applications, businessProcesses } from "../shared/schema";
import { eq } from "drizzle-orm";

async function checkInternalActivities() {
  console.log("=== CHECKING INTERNAL ACTIVITIES IN DATABASE ===\n");

  // 1. Check raw count
  const allActivities = await db.select().from(internalActivities);
  console.log(`Total internal activities in database: ${allActivities.length}`);
  
  if (allActivities.length === 0) {
    console.log("\n❌ NO INTERNAL ACTIVITIES FOUND IN DATABASE!");
    console.log("The database is empty. Need to seed data first.");
  } else {
    console.log("\n✅ Found internal activities in database:");
    
    // 2. Show all activities with their details
    for (const activity of allActivities) {
      console.log(`\n--- Activity ID: ${activity.id} ---`);
      console.log(`  Name: ${activity.activityName}`);
      console.log(`  Type: ${activity.activityType}`);
      console.log(`  Application ID: ${activity.applicationId}`);
      console.log(`  Business Process ID: ${activity.businessProcessId || 'None'}`);
      console.log(`  Description: ${activity.description || 'No description'}`);
      console.log(`  Created: ${activity.createdAt}`);
      
      // Get related application
      if (activity.applicationId) {
        const [app] = await db.select()
          .from(applications)
          .where(eq(applications.id, activity.applicationId));
        console.log(`  Application Name: ${app?.name || 'Not found'}`);
      }
      
      // Get related business process
      if (activity.businessProcessId) {
        const [bp] = await db.select()
          .from(businessProcesses)
          .where(eq(businessProcesses.id, activity.businessProcessId));
        console.log(`  Business Process: ${bp?.businessProcess || 'Not found'}`);
      }
    }
  }

  // 3. Test the same query structure as the API
  console.log("\n\n=== TESTING API QUERY STRUCTURE ===");
  const apiStyleQuery = await db
    .select({
      activity: internalActivities,
      application: applications,
      businessProcess: businessProcesses
    })
    .from(internalActivities)
    .leftJoin(applications, eq(internalActivities.applicationId, applications.id))
    .leftJoin(businessProcesses, eq(internalActivities.businessProcessId, businessProcesses.id));
  
  console.log(`API-style query returned ${apiStyleQuery.length} results`);
  if (apiStyleQuery.length > 0) {
    console.log("\nFirst result structure:");
    console.log(JSON.stringify(apiStyleQuery[0], null, 2));
  }

  process.exit(0);
}

checkInternalActivities().catch(console.error);