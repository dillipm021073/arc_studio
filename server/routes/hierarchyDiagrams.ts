import { Router } from "express";
import { db } from "../db";
import { hierarchyDiagrams, businessProcesses } from "../../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../auth";

const hierarchyDiagramsRouter = Router();

// Get all hierarchy diagrams
hierarchyDiagramsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const { businessProcessId, viewType } = req.query;
    const user = (req as any).user;
    
    let query = db.select().from(hierarchyDiagrams);
    const conditions = [eq(hierarchyDiagrams.createdBy, user.username)];

    if (businessProcessId) {
      conditions.push(eq(hierarchyDiagrams.businessProcessId, parseInt(businessProcessId as string)));
    }
    
    if (viewType) {
      conditions.push(eq(hierarchyDiagrams.viewType, viewType as string));
    }

    query = query.where(and(...conditions));
    const diagrams = await query.orderBy(desc(hierarchyDiagrams.updatedAt));
    
    res.json(diagrams);
  } catch (error) {
    console.error("Error fetching hierarchy diagrams:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy diagrams" });
  }
});

// Get hierarchy diagram by ID
hierarchyDiagramsRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    
    const diagram = await db
      .select()
      .from(hierarchyDiagrams)
      .where(and(
        eq(hierarchyDiagrams.id, id),
        eq(hierarchyDiagrams.createdBy, user.username)
      ))
      .limit(1);

    if (diagram.length === 0) {
      return res.status(404).json({ error: "Hierarchy diagram not found" });
    }

    res.json(diagram[0]);
  } catch (error) {
    console.error("Error fetching hierarchy diagram:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy diagram" });
  }
});

// Create new hierarchy diagram
hierarchyDiagramsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const {
      name,
      businessProcessId,
      viewType,
      diagramData,
      description
    } = req.body;

    if (!name || !viewType || !diagramData) {
      return res.status(400).json({ error: "Name, view type, and diagram data are required" });
    }

    const result = await db
      .insert(hierarchyDiagrams)
      .values({
        name,
        businessProcessId,
        viewType,
        diagramData: JSON.stringify(diagramData),
        description,
        createdBy: user.username,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating hierarchy diagram:", error);
    res.status(500).json({ error: "Failed to create hierarchy diagram" });
  }
});

// Update hierarchy diagram
hierarchyDiagramsRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    const { name, diagramData, description } = req.body;

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (diagramData !== undefined) updateData.diagramData = JSON.stringify(diagramData);
    if (description !== undefined) updateData.description = description;

    const result = await db
      .update(hierarchyDiagrams)
      .set(updateData)
      .where(and(
        eq(hierarchyDiagrams.id, id),
        eq(hierarchyDiagrams.createdBy, user.username)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Hierarchy diagram not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating hierarchy diagram:", error);
    res.status(500).json({ error: "Failed to update hierarchy diagram" });
  }
});

// Delete hierarchy diagram
hierarchyDiagramsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    
    const result = await db
      .delete(hierarchyDiagrams)
      .where(and(
        eq(hierarchyDiagrams.id, id),
        eq(hierarchyDiagrams.createdBy, user.username)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Hierarchy diagram not found" });
    }

    res.json({ message: "Hierarchy diagram deleted successfully" });
  } catch (error) {
    console.error("Error deleting hierarchy diagram:", error);
    res.status(500).json({ error: "Failed to delete hierarchy diagram" });
  }
});

export { hierarchyDiagramsRouter };