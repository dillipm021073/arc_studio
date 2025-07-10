import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function recreateKenanSimple() {
  try {
    // Delete the old project first
    await db
      .delete(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"));
    
    // Create simpler nodes with better spacing
    const nodes = [
      // Title
      {
        id: "title",
        type: "text",
        position: { x: 500, y: 50 },
        data: {
          text: "Kenan Upgrade - Integration Scope",
          fontSize: 28,
          textColor: "#ff9966",
          fontWeight: "bold"
        }
      },
      // Central KENAN system
      {
        id: "kenan-system",
        type: "application",
        position: { x: 600, y: 400 },
        data: {
          id: "kenan-system",
          label: "KENAN",
          name: "KENAN Billing System",
          type: "Core System",
          status: "active",
          description: "Central billing system with CC, Catalog, OM, and Billing modules",
          connections: { input: ["FILE", "DB"], output: ["FILE", "DB"] }
        }
      },
      // Left side systems - properly spaced
      {
        id: "csp-ap",
        type: "application",
        position: { x: 100, y: 150 },
        data: {
          id: "csp-ap",
          label: "CSP AP",
          name: "CSP AP",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "csp-rs",
        type: "application",
        position: { x: 100, y: 250 },
        data: {
          id: "csp-rs",
          label: "CSP RS",
          name: "CSP RS",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "clarity",
        type: "application",
        position: { x: 100, y: 350 },
        data: {
          id: "clarity",
          label: "Clarity",
          name: "Clarity",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "fuse-api",
        type: "application",
        position: { x: 100, y: 450 },
        data: {
          id: "fuse-api",
          label: "FuSE API",
          name: "FuSE API",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "digital-service",
        type: "application",
        position: { x: 100, y: 550 },
        data: {
          id: "digital-service",
          label: "Digital Service Layer",
          name: "Digital Service Layer",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "partner-bridge",
        type: "application",
        position: { x: 100, y: 650 },
        data: {
          id: "partner-bridge",
          label: "Partner Service Bridge",
          name: "Partner Service Bridge",
          type: "External System",
          status: "active"
        }
      },
      // Right side systems
      {
        id: "epfs",
        type: "application",
        position: { x: 1100, y: 150 },
        data: {
          id: "epfs",
          label: "EPFS",
          name: "EPFS",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "sap-fi",
        type: "application",
        position: { x: 1100, y: 250 },
        data: {
          id: "sap-fi",
          label: "SAP FI",
          name: "SAP FI (AFR/Telcon)",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "cares",
        type: "application",
        position: { x: 1100, y: 350 },
        data: {
          id: "cares",
          label: "CARES",
          name: "CARES",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "uws",
        type: "application",
        position: { x: 1100, y: 450 },
        data: {
          id: "uws",
          label: "UWS",
          name: "UWS",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "engage1",
        type: "application",
        position: { x: 1100, y: 550 },
        data: {
          id: "engage1",
          label: "Engage1",
          name: "Engage1",
          type: "External System",
          status: "active"
        }
      },
      {
        id: "smeg-bills",
        type: "application",
        position: { x: 1100, y: 650 },
        data: {
          id: "smeg-bills",
          label: "SMEG Bills Info",
          name: "SMEG Bills Info",
          type: "External System",
          status: "active"
        }
      }
    ];
    
    // Create simple edges
    const edges = [
      // Left to KENAN
      {
        id: "edge-csp-ap-kenan",
        source: "csp-ap",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-csp-rs-kenan",
        source: "csp-rs",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-clarity-kenan",
        source: "clarity",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-fuse-kenan",
        source: "fuse-api",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "DB Integration"
      },
      {
        id: "edge-digital-kenan",
        source: "digital-service",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "DB Integration"
      },
      {
        id: "edge-partner-kenan",
        source: "partner-bridge",
        target: "kenan-system",
        type: "smoothstep",
        animated: true,
        label: "DB Integration"
      },
      // KENAN to Right
      {
        id: "edge-kenan-epfs",
        source: "kenan-system",
        target: "epfs",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-kenan-sap",
        source: "kenan-system",
        target: "sap-fi",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-kenan-cares",
        source: "kenan-system",
        target: "cares",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-kenan-uws",
        source: "kenan-system",
        target: "uws",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-kenan-engage1",
        source: "kenan-system",
        target: "engage1",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)"
      },
      {
        id: "edge-kenan-smeg",
        source: "kenan-system",
        target: "smeg-bills",
        type: "smoothstep",
        animated: true,
        label: "DB Integration"
      }
    ];
    
    // Create the project
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `kenan-simple-${Date.now()}`,
        name: "Kenan Upgrade - Integration Scope",
        description: "Simplified integration scope diagram for Kenan upgrade",
        category: "architecture",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        metadata: JSON.stringify({
          nodeCount: nodes.length,
          edgeCount: edges.length,
          complexity: "Medium"
        }),
        author: "admin",
        isTeamProject: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Successfully created simplified Kenan project");
    console.log("Project ID:", project.id);
    console.log("Nodes:", nodes.length);
    console.log("Edges:", edges.length);
    
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

recreateKenanSimple();