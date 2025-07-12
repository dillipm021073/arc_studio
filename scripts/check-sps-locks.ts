import { db } from "../server/db";
import { applications, artifactLocks, artifactVersions, users } from "@db/schema";
import { eq, and, or, sql } from "drizzle-orm";

async function checkSPSLocks() {
  console.log("=== Checking SPS Application Locks ===\n");

  // 1. Find SPS application
  const spsApps = await db.select()
    .from(applications)
    .where(or(
      eq(applications.name, 'SPS'),
      sql`${applications.name} LIKE '%SPS%'`
    ));

  console.log("SPS Applications found:", spsApps.length);
  spsApps.forEach(app => {
    console.log(`- ID: ${app.id}, Name: ${app.name}`);
  });

  if (spsApps.length === 0) {
    console.log("No SPS application found!");
    process.exit(1);
  }

  const spsApp = spsApps[0];
  console.log(`\nChecking locks for application ID: ${spsApp.id} (${spsApp.name})`);

  // 2. Check ALL locks for this application
  const allLocks = await db.select({
    lock: artifactLocks,
    user: users
  })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.artifactType, 'application'),
        eq(artifactLocks.artifactId, spsApp.id)
      )
    );

  console.log(`\nTotal locks found: ${allLocks.length}`);
  allLocks.forEach((lockData, index) => {
    console.log(`\nLock ${index + 1}:`);
    console.log(`  - Lock ID: ${lockData.lock.id}`);
    console.log(`  - Initiative ID: ${lockData.lock.initiativeId}`);
    console.log(`  - Locked By: ${lockData.user?.username || 'Unknown'} (ID: ${lockData.lock.lockedBy})`);
    console.log(`  - Locked At: ${lockData.lock.lockedAt}`);
    console.log(`  - Lock Expiry: ${lockData.lock.lockExpiry}`);
    console.log(`  - Is Expired: ${lockData.lock.lockExpiry ? lockData.lock.lockExpiry < new Date() : 'No expiry'}`);
  });

  // 3. Check versions for this application
  const versions = await db.select()
    .from(artifactVersions)
    .where(
      and(
        eq(artifactVersions.artifactType, 'application'),
        eq(artifactVersions.artifactId, spsApp.id)
      )
    )
    .orderBy(artifactVersions.versionNumber);

  console.log(`\n\nVersions found: ${versions.length}`);
  versions.forEach(version => {
    console.log(`\nVersion ${version.versionNumber}:`);
    console.log(`  - Version ID: ${version.id}`);
    console.log(`  - Initiative ID: ${version.initiativeId || 'None (baseline)'}`);
    console.log(`  - Is Baseline: ${version.isBaseline}`);
    console.log(`  - Created By: ${version.createdBy}`);
    console.log(`  - Created At: ${version.createdAt}`);
  });

  // 4. Check for data inconsistencies
  console.log("\n\n=== Data Consistency Check ===");
  
  // Check for locks without corresponding versions
  const locksWithoutVersions = [];
  for (const lockData of allLocks) {
    const hasVersion = versions.some(v => 
      v.initiativeId === lockData.lock.initiativeId && 
      !v.isBaseline
    );
    if (!hasVersion) {
      locksWithoutVersions.push(lockData.lock);
    }
  }

  if (locksWithoutVersions.length > 0) {
    console.log(`\n⚠️  Found ${locksWithoutVersions.length} locks without corresponding versions:`);
    locksWithoutVersions.forEach(lock => {
      console.log(`  - Lock ID ${lock.id} for initiative ${lock.initiativeId}`);
    });
  }

  // Check for non-baseline versions without locks
  const nonBaselineVersions = versions.filter(v => !v.isBaseline && v.initiativeId);
  const versionsWithoutLocks = [];
  
  for (const version of nonBaselineVersions) {
    const hasLock = allLocks.some(l => 
      l.lock.initiativeId === version.initiativeId
    );
    if (!hasLock) {
      versionsWithoutLocks.push(version);
    }
  }

  if (versionsWithoutLocks.length > 0) {
    console.log(`\n⚠️  Found ${versionsWithoutLocks.length} versions without corresponding locks:`);
    versionsWithoutLocks.forEach(version => {
      console.log(`  - Version ID ${version.id} for initiative ${version.initiativeId}`);
    });
  }

  // 5. Provide cleanup recommendations
  if (locksWithoutVersions.length > 0 || versionsWithoutLocks.length > 0) {
    console.log("\n\n=== Cleanup Recommendations ===");
    
    if (locksWithoutVersions.length > 0) {
      console.log("\nTo remove orphaned locks:");
      console.log("DELETE FROM artifact_locks WHERE id IN (" + 
        locksWithoutVersions.map(l => l.id).join(", ") + ");");
    }

    if (versionsWithoutLocks.length > 0) {
      console.log("\nVersions without locks might need locks created or versions removed.");
      console.log("Review these initiative IDs:", versionsWithoutLocks.map(v => v.initiativeId).join(", "));
    }
  } else {
    console.log("\n✅ No data inconsistencies found!");
  }

  process.exit(0);
}

checkSPSLocks().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});