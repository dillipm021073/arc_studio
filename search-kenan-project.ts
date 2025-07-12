import { db } from "./server/db";
import { 
  applications, 
  interfaces, 
  businessProcesses, 
  technicalProcesses,
  internalActivities,
  communications,
  documents,
  artifactVersions,
  initiatives,
  changeRequests,
  projects,
  hierarchyDesigns
} from "./db/schema";
import { like, or, sql } from "drizzle-orm";

async function searchForKenanProject() {
  console.log("Searching for Kenan_V7 project in all tables...\n");

  try {
    // Search in projects table (if exists)
    try {
      const projectResults = await db.select().from(projects)
        .where(or(
          like(projects.name, '%Kenan%'),
          like(projects.name, '%kenan%'),
          like(projects.name, '%KENAN%')
        ));
      
      if (projectResults.length > 0) {
        console.log("Found in Projects table:");
        console.log(JSON.stringify(projectResults, null, 2));
      }
    } catch (e) {
      console.log("Projects table not found or error:", e.message);
    }

    // Search in applications
    const appResults = await db.select().from(applications)
      .where(or(
        like(applications.name, '%Kenan%'),
        like(applications.description, '%Kenan%'),
        like(applications.amlNumber, '%Kenan%')
      ));
    
    if (appResults.length > 0) {
      console.log("\nFound in Applications:");
      appResults.forEach(app => {
        console.log(`- ${app.name} (ID: ${app.id}, AML: ${app.amlNumber})`);
      });
    }

    // Search in interfaces
    const interfaceResults = await db.select().from(interfaces)
      .where(or(
        like(interfaces.providerApplicationName, '%Kenan%'),
        like(interfaces.consumerApplicationName, '%Kenan%'),
        like(interfaces.imlNumber, '%Kenan%'),
        like(interfaces.businessProcessName, '%Kenan%')
      ));
    
    if (interfaceResults.length > 0) {
      console.log("\nFound in Interfaces:");
      interfaceResults.forEach(iface => {
        console.log(`- ${iface.imlNumber}: ${iface.providerApplicationName} -> ${iface.consumerApplicationName}`);
      });
    }

    // Search in business processes
    const bpResults = await db.select().from(businessProcesses)
      .where(or(
        like(businessProcesses.businessProcess, '%Kenan%'),
        like(businessProcesses.product, '%Kenan%'),
        like(businessProcesses.vendorFocal, '%Kenan%')
      ));
    
    if (bpResults.length > 0) {
      console.log("\nFound in Business Processes:");
      bpResults.forEach(bp => {
        console.log(`- ${bp.businessProcess} (Product: ${bp.product})`);
      });
    }

    // Search in communications
    const commResults = await db.select().from(communications)
      .where(or(
        like(communications.message, '%Kenan%'),
        like(communications.entityName, '%Kenan%')
      ));
    
    if (commResults.length > 0) {
      console.log("\nFound in Communications:");
      commResults.forEach(comm => {
        console.log(`- ${comm.entityType}: ${comm.entityName} - ${comm.message.substring(0, 50)}...`);
      });
    }

    // Search in documents
    const docResults = await db.select().from(documents)
      .where(or(
        like(documents.fileName, '%Kenan%'),
        like(documents.originalName, '%Kenan%'),
        like(documents.extractedData, '%Kenan%')
      ));
    
    if (docResults.length > 0) {
      console.log("\nFound in Documents:");
      docResults.forEach(doc => {
        console.log(`- ${doc.originalName} (Entity: ${doc.entityType} ${doc.entityId})`);
      });
    }

    // Search in initiatives
    const initResults = await db.select().from(initiatives)
      .where(or(
        like(initiatives.name, '%Kenan%'),
        like(initiatives.description, '%Kenan%')
      ));
    
    if (initResults.length > 0) {
      console.log("\nFound in Initiatives:");
      initResults.forEach(init => {
        console.log(`- ${init.name}: ${init.description}`);
      });
    }

    // Search in change requests
    const crResults = await db.select().from(changeRequests)
      .where(or(
        like(changeRequests.reason, '%Kenan%'),
        like(changeRequests.benefit, '%Kenan%'),
        like(changeRequests.requestedBy, '%Kenan%')
      ));
    
    if (crResults.length > 0) {
      console.log("\nFound in Change Requests:");
      crResults.forEach(cr => {
        console.log(`- CR ${cr.id}: ${cr.reason}`);
      });
    }

    // Search in hierarchy designs (if it contains project data)
    try {
      const hierarchyResults = await db.select().from(hierarchyDesigns)
        .where(or(
          like(hierarchyDesigns.name, '%Kenan%'),
          like(hierarchyDesigns.description, '%Kenan%')
        ));
      
      if (hierarchyResults.length > 0) {
        console.log("\nFound in Hierarchy Designs:");
        hierarchyResults.forEach(h => {
          console.log(`- ${h.name}: ${h.description}`);
        });
      }
    } catch (e) {
      console.log("\nHierarchy Designs table not found or error:", e.message);
    }

    // Search for any versioned artifacts
    const versionResults = await db.execute(sql`
      SELECT DISTINCT av.*, i.name as initiative_name 
      FROM artifact_versions av
      LEFT JOIN initiatives i ON av.initiative_id = i.initiative_id
      WHERE av.artifact_data::text ILIKE '%Kenan%'
    `);
    
    if (versionResults.rows.length > 0) {
      console.log("\nFound in Artifact Versions:");
      versionResults.rows.forEach((ver: any) => {
        console.log(`- ${ver.artifact_type} ID: ${ver.artifact_id} in initiative: ${ver.initiative_name}`);
      });
    }

    console.log("\n\nSearch complete. If Kenan_V7 was a project name, it might have been:");
    console.log("1. A hierarchy design or project structure");
    console.log("2. An application name");
    console.log("3. Part of an initiative or change request");
    console.log("4. Referenced in communications or documents");

  } catch (error) {
    console.error("Error searching database:", error);
  } finally {
    process.exit(0);
  }
}

searchForKenanProject();