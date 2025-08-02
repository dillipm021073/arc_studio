import { db } from "../server/db";
import { artifactLocks, initiatives, users, applications, interfaces, businessProcesses } from "@db/schema";
import { sql } from "drizzle-orm";

async function checkDatabaseLocks() {
  console.log("=== Checking Database for Locks and Artifacts ===\n");

  try {
    // 1. Check for any artifact locks
    const locks = await db.select({
      lock: artifactLocks,
      initiative: initiatives,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(initiatives, sql`${artifactLocks.initiativeId} = ${initiatives.initiativeId}`)
    .leftJoin(users, sql`${artifactLocks.lockedBy} = ${users.id}`);

    console.log(`Total Artifact Locks: ${locks.length}`);
    
    if (locks.length > 0) {
      console.log("\nCurrent Locks:");
      locks.forEach((lock, index) => {
        console.log(`\n  Lock #${index + 1}:`);
        console.log(`    - Artifact Type: ${lock.lock.artifactType}`);
        console.log(`    - Artifact ID: ${lock.lock.artifactId}`);
        console.log(`    - Initiative: ${lock.initiative?.name || lock.lock.initiativeId}`);
        console.log(`    - Locked By: ${lock.user?.name || 'Unknown'} (${lock.user?.username || 'N/A'})`);
        console.log(`    - Locked At: ${lock.lock.lockedAt}`);
        console.log(`    - Lock Expiry: ${lock.lock.lockExpiry || 'No expiry'}`);
        console.log(`    - Lock Reason: ${lock.lock.lockReason || 'No reason specified'}`);
      });
    } else {
      console.log("\n  No locks found in the database.");
    }

    // 2. Check active initiatives
    const activeInitiatives = await db.select()
      .from(initiatives)
      .where(sql`${initiatives.status} = 'active'`);

    console.log(`\n\nActive Initiatives: ${activeInitiatives.length}`);
    if (activeInitiatives.length > 0) {
      activeInitiatives.forEach((init) => {
        console.log(`  - ${init.name} (ID: ${init.initiativeId})`);
      });
    }

    // 3. Count artifacts
    const [appCount] = await db.select({ count: sql<number>`count(*)` }).from(applications);
    const [intCount] = await db.select({ count: sql<number>`count(*)` }).from(interfaces);
    const [bpCount] = await db.select({ count: sql<number>`count(*)` }).from(businessProcesses);

    console.log("\n\nArtifact Counts:");
    console.log(`  - Applications: ${appCount.count}`);
    console.log(`  - Interfaces: ${intCount.count}`);
    console.log(`  - Business Processes: ${bpCount.count}`);

    // 4. Check for locks with expired times
    const expiredLocks = await db.select()
      .from(artifactLocks)
      .where(sql`${artifactLocks.lockExpiry} IS NOT NULL AND ${artifactLocks.lockExpiry} < NOW()`);

    if (expiredLocks.length > 0) {
      console.log(`\n\nWARNING: Found ${expiredLocks.length} expired locks that haven't been cleaned up!`);
      expiredLocks.forEach((lock) => {
        console.log(`  - ${lock.artifactType} #${lock.artifactId} expired at ${lock.lockExpiry}`);
      });
    }

    // 5. Check all initiatives and their statuses
    const allInitiatives = await db.select({
      id: initiatives.id,
      initiativeId: initiatives.initiativeId,
      name: initiatives.name,
      status: initiatives.status,
      createdAt: initiatives.createdAt
    })
    .from(initiatives)
    .orderBy(initiatives.createdAt);

    console.log(`\n\nAll Initiatives (${allInitiatives.length} total):`);
    const statusCounts: Record<string, number> = {};
    allInitiatives.forEach((init) => {
      statusCounts[init.status] = (statusCounts[init.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`);
    });

  } catch (error) {
    console.error("Error checking database:", error);
  }

  process.exit(0);
}

checkDatabaseLocks();