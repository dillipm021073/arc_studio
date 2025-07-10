import { Router } from "express";
import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { requireAuth } from "../auth";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Migrate all existing projects from database to local storage for a user
router.post("/migrate-to-local", async (req, res) => {
  try {
    const username = req.user?.username || 'admin';
    
    // Get all existing projects from database
    const dbProjects = await db.select().from(interfaceBuilderProjects);
    
    if (dbProjects.length === 0) {
      return res.json({
        success: true,
        message: "No projects found to migrate",
        migratedCount: 0
      });
    }
    
    const migratedProjects = [];
    const errors = [];
    
    for (const dbProject of dbProjects) {
      try {
        // Convert database project to local project format
        const localProject = {
          id: `migrated-${dbProject.id}-${Date.now()}`,
          name: `${dbProject.name} (Migrated)`,
          description: dbProject.description || '',
          category: dbProject.category || 'Migrated',
          nodes: dbProject.nodes || [],
          edges: dbProject.edges || [],
          metadata: {
            ...dbProject.metadata,
            author: username,
            originalDbId: dbProject.id.toString(),
            migratedAt: new Date().toISOString(),
            source: 'database_migration',
          },
          createdAt: dbProject.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to local storage directly
        const userProjectsPath = path.join(os.homedir(), "InterfaceBuilder", "Projects", "user_projects", username);
        
        // Ensure directory exists
        await fs.mkdir(userProjectsPath, { recursive: true });
        
        const fileName = `${localProject.id}.json`;
        const filePath = path.join(userProjectsPath, fileName);
        
        // Write to file
        await fs.writeFile(filePath, JSON.stringify(localProject, null, 2), 'utf-8');
        
        migratedProjects.push(localProject);
      } catch (error) {
        console.error(`Error migrating project ${dbProject.id}:`, error);
        errors.push(`Failed to migrate project "${dbProject.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    res.json({
      success: true,
      message: `Successfully migrated ${migratedProjects.length} projects to local storage`,
      migratedCount: migratedProjects.length,
      totalCount: dbProjects.length,
      errors: errors.length > 0 ? errors : undefined,
      migratedProjects: migratedProjects.map(p => ({
        id: p.id,
        name: p.name,
        originalId: p.metadata?.originalDbId
      }))
    });
  } catch (error) {
    console.error("Migration error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to migrate projects",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Get migration status - check if any projects exist in database
router.get("/status", async (req, res) => {
  try {
    const dbProjects = await db.select().from(interfaceBuilderProjects);
    const username = req.user?.username || 'admin';
    
    // Check local projects count directly
    let localProjectsCount = 0;
    try {
      const userProjectsPath = path.join(os.homedir(), "InterfaceBuilder", "Projects", "user_projects", username);
      const files = await fs.readdir(userProjectsPath);
      localProjectsCount = files.filter(file => file.endsWith('.json')).length;
    } catch (error) {
      // Directory doesn't exist yet, which is fine
      localProjectsCount = 0;
    }

    res.json({
      databaseProjectsCount: dbProjects.length,
      localProjectsCount,
      needsMigration: dbProjects.length > 0,
      username,
      projects: dbProjects.map(p => ({
        id: p.id,
        name: p.name,
        createdAt: p.createdAt,
        nodeCount: p.metadata?.nodeCount || 0,
        edgeCount: p.metadata?.edgeCount || 0
      }))
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      error: "Failed to check migration status",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export { router as migrateProjectsRouter };