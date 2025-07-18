import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  initiatives, 
  initiativeParticipants,
  artifactVersions,
  versionConflicts,
  initiativeComments,
  initiativeApprovals,
  artifactLocks,
  users,
  applications,
  interfaces,
  businessProcesses,
  technicalProcesses,
  internalActivities
} from "@db/schema";
import { eq, and, desc, or, sql, like, inArray } from "drizzle-orm";
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

// Get changes for an initiative
initiativesRouter.get("/:id/changes", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all artifact versions for this initiative
    const versions = await db.select({
      id: artifactVersions.id,
      artifactType: artifactVersions.artifactType,
      artifactId: artifactVersions.artifactId,
      versionNumber: artifactVersions.versionNumber,
      changeType: artifactVersions.changeType,
      changeReason: artifactVersions.changeReason,
      createdAt: artifactVersions.createdAt,
      createdBy: artifactVersions.createdBy,
      isBaseline: artifactVersions.isBaseline,
      artifactData: artifactVersions.artifactData
    })
    .from(artifactVersions)
    .where(eq(artifactVersions.initiativeId, id))
    .orderBy(artifactVersions.createdAt);

    // Count changes by type
    const created = versions.filter(v => v.changeType === 'created').length;
    const modified = versions.filter(v => v.changeType === 'modified' || v.changeType === 'update').length;
    const deleted = versions.filter(v => v.changeType === 'deleted').length;

    // Group changes by artifact type
    const changesByType = versions.reduce((acc, version) => {
      if (!acc[version.artifactType]) {
        acc[version.artifactType] = [];
      }
      acc[version.artifactType].push(version);
      return acc;
    }, {} as Record<string, typeof versions>);

    res.json({
      totalChanges: versions.length,
      created,
      modified,
      deleted,
      versions,
      changesByType,
      hasChanges: versions.length > 0
    });
  } catch (error) {
    console.error("Error fetching initiative changes:", error);
    res.status(500).json({ error: "Failed to fetch initiative changes" });
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
    const userRole = req.user!.role;
    const { newOwnerId } = req.body;

    // Check if user is the current owner (creator) or admin
    const [initiative] = await db.select()
      .from(initiatives)
      .where(eq(initiatives.initiativeId, id));

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    const isAdmin = userRole === 'admin';
    const isOwner = initiative.createdBy === userId;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Only the initiative owner or admin can transfer ownership" });
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
        .where(eq(initiatives.initiativeId, id));

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

// Get checked out artifacts for an initiative (for closure process)
initiativesRouter.get("/:id/checked-out-artifacts", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const checkedOutArtifacts = await db.select({
      id: artifactLocks.id,
      artifactType: artifactLocks.artifactType,
      artifactId: artifactLocks.artifactId,
      lockedBy: artifactLocks.lockedBy,
      lockedAt: artifactLocks.lockedAt,
      userName: users.name,
      userEmail: users.email,
      artifactName: sql<string>`
        CASE 
          WHEN ${artifactLocks.artifactType} = 'application' THEN 
            (SELECT name FROM applications WHERE id = ${artifactLocks.artifactId})
          WHEN ${artifactLocks.artifactType} = 'interface' THEN 
            (SELECT iml_number FROM interfaces WHERE id = ${artifactLocks.artifactId})
          WHEN ${artifactLocks.artifactType} = 'business_process' THEN 
            (SELECT business_process FROM business_processes WHERE id = ${artifactLocks.artifactId})
          WHEN ${artifactLocks.artifactType} = 'technical_process' THEN 
            (SELECT name FROM technical_processes WHERE id = ${artifactLocks.artifactId})
          WHEN ${artifactLocks.artifactType} = 'internal_process' THEN 
            (SELECT activity_name FROM internal_activities WHERE id = ${artifactLocks.artifactId})
          ELSE 'Unknown'
        END
      `,
      hasChanges: sql<boolean>`
        EXISTS(
          SELECT 1 FROM artifact_versions 
          WHERE artifact_type = ${artifactLocks.artifactType}
          AND artifact_id = ${artifactLocks.artifactId}
          AND initiative_id = ${artifactLocks.initiativeId}
          AND is_baseline = false
        )
      `,
      conflictCount: sql<number>`
        (SELECT COUNT(*) FROM version_conflicts 
         WHERE artifact_type = ${artifactLocks.artifactType}
         AND artifact_id = ${artifactLocks.artifactId}
         AND initiative_id = ${artifactLocks.initiativeId}
         AND resolution_status = 'pending'
        )
      `
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.initiativeId, id),
        sql`${artifactLocks.lockExpiry} > NOW()`
      )
    );

    res.json(checkedOutArtifacts);
  } catch (error) {
    console.error("Error fetching checked out artifacts:", error);
    res.status(500).json({ error: "Failed to fetch checked out artifacts" });
  }
});

// Get impact analysis for initiative
initiativesRouter.get("/:id/impact-analysis", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get all artifacts modified in this initiative
    const modifiedArtifacts = await db.select({
      artifactType: artifactVersions.artifactType,
      artifactId: artifactVersions.artifactId,
      versionNumber: artifactVersions.versionNumber,
      changeType: artifactVersions.changeType,
      changeReason: artifactVersions.changeReason,
      artifactData: artifactVersions.artifactData
    })
    .from(artifactVersions)
    .where(
      and(
        eq(artifactVersions.initiativeId, id),
        eq(artifactVersions.isBaseline, false)
      )
    );

    if (modifiedArtifacts.length === 0) {
      return res.json({
        modifiedArtifacts: [],
        impactedApplications: [],
        impactedInterfaces: [],
        relatedBusinessProcesses: [],
        riskLevel: 'low'
      });
    }

    // Build comprehensive impact analysis
    let allImpactedApplications = new Set<number>();
    let allImpactedInterfaces = new Set<number>();
    let allRelatedBusinessProcesses = new Set<number>();

    // Process each modified artifact
    for (const artifact of modifiedArtifacts) {
      if (artifact.artifactType === 'application') {
        allImpactedApplications.add(artifact.artifactId);
        
        // Find interfaces provided/consumed by this application
        const relatedInterfaces = await db.select({
          id: interfaces.id,
          imlNumber: interfaces.imlNumber,
          interfaceType: interfaces.interfaceType,
          providerApplicationId: interfaces.providerApplicationId,
          consumerApplicationId: interfaces.consumerApplicationId,
          status: interfaces.status,
          relationship: sql<string>`
            CASE 
              WHEN ${interfaces.providerApplicationId} = ${artifact.artifactId} THEN 'provider'
              WHEN ${interfaces.consumerApplicationId} = ${artifact.artifactId} THEN 'consumer'
              ELSE 'unknown'
            END
          `
        })
        .from(interfaces)
        .where(
          or(
            eq(interfaces.providerApplicationId, artifact.artifactId),
            eq(interfaces.consumerApplicationId, artifact.artifactId)
          )
        );

        relatedInterfaces.forEach(iface => allImpactedInterfaces.add(iface.id));

        // Find other applications connected through these interfaces
        for (const iface of relatedInterfaces) {
          // Add the other application (provider or consumer)
          if (iface.providerApplicationId && iface.providerApplicationId !== artifact.artifactId) {
            allImpactedApplications.add(iface.providerApplicationId);
          }
          if (iface.consumerApplicationId && iface.consumerApplicationId !== artifact.artifactId) {
            allImpactedApplications.add(iface.consumerApplicationId);
          }
        }
      } else if (artifact.artifactType === 'interface') {
        allImpactedInterfaces.add(artifact.artifactId);
        
        // Find applications using this interface
        const [interfaceDetails] = await db.select({
          id: interfaces.id,
          providerApplicationId: interfaces.providerApplicationId,
          consumerApplicationId: interfaces.consumerApplicationId
        })
          .from(interfaces)
          .where(eq(interfaces.id, artifact.artifactId));

        if (interfaceDetails) {
          // Add provider and consumer applications
          if (interfaceDetails.providerApplicationId) {
            allImpactedApplications.add(interfaceDetails.providerApplicationId);
          }
          if (interfaceDetails.consumerApplicationId) {
            allImpactedApplications.add(interfaceDetails.consumerApplicationId);
          }
        }
      }
    }

    // Find business processes using the impacted interfaces
    let businessProcessesResult = [];
    if (allImpactedInterfaces.size > 0) {
      const interfaceIds = Array.from(allImpactedInterfaces);
      
      // First get the interface details with business process names
      const interfacesWithBP = await db.select({
        id: interfaces.id,
        businessProcessName: interfaces.businessProcessName
      })
      .from(interfaces)
      .where(inArray(interfaces.id, interfaceIds));

      // Get unique business process names
      const businessProcessNames = [...new Set(interfacesWithBP
        .map(i => i.businessProcessName)
        .filter(name => name !== null && name !== undefined))];

      if (businessProcessNames.length > 0) {
        businessProcessesResult = await db.select({
          id: businessProcesses.id,
          businessProcess: businessProcesses.businessProcess,
          lob: businessProcesses.lob,
          product: businessProcesses.product,
          domainOwner: businessProcesses.domainOwner,
          itOwner: businessProcesses.itOwner
        })
        .from(businessProcesses)
        .where(inArray(businessProcesses.businessProcess, businessProcessNames));

        businessProcessesResult.forEach(bp => allRelatedBusinessProcesses.add(bp.id));
      }
    }

    // Get detailed information for impacted artifacts
    let impactedApplicationsDetails = [];
    if (allImpactedApplications.size > 0) {
      const applicationIds = Array.from(allImpactedApplications);
      impactedApplicationsDetails = await db.select({
        id: applications.id,
        name: applications.name,
        description: applications.description,
        os: applications.os,
        deployment: applications.deployment,
        uptime: applications.uptime,
        status: applications.status,
        providesExtInterface: applications.providesExtInterface,
        consumesExtInterfaces: applications.consumesExtInterfaces
      })
      .from(applications)
      .where(inArray(applications.id, applicationIds));
    }

    let impactedInterfacesDetails = [];
    if (allImpactedInterfaces.size > 0) {
      const interfaceIds = Array.from(allImpactedInterfaces);
      impactedInterfacesDetails = await db.select({
        id: interfaces.id,
        imlNumber: interfaces.imlNumber,
        interfaceType: interfaces.interfaceType,
        providerApplicationId: interfaces.providerApplicationId,
        consumerApplicationId: interfaces.consumerApplicationId,
        businessProcessName: interfaces.businessProcessName,
        status: interfaces.status,
        version: interfaces.version,
        providerApplicationName: sql<string>`
          (SELECT name FROM applications WHERE id = ${interfaces.providerApplicationId})
        `,
        consumerApplicationName: sql<string>`
          (SELECT name FROM applications WHERE id = ${interfaces.consumerApplicationId})
        `
      })
      .from(interfaces)
      .where(inArray(interfaces.id, interfaceIds));
    }

    let relatedBusinessProcessesDetails = [];
    if (allRelatedBusinessProcesses.size > 0) {
      const businessProcessIds = Array.from(allRelatedBusinessProcesses);
      relatedBusinessProcessesDetails = await db.select()
        .from(businessProcesses)
        .where(inArray(businessProcesses.id, businessProcessIds));
    }

    // Calculate risk level based on impact scope
    let riskLevel = 'low';
    const totalImpactedArtifacts = allImpactedApplications.size + allImpactedInterfaces.size + allRelatedBusinessProcesses.size;
    
    if (totalImpactedArtifacts > 10) {
      riskLevel = 'high';
    } else if (totalImpactedArtifacts > 5) {
      riskLevel = 'medium';
    }

    res.json({
      modifiedArtifacts,
      impactedApplications: impactedApplicationsDetails,
      impactedInterfaces: impactedInterfacesDetails,
      relatedBusinessProcesses: relatedBusinessProcessesDetails,
      riskLevel,
      summary: {
        applicationsCount: allImpactedApplications.size,
        interfacesCount: allImpactedInterfaces.size,
        businessProcessesCount: allRelatedBusinessProcesses.size,
        totalImpactedArtifacts
      }
    });
  } catch (error) {
    console.error("Error generating initiative impact analysis:", error);
    res.status(500).json({ error: "Failed to generate impact analysis" });
  }
});

// Get initiatives and CRs for a specific artifact
initiativesRouter.get("/artifact/:artifactType/:artifactId", requireAuth, async (req, res) => {
  try {
    const { artifactType, artifactId } = req.params;
    const artifactIdNum = parseInt(artifactId);

    // Get initiatives in two ways:
    // 1. Initiatives that have versions of this artifact
    const versionsWithInitiatives = await db.select({
      initiative: initiatives,
      version: artifactVersions,
      isOrigin: sql<boolean>`false`
    })
    .from(artifactVersions)
    .innerJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
    .where(
      and(
        eq(artifactVersions.artifactType, artifactType),
        eq(artifactVersions.artifactId, artifactIdNum),
        inArray(initiatives.status, ['draft', 'planning', 'in_progress', 'review', 'active'])
      )
    )
    .groupBy(initiatives.id, initiatives.initiativeId, artifactVersions.id);

    // 2. Initiatives where this artifact is the origin (for applications and interfaces only)
    let originInitiatives = [];
    if (artifactType === 'application' || artifactType === 'interface') {
      // First get the artifact to find its initiativeOrigin
      const tableName = artifactType === 'application' ? applications : interfaces;
      const [artifact] = await db.select({ initiativeOrigin: tableName.initiativeOrigin })
        .from(tableName)
        .where(eq(tableName.id, artifactIdNum));
      
      if (artifact?.initiativeOrigin) {
        const [originInit] = await db.select({
          initiative: initiatives,
          version: sql<any>`NULL`,
          isOrigin: sql<boolean>`true`
        })
        .from(initiatives)
        .where(
          and(
            eq(initiatives.initiativeId, artifact.initiativeOrigin),
            inArray(initiatives.status, ['draft', 'planning', 'in_progress', 'review', 'active'])
          )
        );
        
        if (originInit) {
          originInitiatives.push(originInit);
        }
      }
    }

    // Combine results
    const artifactInitiatives = [...versionsWithInitiatives, ...originInitiatives];

    // Get unique initiatives with their details
    const uniqueInitiatives = new Map();
    artifactInitiatives.forEach(item => {
      if (!uniqueInitiatives.has(item.initiative.initiativeId)) {
        uniqueInitiatives.set(item.initiative.initiativeId, {
          initiative: item.initiative,
          changeType: item.version ? (item.version.changeType || 'modified') : 'created',
          changeDetails: item.version ? item.version.changeReason : 'Artifact originated in this initiative',
          isOrigin: item.isOrigin
        });
      }
    });

    // Import required tables for CRs and locks
    const { changeRequests, changeRequestApplications, changeRequestInterfaces, 
            changeRequestTechnicalProcesses, changeRequestInternalActivities } = await import("@db/schema");

    // Get related change requests based on artifact type
    let relatedCRs = [];
    if (artifactType === 'application') {
      relatedCRs = await db.select({
        cr: changeRequests,
        impact: changeRequestApplications
      })
      .from(changeRequestApplications)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestApplications.changeRequestId))
      .where(
        and(
          eq(changeRequestApplications.applicationId, artifactIdNum),
          inArray(changeRequests.status, ['draft', 'submitted', 'under_review', 'approved', 'in_progress'])
        )
      );
    } else if (artifactType === 'interface') {
      relatedCRs = await db.select({
        cr: changeRequests,
        impact: changeRequestInterfaces
      })
      .from(changeRequestInterfaces)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestInterfaces.changeRequestId))
      .where(
        and(
          eq(changeRequestInterfaces.interfaceId, artifactIdNum),
          inArray(changeRequests.status, ['draft', 'submitted', 'under_review', 'approved', 'in_progress'])
        )
      );
    } else if (artifactType === 'businessProcess') {
      // Business processes don't have direct CR impact tracking in the current schema
      relatedCRs = [];
    } else if (artifactType === 'technicalProcess') {
      relatedCRs = await db.select({
        cr: changeRequests,
        impact: changeRequestTechnicalProcesses
      })
      .from(changeRequestTechnicalProcesses)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestTechnicalProcesses.changeRequestId))
      .where(
        and(
          eq(changeRequestTechnicalProcesses.technicalProcessId, artifactIdNum),
          inArray(changeRequests.status, ['draft', 'submitted', 'under_review', 'approved', 'in_progress'])
        )
      );
    } else if (artifactType === 'internal_process') {
      relatedCRs = await db.select({
        cr: changeRequests,
        impact: changeRequestInternalActivities
      })
      .from(changeRequestInternalActivities)
      .innerJoin(changeRequests, eq(changeRequests.id, changeRequestInternalActivities.changeRequestId))
      .where(
        and(
          eq(changeRequestInternalActivities.internalActivityId, artifactIdNum),
          inArray(changeRequests.status, ['draft', 'submitted', 'under_review', 'approved', 'in_progress'])
        )
      );
    }

    // Format change requests
    const changeRequestsData = relatedCRs.map(({ cr, impact }) => ({
      id: cr.id,
      crNumber: cr.crNumber,
      title: cr.title,
      description: cr.description,
      status: cr.status,
      impactType: impact.impactType,
      impactDescription: impact.impactDescription,
      createdAt: cr.createdAt
    }));

    // Get artifact locks
    const locks = await db.select({
      lock: artifactLocks,
      initiative: initiatives,
      user: users
    })
    .from(artifactLocks)
    .innerJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
    .innerJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.artifactType, artifactType),
        eq(artifactLocks.artifactId, artifactIdNum),
        sql`${artifactLocks.lockExpiry} IS NULL OR ${artifactLocks.lockExpiry} > NOW()`
      )
    );

    const locksData = locks.map(({ lock, initiative, user }) => ({
      initiativeId: lock.initiativeId,
      initiativeName: initiative.name,
      lockedBy: lock.lockedBy,
      lockedByName: user.name,
      lockedAt: lock.lockedAt
    }));

    res.json({
      initiatives: Array.from(uniqueInitiatives.values()),
      changeRequests: changeRequestsData,
      locks: locksData
    });
  } catch (error) {
    console.error("Error fetching artifact initiatives:", error);
    res.status(500).json({ error: "Failed to fetch artifact initiative details" });
  }
});

// Cancel initiative
initiativesRouter.post("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { reason } = req.body;

    // Get initiative details to check creator
    const [initiative] = await db.select()
      .from(initiatives)
      .where(eq(initiatives.initiativeId, id));

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    // Check if user is authorized (admin OR initiative creator)
    const userRole = req.user!.role;
    const isAdmin = userRole === 'admin';
    const isCreator = initiative.createdBy === userId;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        error: "Only admin users or the initiative creator can cancel this initiative" 
      });
    }

    // Check if initiative is already completed or cancelled
    if (initiative.status === 'completed' || initiative.status === 'cancelled') {
      return res.status(400).json({ 
        error: `Cannot cancel an initiative that is already ${initiative.status}` 
      });
    }

    // Release all locks for this initiative
    await db.delete(artifactLocks)
      .where(eq(artifactLocks.initiativeId, id));

    // Delete all non-baseline versions for this initiative
    await db.delete(artifactVersions)
      .where(
        and(
          eq(artifactVersions.initiativeId, id),
          eq(artifactVersions.isBaseline, false)
        )
      );

    // Update initiative status to cancelled
    await db.update(initiatives)
      .set({
        status: 'cancelled',
        actualCompletionDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
        metadata: {
          ...(initiative.metadata as any || {}),
          cancellationReason: reason || 'No reason provided'
        }
      })
      .where(eq(initiatives.initiativeId, id));

    res.json({ 
      success: true, 
      message: "Initiative cancelled successfully"
    });
  } catch (error) {
    console.error("Error cancelling initiative:", error);
    res.status(500).json({ error: error.message || "Failed to cancel initiative" });
  }
});

// Create baseline and close initiative
initiativesRouter.post("/:id/baseline", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { description } = req.body;

    // Get initiative details to check creator
    const [initiative] = await db.select()
      .from(initiatives)
      .where(eq(initiatives.initiativeId, id));

    if (!initiative) {
      return res.status(404).json({ error: "Initiative not found" });
    }

    // Check if user is authorized (admin OR initiative creator)
    const userRole = req.user!.role;
    const isAdmin = userRole === 'admin';
    const isCreator = initiative.createdBy === userId;

    console.log('Baseline authorization check:', {
      userId,
      userRole,
      isAdmin,
      initiativeCreatedBy: initiative.createdBy,
      isCreator
    });

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ 
        error: "Only admin users or the initiative creator can baseline and close this initiative" 
      });
    }

    // Check if there are any checked out artifacts
    const checkedOutCount = await db.select({ count: sql<number>`COUNT(*)` })
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.initiativeId, id),
          sql`${artifactLocks.lockExpiry} > NOW()`
        )
      );

    const checkedOutNum = Number(checkedOutCount[0].count);
    console.log('Checked out artifacts count:', checkedOutNum);

    if (checkedOutNum > 0) {
      return res.status(400).json({ 
        error: "Cannot close initiative with checked out artifacts. Please checkin all artifacts first." 
      });
    }

    // Check if there are unresolved conflicts
    const conflictCount = await db.select({ count: sql`COUNT(*)` })
      .from(versionConflicts)
      .where(
        and(
          eq(versionConflicts.initiativeId, id),
          eq(versionConflicts.resolutionStatus, 'pending')
        )
      );

    const conflictNum = Number(conflictCount[0].count);
    console.log('Unresolved conflicts count:', conflictNum);

    if (conflictNum > 0) {
      return res.status(400).json({ 
        error: "Cannot close initiative with unresolved conflicts. Please resolve all conflicts first." 
      });
    }

    // Check if there are any versions to baseline
    const versionsToBaseline = await db.select({ count: sql<number>`COUNT(*)` })
      .from(artifactVersions)
      .where(
        and(
          eq(artifactVersions.initiativeId, id),
          eq(artifactVersions.isBaseline, false)
        )
      );

    const versionCount = Number(versionsToBaseline[0].count);
    console.log('Versions to baseline:', versionCount);

    if (versionCount === 0) {
      return res.status(400).json({ 
        error: "No changes found to baseline. The initiative must have at least one artifact version to complete. Consider canceling this initiative instead if no changes are needed." 
      });
    }

    // Create baseline for all versions in this initiative
    await db.execute(sql`
      UPDATE artifact_versions 
      SET is_baseline = true, 
          baseline_date = NOW(), 
          baselined_by = ${userId}
      WHERE initiative_id = ${id} 
      AND is_baseline = false
    `);

    // Remove all locks for this initiative
    await db.delete(artifactLocks)
      .where(eq(artifactLocks.initiativeId, id));

    // Update initiative status to completed
    await db.update(initiatives)
      .set({
        status: 'completed',
        actualCompletionDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date()
      })
      .where(eq(initiatives.initiativeId, id));

    res.json({ 
      success: true, 
      message: "Initiative successfully baselined and closed",
      baselineDescription: description
    });
  } catch (error) {
    console.error("Error creating baseline:", error);
    res.status(500).json({ error: error.message || "Failed to create baseline" });
  }
});