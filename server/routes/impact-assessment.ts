import { Router } from "express";
import { requireAuth, requirePermission } from "../auth";
import { ImpactAssessmentService } from "../services/impact-assessment.service";
import type { Request, Response } from "express";
import * as path from "path";
import * as fs from "fs/promises";
import * as fsSync from "fs";
import { db } from "../db";
import { sql } from "drizzle-orm";

const router = Router();

// Get or generate impact assessment for an initiative
router.post("/initiatives/:id/impact-assessment", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { forceRegenerate } = req.body;
    
    // Check for existing assessment first (unless force regenerate)
    if (!forceRegenerate) {
      const existing = await ImpactAssessmentService.getExistingAssessment(id);
      if (existing.success) {
        return res.json({
          success: true,
          assessment: existing.assessment,
          documentPath: existing.documentPath,
          filename: existing.filename,
          fromCache: true
        });
      }
    }

    // Generate new assessment with user credentials
    const userId = req.user?.id;
    const result = await ImpactAssessmentService.generateImpactAssessment(id, userId);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || "Failed to generate impact assessment"
      });
    }

    res.json({
      success: true,
      assessment: result.assessment,
      documentPath: result.documentPath,
      filename: result.filename
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
    // Handle both absolute and relative paths
    let normalizedPath = path.normalize(documentPath);
    const docsDir = path.join(process.cwd(), 'documents', 'impact-assessments');
    
    // If the path doesn't start with docsDir, it might be a relative path or just a filename
    if (!normalizedPath.startsWith(docsDir)) {
      // Check if it's just a filename
      if (!path.isAbsolute(normalizedPath)) {
        normalizedPath = path.join(docsDir, path.basename(normalizedPath));
      } else {
        return res.status(403).json({
          error: "Access denied - path outside allowed directory"
        });
      }
    }


    // Check if file exists
    try {
      await fs.access(normalizedPath);
    } catch (err) {
      console.error("File not found:", {
        normalizedPath,
        error: err,
        cwd: process.cwd(),
        expectedLocation: normalizedPath
      });
      return res.status(404).json({
        error: "Document not found",
        details: `File not accessible at: ${normalizedPath}`
      });
    }

    // Get the filename from the path
    const filename = path.basename(normalizedPath);

    // Read and send the file
    try {
      const content = await fs.readFile(normalizedPath, 'utf-8');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(content));
      
      res.send(content);
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(500).json({
        error: "Failed to read document file"
      });
    }
  } catch (error) {
    console.error("Error downloading impact assessment:", error);
    res.status(500).json({
      error: "Failed to download impact assessment: " + (error instanceof Error ? error.message : "Unknown error")
    });
  }
});

// Alternative download endpoint using initiative ID and filename
router.get("/initiatives/:id/impact-assessment/download-by-name/:filename", requireAuth, async (req: Request, res: Response) => {
  try {
    const { id, filename } = req.params;
    
    // Construct the full path
    const docsDir = path.join(process.cwd(), 'documents', 'impact-assessments');
    const filePath = path.join(docsDir, filename);
    
    // Security check: ensure filename doesn't contain path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(403).json({
        error: "Invalid filename"
      });
    }
    
    // Check if file exists
    if (!fsSync.existsSync(filePath)) {
      console.error("File not found for download:", {
        filePath,
        docsDir,
        filename,
        filesInDir: fsSync.existsSync(docsDir) ? fsSync.readdirSync(docsDir).slice(-5) : 'dir not found'
      });
      return res.status(404).json({
        error: "Document not found",
        details: `File not found: ${filename}`
      });
    }
    
    // Read and send the file
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Set headers for file download
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(content));
      
      res.send(content);
    } catch (readError) {
      console.error("Error reading file:", readError);
      return res.status(500).json({
        error: "Failed to read document file",
        details: readError.message
      });
    }
  } catch (error) {
    console.error("Error downloading impact assessment by filename:", error);
    res.status(500).json({
      error: "Failed to download impact assessment"
    });
  }
});

// Generate cross-CR impact analysis
router.post("/cross-cr-analysis", requireAuth, async (req: Request, res: Response) => {
  try {
    const { crIds, generateReport } = req.body;
    const userId = req.user?.id;

    if (!crIds || !Array.isArray(crIds) || crIds.length < 2) {
      return res.status(400).json({
        error: "At least 2 CR IDs are required for cross-CR analysis"
      });
    }

    // Generate the cross-CR analysis
    const result = await ImpactAssessmentService.generateCrossCRAnalysis(crIds);

    if (!result.success) {
      return res.status(400).json({
        error: result.error || "Failed to generate cross-CR analysis"
      });
    }

    // Generate professional report if requested
    let report = null;
    if (generateReport && result.analysis && userId) {
      const reportResult = await ImpactAssessmentService.generateCrossCRReport(
        result.analysis,
        crIds,
        userId
      );
      
      if (reportResult.success) {
        report = reportResult.report;
      } else {
        console.warn("Failed to generate report:", reportResult.error);
        // Don't fail the entire request if report generation fails
      }
    }

    res.json({
      success: true,
      analysis: result.analysis,
      report: report
    });
  } catch (error) {
    console.error("Error generating cross-CR analysis:", error);
    res.status(500).json({
      error: "Failed to generate cross-CR analysis"
    });
  }
});

// Admin endpoint to recreate UML tables (emergency restore)
router.post("/admin/recreate-uml-tables", requireAuth, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    // Create diagram type enum
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE diagram_type AS ENUM (
          'sequence', 'activity', 'class', 'usecase', 'component', 
          'state', 'deployment', 'object', 'package', 'timing', 'custom'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create uml_folders table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS uml_folders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        parent_id INTEGER,
        path TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create uml_diagrams table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS uml_diagrams (
        id SERIAL PRIMARY KEY,
        folder_id INTEGER NOT NULL REFERENCES uml_folders(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT NOT NULL,
        diagram_type diagram_type NOT NULL DEFAULT 'sequence',
        rendered_svg TEXT,
        rendered_png TEXT,
        metadata JSONB,
        version INTEGER DEFAULT 1,
        is_public BOOLEAN DEFAULT false,
        created_by INTEGER NOT NULL REFERENCES users(id),
        updated_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default root folder if tables were just created
    const [existingRoot] = await db.execute(sql`
      SELECT id FROM uml_folders WHERE parent_id IS NULL AND path = '/' LIMIT 1
    `);

    if (!existingRoot) {
      await db.execute(sql`
        INSERT INTO uml_folders (name, description, parent_id, path, created_by)
        VALUES ('Root', 'Root folder for UML diagrams', NULL, '/', 1)
      `);
    }

    res.json({
      success: true,
      message: "UML tables recreated successfully"
    });
  } catch (error: any) {
    console.error("Error recreating UML tables:", error);
    res.status(500).json({
      error: "Failed to recreate UML tables",
      details: error.message
    });
  }
});

// Admin endpoint to create impact assessments table
router.post("/admin/create-impact-assessments-table", requireAuth, requirePermission('admin'), async (req: Request, res: Response) => {
  try {
    // Create the table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS impact_assessments (
        id SERIAL PRIMARY KEY,
        initiative_id TEXT REFERENCES initiatives(initiative_id),
        assessment_type TEXT NOT NULL,
        assessment_content TEXT,
        document_path TEXT,
        document_filename TEXT,
        summary TEXT,
        risk_level TEXT,
        status TEXT DEFAULT 'active',
        generated_by INTEGER REFERENCES users(id),
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB,
        autox_task_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_impact_assessments_initiative ON impact_assessments(initiative_id)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_impact_assessments_type ON impact_assessments(assessment_type)
    `);
    
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_impact_assessments_status ON impact_assessments(status)
    `);

    res.json({
      success: true,
      message: "Impact assessments table created successfully"
    });
  } catch (error: any) {
    console.error("Error creating impact assessments table:", error);
    res.status(500).json({
      error: "Failed to create impact assessments table",
      details: error.message
    });
  }
});

export default router;