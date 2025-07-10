import { Router } from "express";
import { db } from "../db";
import { technicalProcesses, technicalProcessInterfaces, technicalProcessDependencies, technicalProcessInternalActivities, changeRequestTechnicalProcesses, applications, interfaces, internalActivities } from "../../shared/schema";
import { eq, and, or, desc, asc } from "drizzle-orm";
import type { Express } from "express";
import { z } from "zod";
import { requireAuth, requirePermission } from "../auth";

export function registerTechnicalProcessRoutes(app: Express) {
  const router = Router();

  // Get all technical processes with related data
  router.get("/", requireAuth, async (req, res) => {
    try {
      const processes = await db
        .select({
          id: technicalProcesses.id,
          name: technicalProcesses.name,
          jobName: technicalProcesses.jobName,
          applicationId: technicalProcesses.applicationId,
          applicationName: applications.name,
          description: technicalProcesses.description,
          frequency: technicalProcesses.frequency,
          schedule: technicalProcesses.schedule,
          criticality: technicalProcesses.criticality,
          status: technicalProcesses.status,
          owner: technicalProcesses.owner,
          technicalOwner: technicalProcesses.technicalOwner,
          lastRunDate: technicalProcesses.lastRunDate,
          nextRunDate: technicalProcesses.nextRunDate,
          createdAt: technicalProcesses.createdAt,
          updatedAt: technicalProcesses.updatedAt,
        })
        .from(technicalProcesses)
        .leftJoin(applications, eq(technicalProcesses.applicationId, applications.id))
        .orderBy(desc(technicalProcesses.createdAt));

      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technical processes" });
    }
  });

  // Export technical processes - must be before :id route
  router.get("/export", requireAuth, async (req, res) => {
    try {
      const { exportTechnicalProcessesToXLSX } = await import("../export-utils");
      const { buffer, filename } = await exportTechnicalProcessesToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export technical processes error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to export technical processes", error: errorMessage });
    }
  });

  // Get single technical process with all related data
  router.get("/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get technical process with application
      const [process] = await db
        .select({
          id: technicalProcesses.id,
          name: technicalProcesses.name,
          jobName: technicalProcesses.jobName,
          applicationId: technicalProcesses.applicationId,
          applicationName: applications.name,
          description: technicalProcesses.description,
          frequency: technicalProcesses.frequency,
          schedule: technicalProcesses.schedule,
          criticality: technicalProcesses.criticality,
          status: technicalProcesses.status,
          owner: technicalProcesses.owner,
          technicalOwner: technicalProcesses.technicalOwner,
          lastRunDate: technicalProcesses.lastRunDate,
          nextRunDate: technicalProcesses.nextRunDate,
          createdAt: technicalProcesses.createdAt,
          updatedAt: technicalProcesses.updatedAt,
        })
        .from(technicalProcesses)
        .leftJoin(applications, eq(technicalProcesses.applicationId, applications.id))
        .where(eq(technicalProcesses.id, id));

      if (!process) {
        return res.status(404).json({ error: "Technical process not found" });
      }

      // Get interfaces used by this process
      const processInterfaces = await db
        .select({
          id: technicalProcessInterfaces.id,
          interfaceId: technicalProcessInterfaces.interfaceId,
          imlNumber: interfaces.imlNumber,
          interfaceDescription: interfaces.description,
          interfaceType: interfaces.interfaceType,
          sequenceNumber: technicalProcessInterfaces.sequenceNumber,
          usageType: technicalProcessInterfaces.usageType,
          description: technicalProcessInterfaces.description,
        })
        .from(technicalProcessInterfaces)
        .innerJoin(interfaces, eq(technicalProcessInterfaces.interfaceId, interfaces.id))
        .where(eq(technicalProcessInterfaces.technicalProcessId, id))
        .orderBy(asc(technicalProcessInterfaces.sequenceNumber));

      // Get dependencies
      const dependencies = await db
        .select({
          id: technicalProcessDependencies.id,
          dependsOnProcessId: technicalProcessDependencies.dependsOnProcessId,
          dependsOnProcessName: technicalProcesses.name,
          dependencyType: technicalProcessDependencies.dependencyType,
          description: technicalProcessDependencies.description,
        })
        .from(technicalProcessDependencies)
        .innerJoin(technicalProcesses, eq(technicalProcessDependencies.dependsOnProcessId, technicalProcesses.id))
        .where(eq(technicalProcessDependencies.technicalProcessId, id));

      // Get processes that depend on this one
      const dependents = await db
        .select({
          id: technicalProcessDependencies.id,
          technicalProcessId: technicalProcessDependencies.technicalProcessId,
          processName: technicalProcesses.name,
          dependencyType: technicalProcessDependencies.dependencyType,
          description: technicalProcessDependencies.description,
        })
        .from(technicalProcessDependencies)
        .innerJoin(technicalProcesses, eq(technicalProcessDependencies.technicalProcessId, technicalProcesses.id))
        .where(eq(technicalProcessDependencies.dependsOnProcessId, id));

      // Get internal activities for this process
      const processInternalActivities = await db
        .select({
          id: technicalProcessInternalActivities.id,
          internalActivityId: technicalProcessInternalActivities.internalActivityId,
          sequenceNumber: technicalProcessInternalActivities.sequenceNumber,
          description: technicalProcessInternalActivities.description,
          activity: {
            id: internalActivities.id,
            activityName: internalActivities.activityName,
            activityType: internalActivities.activityType,
            description: internalActivities.description,
          }
        })
        .from(technicalProcessInternalActivities)
        .innerJoin(internalActivities, eq(technicalProcessInternalActivities.internalActivityId, internalActivities.id))
        .where(eq(technicalProcessInternalActivities.technicalProcessId, id))
        .orderBy(asc(technicalProcessInternalActivities.sequenceNumber));

      res.json({
        ...process,
        interfaces: processInterfaces,
        dependencies,
        dependents,
        internalActivities: processInternalActivities,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technical process" });
    }
  });

  // Create technical process
  router.post("/", requireAuth, requirePermission("technical_processes", "create"), async (req, res) => {
    try {
      const createSchema = z.object({
        name: z.string(),
        jobName: z.string(),
        applicationId: z.number().optional(),
        description: z.string().optional(),
        frequency: z.enum(["scheduled", "on-demand", "real-time", "batch"]),
        schedule: z.string().optional(),
        criticality: z.enum(["low", "medium", "high", "critical"]),
        status: z.enum(["active", "inactive", "deprecated"]).default("active"),
        owner: z.string().optional(),
        technicalOwner: z.string().optional(),
        lastRunDate: z.string().optional().nullable(),
        nextRunDate: z.string().optional().nullable(),
        interfaces: z.array(z.object({
          interfaceId: z.number(),
          sequenceNumber: z.number(),
          usageType: z.enum(["consumes", "provides"]),
          description: z.string().optional(),
        })).optional(),
        dependencies: z.array(z.object({
          dependsOnProcessId: z.number(),
          dependencyType: z.enum(["requires", "triggers", "optional"]),
          description: z.string().optional(),
        })).optional(),
        internalActivities: z.array(z.object({
          internalActivityId: z.number(),
          sequenceNumber: z.number(),
          description: z.string().optional(),
        })).optional(),
      });

      const data = createSchema.parse(req.body);
      const { interfaces: interfaceData, dependencies: dependencyData, internalActivities: activityData, ...processData } = data;

      // Insert technical process
      const [newProcess] = await db
        .insert(technicalProcesses)
        .values({
          ...processData,
          lastRunDate: processData.lastRunDate ? new Date(processData.lastRunDate) : null,
          nextRunDate: processData.nextRunDate ? new Date(processData.nextRunDate) : null,
        })
        .returning();

      // Insert interfaces if provided
      if (interfaceData && interfaceData.length > 0) {
        await db.insert(technicalProcessInterfaces).values(
          interfaceData.map((intf) => ({
            technicalProcessId: newProcess.id,
            ...intf,
          }))
        );
      }

      // Insert dependencies if provided
      if (dependencyData && dependencyData.length > 0) {
        await db.insert(technicalProcessDependencies).values(
          dependencyData.map((dep) => ({
            technicalProcessId: newProcess.id,
            ...dep,
          }))
        );
      }

      // Insert internal activities if provided
      if (activityData && activityData.length > 0) {
        await db.insert(technicalProcessInternalActivities).values(
          activityData.map((act) => ({
            technicalProcessId: newProcess.id,
            ...act,
          }))
        );
      }

      res.status(201).json(newProcess);
    } catch (error) {
      console.error("Error creating technical process:", error);
      res.status(400).json({ error: "Failed to create technical process" });
    }
  });

  // Update technical process
  router.put("/:id", requireAuth, requirePermission("technical_processes", "update"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const updateSchema = z.object({
        name: z.string().optional(),
        jobName: z.string().optional(),
        applicationId: z.number().optional(),
        description: z.string().optional(),
        frequency: z.enum(["scheduled", "on-demand", "real-time", "batch"]).optional(),
        schedule: z.string().optional(),
        criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
        status: z.enum(["active", "inactive", "deprecated"]).optional(),
        owner: z.string().optional(),
        technicalOwner: z.string().optional(),
        lastRunDate: z.string().nullable().optional(),
        nextRunDate: z.string().nullable().optional(),
        interfaces: z.array(z.object({
          interfaceId: z.number(),
          sequenceNumber: z.number(),
          usageType: z.enum(["consumes", "provides"]),
          description: z.string().optional(),
        })).optional(),
        dependencies: z.array(z.object({
          dependsOnProcessId: z.number(),
          dependencyType: z.enum(["requires", "triggers", "optional"]),
          description: z.string().optional(),
        })).optional(),
        internalActivities: z.array(z.object({
          internalActivityId: z.number(),
          sequenceNumber: z.number(),
          description: z.string().optional(),
        })).optional(),
      });

      const data = updateSchema.parse(req.body);
      const { interfaces: interfaceData, dependencies: dependencyData, internalActivities: activityData, ...processData } = data;

      // Update technical process
      const [updatedProcess] = await db
        .update(technicalProcesses)
        .set({
          ...processData,
          lastRunDate: processData.lastRunDate ? new Date(processData.lastRunDate) : null,
          nextRunDate: processData.nextRunDate ? new Date(processData.nextRunDate) : null,
          updatedAt: new Date(),
        })
        .where(eq(technicalProcesses.id, id))
        .returning();

      if (!updatedProcess) {
        return res.status(404).json({ error: "Technical process not found" });
      }

      // Update interfaces if provided
      if (interfaceData !== undefined) {
        // Delete existing interfaces
        await db.delete(technicalProcessInterfaces).where(eq(technicalProcessInterfaces.technicalProcessId, id));
        
        // Insert new interfaces
        if (interfaceData.length > 0) {
          await db.insert(technicalProcessInterfaces).values(
            interfaceData.map((intf) => ({
              technicalProcessId: id,
              ...intf,
            }))
          );
        }
      }

      // Update dependencies if provided
      if (dependencyData !== undefined) {
        // Delete existing dependencies
        await db.delete(technicalProcessDependencies).where(eq(technicalProcessDependencies.technicalProcessId, id));
        
        // Insert new dependencies
        if (dependencyData.length > 0) {
          await db.insert(technicalProcessDependencies).values(
            dependencyData.map((dep) => ({
              technicalProcessId: id,
              ...dep,
            }))
          );
        }
      }

      // Update internal activities if provided
      if (activityData !== undefined) {
        // Delete existing internal activities
        await db.delete(technicalProcessInternalActivities).where(eq(technicalProcessInternalActivities.technicalProcessId, id));
        
        // Insert new internal activities
        if (activityData.length > 0) {
          await db.insert(technicalProcessInternalActivities).values(
            activityData.map((act) => ({
              technicalProcessId: id,
              ...act,
            }))
          );
        }
      }

      res.json(updatedProcess);
    } catch (error) {
      console.error("Error updating technical process:", error);
      res.status(400).json({ error: "Failed to update technical process" });
    }
  });

  // Delete technical process
  router.delete("/:id", requireAuth, requirePermission("technical_processes", "delete"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      // Check if process is referenced in change requests
      const [crReference] = await db
        .select()
        .from(changeRequestTechnicalProcesses)
        .where(eq(changeRequestTechnicalProcesses.technicalProcessId, id))
        .limit(1);

      if (crReference) {
        return res.status(400).json({ 
          error: "Cannot delete technical process that is referenced in change requests" 
        });
      }

      // Delete dependencies first
      await db.delete(technicalProcessDependencies).where(
        or(
          eq(technicalProcessDependencies.technicalProcessId, id),
          eq(technicalProcessDependencies.dependsOnProcessId, id)
        )
      );

      // Delete interface mappings
      await db.delete(technicalProcessInterfaces).where(eq(technicalProcessInterfaces.technicalProcessId, id));

      // Delete internal activity mappings
      await db.delete(technicalProcessInternalActivities).where(eq(technicalProcessInternalActivities.technicalProcessId, id));

      // Delete technical process
      const [deletedProcess] = await db
        .delete(technicalProcesses)
        .where(eq(technicalProcesses.id, id))
        .returning();

      if (!deletedProcess) {
        return res.status(404).json({ error: "Technical process not found" });
      }

      res.json({ message: "Technical process deleted successfully" });
    } catch (error) {
      console.error("Error deleting technical process:", error);
      res.status(500).json({ error: "Failed to delete technical process" });
    }
  });

  // Get technical processes by application
  router.get("/by-application/:applicationId", requireAuth, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      
      const processes = await db
        .select()
        .from(technicalProcesses)
        .where(eq(technicalProcesses.applicationId, applicationId))
        .orderBy(asc(technicalProcesses.name));

      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technical processes by application" });
    }
  });

  // Get technical processes using a specific interface
  router.get("/by-interface/:interfaceId", requireAuth, async (req, res) => {
    try {
      const interfaceId = parseInt(req.params.interfaceId);
      
      const processes = await db
        .select({
          id: technicalProcesses.id,
          name: technicalProcesses.name,
          jobName: technicalProcesses.jobName,
          applicationName: applications.name,
          usageType: technicalProcessInterfaces.usageType,
          description: technicalProcessInterfaces.description,
          criticality: technicalProcesses.criticality,
          status: technicalProcesses.status,
        })
        .from(technicalProcessInterfaces)
        .innerJoin(technicalProcesses, eq(technicalProcessInterfaces.technicalProcessId, technicalProcesses.id))
        .leftJoin(applications, eq(technicalProcesses.applicationId, applications.id))
        .where(eq(technicalProcessInterfaces.interfaceId, interfaceId));

      res.json(processes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch technical processes by interface" });
    }
  });

  app.use("/api/technical-processes", router);
}