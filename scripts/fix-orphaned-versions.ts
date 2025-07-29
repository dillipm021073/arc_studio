import { db } from "../server/db";
import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { eq, and, sql } from "drizzle-orm";

async function fixOrphanedVersions() {
  console.log("=== FIXING ORPHANED VERSIONS ===\n");

  try {
    // 1. Find all non-baseline versions without locks
    console.log("1. Finding orphaned versions...");
    
    // Get all non-baseline versions
    const checkedOutVersions = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.isBaseline, false));

    // Get all locks
    const allLocks = await db.select()
      .from(artifactLocks);

    // Find versions without locks
    const orphanedVersions = [];
    for (const version of checkedOutVersions) {
      const hasLock = allLocks.some(lock => 
        lock.artifactType === version.artifactType && 
        lock.artifactId === version.artifactId &&
        lock.initiativeId === version.initiativeId
      );
      
      if (!hasLock) {
        orphanedVersions.push(version);
      }
    }

    console.log(`Found ${orphanedVersions.length} orphaned versions\n`);

    if (orphanedVersions.length === 0) {
      console.log("No orphaned versions to fix!");
      return;
    }

    // 2. Create locks for orphaned versions
    console.log("2. Creating locks for orphaned versions...");
    
    let successCount = 0;
    let failCount = 0;

    for (const version of orphanedVersions) {
      try {
        // Check if initiative still exists and is active
        const [initiative] = await db.select()
          .from(initiatives)
          .where(eq(initiatives.initiativeId, version.initiativeId!));

        if (!initiative) {
          console.log(`   ⚠️  Initiative ${version.initiativeId} not found for ${version.artifactType} ${version.artifactId} - skipping`);
          failCount++;
          continue;
        }

        if (initiative.status !== 'active') {
          console.log(`   ⚠️  Initiative ${version.initiativeId} is ${initiative.status} - skipping ${version.artifactType} ${version.artifactId}`);
          failCount++;
          continue;
        }

        // Create lock with 24-hour expiry
        const lockExpiry = new Date();
        lockExpiry.setHours(lockExpiry.getHours() + 24);

        const [newLock] = await db.insert(artifactLocks).values({
          artifactType: version.artifactType,
          artifactId: version.artifactId,
          initiativeId: version.initiativeId!,
          lockedBy: version.createdBy,
          lockExpiry,
          lockReason: 'Restored lock for orphaned version'
        }).returning();

        console.log(`   ✓ Created lock for ${version.artifactType} ${version.artifactId} in ${version.initiativeId}`);
        successCount++;
      } catch (error) {
        console.error(`   ❌ Failed to create lock for ${version.artifactType} ${version.artifactId}:`, error.message);
        failCount++;
      }
    }

    console.log(`\n3. Summary:`);
    console.log(`   - Locks created: ${successCount}`);
    console.log(`   - Failures: ${failCount}`);

    // 4. Verify fix
    console.log("\n4. Verifying fix...");
    
    const newLocks = await db.select()
      .from(artifactLocks);
    
    const remainingOrphans = [];
    for (const version of checkedOutVersions) {
      const hasLock = newLocks.some(lock => 
        lock.artifactType === version.artifactType && 
        lock.artifactId === version.artifactId &&
        lock.initiativeId === version.initiativeId
      );
      
      if (!hasLock) {
        remainingOrphans.push(version);
      }
    }

    if (remainingOrphans.length === 0) {
      console.log("   ✓ All versions now have locks!");
    } else {
      console.log(`   ⚠️  Still have ${remainingOrphans.length} orphaned versions`);
      remainingOrphans.forEach(v => {
        console.log(`      - ${v.artifactType} ${v.artifactId} in ${v.initiativeId}`);
      });
    }

    console.log("\n=== FIX COMPLETED ===");

  } catch (error) {
    console.error("Error during fix:", error);
    process.exit(1);
  }
}

// Run the fix
fixOrphanedVersions().then(() => {
  console.log("\nDone!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});