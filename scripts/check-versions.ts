import { db } from "../server/db";
import { artifactVersions } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";

async function checkVersions() {
  console.log("Checking artifact versions for Easy Sync (ID: 181)...\n");

  // Get all versions for Easy Sync
  const versions = await db.select()
    .from(artifactVersions)
    .where(and(
      eq(artifactVersions.artifactType, 'application'),
      eq(artifactVersions.artifactId, 181)
    ))
    .orderBy(desc(artifactVersions.id));
  
  console.log(`Found ${versions.length} versions for Easy Sync:`);
  for (const version of versions) {
    console.log(`\nVersion ID: ${version.id}`);
    console.log(`  Version Number: ${version.versionNumber}`);
    console.log(`  Initiative: ${version.initiativeId}`);
    console.log(`  Is Baseline: ${version.isBaseline}`);
    console.log(`  Created By: User ID ${version.createdBy}`);
    console.log(`  Created At: ${version.createdAt}`);
    console.log(`  Change Type: ${version.changeType}`);
  }

  // Check for recent versions in any initiative
  console.log("\n\nChecking recent versions across all artifacts...");
  const recentVersions = await db.select()
    .from(artifactVersions)
    .orderBy(desc(artifactVersions.id))
    .limit(10);
  
  console.log(`\nMost recent ${recentVersions.length} versions:`);
  for (const version of recentVersions) {
    console.log(`  ID: ${version.id}, Type: ${version.artifactType}, Artifact: ${version.artifactId}, Initiative: ${version.initiativeId}`);
  }

  process.exit(0);
}

checkVersions().catch(console.error);