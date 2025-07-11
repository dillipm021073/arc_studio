import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { artifactLocks, artifactVersions, initiativeParticipants, users } from "@db/schema";
import { eq, and, or, gt, sql } from "drizzle-orm";
import { VersionControlService, ArtifactType } from "../services/version-control.service";
import { requireAuth } from "../auth";

export const versionControlRouter = Router();

// Checkout schema
const checkoutSchema = z.object({
  artifactType: z.enum(['application', 'interface', 'business_process', 'internal_process', 'technical_process']),
  artifactId: z.number(),
  initiativeId: z.string()
});

// Checkin schema  
const checkinSchema = z.object({
  artifactType: z.enum(['application', 'interface', 'business_process', 'internal_process', 'technical_process']),
  artifactId: z.number(),
  initiativeId: z.string(),
  changes: z.record(z.any()),
  changeDescription: z.string().optional()
});

// Checkout an artifact
versionControlRouter.post("/checkout", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { artifactType, artifactId, initiativeId } = checkoutSchema.parse(req.body);

    // Check if user is participant in the initiative
    const [participant] = await db.select()
      .from(initiativeParticipants)
      .where(
        and(
          eq(initiativeParticipants.initiativeId, initiativeId),
          eq(initiativeParticipants.userId, userId)
        )
      );

    if (!participant) {
      return res.status(403).json({ error: "You must be a participant in this initiative to checkout artifacts" });
    }

    // Check for existing locks by other users
    const [existingLock] = await db.select()
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, artifactType),
          eq(artifactLocks.artifactId, artifactId),
          gt(artifactLocks.lockExpiry, new Date())
        )
      );

    if (existingLock && existingLock.lockedBy !== userId) {
      return res.status(409).json({ 
        error: "Artifact is already checked out by another user",
        lockedBy: existingLock.lockedBy,
        expiresAt: existingLock.lockExpiry
      });
    }

    // Perform checkout
    const version = await VersionControlService.checkoutArtifact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId,
      userId
    );

    res.json({ 
      message: "Artifact checked out successfully",
      version 
    });
  } catch (error) {
    console.error("Error checking out artifact:", error);
    res.status(500).json({ error: error.message || "Failed to checkout artifact" });
  }
});

// Checkin an artifact
versionControlRouter.post("/checkin", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { artifactType, artifactId, initiativeId, changes, changeDescription } = checkinSchema.parse(req.body);
    
    console.log('Checkin request:', {
      userId,
      artifactType,
      artifactId,
      initiativeId,
      hasChanges: !!changes
    });

    // Verify user has the artifact checked out (optional - we'll be more lenient)
    const [lock] = await db.select()
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, artifactType),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.initiativeId, initiativeId),
          eq(artifactLocks.lockedBy, userId),
          gt(artifactLocks.lockExpiry, new Date())
        )
      );

    if (!lock) {
      console.log('No lock found for checkin, but continuing anyway:', {
        artifactType,
        artifactId,
        initiativeId,
        userId
      });
      // Don't fail - just log and continue
      // This handles the case where the form saved directly to production
    }

    // Get current version
    const currentVersion = await VersionControlService.getInitiativeVersion(
      artifactType as ArtifactType,
      artifactId,
      initiativeId
    );

    if (!currentVersion) {
      return res.status(404).json({ error: "No checked out version found" });
    }

    // Get the latest data - either from changes or from production
    let updatedData = changes;
    
    // If no changes provided or empty object, fetch from production
    if (!changes || Object.keys(changes).length === 0) {
      if (artifactType === 'application') {
        const { applications } = await import('@db/schema');
        const [app] = await db.select().from(applications).where(eq(applications.id, artifactId));
        updatedData = app;
      } else if (artifactType === 'interface') {
        const { interfaces } = await import('@db/schema');
        const [iface] = await db.select().from(interfaces).where(eq(interfaces.id, artifactId));
        updatedData = iface;
      } else if (artifactType === 'business_process') {
        const { businessProcesses } = await import('@db/schema');
        const [bp] = await db.select().from(businessProcesses).where(eq(businessProcesses.id, artifactId));
        updatedData = bp;
      }
    } else {
      // Merge changes with current version data
      updatedData = { ...currentVersion.artifactData, ...changes };
    }
    
    const newVersion = await VersionControlService.checkinArtifact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId,
      userId,
      updatedData,
      changeDescription || "Updated via checkin"
    );

    res.json({ 
      message: "Artifact checked in successfully",
      version: newVersion 
    });
  } catch (error) {
    console.error("Error checking in artifact:", error);
    res.status(500).json({ error: error.message || "Failed to checkin artifact" });
  }
});

// Get current locks
versionControlRouter.get("/locks", requireAuth, async (req, res) => {
  try {
    const { initiativeId } = req.query;

    let query = db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(gt(artifactLocks.lockExpiry, new Date()));

    if (initiativeId) {
      query = query.where(eq(artifactLocks.initiativeId, initiativeId as string));
    }

    const locks = await query;

    res.json(locks);
  } catch (error) {
    console.error("Error fetching locks:", error);
    res.status(500).json({ error: "Failed to fetch locks" });
  }
});

// Release lock (force unlock - admin only)
versionControlRouter.delete("/locks/:lockId", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { lockId } = req.params;

    // Check if user owns the lock or is admin
    const [lock] = await db.select()
      .from(artifactLocks)
      .where(eq(artifactLocks.id, parseInt(lockId)));

    if (!lock) {
      return res.status(404).json({ error: "Lock not found" });
    }

    if (lock.lockedBy !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: "Only lock owner or admin can release locks" });
    }

    await db.delete(artifactLocks).where(eq(artifactLocks.id, parseInt(lockId)));

    res.json({ message: "Lock released successfully" });
  } catch (error) {
    console.error("Error releasing lock:", error);
    res.status(500).json({ error: "Failed to release lock" });
  }
});