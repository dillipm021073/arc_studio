import * as dotenv from "dotenv";
import path from "path";
import * as readline from "readline";

// Load environment variables BEFORE importing anything that uses them
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { db } from "../server/db";
import { umlFolders, umlDiagrams } from "@shared/schema-uml";
import { eq, and, desc, inArray } from "drizzle-orm";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function analyzePPGISFolders() {
  try {
    console.log("Analyzing PPGIS folders...\n");
    
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
      console.log("No PPGIS folders found. Nothing to analyze.");
      rl.close();
      return;
    }

    // Check for diagrams in each folder
    console.log("\nAnalyzing folder contents:");
    const folderAnalysis = [];
    
    for (const folder of ppgisFolders) {
      const diagrams = await db.select({
        id: umlDiagrams.id,
        name: umlDiagrams.name,
        diagramType: umlDiagrams.diagramType
      })
      .from(umlDiagrams)
      .where(eq(umlDiagrams.folderId, folder.id));
      
      folderAnalysis.push({
        folder,
        diagramCount: diagrams.length,
        diagrams
      });
      
      console.log(`\nFolder ID ${folder.id}:`);
      console.log(`  Path: ${folder.path}`);
      console.log(`  Created: ${folder.createdAt}`);
      console.log(`  Created By User ID: ${folder.createdBy}`);
      console.log(`  Description: ${folder.description || "(none)"}`);
      console.log(`  Contains ${diagrams.length} diagram(s)`);
      
      if (diagrams.length > 0) {
        console.log("  Diagrams:");
        diagrams.forEach(d => {
          console.log(`    - ${d.name} (${d.diagramType})`);
        });
      }
    }

    // Check for child folders
    console.log("\nChecking for child folders...");
    const folderIds = ppgisFolders.map(f => f.id);
    const childFolders = await db.select({
      id: umlFolders.id,
      name: umlFolders.name,
      parentId: umlFolders.parentId,
      path: umlFolders.path
    })
    .from(umlFolders)
    .where(inArray(umlFolders.parentId, folderIds));
    
    if (childFolders.length > 0) {
      console.log(`Found ${childFolders.length} child folders:`);
      childFolders.forEach(child => {
        console.log(`  - ${child.name} (parent ID: ${child.parentId})`);
      });
    } else {
      console.log("No child folders found.");
    }

    // Provide options
    console.log("\n" + "=".repeat(50));
    console.log("Options:");
    console.log("1. Delete ALL PPGIS folders (including any with diagrams)");
    console.log("2. Delete only empty PPGIS folders");
    console.log("3. Keep the oldest folder, delete the rest");
    console.log("4. Exit without making changes");
    console.log("=".repeat(50));
    
    const choice = await question("\nEnter your choice (1-4): ");
    
    switch (choice) {
      case "1":
        // Delete all PPGIS folders
        console.log("\nDeleting ALL PPGIS folders...");
        for (const { folder } of folderAnalysis) {
          await db.delete(umlFolders).where(eq(umlFolders.id, folder.id));
          console.log(`✓ Deleted folder ID ${folder.id}`);
        }
        console.log(`\nDeleted all ${ppgisFolders.length} PPGIS folders.`);
        break;
        
      case "2":
        // Delete only empty folders
        const emptyFolders = folderAnalysis.filter(fa => fa.diagramCount === 0);
        if (emptyFolders.length === 0) {
          console.log("\nNo empty PPGIS folders found.");
        } else {
          console.log(`\nDeleting ${emptyFolders.length} empty PPGIS folders...`);
          for (const { folder } of emptyFolders) {
            await db.delete(umlFolders).where(eq(umlFolders.id, folder.id));
            console.log(`✓ Deleted empty folder ID ${folder.id}`);
          }
        }
        break;
        
      case "3":
        // Keep oldest, delete rest
        if (ppgisFolders.length === 1) {
          console.log("\nOnly one PPGIS folder exists. Nothing to delete.");
        } else {
          const oldest = ppgisFolders[ppgisFolders.length - 1];
          const toDelete = ppgisFolders.slice(0, -1);
          console.log(`\nKeeping folder ID ${oldest.id} (oldest)`);
          console.log(`Deleting ${toDelete.length} newer duplicate(s)...`);
          for (const folder of toDelete) {
            await db.delete(umlFolders).where(eq(umlFolders.id, folder.id));
            console.log(`✓ Deleted folder ID ${folder.id}`);
          }
        }
        break;
        
      case "4":
        console.log("\nExiting without changes.");
        break;
        
      default:
        console.log("\nInvalid choice. Exiting without changes.");
    }

  } catch (error) {
    console.error("Error during analysis:", error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the analysis
analyzePPGISFolders();