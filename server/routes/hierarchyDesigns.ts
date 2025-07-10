import { Router } from "express";
import { db } from "../db";
import { businessProcessHierarchyDesigns, businessProcesses, businessProcessRelationships } from "../../shared/schema";
import { eq, desc, like, and } from "drizzle-orm";
import { requireAuth, requirePermission } from "../auth";
import { storage } from "../storage";

const hierarchyDesignsRouter = Router();

// Get all hierarchy designs with optional filtering
hierarchyDesignsRouter.get("/", async (req, res) => {
  try {
    const { search, template, category, status } = req.query;
    
    let query = db.select().from(businessProcessHierarchyDesigns);
    const conditions = [];

    if (search) {
      conditions.push(like(businessProcessHierarchyDesigns.name, `%${search}%`));
    }
    
    if (template !== undefined) {
      conditions.push(eq(businessProcessHierarchyDesigns.isTemplate, template === 'true'));
    }
    
    if (category) {
      conditions.push(eq(businessProcessHierarchyDesigns.templateCategory, category as string));
    }
    
    if (status) {
      conditions.push(eq(businessProcessHierarchyDesigns.status, status as string));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const designs = await query.orderBy(desc(businessProcessHierarchyDesigns.updatedAt));
    
    res.json(designs);
  } catch (error) {
    console.error("Error fetching hierarchy designs:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy designs" });
  }
});

// Get hierarchy design by ID
hierarchyDesignsRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const design = await db
      .select()
      .from(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .limit(1);

    if (design.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    res.json(design[0]);
  } catch (error) {
    console.error("Error fetching hierarchy design:", error);
    res.status(500).json({ error: "Failed to fetch hierarchy design" });
  }
});

// Create new hierarchy design
hierarchyDesignsRouter.post("/", async (req, res) => {
  try {
    const body = req.body;
    
    const {
      name,
      description,
      hierarchyData,
      createdBy,
      tags,
      isTemplate = false,
      templateCategory,
      version = "1.0",
      status = "draft"
    } = body;

    if (!name || !hierarchyData) {
      return res.status(400).json({ error: "Name and hierarchy data are required" });
    }

    // Validate that hierarchyData is valid JSON if it's a string
    let hierarchyDataString = hierarchyData;
    if (typeof hierarchyData === 'object') {
      hierarchyDataString = JSON.stringify(hierarchyData);
    } else {
      try {
        JSON.parse(hierarchyData);
      } catch (e) {
        return res.status(400).json({ error: "Invalid hierarchy data JSON" });
      }
    }

    const result = await db
      .insert(businessProcessHierarchyDesigns)
      .values({
        name,
        description,
        hierarchyData: hierarchyDataString,
        createdBy,
        tags: Array.isArray(tags) ? tags.join(', ') : tags,
        isTemplate,
        templateCategory,
        version,
        status,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error creating hierarchy design:", error);
    res.status(500).json({ error: "Failed to create hierarchy design" });
  }
});

// Update hierarchy design (partial update)
hierarchyDesignsRouter.patch("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags.join(', ') : body.tags;
    if (body.status !== undefined) updateData.status = body.status;

    const result = await db
      .update(businessProcessHierarchyDesigns)
      .set(updateData)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating hierarchy design:", error);
    res.status(500).json({ error: "Failed to update hierarchy design" });
  }
});

// Update hierarchy design (full update)
hierarchyDesignsRouter.put("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    
    const {
      name,
      description,
      hierarchyData,
      tags,
      isTemplate,
      templateCategory,
      version,
      status
    } = body;

    // Validate that hierarchyData is valid JSON if provided
    let hierarchyDataString = hierarchyData;
    if (hierarchyData) {
      if (typeof hierarchyData === 'object') {
        hierarchyDataString = JSON.stringify(hierarchyData);
      } else {
        try {
          JSON.parse(hierarchyData);
        } catch (e) {
          return res.status(400).json({ error: "Invalid hierarchy data JSON" });
        }
      }
    }

    const updateData: any = {
      updatedAt: new Date()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (hierarchyData !== undefined) updateData.hierarchyData = hierarchyDataString;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.join(', ') : tags;
    if (isTemplate !== undefined) updateData.isTemplate = isTemplate;
    if (templateCategory !== undefined) updateData.templateCategory = templateCategory;
    if (version !== undefined) updateData.version = version;
    if (status !== undefined) updateData.status = status;

    const result = await db
      .update(businessProcessHierarchyDesigns)
      .set(updateData)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating hierarchy design:", error);
    res.status(500).json({ error: "Failed to update hierarchy design" });
  }
});

// Delete hierarchy design
hierarchyDesignsRouter.delete("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const result = await db
      .delete(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    res.json({ message: "Hierarchy design deleted successfully" });
  } catch (error) {
    console.error("Error deleting hierarchy design:", error);
    res.status(500).json({ error: "Failed to delete hierarchy design" });
  }
});

// Duplicate hierarchy design
hierarchyDesignsRouter.post("/:id/duplicate", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const body = req.body;
    const { name, createdBy } = body;
    
    // Get the original design
    const original = await db
      .select()
      .from(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .limit(1);

    if (original.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    const originalDesign = original[0];
    
    // Create duplicate with new name
    const result = await db
      .insert(businessProcessHierarchyDesigns)
      .values({
        name: name || `${originalDesign.name} (Copy)`,
        description: originalDesign.description,
        hierarchyData: originalDesign.hierarchyData,
        createdBy: createdBy || originalDesign.createdBy,
        tags: originalDesign.tags,
        isTemplate: false, // Duplicates are not templates by default
        templateCategory: originalDesign.templateCategory,
        version: "1.0", // Reset version for copy
        status: "draft", // Reset status for copy
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Error duplicating hierarchy design:", error);
    res.status(500).json({ error: "Failed to duplicate hierarchy design" });
  }
});

// Export hierarchy design as JSON file
hierarchyDesignsRouter.get("/:id/export", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const design = await db
      .select()
      .from(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .limit(1);

    if (design.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    const exportData = {
      metadata: {
        name: design[0].name,
        description: design[0].description,
        version: design[0].version,
        exportedAt: new Date().toISOString(),
        tags: design[0].tags?.split(', ').filter(Boolean) || []
      },
      hierarchy: JSON.parse(design[0].hierarchyData)
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${design[0].name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting hierarchy design:", error);
    res.status(500).json({ error: "Failed to export hierarchy design" });
  }
});

// Get template categories
hierarchyDesignsRouter.get("/categories/list", async (req, res) => {
  try {
    const categories = await db
      .selectDistinct({ category: businessProcessHierarchyDesigns.templateCategory })
      .from(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.isTemplate, true));
    
    res.json(categories.map(c => c.category).filter(Boolean));
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Generate business processes from hierarchy design
hierarchyDesignsRouter.post("/:id/generate-business-processes", requireAuth, requirePermission("business_processes", "create"), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const options = req.body;
    const user = (req as any).user;
    
    // Validate required fields
    if (!options.lob || !options.product) {
      return res.status(400).json({ error: "LOB and Product are required" });
    }
    
    // Get the hierarchy design
    const design = await db
      .select()
      .from(businessProcessHierarchyDesigns)
      .where(eq(businessProcessHierarchyDesigns.id, id))
      .limit(1);

    if (design.length === 0) {
      return res.status(404).json({ error: "Hierarchy design not found" });
    }

    // Import the generation logic
    const { generateBusinessProcessesFromHierarchy } = await import("../services/hierarchy-to-business-process");
    
    // Parse hierarchy data
    const hierarchyData = JSON.parse(design[0].hierarchyData);
    
    // Generate business processes
    const result = await generateBusinessProcessesFromHierarchy(hierarchyData, options);
    
    // Log the activity
    await storage.createUserActivityLog({
      userId: user.id,
      username: user.username,
      activityType: 'generate_business_processes',
      resource: 'hierarchy_designs',
      resourceId: id,
      details: JSON.stringify({
        designName: design[0].name,
        processesCreated: result.summary.created,
        levelA: result.summary.levelA,
        levelB: result.summary.levelB,
        levelC: result.summary.levelC,
        lob: options.lob,
        product: options.product
      }),
      endpoint: `/api/hierarchy-designs/${id}/generate-business-processes`,
      method: 'POST',
      requestBody: JSON.stringify({ lob: options.lob, product: options.product }),
      statusCode: 200,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      summary: result.summary,
      processIds: result.processIds
    });
  } catch (error) {
    console.error("Error generating business processes:", error);
    res.status(500).json({ 
      error: "Failed to generate business processes",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export { hierarchyDesignsRouter };