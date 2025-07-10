import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  decisionPoints,
  insertDecisionPointSchema 
} from "../../shared/schema";
import { requireAuth, requirePermission } from "../auth";
import { eq, or, ilike } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all decision points
router.get("/", async (req, res) => {
  try {
    const { search, decisionType } = req.query;
    
    let query = db.select().from(decisionPoints);
    
    const conditions = [];
    
    if (search) {
      conditions.push(
        or(
          ilike(decisionPoints.name, `%${search}%`),
          ilike(decisionPoints.description, `%${search}%`)
        )
      );
    }
    
    if (decisionType) {
      conditions.push(eq(decisionPoints.decisionType, decisionType as string));
    }
    
    if (conditions.length > 0) {
      query = query.where(or(...conditions));
    }
    
    const results = await query;
    res.json(results);
  } catch (error) {
    console.error("Error fetching decision points:", error);
    res.status(500).json({ error: "Failed to fetch decision points" });
  }
});

// Get a specific decision point
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [decisionPoint] = await db
      .select()
      .from(decisionPoints)
      .where(eq(decisionPoints.id, parseInt(id)));

    if (!decisionPoint) {
      return res.status(404).json({ error: "Decision point not found" });
    }

    res.json(decisionPoint);
  } catch (error) {
    console.error("Error fetching decision point:", error);
    res.status(500).json({ error: "Failed to fetch decision point" });
  }
});

// Create a new decision point
router.post("/", requirePermission("decision_points", "create"), async (req, res) => {
  try {
    const validatedData = insertDecisionPointSchema.parse(req.body);
    
    // Ensure possibleOutcomes is a valid JSON string
    if (validatedData.possibleOutcomes && typeof validatedData.possibleOutcomes !== 'string') {
      validatedData.possibleOutcomes = JSON.stringify(validatedData.possibleOutcomes);
    }
    
    const [newDecisionPoint] = await db
      .insert(decisionPoints)
      .values(validatedData)
      .returning();

    res.status(201).json(newDecisionPoint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating decision point:", error);
    res.status(500).json({ error: "Failed to create decision point" });
  }
});

// Update a decision point
router.put("/:id", requirePermission("decision_points", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertDecisionPointSchema.partial().parse(req.body);
    
    // Ensure possibleOutcomes is a valid JSON string
    if (validatedData.possibleOutcomes && typeof validatedData.possibleOutcomes !== 'string') {
      validatedData.possibleOutcomes = JSON.stringify(validatedData.possibleOutcomes);
    }
    
    const [updatedDecisionPoint] = await db
      .update(decisionPoints)
      .set(validatedData)
      .where(eq(decisionPoints.id, parseInt(id)))
      .returning();

    if (!updatedDecisionPoint) {
      return res.status(404).json({ error: "Decision point not found" });
    }

    res.json(updatedDecisionPoint);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error updating decision point:", error);
    res.status(500).json({ error: "Failed to update decision point" });
  }
});

// Delete a decision point
router.delete("/:id", requirePermission("decision_points", "delete"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedDecisionPoint] = await db
      .delete(decisionPoints)
      .where(eq(decisionPoints.id, parseInt(id)))
      .returning();

    if (!deletedDecisionPoint) {
      return res.status(404).json({ error: "Decision point not found" });
    }

    res.json({ message: "Decision point deleted successfully" });
  } catch (error) {
    console.error("Error deleting decision point:", error);
    res.status(500).json({ error: "Failed to delete decision point" });
  }
});

// Get common decision point templates
router.get("/templates/common", async (req, res) => {
  try {
    const templates = [
      {
        name: "Data Exists Check",
        decisionType: "data_check",
        evaluationLogic: "EXISTS(data.id)",
        possibleOutcomes: JSON.stringify(["exists", "not_exists"])
      },
      {
        name: "Response Status Check",
        decisionType: "technical_check",
        evaluationLogic: "response.status === 200",
        possibleOutcomes: JSON.stringify(["success", "failure", "partial"])
      },
      {
        name: "Business Rule Validation",
        decisionType: "business_rule",
        evaluationLogic: "amount <= maxLimit && status === 'approved'",
        possibleOutcomes: JSON.stringify(["valid", "invalid", "requires_review"])
      },
      {
        name: "Retry Decision",
        decisionType: "technical_check",
        evaluationLogic: "retryCount < maxRetries && isRetryableError(error)",
        possibleOutcomes: JSON.stringify(["retry", "abort", "fallback"])
      }
    ];
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching decision point templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

export { router as decisionPointsRouter };