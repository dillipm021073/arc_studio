import { db } from "../server/db";
import { artifactLocks, applications } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function checkAppLocks(appIdOrName: string) {
  console.log(`\n=== Checking locks for: ${appIdOrName} ===\n`);

  try {
    // First, find the application
    let app;
    const appId = parseInt(appIdOrName);
    
    if (!isNaN(appId)) {
      // Search by ID
      [app] = await db.select()
        .from(applications)
        .where(eq(applications.id, appId));
    } else {
      // Search by name
      [app] = await db.select()
        .from(applications)
        .where(eq(applications.name, appIdOrName));
    }

    if (!app) {
      console.log(`Application not found: ${appIdOrName}`);
      return;
    }

    console.log(`Found application: ${app.name} (ID: ${app.id})`);

    // Check for locks
    const locks = await db.select()
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, 'application'),
          eq(artifactLocks.artifactId, app.id)
        )
      );

    if (locks.length === 0) {
      console.log("\nNo locks found for this application");
    } else {
      console.log(`\nFound ${locks.length} lock(s):`);
      locks.forEach((lock, index) => {
        console.log(`\nLock ${index + 1}:`);
        console.log(`  Initiative: ${lock.initiativeId}`);
        console.log(`  Locked by: ${lock.lockedBy}`);
        console.log(`  Expires: ${lock.lockExpiry}`);
        console.log(`  Reason: ${lock.lockReason}`);
        console.log(`  Created: ${lock.createdAt || 'N/A'}`);
      });
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

// Get app ID or name from command line
const appIdOrName = process.argv[2];

if (!appIdOrName) {
  console.log("Usage: tsx scripts/check-app-locks.ts <app-id-or-name>");
  console.log("Example: tsx scripts/check-app-locks.ts 189");
  console.log("Example: tsx scripts/check-app-locks.ts SIEBEL");
  process.exit(1);
}

checkAppLocks(appIdOrName).then(() => {
  console.log("\nDone!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});