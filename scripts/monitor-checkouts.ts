import { artifactLocks, artifactVersions, initiatives } from "@db/schema";
import { eq, and, desc, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

async function monitorCheckouts() {
  console.log("\n=== Monitoring Checkouts - Press Ctrl+C to stop ===\n");
  
  let lastCheckTime = new Date();
  
  const checkForChanges = async () => {
    try {
      // Check for new versions
      const newVersions = await db.select({
        version: artifactVersions,
        initiative: initiatives
      })
        .from(artifactVersions)
        .leftJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
        .where(
          and(
            eq(artifactVersions.isBaseline, false),
            gt(artifactVersions.createdAt, lastCheckTime)
          )
        )
        .orderBy(desc(artifactVersions.createdAt));

      if (newVersions.length > 0) {
        console.log(`\n[${new Date().toISOString()}] New versions created:`);
        for (const { version, initiative } of newVersions) {
          console.log(`  - ${version.artifactType} #${version.artifactId} v${version.versionNumber} in "${initiative?.name}"`);
          
          // Check if there's a corresponding lock
          const [lock] = await db.select()
            .from(artifactLocks)
            .where(
              and(
                eq(artifactLocks.artifactType, version.artifactType),
                eq(artifactLocks.artifactId, version.artifactId),
                eq(artifactLocks.initiativeId, version.initiativeId!)
              )
            );
          
          console.log(`    Lock status: ${lock ? 'FOUND' : 'NOT FOUND'}`);
          if (lock) {
            console.log(`    Lock expiry: ${lock.lockExpiry}`);
          }
        }
      }

      // Check for new locks
      const newLocks = await db.select()
        .from(artifactLocks)
        .where(gt(artifactLocks.lockedAt, lastCheckTime))
        .orderBy(desc(artifactLocks.lockedAt));

      if (newLocks.length > 0) {
        console.log(`\n[${new Date().toISOString()}] New locks created:`);
        for (const lock of newLocks) {
          console.log(`  - ${lock.artifactType} #${lock.artifactId} in ${lock.initiativeId}`);
          console.log(`    Locked by: ${lock.lockedBy}, Expires: ${lock.lockExpiry}`);
        }
      }

      // Update last check time
      lastCheckTime = new Date();
      
    } catch (error) {
      console.error("Error checking for changes:", error);
    }
  };

  // Check every 2 seconds
  const interval = setInterval(checkForChanges, 2000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log("\n\nStopping monitor...");
    clearInterval(interval);
    client.end().then(() => process.exit(0));
  });
}

monitorCheckouts();