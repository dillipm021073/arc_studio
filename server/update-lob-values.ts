import 'dotenv/config';
import { db } from "./db";
import { applications, interfaces, businessProcesses } from "@shared/schema";
import { sql } from "drizzle-orm";

async function updateEmptyLOBValues() {
  console.log("Starting to update empty LOB values to 'TBD'...");

  try {
    // Update applications table
    console.log("\nUpdating applications table...");
    const appResult = await db
      .update(applications)
      .set({ lob: "TBD" })
      .where(sql`${applications.lob} IS NULL OR ${applications.lob} = ''`);
    console.log(`Updated LOB values in applications table`);

    // Update interfaces table
    console.log("\nUpdating interfaces table...");
    const intResult = await db
      .update(interfaces)
      .set({ lob: "TBD" })
      .where(sql`${interfaces.lob} IS NULL OR ${interfaces.lob} = ''`);
    console.log(`Updated LOB values in interfaces table`);

    // Update business_processes table
    console.log("\nUpdating business_processes table...");
    const bpResult = await db
      .update(businessProcesses)
      .set({ lob: "TBD" })
      .where(sql`${businessProcesses.lob} IS NULL OR ${businessProcesses.lob} = ''`);
    console.log(`Updated LOB values in business_processes table`);

    console.log("\n✅ Successfully updated all empty LOB values to 'TBD'");
  } catch (error) {
    console.error("Error updating LOB values:", error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the update
updateEmptyLOBValues();