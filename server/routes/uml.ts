import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { users } from "@db/schema";
import { umlFolders, umlDiagrams } from "@shared/schema-uml";
import { eq, and, or, like, sql, desc, asc, isNull } from "drizzle-orm";
import { requireAuth } from "../auth";
import { PlantUmlService } from "../services/plantuml.service";

export const umlRouter = Router();

// Get all folders with hierarchy
umlRouter.get("/folders", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    // Get all folders for the user
    const folders = await db.select({
      id: umlFolders.id,
      name: umlFolders.name,
      description: umlFolders.description,
      parentId: umlFolders.parentId,
      path: umlFolders.path,
      createdAt: umlFolders.createdAt,
      updatedAt: umlFolders.updatedAt
    })
    .from(umlFolders)
    .where(eq(umlFolders.createdBy, userId))
    .orderBy(asc(umlFolders.path));

    // Build folder hierarchy
    const folderMap = new Map();
    const rootFolders: any[] = [];

    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      if (folder.parentId) {
        const parent = folderMap.get(folder.parentId);
        if (parent) {
          parent.children.push(folderMap.get(folder.id));
        }
      } else {
        rootFolders.push(folderMap.get(folder.id));
      }
    });

    res.json(rootFolders);
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// Create a new folder
umlRouter.post("/folders", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, description, parentId } = req.body;

    // Validate input
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.number().optional()
    });

    const data = schema.parse({ name, description, parentId });

    // Calculate path
    let path = `/${name}`;
    if (data.parentId) {
      const [parent] = await db.select()
        .from(umlFolders)
        .where(eq(umlFolders.id, data.parentId));
      
      if (!parent) {
        return res.status(404).json({ error: "Parent folder not found" });
      }
      
      path = `${parent.path}/${name}`;
    }

    const [folder] = await db.insert(umlFolders).values({
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      path,
      createdBy: userId
    }).returning();

    res.json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Update folder
umlRouter.put("/folders/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const folderId = parseInt(req.params.id);
    const { name, description } = req.body;

    // Check ownership
    const [folder] = await db.select()
      .from(umlFolders)
      .where(and(
        eq(umlFolders.id, folderId),
        eq(umlFolders.createdBy, userId)
      ));

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    // Update folder
    const [updated] = await db.update(umlFolders)
      .set({
        name,
        description,
        updatedAt: new Date()
      })
      .where(eq(umlFolders.id, folderId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating folder:", error);
    res.status(500).json({ error: "Failed to update folder" });
  }
});

// Delete folder
umlRouter.delete("/folders/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const folderId = parseInt(req.params.id);

    // Check ownership
    const [folder] = await db.select()
      .from(umlFolders)
      .where(and(
        eq(umlFolders.id, folderId),
        eq(umlFolders.createdBy, userId)
      ));

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    // Delete folder (cascade will delete children and diagrams)
    await db.delete(umlFolders)
      .where(eq(umlFolders.id, folderId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

// Get diagrams in a folder
umlRouter.get("/folders/:folderId/diagrams", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const folderId = parseInt(req.params.folderId);

    // Check folder ownership
    const [folder] = await db.select()
      .from(umlFolders)
      .where(and(
        eq(umlFolders.id, folderId),
        eq(umlFolders.createdBy, userId)
      ));

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    const diagrams = await db.select()
      .from(umlDiagrams)
      .where(eq(umlDiagrams.folderId, folderId))
      .orderBy(desc(umlDiagrams.updatedAt));

    res.json(diagrams);
  } catch (error) {
    console.error("Error fetching diagrams:", error);
    res.status(500).json({ error: "Failed to fetch diagrams" });
  }
});

// Create a new diagram
umlRouter.post("/folders/:folderId/diagrams", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const folderId = parseInt(req.params.folderId);
    const { name, description, content, diagramType } = req.body;

    // Validate input
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      content: z.string(),
      diagramType: z.enum(['sequence', 'activity', 'class', 'usecase', 'component', 'state', 'deployment', 'object', 'package', 'timing', 'custom'])
    });

    const data = schema.parse({ name, description, content, diagramType });

    // Check folder ownership
    const [folder] = await db.select()
      .from(umlFolders)
      .where(and(
        eq(umlFolders.id, folderId),
        eq(umlFolders.createdBy, userId)
      ));

    if (!folder) {
      return res.status(404).json({ error: "Folder not found or access denied" });
    }

    const [diagram] = await db.insert(umlDiagrams).values({
      folderId,
      name: data.name,
      description: data.description,
      content: data.content,
      diagramType: data.diagramType as any,
      createdBy: userId
    }).returning();

    res.json(diagram);
  } catch (error) {
    console.error("Error creating diagram:", error);
    res.status(500).json({ error: "Failed to create diagram" });
  }
});

// Update diagram
umlRouter.put("/diagrams/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const diagramId = parseInt(req.params.id);
    const { name, description, content, diagramType } = req.body;

    // Check ownership
    const [diagram] = await db.select()
      .from(umlDiagrams)
      .where(and(
        eq(umlDiagrams.id, diagramId),
        eq(umlDiagrams.createdBy, userId)
      ));

    if (!diagram) {
      return res.status(404).json({ error: "Diagram not found or access denied" });
    }

    // Update diagram
    const [updated] = await db.update(umlDiagrams)
      .set({
        name,
        description,
        content,
        diagramType: diagramType as any,
        updatedBy: userId,
        updatedAt: new Date(),
        version: sql`${umlDiagrams.version} + 1`
      })
      .where(eq(umlDiagrams.id, diagramId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating diagram:", error);
    res.status(500).json({ error: "Failed to update diagram" });
  }
});

// Delete diagram
umlRouter.delete("/diagrams/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const diagramId = parseInt(req.params.id);

    // Check ownership
    const [diagram] = await db.select()
      .from(umlDiagrams)
      .where(and(
        eq(umlDiagrams.id, diagramId),
        eq(umlDiagrams.createdBy, userId)
      ));

    if (!diagram) {
      return res.status(404).json({ error: "Diagram not found or access denied" });
    }

    // Delete diagram
    await db.delete(umlDiagrams)
      .where(eq(umlDiagrams.id, diagramId));

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting diagram:", error);
    res.status(500).json({ error: "Failed to delete diagram" });
  }
});

// Render PlantUML diagram
umlRouter.post("/render", requireAuth, async (req, res) => {
  try {
    const { content, format = 'svg' } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Validate syntax
    const validation = PlantUmlService.validateSyntax(content);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    if (format === 'svg') {
      // Render SVG
      const svgContent = await PlantUmlService.renderSvg(content);
      
      // Extract metadata
      const metadata = PlantUmlService.extractMetadata(content);
      
      res.json({ 
        svg: svgContent,
        metadata 
      });
    } else {
      // Return URL for PNG
      const url = await PlantUmlService.getDiagramUrl(content, 'png');
      res.json({ url });
    }
  } catch (error) {
    console.error("Error rendering diagram:", error);
    res.status(500).json({ error: "Failed to render diagram" });
  }
});