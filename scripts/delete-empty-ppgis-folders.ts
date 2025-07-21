import * as dotenv from "dotenv";
import path from "path";

// Load environment variables BEFORE importing anything that uses them
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../server/db";
import { umlFolders, umlDiagrams } from "@shared/schema-uml";
import { eq, desc } from "drizzle-orm";

async function deleteEmptyPPGISFolders() {
  try {
    console.log("Starting cleanup of empty PPGIS folders...\n");
    
    // Find all folders named "PPGIS"
    const ppgisFolders = await db.select({
      id: umlFolders.id,
      name: umlFolders.name,
      path: umlFolders.path,
      parentId: umlFolders.parentId,
      createdBy: umlFolders.createdBy,
      createdAt: umlFolders.createdAt,
      description: umlFolders.description
    })
    .from(umlFolders)
    .where(eq(umlFolders.name, "PPGIS"))
    .orderBy(desc(umlFolders.createdAt));

    console.log(`Found ${ppgisFolders.length} folders named "PPGIS"`);
    
    if (ppgisFolders.length === 0) {
      console.log("No PPGIS folders found. Nothing to clean up.");
      process.exit(0);
      return;
    }

    // Check for diagrams in each folder and delete empty ones
    let deletedCount = 0;
    
    for (const folder of ppgisFolders) {
      const diagrams = await db.select({
        id: umlDiagrams.id
      })
      .from(umlDiagrams)
      .where(eq(umlDiagrams.folderId, folder.id));
      
      if (diagrams.length === 0) {
        // Folder is empty, delete it
        await db.delete(umlFolders).where(eq(umlFolders.id, folder.id));
        console.log(`✓ Deleted empty folder ID ${folder.id} (Path: ${folder.path}, Created: ${folder.createdAt})`);
        deletedCount++;
      } else {
        console.log(`⚠ Skipped folder ID ${folder.id} - contains ${diagrams.length} diagram(s)`);
      }
    }

    console.log(`\nCleanup completed!`);
    console.log(`Deleted ${deletedCount} empty PPGIS folders.`);
    console.log(`Remaining PPGIS folders: ${ppgisFolders.length - deletedCount}`);

  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
deleteEmptyPPGISFolders();