import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  businessProcessSequences,
  businessProcesses,
  interfaces,
  internalActivities,
  decisionPoints,
  insertBusinessProcessSequenceSchema 
} from "../../shared/schema";
import { requireAuth, requirePermission } from "../auth";
import { eq, and, asc, gte, gt, sql } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all sequences for a business process
router.get("/business-process/:businessProcessId", async (req, res) => {
  try {
    const { businessProcessId } = req.params;
    
    const sequences = await db
      .select()
      .from(businessProcessSequences)
      .where(eq(businessProcessSequences.businessProcessId, parseInt(businessProcessId)))
      .orderBy(asc(businessProcessSequences.sequenceNumber));

    // Fetch additional details for each sequence based on type
    const enrichedSequences = await Promise.all(
      sequences.map(async (seq) => {
        let referenceDetails = null;
        
        switch (seq.sequenceType) {
          case 'internal_activity':
            [referenceDetails] = await db
              .select()
              .from(internalActivities)
              .where(eq(internalActivities.id, seq.referenceId));
            break;
            
          case 'interface_call':
            [referenceDetails] = await db
              .select()
              .from(interfaces)
              .where(eq(interfaces.id, seq.referenceId));
            break;
            
          case 'decision_point':
            [referenceDetails] = await db
              .select()
              .from(decisionPoints)
              .where(eq(decisionPoints.id, seq.referenceId));
            break;
        }
        
        return {
          ...seq,
          referenceDetails
        };
      })
    );

    res.json(enrichedSequences);
  } catch (error) {
    console.error("Error fetching business process sequences:", error);
    res.status(500).json({ error: "Failed to fetch sequences" });
  }
});

// Create a new sequence
router.post("/", requirePermission("business_process_sequences", "create"), async (req, res) => {
  try {
    const validatedData = insertBusinessProcessSequenceSchema.parse(req.body);
    
    // Check if sequence number already exists
    const existing = await db
      .select()
      .from(businessProcessSequences)
      .where(and(
        eq(businessProcessSequences.businessProcessId, validatedData.businessProcessId),
        eq(businessProcessSequences.sequenceNumber, validatedData.sequenceNumber)
      ));

    if (existing.length > 0) {
      // Shift existing sequences to make room
      await db
        .update(businessProcessSequences)
        .set({
          sequenceNumber: sql`${businessProcessSequences.sequenceNumber} + 1`
        })
        .where(and(
          eq(businessProcessSequences.businessProcessId, validatedData.businessProcessId),
          gte(businessProcessSequences.sequenceNumber, validatedData.sequenceNumber)
        ));
    }

    const [newSequence] = await db
      .insert(businessProcessSequences)
      .values(validatedData)
      .returning();

    res.status(201).json(newSequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating sequence:", error);
    res.status(500).json({ error: "Failed to create sequence" });
  }
});

// Update a sequence
router.put("/:id", requirePermission("business_process_sequences", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertBusinessProcessSequenceSchema.partial().parse(req.body);
    
    const [updatedSequence] = await db
      .update(businessProcessSequences)
      .set(validatedData)
      .where(eq(businessProcessSequences.id, parseInt(id)))
      .returning();

    if (!updatedSequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    res.json(updatedSequence);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error updating sequence:", error);
    res.status(500).json({ error: "Failed to update sequence" });
  }
});

// Delete a sequence
router.delete("/:id", requirePermission("business_process_sequences", "delete"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedSequence] = await db
      .delete(businessProcessSequences)
      .where(eq(businessProcessSequences.id, parseInt(id)))
      .returning();

    if (!deletedSequence) {
      return res.status(404).json({ error: "Sequence not found" });
    }

    // Reorder remaining sequences
    await db
      .update(businessProcessSequences)
      .set({
        sequenceNumber: sql`${businessProcessSequences.sequenceNumber} - 1`
      })
      .where(and(
        eq(businessProcessSequences.businessProcessId, deletedSequence.businessProcessId),
        gt(businessProcessSequences.sequenceNumber, deletedSequence.sequenceNumber)
      ));

    res.json({ message: "Sequence deleted successfully" });
  } catch (error) {
    console.error("Error deleting sequence:", error);
    res.status(500).json({ error: "Failed to delete sequence" });
  }
});

// Reorder sequences
router.post("/reorder", async (req, res) => {
  try {
    const { businessProcessId, sequences } = req.body;
    
    if (!Array.isArray(sequences)) {
      return res.status(400).json({ error: "Sequences must be an array" });
    }

    // Update each sequence with new order
    await Promise.all(
      sequences.map((seq, index) => 
        db
          .update(businessProcessSequences)
          .set({ sequenceNumber: index + 1 })
          .where(eq(businessProcessSequences.id, seq.id))
      )
    );

    res.json({ message: "Sequences reordered successfully" });
  } catch (error) {
    console.error("Error reordering sequences:", error);
    res.status(500).json({ error: "Failed to reorder sequences" });
  }
});

export { router as businessProcessSequencesRouter };