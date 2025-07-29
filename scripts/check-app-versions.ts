import { db } from "../server/db";
import { artifactVersions, applications, initiatives } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function checkAppVersions(appId: number) {
  console.log(`\n=== Checking versions for application ${appId} ===\n`);

  try {
    // Get the application
    const [app] = await db.select()
      .from(applications)
      .where(eq(applications.id, appId));

    if (!app) {
      console.log(`Application ${appId} not found`);
      return;
    }

    console.log(`Application: ${app.name} (ID: ${app.id})\n`);

    // Get all versions
    const versions = await db.select()
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, 'application'),
          eq(artifactVersions.artifactId, appId)
        )
      );

    console.log(`Found ${versions.length} version(s):\n`);

    // Group by baseline status
    const baselineVersions = versions.filter(v => v.isBaseline);
    const initiativeVersions = versions.filter(v => !v.isBaseline);

    console.log("=== BASELINE VERSIONS ===");
    if (baselineVersions.length === 0) {
      console.log("No baseline versions");
    } else {
      baselineVersions.forEach(v => {
        console.log(`Version ${v.versionNumber}: Created ${v.createdAt}`);
      });
    }

    console.log("\n=== INITIATIVE VERSIONS ===");
    if (initiativeVersions.length === 0) {
      console.log("No initiative versions");
    } else {
      // Group by initiative
      const byInitiative = new Map<string, typeof initiativeVersions>();
      
      for (const version of initiativeVersions) {
        if (!version.initiativeId) continue;
        
        if (!byInitiative.has(version.initiativeId)) {
          byInitiative.set(version.initiativeId, []);
        }
        byInitiative.get(version.initiativeId)!.push(version);
      }

      // Get initiative names
      const initiativeIds = Array.from(byInitiative.keys());
      const initiativeList = await db.select()
        .from(initiatives)
        .where(sql`${initiatives.initiativeId} IN (${sql.join(initiativeIds.map(id => sql`${id}`), sql`, `)})`);
      
      const initiativeMap = new Map(initiativeList.map(i => [i.initiativeId, i]));

      for (const [initId, versions] of byInitiative) {
        const init = initiativeMap.get(initId);
        console.log(`\nInitiative: ${init?.name || 'Unknown'} (${initId})`);
        console.log(`Status: ${init?.status || 'Unknown'}`);
        
        versions.forEach(v => {
          console.log(`  - Version ${v.versionNumber}: Created ${v.createdAt} by user ${v.createdBy}`);
        });
      }
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

// Import sql
import { sql } from "drizzle-orm";

// Get app ID from command line
const appId = parseInt(process.argv[2] || '');

if (!appId) {
  console.log("Usage: tsx scripts/check-app-versions.ts <app-id>");
  console.log("Example: tsx scripts/check-app-versions.ts 184");
  process.exit(1);
}

checkAppVersions(appId).then(() => {
  console.log("\nDone!");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});