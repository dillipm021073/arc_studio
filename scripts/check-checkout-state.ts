import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { eq, and, isNull, or, gt, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function checkCheckoutState() {
  try {
    console.log("\n=== Checking Checkout State ===\n");

    // 1. Check all current locks
    const currentLocks = await db.select({
      lock: artifactLocks,
      initiative: initiatives
    })
    .from(artifactLocks)
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
    .orderBy(desc(artifactLocks.lockedAt));

    console.log(`Total active locks: ${currentLocks.length}`);
    
    if (currentLocks.length > 0) {
      console.log("\nActive locks:");
      currentLocks.forEach(({ lock, initiative }) => {
        const expired = lock.lockExpiry && new Date(lock.lockExpiry) < new Date();
        console.log(`- ${lock.artifactType} #${lock.artifactId}`);
        console.log(`  Initiative: ${initiative?.name || lock.initiativeId} (${initiative?.status || 'unknown status'})`);
        console.log(`  Locked by user: ${lock.lockedBy}`);
        console.log(`  Locked at: ${lock.lockedAt}`);
        console.log(`  Expires: ${lock.lockExpiry} ${expired ? '(EXPIRED)' : ''}`);
        console.log(`  Reason: ${lock.lockReason || 'No reason provided'}`);
        console.log();
      });
    }

    // 2. Check for locks in completed/cancelled initiatives
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
      console.log(`\n⚠️  Found ${problematicLocks.length} locks in completed/cancelled initiatives:`);
      problematicLocks.forEach(({ lock, initiative }) => {
        console.log(`- ${lock.artifactType} #${lock.artifactId} in ${initiative.status} initiative "${initiative.name}"`);
      });
    }

    // 3. Check for artifacts with versions but no locks (potentially stuck in checkout)
    const versionsWithoutLocks = await db.select({
      version: artifactVersions,
      initiative: initiatives
    })
    .from(artifactVersions)
    .innerJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
    .leftJoin(artifactLocks, 
      and(
        eq(artifactLocks.artifactType, artifactVersions.artifactType),
        eq(artifactLocks.artifactId, artifactVersions.artifactId),
        eq(artifactLocks.initiativeId, artifactVersions.initiativeId)
      )
    )
    .where(
      and(
        eq(artifactVersions.isBaseline, false),
        eq(initiatives.status, 'active'),
        isNull(artifactLocks.id)
      )
    );

    if (versionsWithoutLocks.length > 0) {
      console.log(`\n⚠️  Found ${versionsWithoutLocks.length} artifact versions without locks in active initiatives:`);
      versionsWithoutLocks.forEach(({ version, initiative }) => {
        console.log(`- ${version.artifactType} #${version.artifactId} v${version.versionNumber} in "${initiative.name}"`);
      });
    }

    // 4. Check for expired locks
    const expiredLocks = await db.select({
      lock: artifactLocks,
      initiative: initiatives
    })
    .from(artifactLocks)
    .leftJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
    .where(
      and(
        sql`${artifactLocks.lockExpiry} IS NOT NULL`,
        sql`${artifactLocks.lockExpiry} < NOW()`
      )
    );

    if (expiredLocks.length > 0) {
      console.log(`\n⚠️  Found ${expiredLocks.length} expired locks:`);
      expiredLocks.forEach(({ lock, initiative }) => {
        console.log(`- ${lock.artifactType} #${lock.artifactId} in "${initiative?.name || lock.initiativeId}"`);
        console.log(`  Expired at: ${lock.lockExpiry}`);
      });
    }

    console.log("\n=== Check Complete ===\n");

  } catch (error) {
    console.error("Error checking checkout state:", error);
  } finally {
    process.exit(0);
  }
}

checkCheckoutState();