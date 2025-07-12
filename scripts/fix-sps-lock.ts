import { db } from "../server/db";
import { artifactLocks } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function fixSPSLock() {
  console.log("=== Fixing Missing SPS Lock ===\n");

  const appId = 190; // SPS application
  const initiativeId = 'INIT-1752235472251-te8q9x1yr';
  const userId = 7; // admin user who created the version

  // First check if lock already exists
  const existingLocks = await db.select()
    .from(artifactLocks)
    .where(
      and(
        eq(artifactLocks.artifactType, 'application'),
        eq(artifactLocks.artifactId, appId),
        eq(artifactLocks.initiativeId, initiativeId)
      )
    );

  if (existingLocks.length > 0) {
    console.log("Lock already exists! No action needed.");
    process.exit(0);
  }

  // Create the missing lock
  console.log("Creating missing lock for SPS application...");
  
  try {
    const [newLock] = await db.insert(artifactLocks).values({
      artifactType: 'application',
      artifactId: appId,
      initiativeId: initiativeId,
      lockedBy: userId,
      lockExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      lockReason: 'Fixing missing lock for existing checkout'
    }).returning();

    console.log("\n✅ Lock created successfully!");
    console.log("Lock details:", {
      id: newLock.id,
      artifactType: newLock.artifactType,
      artifactId: newLock.artifactId,
      initiativeId: newLock.initiativeId,
      lockedBy: newLock.lockedBy,
      lockExpiry: newLock.lockExpiry
    });
  } catch (error) {
    console.error("❌ Failed to create lock:", error);
    process.exit(1);
  }

  process.exit(0);
}

fixSPSLock().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});