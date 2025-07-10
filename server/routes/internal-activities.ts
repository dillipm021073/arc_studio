import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  internalActivities, 
  applications,
  businessProcesses,
  insertInternalActivitySchema 
} from "../../shared/schema";
import { requireAuth, requirePermission } from "../auth";
import { eq, and, or, ilike, asc, desc } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all internal activities with filters
router.get("/", async (req, res) => {
  try {
    const { applicationId, businessProcessId, activityType, search } = req.query;
    
    let query = db
      .select({
        activity: internalActivities,
        application: applications,
        businessProcess: businessProcesses
      })
      .from(internalActivities)
      .leftJoin(applications, eq(internalActivities.applicationId, applications.id))
      .leftJoin(businessProcesses, eq(internalActivities.businessProcessId, businessProcesses.id));

    const conditions = [];
    
    if (applicationId) {
      conditions.push(eq(internalActivities.applicationId, parseInt(applicationId as string)));
    }
    
    if (businessProcessId) {
      conditions.push(eq(internalActivities.businessProcessId, parseInt(businessProcessId as string)));
    }
    
    if (activityType) {
      conditions.push(eq(internalActivities.activityType, activityType as string));
    }
    
    if (search) {
      conditions.push(
        or(
          ilike(internalActivities.activityName, `%${search}%`),
          ilike(internalActivities.description, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(asc(internalActivities.sequenceNumber));
    
    res.json(results);
  } catch (error) {
    console.error("Error fetching internal activities:", error);
    res.status(500).json({ error: "Failed to fetch internal activities" });
  }
});

// Get a specific internal activity
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [activity] = await db
      .select({
        activity: internalActivities,
        application: applications,
        businessProcess: businessProcesses
      })
      .from(internalActivities)
      .leftJoin(applications, eq(internalActivities.applicationId, applications.id))
      .leftJoin(businessProcesses, eq(internalActivities.businessProcessId, businessProcesses.id))
      .where(eq(internalActivities.id, parseInt(id)));

    if (!activity) {
      return res.status(404).json({ error: "Internal activity not found" });
    }

    res.json(activity);
  } catch (error) {
    console.error("Error fetching internal activity:", error);
    res.status(500).json({ error: "Failed to fetch internal activity" });
  }
});

// Create a new internal activity
router.post("/", requirePermission("internal_activities", "create"), async (req, res) => {
  try {
    const validatedData = insertInternalActivitySchema.parse(req.body);
    
    const [newActivity] = await db
      .insert(internalActivities)
      .values(validatedData)
      .returning();

    res.status(201).json(newActivity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating internal activity:", error);
    res.status(500).json({ error: "Failed to create internal activity" });
  }
});

// Update an internal activity
router.put("/:id", requirePermission("internal_activities", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertInternalActivitySchema.partial().parse(req.body);
    
    const [updatedActivity] = await db
      .update(internalActivities)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(internalActivities.id, parseInt(id)))
      .returning();

    if (!updatedActivity) {
      return res.status(404).json({ error: "Internal activity not found" });
    }

    res.json(updatedActivity);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error updating internal activity:", error);
    res.status(500).json({ error: "Failed to update internal activity" });
  }
});

// Delete an internal activity
router.delete("/:id", requirePermission("internal_activities", "delete"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedActivity] = await db
      .delete(internalActivities)
      .where(eq(internalActivities.id, parseInt(id)))
      .returning();

    if (!deletedActivity) {
      return res.status(404).json({ error: "Internal activity not found" });
    }

    res.json({ message: "Internal activity deleted successfully" });
  } catch (error) {
    console.error("Error deleting internal activity:", error);
    res.status(500).json({ error: "Failed to delete internal activity" });
  }
});

// Bulk create internal activities for a business process
router.post("/bulk", requirePermission("internal_activities", "create"), async (req, res) => {
  try {
    const { activities } = req.body;
    
    if (!Array.isArray(activities)) {
      return res.status(400).json({ error: "Activities must be an array" });
    }

    const validatedActivities = activities.map(activity => 
      insertInternalActivitySchema.parse(activity)
    );

    const newActivities = await db
      .insert(internalActivities)
      .values(validatedActivities)
      .returning();

    res.status(201).json(newActivities);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating internal activities:", error);
    res.status(500).json({ error: "Failed to create internal activities" });
  }
});

export { router as internalActivitiesRouter };