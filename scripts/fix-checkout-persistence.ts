import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { eq, and, isNull, or, gt, sql, desc, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function fixCheckoutPersistence() {
  try {
    console.log("\n=== Fixing Checkout Persistence Issues ===\n");

    // 1. Clean up expired locks
    const expiredLocksDeleted = await db.delete(artifactLocks)
      .where(
        and(
          sql`${artifactLocks.lockExpiry} IS NOT NULL`,
          lt(artifactLocks.lockExpiry, new Date())
        )
      )
      .returning();

    console.log(`✓ Deleted ${expiredLocksDeleted.length} expired locks`);

    // 2. Clean up locks in completed/cancelled initiatives
    const problematicLocks = await db.select({
      lock: artifactLocks,
      initiative: initiatives
    })
    .from(artifactLocks)
    .innerJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
    .where(
      or(
        eq(initiatives.status, 'completed'),
        eq(initiatives.status, 'cancelled')
      )
    );

    if (problematicLocks.length > 0) {
      const deletedProblematic = await db.delete(artifactLocks)
        .where(
          sql`${artifactLocks.initiativeId} IN (
            SELECT initiative_id FROM initiatives 
            WHERE status IN ('completed', 'cancelled')
          )`
        )
        .returning();
      
      console.log(`✓ Deleted ${deletedProblematic.length} locks from completed/cancelled initiatives`);
    }

    // 3. Update remaining locks with new expiry (24 hours from now)
    const updatedLocks = await db.update(artifactLocks)
      .set({
        lockExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000)
      })
      .where(
        sql`${artifactLocks.initiativeId} IN (
          SELECT initiative_id FROM initiatives 
          WHERE status = 'active'
        )`
      )
      .returning();

    console.log(`✓ Updated ${updatedLocks.length} active locks with new expiry time`);

    // 4. Verify final state
    const remainingLocks = await db.select({
      lock: artifactLocks,
      initiative: initiatives
    })
    .from(artifactLocks)
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId));

    console.log(`\nFinal state: ${remainingLocks.length} locks remaining`);
    
    if (remainingLocks.length > 0) {
      console.log("\nRemaining locks:");
      remainingLocks.forEach(({ lock, initiative }) => {
        console.log(`- ${lock.artifactType} #${lock.artifactId} in "${initiative?.name}" (${initiative?.status})`);
      });
    }

    console.log("\n=== Fix Complete ===\n");

  } catch (error) {
    console.error("Error fixing checkout persistence:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

fixCheckoutPersistence();