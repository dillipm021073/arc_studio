import { db } from "./db";
import { applications, initiatives } from "@db/schema";
import { eq, and, like, desc, isNull } from "drizzle-orm";

export async function fixSVAApplication() {
  try {
    console.log("Starting SVA application fix...");
    
    // Find the Kenan_V7 initiative
    const [kenanInitiative] = await db
      .select()
      .from(initiatives)
      .where(like(initiatives.name, "%Kenan%V7%"))
      .limit(1);
    
    if (!kenanInitiative) {
      console.error("Kenan_V7 initiative not found");
      return { success: false, message: "Kenan_V7 initiative not found" };
    }
    
    console.log(`Found initiative: ${kenanInitiative.initiativeId} - ${kenanInitiative.name}`);
    
    // Find the SVA application
    const [svaApp] = await db
      .select()
      .from(applications)
      .where(eq(applications.name, "SVA"))
      .orderBy(desc(applications.createdAt))
      .limit(1);
    
    if (!svaApp) {
      console.error("SVA application not found");
      return { success: false, message: "SVA application not found" };
    }
    
    console.log(`Found SVA application with ID: ${svaApp.id}`);
    console.log(`Current state: artifactState=${svaApp.artifactState}, initiativeOrigin=${svaApp.initiativeOrigin}`);
    
    // Update the SVA application if needed
    if (svaApp.artifactState === "active" && !svaApp.initiativeOrigin) {
      const [updated] = await db
        .update(applications)
        .set({
          artifactState: "pending",
          initiativeOrigin: kenanInitiative.initiativeId,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(applications.id, svaApp.id),
            eq(applications.artifactState, "active"),
            isNull(applications.initiativeOrigin)
          )
        )
        .returning();
      
      if (updated) {
        console.log("Successfully updated SVA application to pending state");
        return { 
          success: true, 
          message: "SVA application updated successfully",
          data: {
            applicationId: updated.id,
            name: updated.name,
            artifactState: updated.artifactState,
            initiativeOrigin: updated.initiativeOrigin
          }
        };
      }
    } else {
      console.log("SVA application already has correct state or was previously updated");
      return { 
        success: true, 
        message: "SVA application already has correct state",
        data: {
          applicationId: svaApp.id,
          name: svaApp.name,
          artifactState: svaApp.artifactState,
          initiativeOrigin: svaApp.initiativeOrigin
        }
      };
    }
    
    return { success: false, message: "Failed to update SVA application" };
    
  } catch (error) {
    console.error("Error fixing SVA application:", error);
    return { 
      success: false, 
      message: "Error fixing SVA application", 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// Run if called directly
if (require.main === module) {
  fixSVAApplication()
    .then(result => {
      console.log("Result:", result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}