import { db } from "../db";
import { applications, interfaces, businessProcesses, artifactVersions, users } from "@db/schema";
import { eq, and } from "drizzle-orm";

async function initializeBaselines() {
  console.log("Initializing baseline versions for existing data...");

  try {
    // Use admin user ID 7
    const systemUserId = 7;
    console.log(`Using admin user ID: ${systemUserId}`);

    // Initialize baselines for applications
    const allApplications = await db.select().from(applications);
    console.log(`Found ${allApplications.length} applications`);
    
    for (const app of allApplications) {
      // Check if baseline already exists
      const [existing] = await db.select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.artifactType, 'application'),
            eq(artifactVersions.artifactId, app.id),
            eq(artifactVersions.isBaseline, true)
          )
        );
      
      if (!existing) {
        await db.insert(artifactVersions).values({
          artifactType: 'application',
          artifactId: app.id,
          versionNumber: 1,
          isBaseline: true,
          artifactData: app,
          changeType: 'create',
          createdBy: systemUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created baseline for application ${app.name} (${app.id})`);
      }
    }

    // Initialize baselines for interfaces
    const allInterfaces = await db.select().from(interfaces);
    console.log(`Found ${allInterfaces.length} interfaces`);
    
    for (const iface of allInterfaces) {
      const [existing] = await db.select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.artifactType, 'interface'),
            eq(artifactVersions.artifactId, iface.id),
            eq(artifactVersions.isBaseline, true)
          )
        );
      
      if (!existing) {
        await db.insert(artifactVersions).values({
          artifactType: 'interface',
          artifactId: iface.id,
          versionNumber: 1,
          isBaseline: true,
          artifactData: iface,
          changeType: 'create',
          createdBy: systemUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created baseline for interface ${iface.imlNumber} (${iface.id})`);
      }
    }

    // Initialize baselines for business processes
    const allBusinessProcesses = await db.select().from(businessProcesses);
    console.log(`Found ${allBusinessProcesses.length} business processes`);
    
    for (const bp of allBusinessProcesses) {
      const [existing] = await db.select()
        .from(artifactVersions)
        .where(
          and(
            eq(artifactVersions.artifactType, 'business_process'),
            eq(artifactVersions.artifactId, bp.id),
            eq(artifactVersions.isBaseline, true)
          )
        );
      
      if (!existing) {
        await db.insert(artifactVersions).values({
          artifactType: 'business_process',
          artifactId: bp.id,
          versionNumber: 1,
          isBaseline: true,
          artifactData: bp,
          changeType: 'create',
          createdBy: systemUserId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`Created baseline for business process ${bp.businessProcess} (${bp.id})`);
      }
    }

    console.log("Baseline initialization complete!");
  } catch (error) {
    console.error("Error initializing baselines:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

initializeBaselines();