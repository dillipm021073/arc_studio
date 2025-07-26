import { db } from "../server/db";
import { applications, artifactLocks, users } from "@db/schema";
import { eq, like, and, desc } from "drizzle-orm";

async function checkSPSLock() {
  console.log("Looking for SPS application...\n");

  // Search for SPS
  const apps = await db.select()
    .from(applications)
    .where(like(applications.name, "%SPS%"));
  
  console.log(`Found ${apps.length} applications with 'SPS' in the name:`);
  for (const app of apps) {
    console.log(`  ID: ${app.id}, Name: ${app.name}, AML: ${app.amlNumber}`);
  }

  // Check locks for each SPS app
  for (const app of apps) {
    console.log(`\nChecking locks for ${app.name} (ID: ${app.id})...`);
    
    const locks = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(and(
      eq(artifactLocks.artifactType, 'application'),
      eq(artifactLocks.artifactId, app.id)
    ));
    
    console.log(`Found ${locks.length} locks:`);
    for (const { lock, user } of locks) {
      console.log(`  Initiative: ${lock.initiativeId}`);
      console.log(`  Locked By: ${user?.username || 'Unknown'} (ID: ${lock.lockedBy})`);
      console.log(`  Lock Expiry: ${lock.lockExpiry}`);
      console.log(`  Is Expired: ${lock.lockExpiry ? lock.lockExpiry < new Date() : 'No expiry'}`);
      console.log(`  Created: ${lock.lockedAt}`);
      console.log("---");
    }
  }

  // Check all current locks to see initiative pattern
  console.log("\n\nAll current non-expired locks:");
  const activeLocks = await db.select({
    lock: artifactLocks,
    user: users
  })
  .from(artifactLocks)
  .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
  .orderBy(desc(artifactLocks.id))
  .limit(10);

  for (const { lock, user } of activeLocks) {
    const isExpired = lock.lockExpiry ? lock.lockExpiry < new Date() : false;
    if (!isExpired) {
      console.log(`Type: ${lock.artifactType}, ID: ${lock.artifactId}, Initiative: ${lock.initiativeId}, User: ${user?.username}, Expiry: ${lock.lockExpiry}`);
    }
  }

  process.exit(0);
}

checkSPSLock().catch(console.error);