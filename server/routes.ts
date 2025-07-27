import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { storage } from "./storage";
import { requireAuth, requirePermission } from "./auth";
import { parseIdParam } from "./middleware/validation";
import { 
  insertApplicationSchema, 
  insertInterfaceSchema, 
  insertChangeRequestSchema, 
  insertInterfaceCommentSchema,
  insertBusinessProcessSchema,
  insertBusinessProcessInterfaceSchema,
  insertBusinessProcessRelationshipSchema,
  insertInterfaceVersionSchema,
  insertInterfaceConsumerDescriptionSchema,
  insertImlDiagramSchema,
  insertConversationSchema,
  insertConversationLinkSchema,
  insertCommunicationCommentSchema,
  insertCommunicationAttachmentSchema,
  insertConversationParticipantSchema,
  insertCommunicationMentionSchema,
  insertRoleSchema,
  insertUserSchema,
  insertUserRoleSchema,
  insertRolePermissionSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  exportApplicationsToXLSX,
  exportInterfacesToXLSX,
  exportBusinessProcessesToXLSX,
  exportBusinessProcessesTreeViewToXLSX,
  exportChangeRequestsToXLSX,
  exportTechnicalProcessesToXLSX
} from "./export-utils";
import { importBusinessProcessesFromExcel } from "./import-export-bp";
import multer from "multer";
import { initiativesRouter } from "./routes/initiatives";
import { auditRouter } from "./routes/audit";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Helper function for auto-checkout logic
async function performAutoCheckout(artifactType: string, artifactId: number, userId: number) {
  try {
    const { VersionControlService } = await import("./services/version-control.service");
    const { initiatives, initiativeParticipants } = await import("@shared/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get user's active initiatives
    const userInitiatives = await db.select({
      initiativeId: initiatives.initiativeId
    })
    .from(initiatives)
    .innerJoin(initiativeParticipants, eq(initiatives.initiativeId, initiativeParticipants.initiativeId))
    .where(and(
      eq(initiativeParticipants.userId, userId),
      eq(initiatives.status, 'active')
    ));

    // Auto-checkout in each active initiative if not already checked out
    for (const initiative of userInitiatives) {
      try {
        const existingVersion = await VersionControlService.getInitiativeVersion(
          artifactType as any,
          artifactId,
          initiative.initiativeId
        );
        
        if (!existingVersion) {
          // No version exists, auto-checkout
          await VersionControlService.checkoutArtifact(
            artifactType as any,
            artifactId,
            initiative.initiativeId,
            userId
          );
          console.log(`Auto-checked out ${artifactType} ${artifactId} in initiative ${initiative.initiativeId} for user ${userId}`);
        }
      } catch (checkoutError) {
        // Don't fail the update if auto-checkout fails, just log it
        console.warn(`Auto-checkout failed for ${artifactType} ${artifactId} in initiative ${initiative.initiativeId}:`, checkoutError.message);
      }
    }
  } catch (autoCheckoutError) {
    // Don't fail the update if auto-checkout logic fails, just log it
    console.warn(`Auto-checkout logic failed for ${artifactType} ${artifactId}:`, autoCheckoutError.message);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint
  app.get("/api/test-db", async (req, res) => {
    try {
      const result = await storage.getAllApplications();
      res.json({ success: true, count: result.length });
    } catch (error) {
      console.error("Test DB error:", error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  });

  // Applications (AML) routes
  app.get("/api/applications", async (req, res) => {
    try {
      const includeInitiativeChanges = req.query.includeInitiativeChanges === 'true';
      const initiativeId = req.query.initiativeId as string;
      
      // Get baseline applications
      const applications = await storage.getAllApplications();
      
      if (includeInitiativeChanges && initiativeId) {
        // Get initiative versions for applications
        const initiativeVersions = await storage.getInitiativeArtifacts('application', initiativeId);
        
        // Merge initiative changes with baseline
        const mergedApplications = applications.map(app => {
          const initiativeVersion = initiativeVersions.find(v => v.artifactId === app.id);
          if (initiativeVersion) {
            return {
              ...app,
              hasInitiativeChanges: true,
              initiativeData: initiativeVersion.artifactData,
              versionState: 'modified_in_initiative'
            };
          }
          return app;
        });
        
        // Add new applications created in initiative
        const newApplications = initiativeVersions
          .filter(v => v.changeType === 'create')
          .map(v => ({
            ...v.artifactData,
            id: v.artifactId,
            hasInitiativeChanges: true,
            versionState: 'new_in_initiative',
            artifactState: 'pending',
            initiativeOrigin: initiativeId
          }));
        
        res.json([...mergedApplications, ...newApplications]);
      } else {
        res.json(applications);
      }
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Export route for applications - must be before :id route
  app.get("/api/applications/export", async (req, res) => {
    console.log("Export applications endpoint hit");
    try {
      const { buffer, filename } = await exportApplicationsToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export applications error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to export applications", error: errorMessage });
    }
  });

  // Get applications pending decommission - must be before :id route
  app.get("/api/applications/pending-decommission", async (req, res) => {
    try {
      const applications = await storage.getAllApplications();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const pendingDecommission = applications.filter(app => {
        if (!app.decommissionDate || app.status === 'decommissioned') return false;
        const decommissionDate = new Date(app.decommissionDate);
        decommissionDate.setHours(0, 0, 0, 0);
        return decommissionDate <= today;
      });
      
      res.json(pendingDecommission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending decommissions" });
    }
  });

  app.get("/api/applications/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  app.post("/api/applications", requireAuth, requirePermission("applications", "create"), async (req, res) => {
    try {
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.createApplication(validatedData);
      
      // Create baseline version for version control
      const { artifactVersions } = await import("@db/schema");
      await db.insert(artifactVersions).values({
        artifactType: 'application',
        artifactId: application.id,
        versionNumber: 1,
        isBaseline: true,
        artifactData: application,
        changeType: 'create',
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  app.put("/api/applications/:id", requireAuth, requirePermission("applications", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertApplicationSchema.parse(req.body);
      const application = await storage.updateApplication(id, validatedData);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Auto-checkout: If user has active initiatives, ensure application is checked out
      await performAutoCheckout('application', id, req.user!.id);

      res.json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Application decommission endpoint - checks for associated interfaces
  app.post("/api/applications/:id/decommission", requireAuth, requirePermission("applications", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const { decommissionDate, decommissionReason, decommissionedBy } = req.body;
      
      if (!decommissionDate || !decommissionReason || !decommissionedBy) {
        return res.status(400).json({ 
          message: "Missing required fields: decommissionDate, decommissionReason, decommissionedBy" 
        });
      }
      
      // Get the application to check if it exists
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get all interfaces associated with this application
      const interfaces = await storage.getAllInterfaces();
      const providedInterfaces = interfaces.filter(i => i.providerApplicationId === id);
      const consumedInterfaces = interfaces.filter(i => i.consumerApplicationId === id);
      
      // Update the application with decommission information
      // We need to update the application directly with decommission fields
      const updateData = {
        decommissionReason,
        decommissionedBy,
        status: new Date(decommissionDate) <= new Date() ? 'decommissioned' : application.status
      };
      
      // Update the application (without decommissionDate as it's excluded from InsertApplication)
      const updatedApplication = await storage.updateApplication(id, updateData as any);
      
      // Update decommissionDate separately using raw SQL if needed
      if (decommissionDate) {
        await storage.setApplicationDecommissionDate(id, new Date(decommissionDate));
      }
      
      // If decommission date is today or in the past, decommission interfaces
      if (new Date(decommissionDate) <= new Date()) {
        // Decommission all provided interfaces
        for (const iface of providedInterfaces) {
          await storage.updateInterface(iface.id, {
            imlNumber: iface.imlNumber,
            interfaceType: iface.interfaceType,
            status: 'decommissioned'
          });
        }
      }
      
      res.json({
        application: updatedApplication,
        impactedInterfaces: {
          provided: providedInterfaces.length,
          consumed: consumedInterfaces.length
        },
        message: new Date(decommissionDate) <= new Date() 
          ? 'Application and associated interfaces have been decommissioned'
          : 'Application decommission scheduled'
      });
    } catch (error) {
      console.error('Decommission error:', error);
      res.status(500).json({ message: "Failed to decommission application" });
    }
  });
  
  // Get decommission impact analysis
  app.get("/api/applications/:id/decommission-impact", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const application = await storage.getApplication(id);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Get all interfaces associated with this application
      const interfaces = await storage.getAllInterfaces();
      const providedInterfaces = interfaces.filter(i => i.providerApplicationId === id && i.status !== 'decommissioned');
      const consumedInterfaces = interfaces.filter(i => i.consumerApplicationId === id && i.status !== 'decommissioned');
      
      res.json({
        application,
        providedInterfaces,
        consumedInterfaces,
        totalImpactedInterfaces: providedInterfaces.length + consumedInterfaces.length
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get decommission impact analysis" });
    }
  });

  app.delete("/api/applications/:id", requireAuth, requirePermission("applications", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const success = await storage.deleteApplication(id);
      if (!success) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Interfaces (IML) routes
  app.get("/api/interfaces", async (req, res) => {
    try {
      const interfaces = await storage.getAllInterfaces();
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interfaces" });
    }
  });

  // Export route for interfaces - must be before :id route
  app.get("/api/interfaces/export", async (req, res) => {
    try {
      const { buffer, filename } = await exportInterfacesToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export interfaces error:", error);
      res.status(500).json({ message: "Failed to export interfaces" });
    }
  });

  app.get("/api/interfaces/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const interface_ = await storage.getInterface(id);
      if (!interface_) {
        return res.status(404).json({ message: "Interface not found" });
      }
      res.json(interface_);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interface" });
    }
  });

  app.post("/api/interfaces", requireAuth, requirePermission("interfaces", "create"), async (req, res) => {
    try {
      const validatedData = insertInterfaceSchema.parse(req.body);
      const interface_ = await storage.createInterface(validatedData);
      
      // Create baseline version for version control
      const { artifactVersions } = await import("@db/schema");
      await db.insert(artifactVersions).values({
        artifactType: 'interface',
        artifactId: interface_.id,
        versionNumber: 1,
        isBaseline: true,
        artifactData: interface_,
        changeType: 'create',
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(interface_);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create interface" });
    }
  });

  app.put("/api/interfaces/:id", requireAuth, requirePermission("interfaces", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const validatedData = insertInterfaceSchema.parse(req.body);
      
      // Get current interface to check for status change
      const currentInterface = await storage.getInterface(id);
      if (!currentInterface) {
        return res.status(404).json({ message: "Interface not found" });
      }
      
      // Check if trying to activate an inactive/decommissioned interface
      if ((currentInterface.status === 'inactive' || currentInterface.status === 'decommissioned') && 
          validatedData.status === 'active') {
        
        // Check provider and consumer application status
        const applications = await storage.getAllApplications();
        const providerApp = applications.find(app => app.id === currentInterface.providerApplicationId);
        const consumerApp = applications.find(app => app.id === currentInterface.consumerApplicationId);
        
        const inactiveApps = [];
        
        if (providerApp && providerApp.status !== 'active') {
          inactiveApps.push({
            name: providerApp.name,
            status: providerApp.status,
            type: 'Provider'
          });
        }
        
        if (consumerApp && consumerApp.status !== 'active') {
          inactiveApps.push({
            name: consumerApp.name,
            status: consumerApp.status,
            type: 'Consumer'
          });
        }
        
        if (inactiveApps.length > 0) {
          return res.status(400).json({ 
            message: "Cannot activate interface",
            reason: "One or more associated applications are not active",
            inactiveApplications: inactiveApps
          });
        }
      }
      
      const interface_ = await storage.updateInterface(id, validatedData);
      res.json(interface_);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update interface" });
    }
  });

  app.delete("/api/interfaces/:id", requireAuth, requirePermission("interfaces", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const success = await storage.deleteInterface(id);
      if (!success) {
        return res.status(404).json({ message: "Interface not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete interface" });
    }
  });

  // Interface activation validation endpoint
  app.get("/api/interfaces/:id/validate-activation", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const interface_ = await storage.getInterface(id);
      if (!interface_) {
        return res.status(404).json({ message: "Interface not found" });
      }
      
      // Get provider and consumer applications
      const applications = await storage.getAllApplications();
      const providerApp = applications.find(app => app.id === interface_.providerApplicationId);
      const consumerApp = applications.find(app => app.id === interface_.consumerApplicationId);
      
      const validationResult = {
        canActivate: true,
        issues: [] as Array<{
          type: string;
          applicationName: string;
          applicationStatus: string;
          message: string;
        }>,
        providerApplication: providerApp ? {
          id: providerApp.id,
          name: providerApp.name,
          status: providerApp.status
        } : null,
        consumerApplication: consumerApp ? {
          id: consumerApp.id,
          name: consumerApp.name,
          status: consumerApp.status
        } : null
      };
      
      if (providerApp && providerApp.status !== 'active') {
        validationResult.canActivate = false;
        validationResult.issues.push({
          type: 'provider',
          applicationName: providerApp.name,
          applicationStatus: providerApp.status,
          message: `Provider application "${providerApp.name}" is ${providerApp.status}`
        });
      }
      
      if (consumerApp && consumerApp.status !== 'active') {
        validationResult.canActivate = false;
        validationResult.issues.push({
          type: 'consumer',
          applicationName: consumerApp.name,
          applicationStatus: consumerApp.status,
          message: `Consumer application "${consumerApp.name}" is ${consumerApp.status}`
        });
      }
      
      res.json(validationResult);
    } catch (error) {
      res.status(500).json({ message: "Failed to validate interface activation" });
    }
  });

  // Interface decommission endpoint
  app.post("/api/interfaces/:id/decommission", requireAuth, requirePermission("interfaces", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const { decommissionDate, decommissionReason, decommissionedBy } = req.body;
      
      if (!decommissionDate || !decommissionReason || !decommissionedBy) {
        return res.status(400).json({ 
          message: "Missing required fields: decommissionDate, decommissionReason, decommissionedBy" 
        });
      }
      
      // Get the interface to check if it exists
      const interface_ = await storage.getInterface(id);
      if (!interface_) {
        return res.status(404).json({ message: "Interface not found" });
      }
      
      // Update the interface with decommission information
      const updatedInterface = await storage.updateInterface(id, {
        imlNumber: interface_.imlNumber,
        interfaceType: interface_.interfaceType,
        status: 'decommissioned'
      });
      
      res.json({
        interface: updatedInterface,
        message: 'Interface has been decommissioned'
      });
    } catch (error) {
      console.error('Interface decommission error:', error);
      res.status(500).json({ message: "Failed to decommission interface" });
    }
  });

  // Interface business processes
  app.get("/api/interfaces/:id/business-processes", async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const businessProcesses = await storage.getInterfaceBusinessProcesses(interfaceId);
      res.json(businessProcesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interface business processes" });
    }
  });

  app.post("/api/interfaces/:id/business-processes", requireAuth, requirePermission("interfaces", "update"), async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { businessProcessId, sequenceNumber, description } = req.body;
      
      const validatedData = insertBusinessProcessInterfaceSchema.parse({
        businessProcessId,
        interfaceId,
        sequenceNumber,
        description
      });
      
      const bpInterface = await storage.addBusinessProcessInterface(validatedData);
      res.status(201).json(bpInterface);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add interface to business process" });
    }
  });

  // Update all business process assignments for an interface
  // Note: This endpoint exists but may not work due to Express routing issues with PUT
  // The UI uses individual DELETE and POST operations instead
  app.put("/api/interfaces/:id/business-processes", requireAuth, requirePermission("interfaces", "update"), async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const { assignments } = req.body;
      if (!Array.isArray(assignments)) {
        return res.status(400).json({ message: "assignments must be an array" });
      }
      
      // Update all assignments
      await storage.updateInterfaceBusinessProcesses(interfaceId, assignments);
      
      // Return the updated assignments
      const updatedAssignments = await storage.getInterfaceBusinessProcesses(interfaceId);
      res.json(updatedAssignments);
    } catch (error) {
      console.error("Error updating interface business processes:", error);
      res.status(500).json({ message: "Failed to update business processes for interface" });
    }
  });

  app.put("/api/business-process-interfaces/:id/sequence", requireAuth, requirePermission("business_processes", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { sequenceNumber } = req.body;
      
      const updated = await storage.updateBusinessProcessInterfaceSequence(id, sequenceNumber);
      if (!updated) {
        return res.status(404).json({ message: "Business process interface not found" });
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update sequence number" });
    }
  });

  // Interface comments
  app.get("/api/interfaces/:id/comments", async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const comments = await storage.getInterfaceComments(interfaceId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/interfaces/:id/comments", async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertInterfaceCommentSchema.parse({
        ...req.body,
        interfaceId
      });
      const comment = await storage.addInterfaceComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Change Requests routes
  app.get("/api/change-requests", async (req, res) => {
    try {
      const changeRequests = await storage.getAllChangeRequests();
      res.json(changeRequests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch change requests" });
    }
  });

  // Export route for change requests - must be before :id route
  app.get("/api/change-requests/export", async (req, res) => {
    try {
      const { buffer, filename } = await exportChangeRequestsToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export change requests error:", error);
      res.status(500).json({ message: "Failed to export change requests" });
    }
  });

  app.get("/api/change-requests/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const changeRequest = await storage.getChangeRequest(id);
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      res.json(changeRequest);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch change request" });
    }
  });

  app.post("/api/change-requests", requireAuth, requirePermission("change_requests", "create"), async (req, res) => {
    try {
      const validatedData = insertChangeRequestSchema.parse(req.body);
      const changeRequest = await storage.createChangeRequest(validatedData);
      res.status(201).json(changeRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create change request" });
    }
  });

  app.put("/api/change-requests/:id", requireAuth, requirePermission("change_requests", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertChangeRequestSchema.parse(req.body);
      const changeRequest = await storage.updateChangeRequest(id, validatedData);
      if (!changeRequest) {
        return res.status(404).json({ message: "Change request not found" });
      }
      res.json(changeRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update change request" });
    }
  });

  // Change Request Impact Management routes
  app.get("/api/change-requests/:id/applications", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impacts = await storage.getChangeRequestApplicationImpacts(crId);
      res.json(impacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch application impacts" });
    }
  });

  app.put("/api/change-requests/:id/applications", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { applications } = req.body;
      await storage.updateChangeRequestApplicationImpacts(crId, applications);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update application impacts" });
    }
  });

  app.get("/api/change-requests/:id/interfaces", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impacts = await storage.getChangeRequestInterfaceImpacts(crId);
      res.json(impacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interface impacts" });
    }
  });

  app.put("/api/change-requests/:id/interfaces", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { interfaces } = req.body;
      await storage.updateChangeRequestInterfaceImpacts(crId, interfaces);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update interface impacts" });
    }
  });

  app.get("/api/change-requests/:id/technical-processes", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impacts = await storage.getChangeRequestTechnicalProcessImpacts(crId);
      res.json(impacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technical process impacts" });
    }
  });

  app.put("/api/change-requests/:id/technical-processes", async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { technicalProcesses } = req.body;
      await storage.updateChangeRequestTechnicalProcessImpacts(crId, technicalProcesses);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update technical process impacts" });
    }
  });

  // Get change request internal activities impacts
  app.get("/api/change-requests/:id/internal-activities", requireAuth, async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const internalActivities = await storage.getChangeRequestInternalActivityImpacts(crId);
      res.json(internalActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch internal activity impacts" });
    }
  });

  // Update change request internal activities impacts
  app.put("/api/change-requests/:id/internal-activities", requireAuth, requirePermission("change_requests", "update"), async (req, res) => {
    try {
      const crId = parseIdParam(req.params.id);
      if (!crId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { internalActivities } = req.body;
      await storage.updateChangeRequestInternalActivityImpacts(crId, internalActivities);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update internal activity impacts" });
    }
  });

  // Delete change request
  app.delete("/api/change-requests/:id", requireAuth, requirePermission("change_requests", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      await storage.deleteChangeRequest(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete change request" });
    }
  });

  // Impact Analysis routes
  app.get("/api/impact-analysis/application/:id", async (req, res) => {
    try {
      const applicationId = parseIdParam(req.params.id);
      if (!applicationId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impact = await storage.getApplicationImpactAnalysis(applicationId);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform impact analysis" });
    }
  });

  app.get("/api/impact-analysis/change-request/:id", async (req, res) => {
    try {
      const changeRequestId = parseIdParam(req.params.id);
      if (!changeRequestId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impact = await storage.getChangeRequestImpactAnalysis(changeRequestId);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform impact analysis" });
    }
  });

  // Multi-select Impact Analysis routes
  app.post("/api/impact-analysis/multi-applications", async (req, res) => {
    try {
      const { applicationIds } = req.body;
      if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
        return res.status(400).json({ message: "applicationIds must be a non-empty array" });
      }
      const impact = await storage.getMultiApplicationImpactAnalysis(applicationIds);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform multi-application impact analysis" });
    }
  });

  app.post("/api/impact-analysis/multi-change-requests", async (req, res) => {
    try {
      const { changeRequestIds } = req.body;
      if (!Array.isArray(changeRequestIds) || changeRequestIds.length === 0) {
        return res.status(400).json({ message: "changeRequestIds must be a non-empty array" });
      }
      const impact = await storage.getMultiChangeRequestImpactAnalysis(changeRequestIds);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform multi-CR impact analysis" });
    }
  });

  app.post("/api/impact-analysis/multi-interfaces", async (req, res) => {
    try {
      const { interfaceIds } = req.body;
      if (!Array.isArray(interfaceIds) || interfaceIds.length === 0) {
        return res.status(400).json({ message: "interfaceIds must be a non-empty array" });
      }
      const impact = await storage.getMultiInterfaceImpactAnalysis(interfaceIds);
      res.json(impact);
    } catch (error) {
      res.status(500).json({ message: "Failed to perform multi-interface impact analysis" });
    }
  });


  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get("/api/dashboard/recent-changes", async (req, res) => {
    try {
      const changes = await storage.getRecentChanges();
      res.json(changes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent changes" });
    }
  });

  app.get("/api/dashboard/communication-metrics", async (req, res) => {
    try {
      const metrics = await storage.getCommunicationMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication metrics" });
    }
  });

  app.get("/api/dashboard/recent-communications", async (req, res) => {
    try {
      const communications = await storage.getRecentCommunications();
      res.json(communications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent communications" });
    }
  });

  // Timeline view
  app.get("/api/timeline", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const timeline = await storage.getTimelineData(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timeline data" });
    }
  });

  // Business Process routes
  app.get("/api/business-processes", async (req, res) => {
    try {
      const { parentProcessId } = req.query;
      
      let businessProcesses = await storage.getAllBusinessProcesses();
      
      // If parentProcessId filter is provided, we need to use relationships
      if (parentProcessId !== undefined) {
        // This filter is no longer applicable as parentProcessId is not on the BusinessProcess model
        // The client should be updated to handle parent-child relationships differently
        // For now, just return all business processes
      }
      
      res.json(businessProcesses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business processes" });
    }
  });

  // Get all business process relationships
  app.get("/api/business-processes/relationships", async (req, res) => {
    try {
      const relationships = await storage.getAllBusinessProcessRelationships();
      res.json(relationships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business process relationships" });
    }
  });

  // Export route for business processes - must be before :id route
  app.get("/api/business-processes/export", async (req, res) => {
    try {
      const { buffer, filename } = await exportBusinessProcessesToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export business processes error:", error);
      res.status(500).json({ message: "Failed to export business processes" });
    }
  });

  // Export route for business processes tree view - must be before :id route
  app.get("/api/business-processes/export-tree", async (req, res) => {
    try {
      const { buffer, filename } = await exportBusinessProcessesTreeViewToXLSX();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error("Export business processes tree view error:", error);
      res.status(500).json({ message: "Failed to export business processes tree view" });
    }
  });

  // Import route for business processes - must be before :id route
  app.post("/api/business-processes/import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const clearExisting = req.body.clearExisting === 'true';
      const result = await importBusinessProcessesFromExcel(req.file.buffer, clearExisting);
      
      res.json({
        success: true,
        message: "Business processes imported successfully",
        summary: result.summary
      });
    } catch (error) {
      console.error("Import business processes error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ message: "Failed to import business processes", error: errorMessage });
    }
  });

  app.get("/api/business-processes/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const businessProcess = await storage.getBusinessProcess(id);
      if (!businessProcess) {
        return res.status(404).json({ message: "Business process not found" });
      }
      res.json(businessProcess);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business process" });
    }
  });

  app.post("/api/business-processes", requireAuth, requirePermission("business_processes", "create"), async (req, res) => {
    try {
      const validatedData = insertBusinessProcessSchema.parse(req.body);
      const businessProcess = await storage.createBusinessProcess(validatedData);
      
      // Create baseline version for version control
      const { artifactVersions } = await import("@db/schema");
      await db.insert(artifactVersions).values({
        artifactType: 'business_process',
        artifactId: businessProcess.id,
        versionNumber: 1,
        isBaseline: true,
        artifactData: businessProcess,
        changeType: 'create',
        createdBy: req.user!.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      res.status(201).json(businessProcess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create business process" });
    }
  });

  app.put("/api/business-processes/:id", requireAuth, requirePermission("business_processes", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertBusinessProcessSchema.parse(req.body);
      const businessProcess = await storage.updateBusinessProcess(id, validatedData);
      if (!businessProcess) {
        return res.status(404).json({ message: "Business process not found" });
      }
      res.json(businessProcess);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update business process" });
    }
  });

  // Check deletion impact before :id route
  app.get("/api/business-processes/:id/deletion-impact", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const impact = await storage.getBusinessProcessDeletionImpact(id);
      res.json(impact);
    } catch (error) {
      console.error("Error checking deletion impact:", error);
      res.status(500).json({ message: "Failed to check deletion impact" });
    }
  });

  app.delete("/api/business-processes/:id", requireAuth, requirePermission("business_processes", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const success = await storage.deleteBusinessProcess(id);
      if (!success) {
        return res.status(404).json({ message: "Business process not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting business process:", error);
      res.status(500).json({ message: "Failed to delete business process" });
    }
  });

  // Duplicate business process with children
  app.post("/api/business-processes/:id/duplicate", requireAuth, requirePermission("business_processes", "create"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const duplicatedBP = await storage.duplicateBusinessProcessWithChildren(id);
      if (!duplicatedBP) {
        return res.status(404).json({ message: "Business process not found" });
      }
      res.status(201).json(duplicatedBP);
    } catch (error) {
      console.error("Error duplicating business process:", error);
      res.status(500).json({ message: "Failed to duplicate business process" });
    }
  });

  // Create child business process
  app.post("/api/business-processes/:id/children", requireAuth, requirePermission("business_processes", "create"), async (req, res) => {
    try {
      const parentId = parseIdParam(req.params.id);
      if (!parentId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const validatedData = insertBusinessProcessSchema.parse(req.body);
      const { sequenceNumber = 1 } = req.body;
      
      // Create the child business process
      const childBP = await storage.createBusinessProcess(validatedData);
      
      // Create the parent-child relationship
      await storage.addBusinessProcessRelationship({
        parentProcessId: parentId,
        childProcessId: childBP.id,
        relationshipType: "contains",
        sequenceNumber: sequenceNumber
      });
      
      res.status(201).json(childBP);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating child business process:", error);
      res.status(500).json({ message: "Failed to create child business process" });
    }
  });

  // Copy business process with all its children
  app.post("/api/business-processes/:id/copy", async (req, res) => {
    try {
      const sourceId = parseIdParam(req.params.id);
      if (!sourceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }

      const { targetParentId } = req.body;
      
      // Validate targetParentId if provided
      if (targetParentId !== null && targetParentId !== undefined) {
        const parentIdNum = parseIdParam(targetParentId);
        if (!parentIdNum) {
          return res.status(400).json({ message: "Invalid parent ID parameter." });
        }
      }

      // Get the source process
      const sourceProcess = await storage.getBusinessProcess(sourceId);
      if (!sourceProcess) {
        return res.status(404).json({ message: "Source business process not found" });
      }

      // Get target parent if specified
      let targetParent = null;
      if (targetParentId) {
        targetParent = await storage.getBusinessProcess(targetParentId);
        if (!targetParent) {
          return res.status(404).json({ message: "Target parent process not found" });
        }

        // Validate hierarchy rules
        if (targetParent.level === 'C') {
          return res.status(400).json({ message: "Level C processes cannot have children" });
        }
        
        if (targetParent.level === 'A' && sourceProcess.level !== 'B') {
          return res.status(400).json({ message: "Only Level B processes can be children of Level A" });
        }
        
        if (targetParent.level === 'B' && sourceProcess.level !== 'C') {
          return res.status(400).json({ message: "Only Level C processes can be children of Level B" });
        }
      }

      // Helper function to copy a process and all its children recursively
      async function copyProcessHierarchy(processId: number, parentId: number | null, sequenceOffset = 0): Promise<number> {
        const process = await storage.getBusinessProcess(processId);
        if (!process) throw new Error("Process not found during copy");

        // Create copy of the process
        const copiedData = {
          businessProcess: `${process.businessProcess} (Copy)`,
          lob: process.lob,
          product: process.product,
          version: process.version,
          level: process.level,
          domainOwner: process.domainOwner,
          itOwner: process.itOwner,
          vendorFocal: process.vendorFocal,
          status: process.status
        };

        const copiedProcess = await storage.createBusinessProcess(copiedData);

        // If there's a parent, create the relationship
        if (parentId) {
          // Get existing children to determine sequence number
          const existingChildren = await storage.getBusinessProcessChildren(parentId);
          const maxSequence = existingChildren.reduce((max, child: any) => 
            Math.max(max, child.sequenceNumber || 0), 0
          );

          await storage.addBusinessProcessRelationship({
            parentProcessId: parentId,
            childProcessId: copiedProcess.id,
            relationshipType: "contains",
            sequenceNumber: maxSequence + sequenceOffset + 1
          });
        }

        // Copy all children recursively
        const children = await storage.getBusinessProcessChildren(processId);
        for (let i = 0; i < children.length; i++) {
          await copyProcessHierarchy(children[i].id, copiedProcess.id, i);
        }

        return copiedProcess.id;
      }

      // Perform the copy
      const copiedProcessId = await copyProcessHierarchy(sourceId, targetParentId);
      const copiedProcess = await storage.getBusinessProcess(copiedProcessId);

      res.json(copiedProcess);
    } catch (error) {
      console.error("Error copying business process:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to copy business process" });
    }
  });

  // Move business process to new parent
  app.put("/api/business-processes/:id/move", async (req, res) => {
    try {
      const processId = parseIdParam(req.params.id);
      if (!processId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      const { newParentId, position } = req.body;
      
      // Validate newParentId if provided
      if (newParentId !== null && newParentId !== undefined) {
        const parentIdNum = parseIdParam(newParentId);
        if (!parentIdNum) {
          return res.status(400).json({ message: "Invalid parent ID parameter." });
        }
      }
      
      const movedProcess = await storage.moveBusinessProcess(
        processId, 
        newParentId || null,
        position
      );
      
      if (!movedProcess) {
        return res.status(404).json({ message: "Business process not found" });
      }
      
      res.json(movedProcess);
    } catch (error) {
      console.error("Error moving business process:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to move business process";
      res.status(400).json({ message: errorMessage });
    }
  });

  // Resequence children of a business process
  app.put("/api/business-processes/:id/resequence", async (req, res) => {
    try {
      const parentId = parseIdParam(req.params.id);
      if (!parentId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      
      await storage.resequenceBusinessProcessChildren(parentId);
      res.json({ success: true, message: "Children resequenced successfully" });
    } catch (error) {
      console.error("Error resequencing children:", error);
      res.status(500).json({ message: "Failed to resequence children" });
    }
  });

  // Business Process Relationship routes
  app.get("/api/business-processes/:id/parents", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const parents = await storage.getBusinessProcessParents(id);
      res.json(parents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch parent processes" });
    }
  });

  app.get("/api/business-processes/:id/children", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const children = await storage.getBusinessProcessChildren(id);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch child processes" });
    }
  });

  app.post("/api/business-processes/:id/relationships", async (req, res) => {
    try {
      const childId = parseIdParam(req.params.id);
      if (!childId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const { parentProcessId, relationshipType, sequenceNumber } = req.body;
      
      const validatedData = insertBusinessProcessRelationshipSchema.parse({
        parentProcessId,
        childProcessId: childId,
        relationshipType: relationshipType || 'contains',
        sequenceNumber: sequenceNumber || 1
      });
      
      const relationship = await storage.addBusinessProcessRelationship(validatedData);
      res.status(201).json(relationship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create relationship" });
    }
  });

  app.delete("/api/business-processes/:childId/relationships/:parentId", async (req, res) => {
    try {
      const childId = parseIdParam(req.params.childId);
      const parentId = parseIdParam(req.params.parentId);
      if (!childId || !parentId) {
        return res.status(400).json({ message: "Invalid ID parameters. Must be positive integers." });
      }
      const success = await storage.removeBusinessProcessRelationship(parentId, childId);
      if (!success) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove relationship" });
    }
  });

  // Business Process Interface Mapping routes
  app.get("/api/business-processes/:id/interfaces", async (req, res) => {
    try {
      const businessProcessId = parseIdParam(req.params.id);
      if (!businessProcessId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const interfaces = await storage.getBusinessProcessInterfaces(businessProcessId);
      res.json(interfaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business process interfaces" });
    }
  });

  app.post("/api/business-processes/:id/interfaces", async (req, res) => {
    try {
      const businessProcessId = parseIdParam(req.params.id);
      if (!businessProcessId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertBusinessProcessInterfaceSchema.parse({
        ...req.body,
        businessProcessId
      });
      const bpInterface = await storage.addBusinessProcessInterface(validatedData);
      res.status(201).json(bpInterface);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add interface to business process" });
    }
  });

  app.delete("/api/business-process-interfaces/:id", requireAuth, requirePermission("business_processes", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const success = await storage.removeBusinessProcessInterface(id);
      if (!success) {
        return res.status(404).json({ message: "Business process interface not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove interface from business process" });
    }
  });

  // Interface Versions routes
  app.get("/api/interfaces/:id/versions", async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const versions = await storage.getInterfaceVersions(interfaceId);
      res.json(versions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interface versions" });
    }
  });

  app.post("/api/interfaces/:id/versions", async (req, res) => {
    try {
      const interfaceId = parseIdParam(req.params.id);
      if (!interfaceId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertInterfaceVersionSchema.parse({
        ...req.body,
        interfaceId
      });
      const version = await storage.createInterfaceVersion(validatedData);
      res.status(201).json(version);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create interface version" });
    }
  });

  // IML Diagram routes
  app.get("/api/business-processes/:id/diagram", async (req, res) => {
    try {
      const businessProcessId = parseIdParam(req.params.id);
      if (!businessProcessId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const diagram = await storage.getImlDiagram(businessProcessId);
      if (!diagram) {
        return res.status(404).json({ message: "Diagram not found" });
      }
      res.json(diagram);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch IML diagram" });
    }
  });

  app.post("/api/business-processes/:id/diagram", async (req, res) => {
    try {
      const businessProcessId = parseIdParam(req.params.id);
      if (!businessProcessId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertImlDiagramSchema.parse({
        ...req.body,
        businessProcessId
      });
      const diagram = await storage.createImlDiagram(validatedData);
      res.status(201).json(diagram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create IML diagram" });
    }
  });

  app.put("/api/diagrams/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertImlDiagramSchema.parse(req.body);
      const diagram = await storage.updateImlDiagram(id, validatedData);
      if (!diagram) {
        return res.status(404).json({ message: "Diagram not found" });
      }
      res.json(diagram);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update IML diagram" });
    }
  });

  // Import/Export routes
  app.get("/api/export", async (req, res) => {
    try {
      const data = await storage.exportAllData();
      const filename = `ait-export-${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Entity-specific Export routes (moved to before :id routes)
  // All export routes have been moved above their corresponding :id routes

  app.post("/api/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importData(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import data",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Entity-specific Import routes
  app.post("/api/applications/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importApplications(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import applications",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/interfaces/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importInterfaces(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import interfaces",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/business-processes/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importBusinessProcesses(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import business processes",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/change-requests/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importChangeRequests(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import change requests",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/technical-processes/import", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !mode) {
        return res.status(400).json({ message: "Missing required fields: data and mode" });
      }
      
      if (mode !== 'truncate' && mode !== 'incremental') {
        return res.status(400).json({ message: "Invalid import mode. Use 'truncate' or 'incremental'" });
      }
      
      const result = await storage.importTechnicalProcesses(data, mode);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to import technical processes",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Communication routes
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation count for a specific entity
  app.get("/api/conversations/count/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const id = parseIdParam(entityId);
      if (!id) {
        return res.status(400).json({ message: "Invalid entity ID parameter." });
      }
      const count = await storage.getConversationCountForEntity(entityType, id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation count" });
    }
  });

  // Get bulk conversation counts for multiple entities
  app.post("/api/conversations/counts/:entityType", async (req, res) => {
    try {
      const { entityType } = req.params;
      const { entityIds } = req.body;
      
      if (!Array.isArray(entityIds) || entityIds.length === 0) {
        return res.status(400).json({ message: "entityIds must be a non-empty array" });
      }
      
      // Validate all entity IDs are positive integers
      const validatedIds = entityIds.map(id => parseIdParam(id));
      if (validatedIds.some(id => !id)) {
        return res.status(400).json({ message: "All entity IDs must be positive integers" });
      }
      
      const counts = await storage.getBulkConversationCounts(entityType, validatedIds as number[]);
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bulk conversation counts" });
    }
  });

  // Get conversations for a specific entity
  app.get("/api/conversations/entity/:entityType/:entityId", async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const id = parseIdParam(entityId);
      if (!id) {
        return res.status(400).json({ message: "Invalid entity ID parameter." });
      }
      const conversations = await storage.getConversationsForEntity(entityType, id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch entity conversations" });
    }
  });

  app.get("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const conversation = await storage.getConversationWithDetails(id);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.post("/api/conversations", requireAuth, requirePermission("communications", "create"), async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.status(201).json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.put("/api/conversations/:id", requireAuth, requirePermission("communications", "update"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.updateConversation(id, validatedData);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  app.delete("/api/conversations/:id", requireAuth, requirePermission("communications", "delete"), async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      await storage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete conversation" });
    }
  });

  // Conversation links
  app.post("/api/conversations/:id/links", async (req, res) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertConversationLinkSchema.parse({ ...req.body, conversationId });
      const link = await storage.addConversationLink(validatedData);
      res.status(201).json(link);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add conversation link" });
    }
  });

  app.delete("/api/conversations/:id/links/:linkId", async (req, res) => {
    try {
      const linkId = parseIdParam(req.params.linkId);
      if (!linkId) {
        return res.status(400).json({ message: "Invalid link ID parameter." });
      }
      await storage.removeConversationLink(linkId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove conversation link" });
    }
  });

  // Communication comments
  app.get("/api/conversations/:id/comments", async (req, res) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const comments = await storage.getConversationComments(conversationId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/conversations/:id/comments", requireAuth, async (req, res) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertCommunicationCommentSchema.parse({ ...req.body, conversationId });
      const comment = await storage.addCommunicationComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.put("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const comment = await storage.updateCommunicationComment(id, req.body.content);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const id = parseIdParam(req.params.id);
      if (!id) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      await storage.deleteCommunicationComment(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Conversation participants
  app.post("/api/conversations/:id/participants", async (req, res) => {
    try {
      const conversationId = parseIdParam(req.params.id);
      if (!conversationId) {
        return res.status(400).json({ message: "Invalid ID parameter. Must be a positive integer." });
      }
      const validatedData = insertConversationParticipantSchema.parse({ ...req.body, conversationId });
      const participant = await storage.addConversationParticipant(validatedData);
      res.status(201).json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add participant" });
    }
  });

  app.delete("/api/conversations/:id/participants/:participantId", async (req, res) => {
    try {
      const participantId = parseIdParam(req.params.participantId);
      if (!participantId) {
        return res.status(400).json({ message: "Invalid participant ID parameter." });
      }
      await storage.removeConversationParticipant(participantId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove participant" });
    }
  });

  // Get conversations by entity
  app.get("/api/conversations/by-entity/:entityType/:entityId", async (req, res) => {
    try {
      const entityId = parseIdParam(req.params.entityId);
      if (!entityId) {
        return res.status(400).json({ message: "Invalid entity ID parameter." });
      }
      const conversations = await storage.getConversationsByEntity(req.params.entityType, entityId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations for entity" });
    }
  });

  // Communication timeline
  app.get("/api/communications/timeline", async (req, res) => {
    try {
      const { startDate, endDate, entityType, entityId } = req.query;
      const timeline = await storage.getCommunicationTimeline({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        entityType: entityType as string,
        entityId: entityId ? parseInt(entityId as string) : undefined
      });
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch communication timeline" });
    }
  });

  // Register Technical Process routes
  const { registerTechnicalProcessRoutes } = await import("./routes/technicalProcesses");
  registerTechnicalProcessRoutes(app);

  // Register Technical Process Diagrams routes
  const { technicalProcessDiagramsRouter } = await import("./routes/technicalProcessDiagrams");
  app.use("/api/technical-process-diagrams", technicalProcessDiagramsRouter);

  // Register Interface Builder routes
  const { interfaceBuilderRouter } = await import("./routes/interface-builder");
  app.use("/api/interface-builder", interfaceBuilderRouter);

  // Register Local Projects routes
  const { localProjectsRouter } = await import("./routes/local-projects");
  app.use("/api/local-projects", localProjectsRouter);

  // Register Internal Activities routes
  const { internalActivitiesRouter } = await import("./routes/internal-activities");
  app.use("/api/internal-activities", internalActivitiesRouter);

  // Register Business Process Sequences routes
  const { businessProcessSequencesRouter } = await import("./routes/business-process-sequences");
  app.use("/api/business-process-sequences", businessProcessSequencesRouter);

  // Register Interface Response Scenarios routes
  const { interfaceResponseScenariosRouter } = await import("./routes/interface-response-scenarios");
  app.use("/api/interface-response-scenarios", interfaceResponseScenariosRouter);

  // Register Decision Points routes
  const { decisionPointsRouter } = await import("./routes/decision-points");
  app.use("/api/decision-points", decisionPointsRouter);

  // Register Hierarchy Designs routes
  const { hierarchyDesignsRouter } = await import("./routes/hierarchyDesigns");
  app.use("/api/hierarchy-designs", hierarchyDesignsRouter);

  // Register Hierarchy Diagrams routes
  const { hierarchyDiagramsRouter } = await import("./routes/hierarchyDiagrams");
  app.use("/api/hierarchy-diagrams", hierarchyDiagramsRouter);

  // Register Project Migration routes
  const { migrateProjectsRouter } = await import("./routes/migrate-projects");
  app.use("/api/migrate-projects", migrateProjectsRouter);

  // Register RBAC routes
  const { registerRBACRoutes } = await import("./routes/rbac");
  registerRBACRoutes(app);

  // Register Bulk Operations routes
  const bulkOperationsRouter = await import("./routes/bulk-operations");
  app.use("/api/bulk", bulkOperationsRouter.default);

  // Register Capabilities routes
  const capabilitiesRouter = await import("./routes/capabilities");
  app.use("/api", capabilitiesRouter.default);
  
  // Register Simple Capabilities test routes
  const simpleCapabilitiesRouter = await import("./routes/capabilities-simple");
  app.use("/api/capabilities-test", simpleCapabilitiesRouter.default);

  // Register Initiatives routes (Version Control)
  const { initiativesRouter } = await import("./routes/initiatives");
  app.use("/api/initiatives", initiativesRouter);
  
  // Register Initiatives Changes routes
  // TODO: Fix initiatives-changes.ts - references non-existent tables
  // const initiativesChangesRouter = await import("./routes/initiatives-changes");
  // app.use("/api", initiativesChangesRouter.default);
  
  // Register Impact Assessment routes
  // Impact assessment routes
  const impactAssessmentRouter = await import("./routes/impact-assessment");
  app.use("/api", impactAssessmentRouter.default);

  // Register Version Control routes
  const { versionControlRouter } = await import("./routes/version-control");
  app.use("/api/version-control", versionControlRouter);
  
  // Register Internal Activities Version Control routes
  const internalActivitiesVersionControlRouter = await import("./routes/internal-activities-version-control");
  app.use("/api/version-control", internalActivitiesVersionControlRouter.default);
  
  // Register UML routes
  const { umlRouter } = await import("./routes/uml");
  app.use("/api/uml", umlRouter);
  
  // Register API Test routes
  const { apiTestRouter } = await import("./routes/api-test");
  app.use("/api/api-test", apiTestRouter);
  
  // Register Technical Processes Version Control routes
  const technicalProcessesVersionControlRouter = await import("./routes/technical-processes-version-control");
  app.use("/api/version-control", technicalProcessesVersionControlRouter.default);
  
  // Register Version Control Changes routes
  const versionControlChangesRouter = await import("./routes/version-control-changes");
  app.use("/api/version-control", versionControlChangesRouter.default);

  // Register Audit routes
  const { auditRouter } = await import("./routes/audit");
  app.use("/api/audit", auditRouter);

  const httpServer = createServer(app);
  return httpServer;
}
