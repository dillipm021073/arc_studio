import { db } from "../server/db";
import { artifactLocks, users, applications } from "@db/schema";
import { desc, eq } from "drizzle-orm";

async function checkLocks() {
  console.log("Checking artifact locks in database...\n");

  // Get all locks
  const allLocks = await db.select({
    lock: artifactLocks,
    user: users
  })
  .from(artifactLocks)
  .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
  .orderBy(desc(artifactLocks.id))
  .limit(20);

  console.log(`Found ${allLocks.length} locks:\n`);
  
  for (const { lock, user } of allLocks) {
    console.log(`Lock ID: ${lock.id}`);
    console.log(`  Type: ${lock.artifactType}`);
    console.log(`  Artifact ID: ${lock.artifactId}`);
    console.log(`  Initiative: ${lock.initiativeId}`);
    console.log(`  Locked By: ${user?.username || 'Unknown'} (ID: ${lock.lockedBy})`);
    console.log(`  Lock Expiry: ${lock.lockExpiry}`);
    console.log(`  Is Expired: ${lock.lockExpiry ? lock.lockExpiry < new Date() : 'No expiry'}`);
    console.log(`  Reason: ${lock.lockReason}`);
    console.log("---");
  }

  // Check for Easy Sync specifically
  console.log("\nChecking for Easy Sync application...");
  const easySyncApp = await db.select()
    .from(applications)
    .where(eq(applications.name, "Easy Sync"));
  
  if (easySyncApp.length > 0) {
    console.log(`Easy Sync Application ID: ${easySyncApp[0].id}`);
    
    // Check locks for Easy Sync
    const easySyncLocks = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(eq(artifactLocks.artifactId, easySyncApp[0].id));
    
    console.log(`\nFound ${easySyncLocks.length} locks for Easy Sync:`);
    for (const { lock, user } of easySyncLocks) {
      console.log(`  Initiative: ${lock.initiativeId}`);
      console.log(`  Locked By: ${user?.username}`);
      console.log(`  Expiry: ${lock.lockExpiry}`);
      console.log(`  Is Expired: ${lock.lockExpiry ? lock.lockExpiry < new Date() : 'No expiry'}`);
    }
  }

  process.exit(0);
}

checkLocks().catch(console.error);