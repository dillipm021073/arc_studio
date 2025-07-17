import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  interfaceBuilderProjects, 
  interfaceBuilderFolders,
  applications, 
  interfaces,
  interfaceProviderConsumerLink 
} from "../../shared/schema";
import { requireAuth } from "../auth";
import { eq, and, or, inArray, sql } from "drizzle-orm";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Get all projects for the current user (including team projects)
router.get("/projects", async (req, res) => {
  try {
    const currentUser = req.user!.username;
    const { folderPath } = req.query;
    
    // Get all projects that are either:
    // 1. Created by the current user (personal projects)
    // 2. Team projects (visible to all users)
    let query = db
      .select()
      .from(interfaceBuilderProjects)
      .where(or(
        eq(interfaceBuilderProjects.author, currentUser),
        eq(interfaceBuilderProjects.isTeamProject, true)
      ));
    
    // Filter by folder path if provided and if folderPath column exists
    if (folderPath && typeof folderPath === 'string') {
      try {
        query = query.where(eq(interfaceBuilderProjects.folderPath, folderPath));
      } catch (columnError) {
        // If folderPath column doesn't exist, ignore the filter for now
        console.warn("folderPath column does not exist yet, ignoring folder filter");
      }
    }
    
    const projects = await query;
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    console.error("Error details:", error.message);
    
    // If it's a column error, return empty array for now
    if (error.message && error.message.includes('column "folder_path" does not exist')) {
      console.warn("Database schema not yet migrated, returning empty projects list");
      return res.json([]);
    }
    
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Get a specific project
router.get("/projects/:id", async (req, res) => {
  try {
    const projectId = req.params.id;
    const currentUser = req.user!.username;
    
    const [project] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.projectId, projectId));
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check permissions:
    // - Users can view their own projects
    // - Everyone can view team projects
    const canView = project.author === currentUser || project.isTeamProject;
    
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to view this project" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Create a new project
router.post("/projects", async (req, res) => {
  try {
    const currentUser = req.user!;
    const { name, description, category, nodes, edges, metadata, isTeamProject, folderPath } = req.body;
    
    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: "Project name is required" });
    }
    
    // Check if user has permission to create team projects
    // For now, allow all authenticated users to create team projects
    // TODO: Implement proper RBAC check using userRoles table
    if (isTeamProject && currentUser.role !== 'Manager' && currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'user') {
      return res.status(403).json({ error: "Only Managers and Admins can create team projects" });
    }
    
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `project-${Date.now()}`,
        name: name.trim(),
        description: description || null,
        category: category || "custom",
        folderPath: folderPath || "/",
        nodes: JSON.stringify(nodes || []),
        edges: JSON.stringify(edges || []),
        metadata: JSON.stringify(metadata || {}),
        author: currentUser.username,
        isTeamProject: isTeamProject || false
      })
      .returning();
    
    res.json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Update a project
router.put("/projects/:id", async (req, res) => {
  try {
    const currentUser = req.user!;
    const projectId = req.params.id;
    const { name, description, category, nodes, edges, metadata, isTeamProject, folderPath } = req.body;
    
    
    // First check if the project exists and get its current state
    const [existingProject] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.projectId, projectId));
    
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check permissions:
    // - Users can only update their own personal projects
    // - Managers/Admins can update team projects
    const canUpdate = existingProject.author === currentUser.username || 
                     (existingProject.isTeamProject && (currentUser.role === 'Manager' || currentUser.role === 'Admin' || currentUser.role === 'admin' || currentUser.role === 'user'));
    
    if (!canUpdate) {
      return res.status(403).json({ error: "You don't have permission to update this project" });
    }
    
    // Check if trying to change team project status
    if (isTeamProject !== undefined && isTeamProject !== existingProject.isTeamProject) {
      if (currentUser.role !== 'Manager' && currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'user') {
        return res.status(403).json({ error: "Only Managers and Admins can change team project status" });
      }
    }
    
    // Clean nodes and edges to remove circular references and unnecessary properties
    const cleanNodes = (nodes || []).map((node: any) => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      width: node.width,
      height: node.height,
      // Exclude properties that might cause circular references
      // like selected, dragging, positionAbsolute
    }));
    
    const cleanEdges = (edges || []).map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      animated: edge.animated,
      data: edge.data,
      style: edge.style,
      label: edge.label,
      labelStyle: edge.labelStyle,
      labelBgStyle: edge.labelBgStyle,
      labelBgPadding: edge.labelBgPadding,
      labelBgBorderRadius: edge.labelBgBorderRadius,
      markerEnd: edge.markerEnd,
      // Exclude any React Flow internal properties
    }));
    
    const updateData: any = {
      name,
      description,
      category: category || "custom",
      nodes: JSON.stringify(cleanNodes),
      edges: JSON.stringify(cleanEdges),
      metadata: JSON.stringify(metadata || {}),
      updatedAt: new Date()
    };
    
    // Include folderPath if provided
    if (folderPath !== undefined) {
      updateData.folderPath = folderPath;
    }
    
    
    // Only include isTeamProject if it's being changed
    if (isTeamProject !== undefined) {
      updateData.isTeamProject = isTeamProject;
    }
    
    const [project] = await db
      .update(interfaceBuilderProjects)
      .set(updateData)
      .where(eq(interfaceBuilderProjects.projectId, projectId))
      .returning();
    
    
    res.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a project
router.delete("/projects/:id", async (req, res) => {
  try {
    const currentUser = req.user!;
    const projectId = req.params.id;
    
    // First check if the project exists and get its current state
    const [existingProject] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.projectId, projectId));
    
    if (!existingProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check permissions:
    // - Users can only delete their own personal projects
    // - Managers/Admins can delete team projects
    const canDelete = existingProject.author === currentUser.username || 
                     (existingProject.isTeamProject && (currentUser.role === 'Manager' || currentUser.role === 'Admin'));
    
    if (!canDelete) {
      return res.status(403).json({ error: "You don't have permission to delete this project" });
    }
    
    const [deleted] = await db
      .delete(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.projectId, projectId))
      .returning();
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Schema for generate from LOB request
const generateFromLobSchema = z.object({
  lobs: z.array(z.string()).min(1),
  includeInactive: z.boolean().default(false),
  layout: z.enum(["hierarchical", "force", "grid"]).default("hierarchical"),
  groupBy: z.enum(["none", "team", "layer", "businessProcess"]).default("none")
});

// Generate diagram from LOB
router.post("/generate-from-lob", async (req, res) => {
  try {
    const validation = generateFromLobSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { lobs, includeInactive, layout, groupBy } = validation.data;

    // Fetch applications for selected LOBs
    const apps = includeInactive 
      ? await db
          .select()
          .from(applications)
          .where(inArray(applications.lob, lobs))
      : await db
          .select()
          .from(applications)
          .where(and(
            inArray(applications.lob, lobs),
            eq(applications.status, "active")
          ));

    // Fetch interfaces for selected LOBs with their provider and consumer apps
    const interfaceList = includeInactive
      ? await db
          .select()
          .from(interfaces)
          .where(inArray(interfaces.lob, lobs))
      : await db
          .select()
          .from(interfaces)
          .where(and(
            inArray(interfaces.lob, lobs),
            eq(interfaces.status, "active")
          ));

    // Create a map of applications by ID for quick lookup
    const appMap = new Map(apps.map(app => [app.id, app]));

    // Transform data to Interface Builder format
    const nodes: any[] = [];
    const edges: any[] = [];
    const nodePositions = new Map<number, { x: number; y: number }>();

    // Layout algorithm helper
    const calculatePosition = (index: number, total: number, layer: string) => {
      const layerY = {
        presentation: 100,
        application: 300,
        data: 500,
        integration: 700,
        default: 400
      };

      const spacing = 250;
      const startX = -(total - 1) * spacing / 2;

      return {
        x: startX + index * spacing,
        y: layerY[layer] || layerY.default
      };
    };

    // Group applications by layer if needed
    const appsByLayer = new Map<string, any[]>();
    apps.forEach(app => {
      const layer = app.layer || "default";
      if (!appsByLayer.has(layer)) {
        appsByLayer.set(layer, []);
      }
      appsByLayer.get(layer)!.push(app);
    });

    // Create nodes for applications
    let nodeIndex = 0;
    appsByLayer.forEach((layerApps, layer) => {
      layerApps.forEach((app, index) => {
        const position = app.xPosition && app.yPosition 
          ? { x: parseFloat(app.xPosition), y: parseFloat(app.yPosition) }
          : calculatePosition(index, layerApps.length, layer);

        const node = {
          id: `app-${app.id}`,
          type: "application",
          position,
          data: {
            id: `app-${app.id}`,
            type: "application",
            category: "Backend",
            name: app.name,
            description: app.description || "Application generated from AML data",
            color: "bg-blue-600",
            properties: {
              runtime: app.deployment === "cloud" ? "Cloud Native" : "On-Premise",
              framework: "Generated",
              deployment: app.deployment,
              scaling: "Horizontal"
            },
            connectionPoints: {
              input: [
                { id: "http-requests", type: "http", position: "left" },
                { id: "messages", type: "message", position: "top" }
              ],
              output: [
                { id: "http-responses", type: "http", position: "right" },
                { id: "database", type: "sql", position: "bottom" }
              ]
            },
            label: app.name,
            amlNumber: app.amlNumber,
            status: app.status,
            deployment: app.deployment,
            criticality: app.criticality,
            team: app.team,
            lob: app.lob,
            providesInterface: app.providesExtInterface,
            consumesInterface: app.consumesExtInterfaces,
            isConfigured: true
          }
        };

        nodes.push(node);
        nodePositions.set(app.id, position);
        nodeIndex++;
      });
    });

    // Create edges for interfaces
    interfaceList.forEach((iface, index) => {
      if (iface.providerApplicationId && iface.consumerApplicationId) {
        // Only create edge if both provider and consumer are in our selected apps
        if (appMap.has(iface.providerApplicationId) && appMap.has(iface.consumerApplicationId)) {
        const edge = {
          id: `iface-${iface.id}`,
          source: `app-${iface.providerApplicationId}`,
          target: `app-${iface.consumerApplicationId}`,
          type: "default",
          animated: iface.frequency === "real-time",
          data: {
            label: iface.imlNumber,
            interfaceType: iface.interfaceType,
            middleware: iface.middleware,
            dataFlow: iface.dataFlow || "provider_to_consumer",
            protocol: iface.protocol,
            frequency: iface.frequency,
            dataVolume: iface.dataVolume,
            status: iface.status
          },
          style: {
            stroke: iface.status === "active" ? "#10b981" : "#6b7280",
            strokeWidth: iface.dataVolume === "very-high" ? 3 : iface.dataVolume === "high" ? 2 : 1
          }
        };

        edges.push(edge);
        }
      }
    });

    // Apply force-directed layout if requested
    if (layout === "force") {
      // Simple force-directed layout simulation
      const iterations = 50;
      const k = 100; // Optimal distance between nodes
      
      for (let iter = 0; iter < iterations; iter++) {
        // Repulsive forces between all nodes
        nodes.forEach((node1, i) => {
          nodes.forEach((node2, j) => {
            if (i !== j) {
              const dx = node1.position.x - node2.position.x;
              const dy = node1.position.y - node2.position.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0) {
                const force = k * k / dist;
                node1.position.x += dx / dist * force * 0.01;
                node1.position.y += dy / dist * force * 0.01;
              }
            }
          });
        });

        // Attractive forces along edges
        edges.forEach(edge => {
          const source = nodes.find(n => n.id === edge.source);
          const target = nodes.find(n => n.id === edge.target);
          if (source && target) {
            const dx = target.position.x - source.position.x;
            const dy = target.position.y - source.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              const force = dist * dist / k;
              const fx = dx / dist * force * 0.01;
              const fy = dy / dist * force * 0.01;
              source.position.x += fx;
              source.position.y += fy;
              target.position.x -= fx;
              target.position.y -= fy;
            }
          }
        });
      }
    }

    const projectData = {
      nodes,
      edges,
      metadata: {
        generatedFrom: "LOB",
        lobs,
        generatedAt: new Date().toISOString(),
        layout,
        groupBy,
        includeInactive
      }
    };

    res.json(projectData);
  } catch (error) {
    console.error("Error generating diagram from LOB:", error);
    res.status(500).json({ error: "Failed to generate diagram" });
  }
});

// Get available LOBs
router.get("/lobs", async (req, res) => {
  try {
    // Get unique LOBs from both applications and interfaces
    const appLobs = await db
      .selectDistinct({ lob: applications.lob })
      .from(applications)
      .where(sql`${applications.lob} IS NOT NULL`);

    const interfaceLobs = await db
      .selectDistinct({ lob: interfaces.lob })
      .from(interfaces)
      .where(sql`${interfaces.lob} IS NOT NULL`);

    // Combine and deduplicate
    const allLobs = new Set([
      ...appLobs.map(a => a.lob),
      ...interfaceLobs.map(i => i.lob)
    ]);

    const lobList = Array.from(allLobs).filter(Boolean).sort();

    res.json(lobList);
  } catch (error) {
    console.error("Error fetching LOBs:", error);
    res.status(500).json({ error: "Failed to fetch LOBs" });
  }
});

// Export project with full data
router.get("/projects/:id/export", async (req, res) => {
  try {
    const projectId = req.params.id;
    const currentUser = req.user!.username;
    
    // Get the project
    const [project] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.projectId, projectId));
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Check permissions
    const canView = project.author === currentUser || project.isTeamProject;
    if (!canView) {
      return res.status(403).json({ error: "You don't have permission to export this project" });
    }
    
    // Parse nodes and edges
    const nodes = JSON.parse(project.nodes);
    const edges = JSON.parse(project.edges);
    
    // Extract referenced entity IDs from nodes
    const applicationIds = new Set<number>();
    const interfaceIds = new Set<number>();
    const businessProcessIds = new Set<number>();
    const internalActivityIds = new Set<number>();
    
    // Extract IDs from nodes based on their data
    nodes.forEach((node: any) => {
      if (node.type === 'application' && node.data) {
        // Check various possible ID fields
        if (node.data.applicationId) {
          applicationIds.add(parseInt(node.data.applicationId));
        }
        // Also check if the node ID contains app reference
        if (node.id && node.id.startsWith('app-')) {
          const appId = parseInt(node.id.replace('app-', ''));
          if (!isNaN(appId)) {
            applicationIds.add(appId);
          }
        }
      } else if (node.type === 'interface' && node.data) {
        if (node.data.interfaceId) {
          interfaceIds.add(parseInt(node.data.interfaceId));
        }
        // Check node ID for interface reference
        if (node.id && node.id.startsWith('iface-')) {
          const ifaceId = parseInt(node.id.replace('iface-', ''));
          if (!isNaN(ifaceId)) {
            interfaceIds.add(ifaceId);
          }
        }
      } else if (node.type === 'process' && node.data?.processId) {
        businessProcessIds.add(parseInt(node.data.processId));
      } else if (node.type === 'internalActivity' && node.data?.activityId) {
        internalActivityIds.add(parseInt(node.data.activityId));
      }
    });
    
    // Also extract interface IDs from edges
    edges.forEach((edge: any) => {
      if (edge.id && edge.id.startsWith('iface-')) {
        const ifaceId = parseInt(edge.id.replace('iface-', ''));
        if (!isNaN(ifaceId)) {
          interfaceIds.add(ifaceId);
        }
      }
    });
    
    // Fetch referenced data
    const referencedData: any = {
      applications: [],
      interfaces: [],
      businessProcesses: [],
      internalActivities: []
    };
    
    if (applicationIds.size > 0) {
      referencedData.applications = await db
        .select()
        .from(applications)
        .where(inArray(applications.id, Array.from(applicationIds)));
    }
    
    if (interfaceIds.size > 0) {
      referencedData.interfaces = await db
        .select()
        .from(interfaces)
        .where(inArray(interfaces.id, Array.from(interfaceIds)));
      
      // Also get provider/consumer application IDs from interfaces
      referencedData.interfaces.forEach((iface: any) => {
        if (iface.providerApplicationId) applicationIds.add(iface.providerApplicationId);
        if (iface.consumerApplicationId) applicationIds.add(iface.consumerApplicationId);
      });
      
      // Fetch additional applications if needed
      if (applicationIds.size > referencedData.applications.length) {
        referencedData.applications = await db
          .select()
          .from(applications)
          .where(inArray(applications.id, Array.from(applicationIds)));
      }
    }
    
    // Import dependencies
    const { businessProcesses, internalActivities } = await import("@shared/schema");
    
    if (businessProcessIds.size > 0) {
      referencedData.businessProcesses = await db
        .select()
        .from(businessProcesses)
        .where(inArray(businessProcesses.id, Array.from(businessProcessIds)));
    }
    
    if (internalActivityIds.size > 0) {
      referencedData.internalActivities = await db
        .select()
        .from(internalActivities)
        .where(inArray(internalActivities.id, Array.from(internalActivityIds)));
    }
    
    // Create export data
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      exportedBy: currentUser,
      project: {
        name: project.name,
        description: project.description,
        category: project.category,
        nodes: nodes,
        edges: edges,
        metadata: JSON.parse(project.metadata || '{}'),
        version: project.version,
        folderPath: project.folderPath
      },
      referencedData,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        applicationCount: referencedData.applications.length,
        interfaceCount: referencedData.interfaces.length,
        businessProcessCount: referencedData.businessProcesses.length,
        internalActivityCount: referencedData.internalActivities.length,
        exportSource: "StudioArchitect",
        exportVersion: "1.0.0"
      }
    };
    
    // Set response headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_export_${Date.now()}.json"`);
    
    res.json(exportData);
  } catch (error) {
    console.error("Error exporting project:", error);
    res.status(500).json({ error: "Failed to export project" });
  }
});

// Import project with ID mapping
router.post("/projects/import", async (req, res) => {
  try {
    const currentUser = req.user!;
    const importData = req.body;
    
    // Validate import data
    if (!importData || !importData.project || !importData.version) {
      return res.status(400).json({ error: "Invalid import data format" });
    }
    
    if (importData.version !== "1.0") {
      return res.status(400).json({ error: "Unsupported export version" });
    }
    
    const { project, referencedData } = importData;
    
    // Create ID mapping tables
    const idMappings = {
      applications: new Map<number, number>(),
      interfaces: new Map<number, number>(),
      businessProcesses: new Map<number, number>(),
      internalActivities: new Map<number, number>()
    };
    
    // Import referenced data (if requested)
    const importReferenced = req.query.importReferenced === 'true';
    
    if (importReferenced && referencedData) {
      // Import applications
      if (referencedData.applications) {
        for (const app of referencedData.applications) {
          // Check if application with same AML number exists
          const [existing] = await db
            .select()
            .from(applications)
            .where(eq(applications.amlNumber, app.amlNumber));
          
          if (existing) {
            idMappings.applications.set(app.id, existing.id);
          } else {
            // Create new application
            const { id, createdAt, updatedAt, ...appData } = app;
            const [newApp] = await db
              .insert(applications)
              .values({
                ...appData,
                amlNumber: `${app.amlNumber}_imported_${Date.now()}`
              })
              .returning();
            idMappings.applications.set(app.id, newApp.id);
          }
        }
      }
      
      // Import interfaces
      if (referencedData.interfaces) {
        for (const iface of referencedData.interfaces) {
          // Check if interface with same IML number exists
          const [existing] = await db
            .select()
            .from(interfaces)
            .where(eq(interfaces.imlNumber, iface.imlNumber));
          
          if (existing) {
            idMappings.interfaces.set(iface.id, existing.id);
          } else {
            // Create new interface with mapped IDs
            const { id, createdAt, updatedAt, ...ifaceData } = iface;
            const [newIface] = await db
              .insert(interfaces)
              .values({
                ...ifaceData,
                imlNumber: `${iface.imlNumber}_imported_${Date.now()}`,
                providerApplicationId: ifaceData.providerApplicationId ? 
                  idMappings.applications.get(ifaceData.providerApplicationId) || null : null,
                consumerApplicationId: ifaceData.consumerApplicationId ? 
                  idMappings.applications.get(ifaceData.consumerApplicationId) || null : null
              })
              .returning();
            idMappings.interfaces.set(iface.id, newIface.id);
          }
        }
      }
      
      // Import business processes
      if (referencedData.businessProcesses) {
        const { businessProcesses } = await import("@shared/schema");
        for (const bp of referencedData.businessProcesses) {
          const { id, createdAt, updatedAt, ...bpData } = bp;
          const [newBP] = await db
            .insert(businessProcesses)
            .values(bpData)
            .returning();
          idMappings.businessProcesses.set(bp.id, newBP.id);
        }
      }
      
      // Import internal activities
      if (referencedData.internalActivities) {
        const { internalActivities } = await import("@shared/schema");
        for (const activity of referencedData.internalActivities) {
          const { id, createdAt, updatedAt, ...activityData } = activity;
          const [newActivity] = await db
            .insert(internalActivities)
            .values({
              ...activityData,
              applicationId: activityData.applicationId ? 
                idMappings.applications.get(activityData.applicationId) || activityData.applicationId : activityData.applicationId
            })
            .returning();
          idMappings.internalActivities.set(activity.id, newActivity.id);
        }
      }
    }
    
    // Update nodes with new IDs
    const updatedNodes = project.nodes.map((node: any) => {
      const newNode = { ...node };
      
      // Update node IDs
      if (node.id && node.id.startsWith('app-')) {
        const oldId = parseInt(node.id.replace('app-', ''));
        const newId = idMappings.applications.get(oldId);
        if (newId) {
          newNode.id = `app-${newId}`;
        }
      } else if (node.id && node.id.startsWith('iface-')) {
        const oldId = parseInt(node.id.replace('iface-', ''));
        const newId = idMappings.interfaces.get(oldId);
        if (newId) {
          newNode.id = `iface-${newId}`;
        }
      }
      
      // Update data IDs
      if (node.type === 'application' && node.data?.applicationId) {
        const newId = idMappings.applications.get(node.data.applicationId);
        if (newId) {
          newNode.data = { ...node.data, applicationId: newId };
        }
      } else if (node.type === 'interface' && node.data?.interfaceId) {
        const newId = idMappings.interfaces.get(node.data.interfaceId);
        if (newId) {
          newNode.data = { ...node.data, interfaceId: newId };
        }
      } else if (node.type === 'process' && node.data?.processId) {
        const newId = idMappings.businessProcesses.get(node.data.processId);
        if (newId) {
          newNode.data = { ...node.data, processId: newId };
        }
      } else if (node.type === 'internalActivity' && node.data?.activityId) {
        const newId = idMappings.internalActivities.get(node.data.activityId);
        if (newId) {
          newNode.data = { ...node.data, activityId: newId };
        }
      }
      
      return newNode;
    });
    
    // Update edges with new node IDs
    const updatedEdges = project.edges.map((edge: any) => {
      const newEdge = { ...edge };
      
      // Update edge ID if it references an interface
      if (edge.id && edge.id.startsWith('iface-')) {
        const oldId = parseInt(edge.id.replace('iface-', ''));
        const newId = idMappings.interfaces.get(oldId);
        if (newId) {
          newEdge.id = `iface-${newId}`;
        }
      }
      
      // Update source and target if they reference mapped nodes
      if (edge.source && edge.source.startsWith('app-')) {
        const oldId = parseInt(edge.source.replace('app-', ''));
        const newId = idMappings.applications.get(oldId);
        if (newId) {
          newEdge.source = `app-${newId}`;
        }
      }
      
      if (edge.target && edge.target.startsWith('app-')) {
        const oldId = parseInt(edge.target.replace('app-', ''));
        const newId = idMappings.applications.get(oldId);
        if (newId) {
          newEdge.target = `app-${newId}`;
        }
      }
      
      return newEdge;
    });
    
    // Create the imported project
    const [importedProject] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `imported-${Date.now()}`,
        name: `${project.name} (Imported)`,
        description: project.description || `Imported on ${new Date().toLocaleDateString()}`,
        category: project.category || "imported",
        folderPath: project.folderPath || "/imported",
        nodes: JSON.stringify(updatedNodes),
        edges: JSON.stringify(updatedEdges),
        metadata: JSON.stringify({
          ...project.metadata,
          importedFrom: importData.exportedBy,
          importedDate: new Date().toISOString(),
          originalExportDate: importData.exportDate
        }),
        author: currentUser.username,
        isTeamProject: false
      })
      .returning();
    
    res.json({
      success: true,
      project: importedProject,
      importSummary: {
        mappedApplications: idMappings.applications.size,
        mappedInterfaces: idMappings.interfaces.size,
        mappedBusinessProcesses: idMappings.businessProcesses.size,
        mappedInternalActivities: idMappings.internalActivities.size,
        totalNodes: updatedNodes.length,
        totalEdges: updatedEdges.length
      }
    });
  } catch (error) {
    console.error("Error importing project:", error);
    res.status(500).json({ error: "Failed to import project" });
  }
});

// Create a new folder
router.post("/folders", async (req, res) => {
  try {
    const currentUser = req.user!;
    const { path, name, parentPath, isTeamFolder } = req.body;
    
    // Check permissions for team folders
    if (isTeamFolder && currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'Manager') {
      return res.status(403).json({ error: "Only Managers and Admins can create team folders" });
    }
    
    // Check if folder already exists
    const [existing] = await db
      .select()
      .from(interfaceBuilderFolders)
      .where(eq(interfaceBuilderFolders.path, path));
    
    if (existing) {
      return res.status(409).json({ error: "Folder already exists" });
    }
    
    // Create the folder
    const [folder] = await db
      .insert(interfaceBuilderFolders)
      .values({
        path,
        name,
        parentPath: parentPath || null,
        createdBy: currentUser.username,
        isTeamFolder: isTeamFolder || false
      })
      .returning();
    
    res.json(folder);
  } catch (error) {
    console.error("Error creating folder:", error);
    
    // If the table doesn't exist yet, return a helpful error
    if (error.message && error.message.includes('relation "interface_builder_folders" does not exist')) {
      return res.status(503).json({ 
        error: "Database schema not yet migrated. Please run the migration script to enable folder functionality." 
      });
    }
    
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// Get folder structure
router.get("/folders", async (req, res) => {
  try {
    const currentUser = req.user!.username;
    
    // Get all folders that are either:
    // 1. Created by the current user
    // 2. Team folders (visible to all users)
    const folders = await db
      .select()
      .from(interfaceBuilderFolders)
      .where(or(
        eq(interfaceBuilderFolders.createdBy, currentUser),
        eq(interfaceBuilderFolders.isTeamFolder, true)
      ));
    
    // Return just the paths in sorted order
    const folderPaths = folders.map(f => f.path).sort();
    
    res.json(folderPaths);
  } catch (error) {
    console.error("Error fetching folders:", error);
    
    // If the table doesn't exist yet, return empty array
    if (error.message && error.message.includes('relation "interface_builder_folders" does not exist')) {
      console.warn("Database schema not yet migrated, returning empty folders list");
      return res.json([]);
    }
    
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// Get folder impact (what will be deleted)
router.get("/folders/:folderPath/impact", async (req, res) => {
  try {
    const currentUser = req.user!;
    const folderPath = decodeURIComponent(req.params.folderPath);
    
    // Check permissions
    if (currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'Manager') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Get all projects in this folder and subfolders
    const projects = await db
      .select({
        id: interfaceBuilderProjects.id,
        name: interfaceBuilderProjects.name,
        category: interfaceBuilderProjects.category,
        folderPath: interfaceBuilderProjects.folderPath
      })
      .from(interfaceBuilderProjects)
      .where(or(
        eq(interfaceBuilderProjects.folderPath, folderPath),
        sql`${interfaceBuilderProjects.folderPath} LIKE ${folderPath + '/%'}`
      ));
    
    // Extract subfolders
    const subfolders = new Set<string>();
    projects.forEach(p => {
      if (p.folderPath && p.folderPath !== folderPath && p.folderPath.startsWith(folderPath)) {
        // Get the relative path and extract immediate subfolders
        const relativePath = p.folderPath.substring(folderPath.length);
        const parts = relativePath.split('/').filter(Boolean);
        if (parts.length > 0) {
          let subfolder = folderPath;
          for (const part of parts) {
            subfolder += '/' + part;
            subfolders.add(subfolder);
          }
        }
      }
    });
    
    res.json({
      projects: projects.filter(p => p.folderPath === folderPath),
      subfolders: Array.from(subfolders).sort()
    });
  } catch (error) {
    console.error("Error getting folder impact:", error);
    res.status(500).json({ error: "Failed to get folder impact" });
  }
});

// Rename folder
router.put("/folders/:folderPath/rename", async (req, res) => {
  try {
    const currentUser = req.user!;
    const oldPath = decodeURIComponent(req.params.folderPath);
    const { newName } = req.body;
    
    // Check permissions
    if (currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'Manager') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    if (!newName || typeof newName !== 'string' || newName.includes('/')) {
      return res.status(400).json({ error: "Invalid folder name" });
    }
    
    // Get the folder
    const [folder] = await db
      .select()
      .from(interfaceBuilderFolders)
      .where(eq(interfaceBuilderFolders.path, oldPath));
    
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    
    // Check ownership for non-team folders
    if (!folder.isTeamFolder && folder.createdBy !== currentUser.username && 
        currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
      return res.status(403).json({ error: "You can only rename your own folders" });
    }
    
    // Calculate new path
    const pathParts = oldPath.split('/').filter(Boolean);
    pathParts[pathParts.length - 1] = newName;
    const newPath = '/' + pathParts.join('/');
    
    // Update folder and all subfolders and projects in a transaction
    await db.transaction(async (tx) => {
      // Update the folder itself
      await tx
        .update(interfaceBuilderFolders)
        .set({ 
          path: newPath, 
          name: newName,
          updatedAt: new Date()
        })
        .where(eq(interfaceBuilderFolders.path, oldPath));
      
      // Update all subfolders
      const subfolders = await tx
        .select()
        .from(interfaceBuilderFolders)
        .where(sql`${interfaceBuilderFolders.path} LIKE ${oldPath + '/%'}`);
      
      for (const subfolder of subfolders) {
        const updatedPath = subfolder.path.replace(oldPath, newPath);
        const updatedParentPath = subfolder.parentPath?.replace(oldPath, newPath) || null;
        await tx
          .update(interfaceBuilderFolders)
          .set({ 
            path: updatedPath,
            parentPath: updatedParentPath,
            updatedAt: new Date()
          })
          .where(eq(interfaceBuilderFolders.id, subfolder.id));
      }
      
      // Update projects in this folder
      await tx
        .update(interfaceBuilderProjects)
        .set({ folderPath: newPath })
        .where(eq(interfaceBuilderProjects.folderPath, oldPath));
      
      // Update projects in subfolders
      const projects = await tx
        .select()
        .from(interfaceBuilderProjects)
        .where(sql`${interfaceBuilderProjects.folderPath} LIKE ${oldPath + '/%'}`);
      
      for (const project of projects) {
        const updatedPath = project.folderPath!.replace(oldPath, newPath);
        await tx
          .update(interfaceBuilderProjects)
          .set({ folderPath: updatedPath })
          .where(eq(interfaceBuilderProjects.id, project.id));
      }
    });
    
    res.json({ success: true, newPath });
  } catch (error) {
    console.error("Error renaming folder:", error);
    res.status(500).json({ error: "Failed to rename folder" });
  }
});

// Delete folder
router.delete("/folders/:folderPath", async (req, res) => {
  try {
    const currentUser = req.user!;
    const folderPath = decodeURIComponent(req.params.folderPath);
    
    // Check permissions
    if (currentUser.role !== 'Admin' && currentUser.role !== 'admin' && currentUser.role !== 'Manager') {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    // Get the folder
    const [folder] = await db
      .select()
      .from(interfaceBuilderFolders)
      .where(eq(interfaceBuilderFolders.path, folderPath));
    
    if (!folder) {
      return res.status(404).json({ error: "Folder not found" });
    }
    
    // Check ownership for non-team folders
    if (!folder.isTeamFolder && folder.createdBy !== currentUser.username && 
        currentUser.role !== 'Admin' && currentUser.role !== 'admin') {
      return res.status(403).json({ error: "You can only delete your own folders" });
    }
    
    // Delete folder, subfolders, and all projects in a transaction
    await db.transaction(async (tx) => {
      // Delete all projects in this folder and subfolders
      await tx
        .delete(interfaceBuilderProjects)
        .where(or(
          eq(interfaceBuilderProjects.folderPath, folderPath),
          sql`${interfaceBuilderProjects.folderPath} LIKE ${folderPath + '/%'}`
        ));
      
      // Delete all subfolders
      await tx
        .delete(interfaceBuilderFolders)
        .where(sql`${interfaceBuilderFolders.path} LIKE ${folderPath + '/%'}`);
      
      // Delete the folder itself
      await tx
        .delete(interfaceBuilderFolders)
        .where(eq(interfaceBuilderFolders.path, folderPath));
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ error: "Failed to delete folder" });
  }
});

export { router as interfaceBuilderRouter };