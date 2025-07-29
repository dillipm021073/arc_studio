import { db } from "../server/db";
import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { eq, and, or, lt, isNull, sql } from "drizzle-orm";

async function cleanupVersionControl() {
  console.log("Starting version control cleanup...");

  try {
    // 1. Remove expired locks
    console.log("\n1. Removing expired locks...");
    const expiredLocks = await db.delete(artifactLocks)
      .where(
        and(
          lt(artifactLocks.lockExpiry, new Date()),
          sql`${artifactLocks.lockExpiry} IS NOT NULL`
        )
      )
      .returning();
    console.log(`Removed ${expiredLocks.length} expired locks`);

    // 2. Remove orphaned locks (where initiative doesn't exist)
    console.log("\n2. Removing orphaned locks...");
    const validInitiatives = await db.select({ initiativeId: initiatives.initiativeId })
      .from(initiatives);
    const validInitiativeIds = validInitiatives.map(i => i.initiativeId);

    let orphanedLocksCount = 0;
    if (validInitiativeIds.length > 0) {
      // If we have valid initiatives, find locks that don't match
      const orphanedLocks = await db.select()
        .from(artifactLocks)
        .where(
          sql`${artifactLocks.initiativeId} NOT IN (${sql.join(validInitiativeIds.map(id => sql`${id}`), sql`, `)})`
        );

      if (orphanedLocks.length > 0) {
        await db.delete(artifactLocks)
          .where(
            sql`${artifactLocks.initiativeId} NOT IN (${sql.join(validInitiativeIds.map(id => sql`${id}`), sql`, `)})`
          );
        orphanedLocksCount = orphanedLocks.length;
      }
    } else {
      // If no valid initiatives exist, all locks are orphaned
      const allLocks = await db.delete(artifactLocks).returning();
      orphanedLocksCount = allLocks.length;
    }
    console.log(`Removed ${orphanedLocksCount} orphaned locks`);

    // 3. Remove non-baseline versions for completed initiatives
    console.log("\n3. Cleaning up versions for completed initiatives...");
    const completedInitiatives = await db.select()
      .from(initiatives)
      .where(eq(initiatives.status, 'completed'));

    let versionsCleanedCount = 0;
    for (const initiative of completedInitiatives) {
      const deletedVersions = await db.delete(artifactVersions)
        .where(
          and(
            eq(artifactVersions.initiativeId, initiative.initiativeId),
            eq(artifactVersions.isBaseline, false)
          )
        )
        .returning();
      versionsCleanedCount += deletedVersions.length;
    }
    console.log(`Removed ${versionsCleanedCount} non-baseline versions from completed initiatives`);

    // 4. Remove duplicate baseline versions (keep only the latest)
    console.log("\n4. Removing duplicate baseline versions...");
    const allBaselines = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.isBaseline, true))
      .orderBy(artifactVersions.artifactType, artifactVersions.artifactId, artifactVersions.createdAt);

    const baselineMap = new Map<string, typeof allBaselines[0]>();
    const duplicatesToRemove: number[] = [];

    for (const baseline of allBaselines) {
      const key = `${baseline.artifactType}-${baseline.artifactId}`;
      const existing = baselineMap.get(key);
      
      if (existing) {
        // Keep the newer one
        if (baseline.createdAt > existing.createdAt) {
          duplicatesToRemove.push(existing.id);
          baselineMap.set(key, baseline);
        } else {
          duplicatesToRemove.push(baseline.id);
        }
      } else {
        baselineMap.set(key, baseline);
      }
    }

    if (duplicatesToRemove.length > 0) {
      for (const id of duplicatesToRemove) {
        await db.delete(artifactVersions).where(eq(artifactVersions.id, id));
      }
      console.log(`Removed ${duplicatesToRemove.length} duplicate baseline versions`);
    } else {
      console.log("No duplicate baseline versions found");
    }

    // 5. Clean up orphaned initiative versions (no corresponding baseline)
    console.log("\n5. Cleaning up orphaned initiative versions...");
    const orphanedVersions = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.isBaseline, false),
          sql`${artifactVersions.initiativeId} IS NOT NULL`
        )
      );

    let orphanedCount = 0;
    for (const version of orphanedVersions) {
      // Check if there's a baseline for this artifact
      const [baseline] = await db.select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.artifactType, version.artifactType),
            eq(artifactVersions.artifactId, version.artifactId),
            eq(artifactVersions.isBaseline, true)
          )
        )
        .limit(1);

      if (!baseline) {
        // No baseline exists, this is truly orphaned
        await db.delete(artifactVersions).where(eq(artifactVersions.id, version.id));
        orphanedCount++;
      }
    }
    console.log(`Removed ${orphanedCount} orphaned initiative versions`);

    // 6. Summary
    console.log("\n=== Cleanup Summary ===");
    console.log(`Expired locks removed: ${expiredLocks.length}`);
    console.log(`Orphaned locks removed: ${orphanedLocksCount}`);
    console.log(`Completed initiative versions removed: ${versionsCleanedCount}`);
    console.log(`Duplicate baselines removed: ${duplicatesToRemove.length}`);
    console.log(`Orphaned versions removed: ${orphanedCount}`);
    console.log("\nVersion control cleanup completed successfully!");

  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupVersionControl().then(() => {
  console.log("\nDone!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});