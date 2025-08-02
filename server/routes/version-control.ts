import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { artifactLocks, artifactVersions, initiativeParticipants, users, initiatives } from "@db/schema";
import { eq, and, or, gt, sql } from "drizzle-orm";
import { VersionControlService, ArtifactType } from "../services/version-control.service";
import { CheckoutImpactService } from "../services/checkout-impact.service";
import { requireAuth, requireAdmin } from "../auth";
import { LockConflictError } from "../errors/LockConflictError";

export const versionControlRouter = Router();

// Checkout schema
const checkoutSchema = z.object({
  artifactType: z.enum(['application', 'interface', 'business_process', 'internal_process', 'internal_activity', 'technical_process']).transform(val => 
    val === 'internal_activity' ? 'internal_process' : val
  ),
  artifactId: z.number(),
  initiativeId: z.string()
});

// Checkin schema  
const checkinSchema = z.object({
  artifactType: z.enum(['application', 'interface', 'business_process', 'internal_process', 'internal_activity', 'technical_process']).transform(val => 
    val === 'internal_activity' ? 'internal_process' : val
  ),
  artifactId: z.number(),
  initiativeId: z.string(),
  changes: z.record(z.any()),
  changeDescription: z.string().optional()
});

// Checkout an artifact
versionControlRouter.post("/checkout", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { artifactType, artifactId, initiativeId } = checkoutSchema.parse(req.body);
    

    // Check if user is participant in the initiative (admins bypass this check)
    if (userRole !== 'admin') {
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
    }

    // Check for existing locks by other users with user information
    const [existingLock] = await db.select({
      lock: artifactLocks,
      user: users
    })
      .from(artifactLocks)
      .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
      .where(
        and(
          eq(artifactLocks.artifactType, artifactType),
          eq(artifactLocks.artifactId, artifactId),
          gt(artifactLocks.lockExpiry, new Date())
        )
      );

    if (existingLock && existingLock.lock.lockedBy !== userId) {
      const userName = existingLock.user?.name || existingLock.user?.username || 'Unknown User';
      return res.status(409).json({ 
        error: `Artifact is already checked out by ${userName} in initiative ${existingLock.lock.initiativeId}`,
        lockedBy: existingLock.lock.lockedBy,
        lockedByUser: userName,
        initiativeId: existingLock.lock.initiativeId,
        expiresAt: existingLock.lock.lockExpiry
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
    // Handle LockConflictError specifically
    if (error instanceof LockConflictError) {
      return res.status(error.statusCode).json(error.toJSON());
    }
    
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
      // Check if there's a version in a different initiative
      const [otherVersion] = await db.select({
        version: artifactVersions,
        initiative: initiatives
      })
        .from(artifactVersions)
        .leftJoin(initiatives, eq(initiatives.initiativeId, artifactVersions.initiativeId))
        .where(
          and(
            eq(artifactVersions.artifactType, artifactType),
            eq(artifactVersions.artifactId, artifactId),
            eq(artifactVersions.isBaseline, false)
          )
        );

      if (otherVersion && otherVersion.version) {
        return res.status(404).json({ 
          error: `This artifact is checked out in a different initiative: "${otherVersion.initiative?.name || otherVersion.version.initiativeId}". You can only checkin from the initiative where it was checked out.`,
          details: {
            currentInitiative: initiativeId,
            checkedOutInInitiative: otherVersion.version.initiativeId,
            checkedOutInInitiativeName: otherVersion.initiative?.name
          }
        });
      }

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

// Cancel checkout - removes lock and deletes any uncommitted changes
versionControlRouter.post("/cancel-checkout", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    
    // Make artifactId optional for cancel checkout
    const cancelSchema = z.object({
      artifactType: z.enum(['application', 'interface', 'business_process', 'internal_process', 'internal_activity', 'technical_process']).transform(val => 
        val === 'internal_activity' ? 'internal_process' : val
      ),
      artifactId: z.number().optional(),
      initiativeId: z.string()
    });
    
    const { artifactType, artifactId, initiativeId } = cancelSchema.parse(req.body);
    
    // If no artifactId provided, try to find and cancel any locks for this user/initiative/type
    if (!artifactId) {
      await db.delete(artifactLocks)
        .where(
          and(
            eq(artifactLocks.artifactType, artifactType),
            eq(artifactLocks.initiativeId, initiativeId),
            eq(artifactLocks.lockedBy, userId)
          )
        );
      
      return res.json({ message: "All checkouts cancelled for artifact type" });
    }

    // Check if user has the lock OR if user is admin
    const [existingLock] = await db.select()
      .from(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, artifactType),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.initiativeId, initiativeId)
        )
      );

    if (!existingLock) {
      // Check if there's a lock in a different initiative
      const [otherLock] = await db.select({
        lock: artifactLocks,
        initiative: initiatives
      })
        .from(artifactLocks)
        .leftJoin(initiatives, eq(initiatives.initiativeId, artifactLocks.initiativeId))
        .where(
          and(
            eq(artifactLocks.artifactType, artifactType),
            eq(artifactLocks.artifactId, artifactId)
          )
        );

      if (otherLock && otherLock.lock) {
        return res.status(404).json({ 
          error: `This artifact is checked out in a different initiative: "${otherLock.initiative?.name || otherLock.lock.initiativeId}". You can only cancel checkout from the initiative where it was checked out.`,
          details: {
            currentInitiative: initiativeId,
            lockedInInitiative: otherLock.lock.initiativeId,
            lockedInInitiativeName: otherLock.initiative?.name
          }
        });
      }

      return res.status(404).json({ error: "No checkout found for this artifact in the initiative" });
    }

    // Check if user owns the lock OR is admin
    if (existingLock.lockedBy !== userId && userRole !== 'admin') {
      return res.status(403).json({ 
        error: "Only the lock owner or admin can cancel this checkout",
        details: {
          lockOwnerId: existingLock.lockedBy,
          requestingUserId: userId,
          userRole: userRole
        }
      });
    }

    // Check if this is an admin override
    const isAdminOverride = existingLock.lockedBy !== userId && userRole === 'admin';
    
    // Get original user info for admin override logging
    let originalUser = null;
    if (isAdminOverride) {
      const [user] = await db.select({
        id: users.id,
        name: users.name,
        username: users.username
      })
      .from(users)
      .where(eq(users.id, existingLock.lockedBy));
      originalUser = user;
    }

    // Remove the lock
    await db.delete(artifactLocks)
      .where(eq(artifactLocks.id, existingLock.id));

    // Delete any uncommitted version for this initiative
    await db.delete(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, artifactType),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.initiativeId, initiativeId),
          eq(artifactVersions.isBaseline, false)
        )
      );

    // Also clean up any other locks for the same artifact/initiative combination
    // This handles edge cases where multiple locks might exist
    await db.delete(artifactLocks)
      .where(
        and(
          eq(artifactLocks.artifactType, artifactType),
          eq(artifactLocks.artifactId, artifactId),
          eq(artifactLocks.initiativeId, initiativeId)
        )
      );

    const message = isAdminOverride 
      ? `Admin override: Checkout cancelled for ${originalUser?.name || 'user'} (${originalUser?.username || 'unknown'})`
      : "Checkout cancelled and changes discarded";

    res.json({ 
      success: true, 
      message,
      ...(isAdminOverride && { 
        adminOverride: true,
        originalUser: originalUser ? {
          id: originalUser.id,
          name: originalUser.name,
          username: originalUser.username
        } : null
      })
    });
  } catch (error) {
    console.error("Error cancelling checkout:", error);
    res.status(500).json({ error: error.message || "Failed to cancel checkout" });
  }
});

// Get current locks
versionControlRouter.get("/locks", requireAuth, async (req, res) => {
  try {
    const { initiativeId } = req.query;
    
    let whereConditions = [];
    
    if (initiativeId) {
      whereConditions.push(eq(artifactLocks.initiativeId, initiativeId as string));
    }

    const query = db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

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

// IMPACT-AWARE CHECKOUT ENDPOINTS

// Get checkout impact analysis
versionControlRouter.post("/analyze-checkout-impact", requireAuth, async (req, res) => {
  try {
    const { artifactType, artifactId, initiativeId } = req.body;

    if (!artifactType || !artifactId || !initiativeId) {
      return res.status(400).json({ 
        error: "artifactType, artifactId, and initiativeId are required" 
      });
    }

    const analysis = await CheckoutImpactService.analyzeCheckoutImpact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId
    );

    res.json(analysis);
  } catch (error) {
    console.error("Error analyzing checkout impact:", error);
    res.status(500).json({ error: "Failed to analyze checkout impact" });
  }
});

// Perform bulk checkout based on impact analysis
versionControlRouter.post("/bulk-checkout", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { artifactType, artifactId, initiativeId, autoApprove = false } = req.body;

    if (!artifactType || !artifactId || !initiativeId) {
      return res.status(400).json({ 
        error: "artifactType, artifactId, and initiativeId are required" 
      });
    }

    // Check if user is participant in the initiative (admins bypass this check)
    if (userRole !== 'admin') {
      const [participant] = await db.select()
        .from(initiativeParticipants)
        .where(
          and(
            eq(initiativeParticipants.initiativeId, initiativeId),
            eq(initiativeParticipants.userId, userId)
          )
        );

      if (!participant) {
        return res.status(403).json({ 
          error: "You must be a participant in this initiative to checkout artifacts" 
        });
      }
    }

    // First, analyze the impact
    const analysis = await CheckoutImpactService.analyzeCheckoutImpact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId
    );

    // Then perform the bulk checkout
    const results = await CheckoutImpactService.performBulkCheckout(
      analysis,
      initiativeId,
      userId,
      autoApprove
    );

    res.json({
      analysis,
      checkoutResults: results,
      message: `Bulk checkout completed. ${results.successful} artifacts checked out successfully, ${results.failed.length} failed.`
    });
  } catch (error) {
    console.error("Error performing bulk checkout:", error);
    res.status(500).json({ error: "Failed to perform bulk checkout" });
  }
});

// Enhanced checkout with optional auto-impact
versionControlRouter.post("/checkout-with-impact", requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;
    const { artifactType, artifactId, initiativeId, includeImpacts = false } = req.body;

    if (!artifactType || !artifactId || !initiativeId) {
      return res.status(400).json({ 
        error: "artifactType, artifactId, and initiativeId are required" 
      });
    }

    // Check if user is participant in the initiative (admins bypass this check)
    if (userRole !== 'admin') {
      const [participant] = await db.select()
        .from(initiativeParticipants)
        .where(
          and(
            eq(initiativeParticipants.initiativeId, initiativeId),
            eq(initiativeParticipants.userId, userId)
          )
        );

      if (!participant) {
        return res.status(403).json({ 
          error: "You must be a participant in this initiative to checkout artifacts" 
        });
      }
    }

    if (includeImpacts) {
      // Perform impact-aware checkout
      const analysis = await CheckoutImpactService.analyzeCheckoutImpact(
        artifactType as ArtifactType,
        artifactId,
        initiativeId
      );

      const results = await CheckoutImpactService.performBulkCheckout(
        analysis,
        initiativeId,
        userId,
        false
      );

      res.json({
        primaryCheckout: true,
        analysis,
        bulkCheckoutResults: results,
        message: `Impact-aware checkout completed. ${results.successful} total artifacts checked out.`
      });
    } else {
      // Standard single checkout
      const version = await VersionControlService.checkoutArtifact(
        artifactType as ArtifactType,
        artifactId,
        initiativeId,
        userId
      );

      // Still provide impact analysis for information
      const analysis = await CheckoutImpactService.analyzeCheckoutImpact(
        artifactType as ArtifactType,
        artifactId,
        initiativeId
      );

      res.json({
        primaryCheckout: true,
        version,
        analysis,
        message: "Single artifact checked out successfully. Impact analysis provided for reference."
      });
    }
  } catch (error) {
    console.error("Error in enhanced checkout:", error);
    res.status(500).json({ error: error.message || "Failed to checkout artifact" });
  }
});

// ADMIN OVERRIDE ENDPOINTS

// Admin override: Force cancel any checkout
versionControlRouter.post("/admin/cancel-checkout", requireAdmin, async (req, res) => {
  try {
    const adminUserId = req.user!.id;
    const { artifactType, artifactId, initiativeId, reason } = req.body;

    if (!artifactType || !artifactId || !initiativeId) {
      return res.status(400).json({ error: "artifactType, artifactId, and initiativeId are required" });
    }

    // Find any existing lock for this artifact
    const [existingLock] = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.artifactType, artifactType),
        eq(artifactLocks.artifactId, artifactId),
        eq(artifactLocks.initiativeId, initiativeId)
      )
    );

    if (!existingLock) {
      return res.status(404).json({ error: "No checkout found for this artifact" });
    }

    const originalUser = existingLock.user;

    // Remove the lock
    await db.delete(artifactLocks)
      .where(eq(artifactLocks.id, existingLock.lock.id));

    // Delete any uncommitted version for this initiative
    await db.delete(artifactVersions)
      .where(
        and(
          eq(artifactVersions.artifactType, artifactType),
          eq(artifactVersions.artifactId, artifactId),
          eq(artifactVersions.initiativeId, initiativeId),
          eq(artifactVersions.isBaseline, false)
        )
      );

    res.json({ 
      success: true, 
      message: `Admin override: Checkout cancelled for ${originalUser?.name || 'user'} (${originalUser?.username || 'unknown'})`,
      details: {
        artifactType,
        artifactId,
        initiativeId,
        originalUser: originalUser ? {
          id: originalUser.id,
          name: originalUser.name,
          username: originalUser.username
        } : null,
        reason: reason || 'Admin override - no reason provided'
      }
    });
  } catch (error) {
    console.error("Error in admin cancel checkout:", error);
    res.status(500).json({ error: error.message || "Failed to cancel checkout" });
  }
});

// Admin override: Force checkout any artifact
versionControlRouter.post("/admin/force-checkout", requireAdmin, async (req, res) => {
  try {
    const adminUserId = req.user!.id;
    const { artifactType, artifactId, initiativeId, reason } = req.body;

    if (!artifactType || !artifactId || !initiativeId) {
      return res.status(400).json({ error: "artifactType, artifactId, and initiativeId are required" });
    }

    // Check for existing locks by other users and forcibly remove them
    const existingLocks = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.artifactType, artifactType),
        eq(artifactLocks.artifactId, artifactId),
        gt(artifactLocks.lockExpiry, new Date())
      )
    );

    let overriddenUsers = [];
    
    // Remove existing locks
    if (existingLocks.length > 0) {
      for (const existing of existingLocks) {
        if (existing.user) {
          overriddenUsers.push({
            id: existing.user.id,
            name: existing.user.name,
            username: existing.user.username,
            initiativeId: existing.lock.initiativeId
          });
        }

        await db.delete(artifactLocks)
          .where(eq(artifactLocks.id, existing.lock.id));

        // Delete any uncommitted changes for that user's initiative
        await db.delete(artifactVersions)
          .where(
            and(
              eq(artifactVersions.artifactType, artifactType),
              eq(artifactVersions.artifactId, artifactId),
              eq(artifactVersions.initiativeId, existing.lock.initiativeId),
              eq(artifactVersions.isBaseline, false)
            )
          );
      }
    }

    // Create the admin checkout
    const lockExpiry = new Date();
    lockExpiry.setHours(lockExpiry.getHours() + 24); // 24 hour lock

    const [newLock] = await db.insert(artifactLocks)
      .values({
        artifactType,
        artifactId,
        initiativeId,
        lockedBy: adminUserId,
        lockExpiry,
        lockReason: `Admin force checkout: ${reason || 'No reason provided'}`
      })
      .returning();

    // Create initial version if needed
    const version = await VersionControlService.checkoutArtifact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId,
      adminUserId
    );

    res.json({ 
      success: true,
      message: "Admin force checkout successful",
      lock: newLock,
      version,
      overriddenUsers,
      details: {
        reason: reason || 'Admin force checkout - no reason provided',
        overriddenCheckouts: overriddenUsers.length
      }
    });
  } catch (error) {
    console.error("Error in admin force checkout:", error);
    res.status(500).json({ error: error.message || "Failed to force checkout artifact" });
  }
});

// Admin override: Force checkin any artifact
versionControlRouter.post("/admin/force-checkin", requireAdmin, async (req, res) => {
  try {
    const adminUserId = req.user!.id;
    const { artifactType, artifactId, initiativeId, changes, changeDescription, reason } = req.body;

    if (!artifactType || !artifactId || !initiativeId || !changes) {
      return res.status(400).json({ 
        error: "artifactType, artifactId, initiativeId, and changes are required" 
      });
    }

    // Check if there's currently a lock (and who owns it)
    const [currentLock] = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(
      and(
        eq(artifactLocks.artifactType, artifactType),
        eq(artifactLocks.artifactId, artifactId),
        eq(artifactLocks.initiativeId, initiativeId)
      )
    );

    let originalUser = null;
    if (currentLock && currentLock.user) {
      originalUser = {
        id: currentLock.user.id,
        name: currentLock.user.name,
        username: currentLock.user.username
      };
    }

    // Force checkin using the admin user ID
    const version = await VersionControlService.checkinArtifact(
      artifactType as ArtifactType,
      artifactId,
      initiativeId,
      adminUserId,
      changes,
      changeDescription || `Admin force checkin: ${reason || 'No reason provided'}`
    );

    // Remove any locks for this artifact
    if (currentLock) {
      await db.delete(artifactLocks)
        .where(eq(artifactLocks.id, currentLock.lock.id));
    }

    res.json({ 
      success: true,
      message: "Admin force checkin successful",
      version,
      details: {
        reason: reason || 'Admin force checkin - no reason provided',
        originalUser,
        adminOverride: true
      }
    });
  } catch (error) {
    console.error("Error in admin force checkin:", error);
    res.status(500).json({ error: error.message || "Failed to force checkin artifact" });
  }
});

// Admin: Get all locks across the system
versionControlRouter.get("/admin/all-locks", requireAdmin, async (req, res) => {
  try {
    const locks = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(gt(artifactLocks.lockExpiry, new Date()));

    res.json({
      locks,
      count: locks.length
    });
  } catch (error) {
    console.error("Error fetching all locks:", error);
    res.status(500).json({ error: "Failed to fetch all locks" });
  }
});

// Admin: Release any lock by ID
versionControlRouter.delete("/admin/locks/:lockId", requireAdmin, async (req, res) => {
  try {
    const { lockId } = req.params;
    const { reason } = req.body;

    const [lock] = await db.select({
      lock: artifactLocks,
      user: users
    })
    .from(artifactLocks)
    .leftJoin(users, eq(users.id, artifactLocks.lockedBy))
    .where(eq(artifactLocks.id, parseInt(lockId)));

    if (!lock) {
      return res.status(404).json({ error: "Lock not found" });
    }

    const originalUser = lock.user ? {
      id: lock.user.id,
      name: lock.user.name,
      username: lock.user.username
    } : null;

    await db.delete(artifactLocks).where(eq(artifactLocks.id, parseInt(lockId)));

    res.json({ 
      success: true,
      message: "Admin override: Lock released successfully",
      details: {
        lockId: parseInt(lockId),
        artifactType: lock.lock.artifactType,
        artifactId: lock.lock.artifactId,
        initiativeId: lock.lock.initiativeId,
        originalUser,
        reason: reason || 'Admin override - no reason provided'
      }
    });
  } catch (error) {
    console.error("Error in admin lock release:", error);
    res.status(500).json({ error: "Failed to release lock" });
  }
});

// Clean up stale locks and versions
versionControlRouter.post("/cleanup-stale-locks", requireAuth, async (req, res) => {
  try {
    const { artifactType, artifactId } = req.body;
    
    // Clean up expired locks
    const expiredLocks = await db.delete(artifactLocks)
      .where(
        and(
          artifactType ? eq(artifactLocks.artifactType, artifactType) : sql`1=1`,
          artifactId ? eq(artifactLocks.artifactId, artifactId) : sql`1=1`,
          gt(sql`NOW()`, artifactLocks.lockExpiry)
        )
      )
      .returning();

    // Clean up orphaned versions (non-baseline versions without active initiatives)
    const activeInitiatives = await db.select({ initiativeId: initiatives.initiativeId })
      .from(initiatives)
      .where(eq(initiatives.status, 'active'));
    
    const activeInitiativeIds = activeInitiatives.map(i => i.initiativeId);

    let orphanedVersions = 0;
    if (activeInitiativeIds.length > 0) {
      const deleted = await db.delete(artifactVersions)
        .where(
          and(
            artifactType ? eq(artifactVersions.artifactType, artifactType) : sql`1=1`,
            artifactId ? eq(artifactVersions.artifactId, artifactId) : sql`1=1`,
            eq(artifactVersions.isBaseline, false),
            sql`${artifactVersions.initiativeId} NOT IN (${sql.join(activeInitiativeIds.map(id => sql`${id}`), sql`, `)})`
          )
        )
        .returning();
      orphanedVersions = deleted.length;
    }

    res.json({
      success: true,
      expiredLocksRemoved: expiredLocks.length,
      orphanedVersionsRemoved: orphanedVersions,
      message: `Cleanup completed: ${expiredLocks.length} expired locks and ${orphanedVersions} orphaned versions removed`
    });
  } catch (error) {
    console.error("Error cleaning up stale locks:", error);
    res.status(500).json({ error: "Failed to clean up stale locks" });
  }
});