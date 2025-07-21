import * as dotenv from "dotenv";
import path from "path";

// Load environment variables BEFORE importing anything that uses them
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../server/db";
import { umlFolders } from "@shared/schema-uml";
import { eq, and, desc } from "drizzle-orm";

async function cleanupPPGISFolders() {
  try {
    console.log("Starting PPGIS folders cleanup...");
    
    // First, find all folders named "PPGIS"
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
      return;
    }

    // Display all found folders
    console.log("\nList of PPGIS folders found:");
    ppgisFolders.forEach((folder, index) => {
      console.log(`${index + 1}. ID: ${folder.id}, Path: ${folder.path}, Created: ${folder.createdAt}, Created By: ${folder.createdBy}`);
      if (folder.description) {
        console.log(`   Description: ${folder.description}`);
      }
    });

    // Keep the first one (oldest) if it might be legitimate
    const folderToKeep = ppgisFolders[ppgisFolders.length - 1]; // Last in array (oldest due to desc order)
    const foldersToDelete = ppgisFolders.slice(0, -1); // All except the last one

    if (foldersToDelete.length === 0) {
      console.log("\nOnly one PPGIS folder exists. No duplicates to remove.");
      return;
    }

    console.log(`\nKeeping folder: ID ${folderToKeep.id} (created at ${folderToKeep.createdAt})`);
    console.log(`Will delete ${foldersToDelete.length} duplicate folders`);

    // Confirm before deletion
    console.log("\nDeleting the following folders:");
    for (const folder of foldersToDelete) {
      console.log(`- ID: ${folder.id}, Path: ${folder.path}`);
      
      // Delete the folder (cascade will handle child folders and diagrams)
      await db.delete(umlFolders)
        .where(eq(umlFolders.id, folder.id));
      
      console.log(`  ✓ Deleted folder ID ${folder.id}`);
    }

    console.log("\nCleanup completed successfully!");
    console.log(`Removed ${foldersToDelete.length} duplicate PPGIS folders.`);
    console.log(`Kept folder ID ${folderToKeep.id} as the original.`);

  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    process.exit(0);
  }
}

// Run the cleanup
cleanupPPGISFolders();