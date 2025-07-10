import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  interfaceResponseScenarios,
  interfaces,
  insertInterfaceResponseScenarioSchema 
} from "../../shared/schema";
import { requireAuth, requirePermission } from "../auth";
import { eq, and } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all response scenarios for an interface
router.get("/interface/:interfaceId", async (req, res) => {
  try {
    const { interfaceId } = req.params;
    
    const scenarios = await db
      .select({
        scenario: interfaceResponseScenarios,
        fallbackInterface: interfaces
      })
      .from(interfaceResponseScenarios)
      .leftJoin(interfaces, eq(interfaceResponseScenarios.fallbackInterfaceId, interfaces.id))
      .where(eq(interfaceResponseScenarios.interfaceId, parseInt(interfaceId)));

    res.json(scenarios);
  } catch (error) {
    console.error("Error fetching response scenarios:", error);
    res.status(500).json({ error: "Failed to fetch response scenarios" });
  }
});

// Get a specific response scenario
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const [scenario] = await db
      .select({
        scenario: interfaceResponseScenarios,
        interface: interfaces,
        fallbackInterface: interfaces
      })
      .from(interfaceResponseScenarios)
      .leftJoin(interfaces, eq(interfaceResponseScenarios.interfaceId, interfaces.id))
      .leftJoin(interfaces, eq(interfaceResponseScenarios.fallbackInterfaceId, interfaces.id))
      .where(eq(interfaceResponseScenarios.id, parseInt(id)));

    if (!scenario) {
      return res.status(404).json({ error: "Response scenario not found" });
    }

    res.json(scenario);
  } catch (error) {
    console.error("Error fetching response scenario:", error);
    res.status(500).json({ error: "Failed to fetch response scenario" });
  }
});

// Create a new response scenario
router.post("/", requirePermission("interface_response_scenarios", "create"), async (req, res) => {
  try {
    const validatedData = insertInterfaceResponseScenarioSchema.parse(req.body);
    
    const [newScenario] = await db
      .insert(interfaceResponseScenarios)
      .values(validatedData)
      .returning();

    res.status(201).json(newScenario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error creating response scenario:", error);
    res.status(500).json({ error: "Failed to create response scenario" });
  }
});

// Update a response scenario
router.put("/:id", requirePermission("interface_response_scenarios", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = insertInterfaceResponseScenarioSchema.partial().parse(req.body);
    
    const [updatedScenario] = await db
      .update(interfaceResponseScenarios)
      .set(validatedData)
      .where(eq(interfaceResponseScenarios.id, parseInt(id)))
      .returning();

    if (!updatedScenario) {
      return res.status(404).json({ error: "Response scenario not found" });
    }

    res.json(updatedScenario);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid request data", details: error.errors });
    }
    console.error("Error updating response scenario:", error);
    res.status(500).json({ error: "Failed to update response scenario" });
  }
});

// Delete a response scenario
router.delete("/:id", requirePermission("interface_response_scenarios", "delete"), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedScenario] = await db
      .delete(interfaceResponseScenarios)
      .where(eq(interfaceResponseScenarios.id, parseInt(id)))
      .returning();

    if (!deletedScenario) {
      return res.status(404).json({ error: "Response scenario not found" });
    }

    res.json({ message: "Response scenario deleted successfully" });
  } catch (error) {
    console.error("Error deleting response scenario:", error);
    res.status(500).json({ error: "Failed to delete response scenario" });
  }
});

// Create default scenarios for an interface
router.post("/interface/:interfaceId/create-defaults", requirePermission("interface_response_scenarios", "create"), async (req, res) => {
  try {
    const { interfaceId } = req.params;
    
    const defaultScenarios = [
      {
        interfaceId: parseInt(interfaceId),
        scenarioType: 'success',
        responseCode: '200',
        responseDescription: 'Request processed successfully',
        nextAction: 'continue',
        nextSequenceNumber: null,
        retryPolicy: null,
        maxRetries: 0,
        retryDelayMs: 0,
        timeoutMs: 30000
      },
      {
        interfaceId: parseInt(interfaceId),
        scenarioType: 'failure',
        responseCode: '500',
        responseDescription: 'Internal server error',
        nextAction: 'retry',
        nextSequenceNumber: null,
        retryPolicy: 'exponential_backoff',
        maxRetries: 3,
        retryDelayMs: 1000,
        timeoutMs: 30000
      },
      {
        interfaceId: parseInt(interfaceId),
        scenarioType: 'timeout',
        responseCode: 'TIMEOUT',
        responseDescription: 'Request timed out',
        nextAction: 'retry',
        nextSequenceNumber: null,
        retryPolicy: 'fixed_delay',
        maxRetries: 2,
        retryDelayMs: 5000,
        timeoutMs: 30000
      }
    ];

    const newScenarios = await db
      .insert(interfaceResponseScenarios)
      .values(defaultScenarios)
      .returning();

    res.status(201).json(newScenarios);
  } catch (error) {
    console.error("Error creating default scenarios:", error);
    res.status(500).json({ error: "Failed to create default scenarios" });
  }
});

export { router as interfaceResponseScenariosRouter };