import { db } from "../server/db";
import { applications, artifactLocks } from "@db/schema";
import { eq, like, and, desc } from "drizzle-orm";

async function checkEasySync() {
  console.log("Looking for Easy Sync application...\n");

  // Search for Easy Sync
  const apps = await db.select()
    .from(applications)
    .where(like(applications.name, "%Easy%"));
  
  console.log(`Found ${apps.length} applications with 'Easy' in the name:`);
  for (const app of apps) {
    console.log(`  ID: ${app.id}, Name: ${app.name}, AML: ${app.amlNumber}`);
  }

  // Get the current initiative from recent locks or ask user
  const recentLocks = await db.select()
    .from(artifactLocks)
    .orderBy(desc(artifactLocks.id))
    .limit(1);
  
  if (recentLocks.length > 0) {
    console.log(`\nMost recent lock is for initiative: ${recentLocks[0].initiativeId}`);
  }

  // Check for any locks on Easy Sync
  const easySyncApp = apps.find(app => app.name === "Easy Sync");
  if (easySyncApp) {
    console.log(`\nChecking locks for Easy Sync (ID: ${easySyncApp.id})...`);
    
    const locks = await db.select()
      .from(artifactLocks)
      .where(and(
        eq(artifactLocks.artifactType, 'application'),
        eq(artifactLocks.artifactId, easySyncApp.id)
      ));
    
    console.log(`Found ${locks.length} locks for Easy Sync:`);
    for (const lock of locks) {
      console.log(`  Initiative: ${lock.initiativeId}`);
      console.log(`  Locked By: User ID ${lock.lockedBy}`);
      console.log(`  Expiry: ${lock.lockExpiry}`);
      console.log(`  Created: ${lock.lockedAt}`);
      console.log("---");
    }
  }

  process.exit(0);
}

checkEasySync().catch(console.error);