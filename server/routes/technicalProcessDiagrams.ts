import { Router } from "express";
import { db } from "../db";
import { technicalProcessDiagrams } from "../../shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth";

const router = Router();

// Get diagram for a technical process
router.get("/:technicalProcessId", requireAuth, async (req, res) => {
  try {
    const technicalProcessId = parseInt(req.params.technicalProcessId);
    
    const [diagram] = await db
      .select()
      .from(technicalProcessDiagrams)
      .where(eq(technicalProcessDiagrams.technicalProcessId, technicalProcessId))
      .limit(1);
    
    if (!diagram) {
      return res.status(404).json({ message: "Diagram not found" });
    }
    
    res.json(diagram);
  } catch (error) {
    console.error("Error fetching technical process diagram:", error);
    res.status(500).json({ error: "Failed to fetch diagram" });
  }
});

// Create or update diagram
router.post("/:technicalProcessId", requireAuth, async (req, res) => {
  try {
    const technicalProcessId = parseInt(req.params.technicalProcessId);
    const { diagramData } = req.body;
    
    if (!diagramData) {
      return res.status(400).json({ error: "Diagram data is required" });
    }
    
    // Check if diagram exists
    const [existing] = await db
      .select()
      .from(technicalProcessDiagrams)
      .where(eq(technicalProcessDiagrams.technicalProcessId, technicalProcessId))
      .limit(1);
    
    if (existing) {
      // Update existing diagram
      const [updated] = await db
        .update(technicalProcessDiagrams)
        .set({
          diagramData,
          lastModifiedBy: req.user?.username || "system",
          updatedAt: new Date()
        })
        .where(eq(technicalProcessDiagrams.id, existing.id))
        .returning();
      
      res.json(updated);
    } else {
      // Create new diagram
      const [created] = await db
        .insert(technicalProcessDiagrams)
        .values({
          technicalProcessId,
          diagramData,
          createdBy: req.user?.username || "system",
          lastModifiedBy: req.user?.username || "system"
        })
        .returning();
      
      res.status(201).json(created);
    }
  } catch (error) {
    console.error("Error saving technical process diagram:", error);
    res.status(500).json({ error: "Failed to save diagram" });
  }
});

// Update existing diagram
router.put("/:technicalProcessId", requireAuth, async (req, res) => {
  try {
    const technicalProcessId = parseInt(req.params.technicalProcessId);
    const { diagramData, notes } = req.body;
    
    const [updated] = await db
      .update(technicalProcessDiagrams)
      .set({
        diagramData,
        notes,
        lastModifiedBy: req.user?.username || "system",
        updatedAt: new Date()
      })
      .where(eq(technicalProcessDiagrams.technicalProcessId, technicalProcessId))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ error: "Diagram not found" });
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating technical process diagram:", error);
    res.status(500).json({ error: "Failed to update diagram" });
  }
});

// Delete diagram
router.delete("/:technicalProcessId", requireAuth, async (req, res) => {
  try {
    const technicalProcessId = parseInt(req.params.technicalProcessId);
    
    const [deleted] = await db
      .delete(technicalProcessDiagrams)
      .where(eq(technicalProcessDiagrams.technicalProcessId, technicalProcessId))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ error: "Diagram not found" });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting technical process diagram:", error);
    res.status(500).json({ error: "Failed to delete diagram" });
  }
});

export { router as technicalProcessDiagramsRouter };