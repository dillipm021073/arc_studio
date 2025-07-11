import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  initiatives, 
  initiativeParticipants,
  artifactVersions,
  versionConflicts,
  initiativeComments,
  initiativeApprovals
} from "@db/schema";
import { eq, and, desc, or, sql, like } from "drizzle-orm";
import { VersionControlService, ArtifactType } from "../services/version-control.service";
import { DependencyTrackingService } from "../services/dependency-tracking.service";
import { requireAuth } from "../auth";

export const initiativesRouter = Router();

// Create initiative schema
const createInitiativeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  businessJustification: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  targetCompletionDate: z.string().optional(),
});

// Get all initiatives
initiativesRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { status, participant, search } = req.query;

    let query = db.select({
      initiative: initiatives,
      participantCount: sql<number>`COUNT(DISTINCT ${initiativeParticipants.userId})`,
      artifactCount: sql<number>`COUNT(DISTINCT ${artifactVersions.id})`,
      isParticipant: sql<boolean>`EXISTS(
        SELECT 1 FROM ${initiativeParticipants} 
        WHERE ${initiativeParticipants.initiativeId} = ${initiatives.initiativeId} 
        AND ${initiativeParticipants.userId} = ${userId}
      )`
    })
    .from(initiatives)
    .leftJoin(initiativeParticipants, eq(initiativeParticipants.initiativeId, initiatives.initiativeId))
    .leftJoin(artifactVersions, eq(artifactVersions.initiativeId, initiatives.initiativeId))
    .groupBy(initiatives.id);

    // Filter by status
    if (status) {
      query = query.where(eq(initiatives.status, status as string));
    }

    // Filter by participant
    if (participant === 'true') {
      query = query.having(sql`EXISTS(
        SELECT 1 FROM ${initiativeParticipants} 
        WHERE ${initiativeParticipants.initiativeId} = ${initiatives.initiativeId} 
        AND ${initiativeParticipants.userId} = ${userId}
      )`);
    }

    // Search
    if (search) {
      query = query.where(
        or(
          like(initiatives.name, `%${search}%`),
          like(initiatives.description, `%${search}%`)
        )
      );
    }

    const results = await query.orderBy(desc(initiatives.createdAt));

    res.json(results);
  } catch (error) {
    console.error("Error fetching initiatives:", error);
    res.status(500).json({ error: "Failed to fetch initiatives" });
  }
});

// Get initiative by ID
initiativesRouter.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [initiative] = await db.select({
      initiative: initiatives,
      participants: sql<any>`
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', ${initiativeParticipants.id},
            'userId', ${initiativeParticipants.userId},
            'role', ${initiativeParticipants.role},
            'joinedAt', ${initiativeParticipants.joinedAt}
          )
        ) FILTER (WHERE ${initiativeParticipants.id} IS NOT NULL)
      `,
      artifacts: sql<any>`
        JSON_AGG(DISTINCT
          JSON_BUILD_OBJECT(
            'type', ${artifactVersions.artifactType},
            'id', ${artifactVersions.artifactId},
            'versionNumber', ${artifactVersions.versionNumber}
          )
        ) FILTER (WHERE ${artifactVersions.id} IS NOT NULL)
      `,
      conflicts: sql<number>`COUNT(DISTINCT ${versionConflicts.id}) FILTER (WHERE ${versionConflicts.resolutionStatus} = 'pending')`,
      userRole: sql<string>`
        (SELECT role FROM ${initiativeParticipants} 
         WHERE ${initiativeParticipants.initiativeId} = ${initiatives.initiativeId} 
         AND ${initiativeParticipants.userId} = ${userId})
      `
    })
    .from(initiatives)
    .leftJoin(initiativeParticipants, eq(initiativeParticipants.initiativeId, initiatives.initiativeId))
    .leftJoin(artifactVersions, eq(artifactVersions.initiativeId, initiatives.initiativeId))
    .leftJoin(versionConflicts, eq(versionConflicts.initiativeId, initiatives.initiativeId))
    .where(eq(initiatives.initiativeId, id))
    .groupBy(initiatives.id);

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    res.json(initiative);
  } catch (error) {
    console.error("Error fetching initiative:", error);
    res.status(500).json({ error: "Failed to fetch initiative" });
  }
});

// Create new initiative
initiativesRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const data = createInitiativeSchema.parse(req.body);

    const initiative = await VersionControlService.createInitiative({
      ...data,
      targetCompletionDate: data.targetCompletionDate ? new Date(data.targetCompletionDate) : undefined,
      createdBy: userId
    });

    res.status(201).json(initiative);
  } catch (error) {
    console.error("Error creating initiative:", error);
    res.status(500).json({ error: "Failed to create initiative" });
  }
});

// Update initiative
initiativesRouter.put("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const data = createInitiativeSchema.parse(req.body);

    console.log("Update initiative request:", {
      paramId: id,
      userId,
      userIdType: typeof userId,
      user: req.user
    });

    // First check if user is the creator/owner
    const [initiative] = await db.select()
      .from(initiatives)
      .where(eq(initiatives.id, parseInt(id)));

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    console.log("Initiative found:", {
      id: initiative.id,
      createdBy: initiative.createdBy,
      createdByType: typeof initiative.createdBy,
      comparison: initiative.createdBy === userId
    });

    // Allow if user is creator or participant with appropriate role
    if (initiative.createdBy !== userId) {
      const [participant] = await db.select()
        .from(initiativeParticipants)
        .where(
          and(
            eq(initiativeParticipants.initiativeId, initiative.initiativeId),
            eq(initiativeParticipants.userId, userId)
          )
        );


      if (!participant || !['lead', 'architect'].includes(participant.role)) {
        return res.status(403).json({ error: "Not authorized to update this initiative" });
      }
    }

    const [updated] = await db.update(initiatives)
      .set({
        ...data,
        targetCompletionDate: data.targetCompletionDate ? new Date(data.targetCompletionDate) : undefined,
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(initiatives.id, parseInt(id)))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("Error updating initiative:", error);
    res.status(500).json({ error: "Failed to update initiative" });
  }
});

// Add participant to initiative
initiativesRouter.post("/:id/participants", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { userId: participantId, role } = req.body;

    // Check if user has permission to add participants
    const [requester] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, id),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!requester || !['lead', 'architect'].includes(requester.role)) {
      return res.status(403).json({ error: "Not authorized to add participants" });
    }

    const [participant] = await db.insert(initiativeParticipants)
      .values({
        initiativeId: id,
        userId: participantId,
        role,
        addedBy: userId
      })
      .returning();

    res.status(201).json(participant);
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ error: "Failed to add participant" });
  }
});

// Checkout artifact for editing
initiativesRouter.post("/:id/checkout", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { artifactType, artifactId } = req.body;

    // Verify user is participant
    const [participant] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, id),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!participant) {
      return res.status(403).json({ error: "Not a participant of this initiative" });
    }

    const version = await VersionControlService.checkoutArtifact(
      artifactType as ArtifactType,
      artifactId,
      id,
      userId
    );

    res.json(version);
  } catch (error) {
    console.error("Error checking out artifact:", error);
    res.status(500).json({ error: error.message || "Failed to checkout artifact" });
  }
});

// Checkin artifact changes
initiativesRouter.post("/:id/checkin", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { artifactType, artifactId, data, changeReason } = req.body;

    const version = await VersionControlService.checkinArtifact(
      artifactType as ArtifactType,
      artifactId,
      id,
      userId,
      data,
      changeReason
    );

    res.json(version);
  } catch (error) {
    console.error("Error checking in artifact:", error);
    res.status(500).json({ error: error.message || "Failed to checkin artifact" });
  }
});

// Get conflicts for initiative
initiativesRouter.get("/:id/conflicts", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const conflicts = await db.select({
      conflict: versionConflicts,
      baselineVersion: artifactVersions,
      initiativeVersion: {
        id: artifactVersions.id,
        versionNumber: artifactVersions.versionNumber,
        artifactData: artifactVersions.artifactData
      }
    })
    .from(versionConflicts)
    .innerJoin(
      artifactVersions,
      eq(artifactVersions.id, versionConflicts.baselineVersionId)
    )
    .where(eq(versionConflicts.initiativeId, id))
    .orderBy(versionConflicts.createdAt);

    res.json(conflicts);
  } catch (error) {
    console.error("Error fetching conflicts:", error);
    res.status(500).json({ error: "Failed to fetch conflicts" });
  }
});

// Detect conflicts for initiative
initiativesRouter.post("/:id/detect-conflicts", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const conflicts = await VersionControlService.detectConflicts(id);

    res.json({ 
      conflictCount: conflicts.length,
      conflicts 
    });
  } catch (error) {
    console.error("Error detecting conflicts:", error);
    res.status(500).json({ error: "Failed to detect conflicts" });
  }
});

// Resolve conflict
initiativesRouter.post("/:id/conflicts/:conflictId/resolve", requireAuth, async (req, res) => {
  try {
    const { conflictId } = req.params;
    const userId = req.user!.id;
    const { strategy, resolvedData, notes } = req.body;

    await VersionControlService.resolveConflict(
      parseInt(conflictId),
      strategy,
      resolvedData,
      userId,
      notes
    );

    res.json({ message: "Conflict resolved successfully" });
  } catch (error) {
    console.error("Error resolving conflict:", error);
    res.status(500).json({ error: "Failed to resolve conflict" });
  }
});

// Complete initiative (baseline)
initiativesRouter.post("/:id/baseline", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has permission
    const [participant] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, id),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!participant || participant.role !== 'lead') {
      return res.status(403).json({ error: "Only initiative lead can complete the initiative" });
    }

    await VersionControlService.baselineInitiative(id, userId);

    res.json({ message: "Initiative completed and baselined successfully" });
  } catch (error) {
    console.error("Error completing initiative:", error);
    res.status(500).json({ error: error.message || "Failed to complete initiative" });
  }
});

// Transfer ownership
initiativesRouter.post("/:id/transfer-ownership", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { newOwnerId } = req.body;

    // Check if user is the current owner (creator)
    const [initiative] = await db.select()
      .from(initiatives)
      .where(eq(initiatives.id, parseInt(id)));

    if (!initiative || initiative.createdBy !== userId) {
      return res.status(403).json({ error: "Only the initiative owner can transfer ownership" });
    }

    // Update the initiative creator and add new owner as lead participant
    await db.transaction(async (tx) => {
      // Update initiative owner
      await tx.update(initiatives)
        .set({
          createdBy: newOwnerId,
          updatedBy: userId,
          updatedAt: new Date()
        })
        .where(eq(initiatives.id, parseInt(id)));

      // Remove old owner as lead if they are a participant
      await tx.update(initiativeParticipants)
        .set({ role: 'developer' })
        .where(
          and(
            eq(initiativeParticipants.initiativeId, initiative.initiativeId),
            eq(initiativeParticipants.userId, userId),
            eq(initiativeParticipants.role, 'lead')
          )
        );

      // Add new owner as lead participant if not already
      const [existingParticipant] = await tx.select()
        .from(initiativeParticipants)
        .where(
          and(
            eq(initiativeParticipants.initiativeId, initiative.initiativeId),
            eq(initiativeParticipants.userId, newOwnerId)
          )
        );

      if (existingParticipant) {
        // Update existing participant to lead
        await tx.update(initiativeParticipants)
          .set({ role: 'lead' })
          .where(eq(initiativeParticipants.id, existingParticipant.id));
      } else {
        // Add as new lead participant
        await tx.insert(initiativeParticipants)
          .values({
            initiativeId: initiative.initiativeId,
            userId: newOwnerId,
            role: 'lead',
            addedBy: userId
          });
      }
    });

    res.json({ message: "Ownership transferred successfully" });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    res.status(500).json({ error: "Failed to transfer ownership" });
  }
});

// Complete initiative (baseline) - duplicate endpoint for backward compatibility
initiativesRouter.post("/:id/complete", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    // Check if user has permission
    const [participant] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, id),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!participant || participant.role !== 'lead') {
      return res.status(403).json({ error: "Only initiative lead can complete the initiative" });
    }

    await VersionControlService.baselineInitiative(id, userId);

    res.json({ message: "Initiative completed and baselined successfully" });
  } catch (error) {
    console.error("Error completing initiative:", error);
    res.status(500).json({ error: error.message || "Failed to complete initiative" });
  }
});

// Add comment to initiative
initiativesRouter.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { comment, commentType, artifactType, artifactId, versionId } = req.body;

    const [newComment] = await db.insert(initiativeComments)
      .values({
        initiativeId: id,
        comment,
        commentType,
        artifactType,
        artifactId,
        versionId,
        userId
      })
      .returning();

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get comments for initiative
initiativesRouter.get("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await db.select()
      .from(initiativeComments)
      .where(eq(initiativeComments.initiativeId, id))
      .orderBy(desc(initiativeComments.createdAt));

    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// Get dependency graph for artifact
initiativesRouter.get("/:id/dependencies/:artifactType/:artifactId", requireAuth, async (req, res) => {
  try {
    const { artifactType, artifactId } = req.params;
    const { maxDepth = "3" } = req.query;

    const graph = await DependencyTrackingService.buildDependencyGraph(
      artifactType as ArtifactType,
      parseInt(artifactId),
      parseInt(maxDepth as string)
    );

    res.json(graph);
  } catch (error) {
    console.error("Error building dependency graph:", error);
    res.status(500).json({ error: "Failed to build dependency graph" });
  }
});

// Get impact report for initiative
initiativesRouter.get("/:id/impact-report", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get all changes in this initiative
    const versions = await db.select()
      .from(artifactVersions)
      .where(eq(artifactVersions.initiativeId, id));

    const changes = versions.map(v => ({
      type: v.artifactType as ArtifactType,
      id: v.artifactId,
      changeType: v.changeType || 'update'
    }));

    const report = await DependencyTrackingService.getImpactReport(changes);

    res.json(report);
  } catch (error) {
    console.error("Error generating impact report:", error);
    res.status(500).json({ error: "Failed to generate impact report" });
  }
});

// Auto-resolve conflicts
initiativesRouter.post("/:id/conflicts/:conflictId/auto-resolve", requireAuth, async (req, res) => {
  try {
    const { id, conflictId } = req.params;
    const userId = req.user!.id;

    // Verify user is participant
    const [participant] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, id),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!participant) {
      return res.status(403).json({ error: "Not a participant of this initiative" });
    }

    // Get conflict details
    const [conflict] = await db.select()
      .from(versionConflicts)
      .where(eq(versionConflicts.id, parseInt(conflictId)));

    if (!conflict || conflict.initiativeId !== id) {
      return res.status(404).json({ error: "Conflict not found" });
    }

    // Try auto-resolution
    await VersionControlService.resolveConflict(
      parseInt(conflictId),
      'auto_merge',
      null, // Will be calculated by the service
      userId
    );

    res.json({ message: "Conflict auto-resolved successfully" });
  } catch (error) {
    console.error("Error auto-resolving conflict:", error);
    res.status(500).json({ error: error.message || "Failed to auto-resolve conflict" });
  }
});

// Get conflict details with analysis
initiativesRouter.get("/:id/conflicts/:conflictId/analysis", requireAuth, async (req, res) => {
  try {
    const { id, conflictId } = req.params;

    const [conflict] = await db.select()
      .from(versionConflicts)
      .where(
        and(
          eq(versionConflicts.id, parseInt(conflictId)),
          eq(versionConflicts.initiativeId, id)
        )
      );

    if (!conflict) {
      return res.status(404).json({ error: "Conflict not found" });
    }

    // Return conflict with detailed analysis
    res.json({
      ...conflict,
      analysis: conflict.conflictDetails
    });
  } catch (error) {
    console.error("Error fetching conflict analysis:", error);
    res.status(500).json({ error: "Failed to fetch conflict analysis" });
  }
});