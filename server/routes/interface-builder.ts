import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { 
  interfaceBuilderProjects, 
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
    
    // Get all projects that are either:
    // 1. Created by the current user (personal projects)
    // 2. Team projects (visible to all users)
    const projects = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(or(
        eq(interfaceBuilderProjects.author, currentUser),
        eq(interfaceBuilderProjects.isTeamProject, true)
      ));
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    console.error("Error details:", error.message);
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
    const { name, description, category, nodes, edges, metadata, isTeamProject } = req.body;
    
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
    const { name, description, category, nodes, edges, metadata, isTeamProject } = req.body;
    
    
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

export { router as interfaceBuilderRouter };