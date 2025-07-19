import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  apiTestCollections, 
  apiTestRequests, 
  apiTestHistory,
  apiTestEnvironments,
  apiTestEnvironmentVariables,
  apiTestGlobalVariables,
  insertApiTestCollectionSchema,
  insertApiTestRequestSchema,
  insertApiTestHistorySchema,
  insertApiTestEnvironmentSchema,
  insertApiTestEnvironmentVariableSchema,
  insertApiTestGlobalVariableSchema
} from "../../shared/schema";
import { requireAuth } from "../auth";
import { eq, and, or, inArray, desc, asc } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all collections for the current user
router.get("/collections", async (req, res) => {
  try {
    const currentUser = req.user!.username;
    
    // Get collections created by user or shared with them
    const collections = await db
      .select()
      .from(apiTestCollections)
      .where(or(
        eq(apiTestCollections.createdBy, currentUser),
        // Check if user is in sharedWith array
        inArray(apiTestCollections.id, 
          db.select({ id: apiTestCollections.id })
            .from(apiTestCollections)
            .where(sql`${currentUser} = ANY(${apiTestCollections.sharedWith})`)
        )
      ))
      .orderBy(desc(apiTestCollections.updatedAt));
    
    res.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    res.status(500).json({ error: "Failed to fetch collections" });
  }
});

// Get a specific collection with its requests
router.get("/collections/:id", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Get collection
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    // Check permissions
    const hasAccess = collection.createdBy === currentUser || 
      (collection.sharedWith && collection.sharedWith.includes(currentUser));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get requests in the collection
    const requests = await db
      .select()
      .from(apiTestRequests)
      .where(eq(apiTestRequests.collectionId, collectionId))
      .orderBy(asc(apiTestRequests.sortOrder), asc(apiTestRequests.name));
    
    res.json({ collection, requests });
  } catch (error) {
    console.error("Error fetching collection:", error);
    res.status(500).json({ error: "Failed to fetch collection" });
  }
});

// Create a new collection
router.post("/collections", async (req, res) => {
  try {
    const currentUser = req.user!;
    const data = insertApiTestCollectionSchema.parse({
      ...req.body,
      createdBy: currentUser.username
    });
    
    const [collection] = await db
      .insert(apiTestCollections)
      .values(data)
      .returning();
    
    res.json(collection);
  } catch (error) {
    console.error("Error creating collection:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create collection" });
  }
});

// Update a collection
router.put("/collections/:id", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Check ownership
    const [existing] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!existing) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    if (existing.createdBy !== currentUser) {
      return res.status(403).json({ error: "Only the owner can update a collection" });
    }
    
    const [updated] = await db
      .update(apiTestCollections)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(apiTestCollections.id, collectionId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating collection:", error);
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// Delete a collection
router.delete("/collections/:id", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Check ownership
    const [existing] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!existing) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    if (existing.createdBy !== currentUser) {
      return res.status(403).json({ error: "Only the owner can delete a collection" });
    }
    
    await db
      .delete(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

// Create a new request in a collection
router.post("/collections/:collectionId/requests", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const currentUser = req.user!.username;
    
    // Check access to collection
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    const hasAccess = collection.createdBy === currentUser || 
      (collection.sharedWith && collection.sharedWith.includes(currentUser));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const data = insertApiTestRequestSchema.parse({
      ...req.body,
      collectionId
    });
    
    const [request] = await db
      .insert(apiTestRequests)
      .values(data)
      .returning();
    
    // Update collection's updatedAt
    await db
      .update(apiTestCollections)
      .set({ updatedAt: new Date() })
      .where(eq(apiTestCollections.id, collectionId));
    
    res.json(request);
  } catch (error) {
    console.error("Error creating request:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to create request" });
  }
});

// Get a specific request
router.get("/requests/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Get request with collection info
    const [request] = await db
      .select()
      .from(apiTestRequests)
      .where(eq(apiTestRequests.id, requestId));
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // Check access via collection
    if (request.collectionId) {
      const [collection] = await db
        .select()
        .from(apiTestCollections)
        .where(eq(apiTestCollections.id, request.collectionId));
      
      if (collection) {
        const hasAccess = collection.createdBy === currentUser || 
          (collection.sharedWith && collection.sharedWith.includes(currentUser));
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
    }
    
    res.json(request);
  } catch (error) {
    console.error("Error fetching request:", error);
    res.status(500).json({ error: "Failed to fetch request" });
  }
});

// Update a request
router.put("/requests/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Get request with collection info
    const [request] = await db
      .select()
      .from(apiTestRequests)
      .where(eq(apiTestRequests.id, requestId));
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // Check access via collection
    if (request.collectionId) {
      const [collection] = await db
        .select()
        .from(apiTestCollections)
        .where(eq(apiTestCollections.id, request.collectionId));
      
      if (collection) {
        const hasAccess = collection.createdBy === currentUser || 
          (collection.sharedWith && collection.sharedWith.includes(currentUser));
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
    }
    
    const [updated] = await db
      .update(apiTestRequests)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(apiTestRequests.id, requestId))
      .returning();
    
    // Update collection's updatedAt
    if (request.collectionId) {
      await db
        .update(apiTestCollections)
        .set({ updatedAt: new Date() })
        .where(eq(apiTestCollections.id, request.collectionId));
    }
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: "Failed to update request" });
  }
});

// Delete a request
router.delete("/requests/:id", async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Get request with collection info
    const [request] = await db
      .select()
      .from(apiTestRequests)
      .where(eq(apiTestRequests.id, requestId));
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    // Check access via collection
    if (request.collectionId) {
      const [collection] = await db
        .select()
        .from(apiTestCollections)
        .where(eq(apiTestCollections.id, request.collectionId));
      
      if (collection && collection.createdBy !== currentUser) {
        return res.status(403).json({ error: "Only the collection owner can delete requests" });
      }
    }
    
    await db
      .delete(apiTestRequests)
      .where(eq(apiTestRequests.id, requestId));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting request:", error);
    res.status(500).json({ error: "Failed to delete request" });
  }
});

// Save test execution history
router.post("/history", async (req, res) => {
  try {
    const currentUser = req.user!;
    const data = insertApiTestHistorySchema.parse({
      ...req.body,
      executedBy: currentUser.username
    });
    
    const [history] = await db
      .insert(apiTestHistory)
      .values(data)
      .returning();
    
    res.json(history);
  } catch (error) {
    console.error("Error saving test history:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save test history" });
  }
});

// Get test history for a request
router.get("/requests/:requestId/history", async (req, res) => {
  try {
    const requestId = parseInt(req.params.requestId);
    const currentUser = req.user!.username;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Verify access to the request
    const [request] = await db
      .select()
      .from(apiTestRequests)
      .where(eq(apiTestRequests.id, requestId));
    
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    const history = await db
      .select()
      .from(apiTestHistory)
      .where(eq(apiTestHistory.requestId, requestId))
      .orderBy(desc(apiTestHistory.executedAt))
      .limit(limit);
    
    res.json(history);
  } catch (error) {
    console.error("Error fetching test history:", error);
    res.status(500).json({ error: "Failed to fetch test history" });
  }
});

// Import for sql template literal
import { sql } from "drizzle-orm";

// Get environments for a collection
router.get("/collections/:collectionId/environments", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const currentUser = req.user!.username;
    
    // Check access to collection
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    const hasAccess = collection.createdBy === currentUser || 
      (collection.sharedWith && collection.sharedWith.includes(currentUser));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get environments
    const environments = await db
      .select()
      .from(apiTestEnvironments)
      .where(eq(apiTestEnvironments.collectionId, collectionId))
      .orderBy(asc(apiTestEnvironments.sortOrder));
    
    res.json(environments);
  } catch (error) {
    console.error("Error fetching environments:", error);
    res.status(500).json({ error: "Failed to fetch environments" });
  }
});

// Get environment variables
router.get("/environments/:environmentId/variables", async (req, res) => {
  try {
    const environmentId = parseInt(req.params.environmentId);
    const currentUser = req.user!.username;
    
    // Get environment and check access via collection
    const [environment] = await db
      .select()
      .from(apiTestEnvironments)
      .where(eq(apiTestEnvironments.id, environmentId));
    
    if (!environment) {
      return res.status(404).json({ error: "Environment not found" });
    }
    
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, environment.collectionId));
    
    const hasAccess = collection.createdBy === currentUser || 
      (collection.sharedWith && collection.sharedWith.includes(currentUser));
    
    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    // Get variables
    const variables = await db
      .select()
      .from(apiTestEnvironmentVariables)
      .where(eq(apiTestEnvironmentVariables.environmentId, environmentId));
    
    res.json(variables);
  } catch (error) {
    console.error("Error fetching environment variables:", error);
    res.status(500).json({ error: "Failed to fetch environment variables" });
  }
});

// Create or update environment variable
router.post("/environments/:environmentId/variables", async (req, res) => {
  try {
    const environmentId = parseInt(req.params.environmentId);
    const currentUser = req.user!.username;
    
    // Check access via collection
    const [environment] = await db
      .select()
      .from(apiTestEnvironments)
      .where(eq(apiTestEnvironments.id, environmentId));
    
    if (!environment) {
      return res.status(404).json({ error: "Environment not found" });
    }
    
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, environment.collectionId));
    
    if (collection.createdBy !== currentUser) {
      return res.status(403).json({ error: "Only the collection owner can modify variables" });
    }
    
    const data = insertApiTestEnvironmentVariableSchema.parse({
      ...req.body,
      environmentId
    });
    
    // Check if variable already exists
    const [existing] = await db
      .select()
      .from(apiTestEnvironmentVariables)
      .where(and(
        eq(apiTestEnvironmentVariables.environmentId, environmentId),
        eq(apiTestEnvironmentVariables.key, data.key)
      ));
    
    let variable;
    if (existing) {
      // Update existing
      [variable] = await db
        .update(apiTestEnvironmentVariables)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(apiTestEnvironmentVariables.id, existing.id))
        .returning();
    } else {
      // Create new
      [variable] = await db
        .insert(apiTestEnvironmentVariables)
        .values(data)
        .returning();
    }
    
    res.json(variable);
  } catch (error) {
    console.error("Error saving environment variable:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid data", details: error.errors });
    }
    res.status(500).json({ error: "Failed to save environment variable" });
  }
});

// Delete environment variable
router.delete("/variables/:id", async (req, res) => {
  try {
    const variableId = parseInt(req.params.id);
    const currentUser = req.user!.username;
    
    // Get variable and check access
    const [variable] = await db
      .select()
      .from(apiTestEnvironmentVariables)
      .where(eq(apiTestEnvironmentVariables.id, variableId));
    
    if (!variable) {
      return res.status(404).json({ error: "Variable not found" });
    }
    
    const [environment] = await db
      .select()
      .from(apiTestEnvironments)
      .where(eq(apiTestEnvironments.id, variable.environmentId));
    
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, environment.collectionId));
    
    if (collection.createdBy !== currentUser) {
      return res.status(403).json({ error: "Only the collection owner can delete variables" });
    }
    
    await db
      .delete(apiTestEnvironmentVariables)
      .where(eq(apiTestEnvironmentVariables.id, variableId));
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting environment variable:", error);
    res.status(500).json({ error: "Failed to delete environment variable" });
  }
});

// Set current environment for collection
router.put("/collections/:collectionId/current-environment", async (req, res) => {
  try {
    const collectionId = parseInt(req.params.collectionId);
    const { environmentId } = req.body;
    const currentUser = req.user!.username;
    
    // Check ownership
    const [collection] = await db
      .select()
      .from(apiTestCollections)
      .where(eq(apiTestCollections.id, collectionId));
    
    if (!collection) {
      return res.status(404).json({ error: "Collection not found" });
    }
    
    if (collection.createdBy !== currentUser) {
      return res.status(403).json({ error: "Only the owner can update collection settings" });
    }
    
    // Verify environment belongs to collection
    if (environmentId) {
      const [environment] = await db
        .select()
        .from(apiTestEnvironments)
        .where(and(
          eq(apiTestEnvironments.id, environmentId),
          eq(apiTestEnvironments.collectionId, collectionId)
        ));
      
      if (!environment) {
        return res.status(400).json({ error: "Environment not found in this collection" });
      }
    }
    
    const [updated] = await db
      .update(apiTestCollections)
      .set({
        currentEnvironmentId: environmentId,
        updatedAt: new Date()
      })
      .where(eq(apiTestCollections.id, collectionId))
      .returning();
    
    res.json(updated);
  } catch (error) {
    console.error("Error updating current environment:", error);
    res.status(500).json({ error: "Failed to update current environment" });
  }
});

export { router as apiTestRouter };