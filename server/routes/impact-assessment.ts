import { Router } from "express";
import { requireAuth } from "../auth";
import { ImpactAssessmentService } from "../services/impact-assessment.service";
import type { Request, Response } from "express";

const router = Router();

// Generate impact assessment for an initiative
router.post("/initiatives/:id/impact-assessment", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Generate the assessment
    const result = await ImpactAssessmentService.generateImpactAssessment(id);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || "Failed to generate impact assessment"
      });
    }

    res.json({
      success: true,
      assessment: result.assessment,
      documentPath: result.documentPath
    });
  } catch (error) {
    console.error("Error generating impact assessment:", error);
    res.status(500).json({
      error: "Failed to generate impact assessment"
    });
  }
});

// Download impact assessment document
router.get("/initiatives/:id/impact-assessment/download", requireAuth, async (req: Request, res: Response) => {
  try {
    const { documentPath } = req.query;

    if (!documentPath || typeof documentPath !== 'string') {
      return res.status(400).json({
        error: "Document path is required"
      });
    }

    // Security check: ensure the path is within the documents directory
    const path = require('path');
    const fs = require('fs/promises');
    
    const normalizedPath = path.normalize(documentPath);
    const docsDir = path.join(process.cwd(), 'documents', 'impact-assessments');
    
    if (!normalizedPath.startsWith(docsDir)) {
      return res.status(403).json({
        error: "Access denied"
      });
    }

    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    // Get the filename from the path
    const filename = path.basename(normalizedPath);

    // Send the file
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const content = await fs.readFile(normalizedPath, 'utf-8');
    res.send(content);
  } catch (error) {
    console.error("Error downloading impact assessment:", error);
    res.status(500).json({
      error: "Failed to download impact assessment"
    });
  }
});

export default router;