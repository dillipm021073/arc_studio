import { Router } from "express";
import { AuditService } from "../services/audit.service";
import { requireAuth } from "../auth";

export const auditRouter = Router();

// Get audit trail
auditRouter.get("/trail", requireAuth, async (req, res) => {
  try {
    const {
      artifactType,
      artifactId,
      initiativeId,
      userId,
      changeType,
      fromDate,
      toDate,
      limit = "100"
    } = req.query;

    const filter = {
      artifactType: artifactType as string,
      artifactId: artifactId ? parseInt(artifactId as string) : undefined,
      initiativeId: initiativeId as string,
      userId: userId ? parseInt(userId as string) : undefined,
      changeType: changeType as string,
      fromDate: fromDate ? new Date(fromDate as string) : undefined,
      toDate: toDate ? new Date(toDate as string) : undefined,
      limit: parseInt(limit as string)
    };

    const result = await AuditService.getAuditTrail(filter);
    res.json(result);
  } catch (error) {
    console.error("Error fetching audit trail:", error);
    res.status(500).json({ error: "Failed to fetch audit trail" });
  }
});

// Compare versions
auditRouter.get("/compare-versions", requireAuth, async (req, res) => {
  try {
    const { type, id, from, to } = req.query;

    if (!type || !id || !from || !to) {
      return res.status(400).json({ 
        error: "Missing required parameters: type, id, from, to" 
      });
    }

    const comparison = await AuditService.compareVersions(
      type as string,
      parseInt(id as string),
      parseInt(from as string),
      parseInt(to as string)
    );

    res.json(comparison);
  } catch (error) {
    console.error("Error comparing versions:", error);
    res.status(500).json({ error: "Failed to compare versions" });
  }
});

// Get version history
auditRouter.get("/history/:type/:id", requireAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { limit = "20" } = req.query;

    const history = await AuditService.getVersionHistory(
      type,
      parseInt(id),
      parseInt(limit as string)
    );

    res.json(history);
  } catch (error) {
    console.error("Error fetching version history:", error);
    res.status(500).json({ error: "Failed to fetch version history" });
  }
});