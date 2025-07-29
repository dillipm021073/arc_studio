import { db } from "../server/db";
import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { desc, eq } from "drizzle-orm";

async function debugLocks() {
  console.log("=== VERSION CONTROL DEBUG ===\n");

  // 1. Check all locks
  console.log("1. All locks in the database:");
  const allLocks = await db.select()
    .from(artifactLocks);
  
  if (allLocks.length === 0) {
    console.log("   No locks found");
  } else {
    allLocks.forEach(lock => {
      console.log(`   - ${lock.artifactType} ${lock.artifactId}:`);
      console.log(`     Initiative: ${lock.initiativeId}`);
      console.log(`     Locked by: ${lock.lockedBy}`);
      console.log(`     Created: ${lock.createdAt}`);
      console.log(`     Expires: ${lock.lockExpiry}`);
      console.log(`     Expired: ${lock.lockExpiry < new Date() ? 'YES' : 'NO'}`);
      console.log(`     Reason: ${lock.lockReason}`);
      console.log();
    });
  }

  // 2. Check active initiatives
  console.log("\n2. Active initiatives:");
  const activeInitiatives = await db.select()
    .from(initiatives)
    .where(eq(initiatives.status, 'active'));
  
  if (activeInitiatives.length === 0) {
    console.log("   No active initiatives found");
  } else {
    activeInitiatives.forEach(init => {
      console.log(`   - ${init.initiativeId}: ${init.name}`);
    });
  }

  // 3. Check non-baseline versions
  console.log("\n3. Non-baseline versions (checked out artifacts):");
  const checkedOutVersions = await db.select()
    .from(artifactVersions)
    .where(eq(artifactVersions.isBaseline, false));
  
  if (checkedOutVersions.length === 0) {
    console.log("   No checked out versions found");
  } else {
    checkedOutVersions.forEach(version => {
      console.log(`   - ${version.artifactType} ${version.artifactId}:`);
      console.log(`     Initiative: ${version.initiativeId}`);
      console.log(`     Version: ${version.versionNumber}`);
      console.log(`     Created: ${version.createdAt}`);
      console.log(`     Created by: ${version.createdBy}`);
      console.log();
    });
  }

  // 4. Check for mismatches
  console.log("\n4. Checking for mismatches:");
  
  // Versions without locks
  const versionsWithoutLocks = [];
  for (const version of checkedOutVersions) {
    const lock = allLocks.find(l => 
      l.artifactType === version.artifactType && 
      l.artifactId === version.artifactId &&
      l.initiativeId === version.initiativeId
    );
    if (!lock) {
      versionsWithoutLocks.push(version);
    }
  }
  
  if (versionsWithoutLocks.length > 0) {
    console.log("   ⚠️  Versions without locks:");
    versionsWithoutLocks.forEach(v => {
      console.log(`      - ${v.artifactType} ${v.artifactId} in ${v.initiativeId}`);
    });
  } else {
    console.log("   ✓ All versions have corresponding locks");
  }

  // Locks without versions
  const locksWithoutVersions = [];
  for (const lock of allLocks) {
    const version = checkedOutVersions.find(v => 
      v.artifactType === lock.artifactType && 
      v.artifactId === lock.artifactId &&
      v.initiativeId === lock.initiativeId
    );
    if (!version) {
      locksWithoutVersions.push(lock);
    }
  }
  
  if (locksWithoutVersions.length > 0) {
    console.log("\n   ⚠️  Locks without versions:");
    locksWithoutVersions.forEach(l => {
      console.log(`      - ${l.artifactType} ${l.artifactId} in ${l.initiativeId}`);
    });
  } else {
    console.log("   ✓ All locks have corresponding versions");
  }

  console.log("\n=== END DEBUG ===");
}

// Run the debug
debugLocks().then(() => {
  console.log("\nDone!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});