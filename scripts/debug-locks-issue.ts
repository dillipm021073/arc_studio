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

async function debugLocks() {
  try {
    console.log("\n=== Debugging Lock Issues ===\n");
    console.log("Current time:", new Date().toISOString());

    // 1. Check ALL locks (without any filters)
    const allLocks = await db.select()
      .from(artifactLocks)
      .orderBy(desc(artifactLocks.lockedAt));

    console.log(`\nTotal locks in database: ${allLocks.length}`);
    
    if (allLocks.length > 0) {
      console.log("\nAll locks:");
      allLocks.forEach((lock) => {
        const now = new Date();
        const expiry = lock.lockExpiry ? new Date(lock.lockExpiry) : null;
        const isExpired = expiry && expiry < now;
        const isNullExpiry = !lock.lockExpiry;
        
        console.log(`\n- ${lock.artifactType} #${lock.artifactId}`);
        console.log(`  ID: ${lock.id}`);
        console.log(`  Initiative: ${lock.initiativeId}`);
        console.log(`  Locked by: ${lock.lockedBy}`);
        console.log(`  Locked at: ${lock.lockedAt}`);
        console.log(`  Expiry: ${lock.lockExpiry} ${isNullExpiry ? '(NULL)' : isExpired ? '(EXPIRED)' : '(VALID)'}`);
        if (expiry && !isExpired) {
          const hoursLeft = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
          console.log(`  Hours until expiry: ${hoursLeft.toFixed(2)}`);
        }
      });
    }

    // 2. Check locks that would be returned by the /locks endpoint
    const activeLocks = await db.select()
      .from(artifactLocks)
      .where(gt(artifactLocks.lockExpiry, new Date()));

    console.log(`\n\nLocks with future expiry (what /locks returns): ${activeLocks.length}`);

    // 3. Check locks with null expiry
    const nullExpiryLocks = await db.select()
      .from(artifactLocks)
      .where(isNull(artifactLocks.lockExpiry));

    console.log(`\nLocks with NULL expiry: ${nullExpiryLocks.length}`);

    // 4. Check recent artifact versions
    const recentVersions = await db.select({
      version: artifactVersions,
      initiative: initiatives
    })
      .from(artifactVersions)
      .leftJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
      .where(eq(artifactVersions.isBaseline, false))
      .orderBy(desc(artifactVersions.createdAt))
      .limit(5);

    console.log(`\n\nRecent artifact versions (non-baseline):`);
    recentVersions.forEach(({ version, initiative }) => {
      console.log(`- ${version.artifactType} #${version.artifactId} v${version.versionNumber}`);
      console.log(`  Initiative: ${initiative?.name || version.initiativeId} (${initiative?.status})`);
      console.log(`  Created: ${version.createdAt}`);
    });

    // 5. Test the exact query used by /locks endpoint
    console.log("\n\nTesting /locks endpoint query:");
    const whereConditions = [gt(artifactLocks.lockExpiry, new Date())];
    const testQuery = await db.select({
      lock: artifactLocks
    })
    .from(artifactLocks)
    .where(and(...whereConditions));
    
    console.log(`Query result count: ${testQuery.length}`);

    console.log("\n=== Debug Complete ===\n");

  } catch (error) {
    console.error("Error debugging locks:", error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

debugLocks();