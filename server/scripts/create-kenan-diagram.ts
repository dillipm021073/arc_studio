import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";

async function createKenanUpgradeProject() {
  // Define the nodes for the diagram
  const nodes = [
    // Central KENAN box
    {
      id: "kenan-central",
      type: "rectangle",
      position: { x: 400, y: 300 },
      data: {
        label: "KENAN",
        text: "KENAN",
        width: 300,
        height: 400,
        fillColor: "#ff9966",
        strokeColor: "#ffffff",
        strokeWidth: 2,
        textColor: "#ffffff",
        fontSize: 24,
        textAlign: "center"
      }
    },
    // Inner components within KENAN
    {
      id: "kenan-cc",
      type: "rectangle",
      position: { x: 450, y: 350 },
      data: {
        label: "KENAN CC",
        text: "KENAN CC",
        width: 200,
        height: 50,
        fillColor: "#66cc66",
        strokeColor: "#ffffff",
        strokeWidth: 1,
        textColor: "#ffffff",
        fontSize: 14,
        textAlign: "center"
      }
    },
    {
      id: "kenan-catalog",
      type: "rectangle",
      position: { x: 450, y: 420 },
      data: {
        label: "KENAN CATALOG",
        text: "KENAN CATALOG",
        width: 200,
        height: 50,
        fillColor: "#66cc66",
        strokeColor: "#ffffff",
        strokeWidth: 1,
        textColor: "#ffffff",
        fontSize: 14,
        textAlign: "center"
      }
    },
    {
      id: "kenan-om",
      type: "rectangle",
      position: { x: 450, y: 490 },
      data: {
        label: "KENAN OM",
        text: "KENAN OM",
        width: 200,
        height: 50,
        fillColor: "#66cc66",
        strokeColor: "#ffffff",
        strokeWidth: 1,
        textColor: "#ffffff",
        fontSize: 14,
        textAlign: "center"
      }
    },
    {
      id: "kenan-billing",
      type: "rectangle",
      position: { x: 450, y: 560 },
      data: {
        label: "KENAN BILLING",
        text: "KENAN BILLING",
        width: 200,
        height: 50,
        fillColor: "#66cc66",
        strokeColor: "#ffffff",
        strokeWidth: 1,
        textColor: "#ffffff",
        fontSize: 14,
        textAlign: "center"
      }
    },
    // Left side systems
    {
      id: "csp-ap",
      type: "application",
      position: { x: 50, y: 100 },
      data: {
        id: "csp-ap",
        label: "CSP AP",
        name: "CSP AP",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["API"] }
      }
    },
    {
      id: "csp-rs",
      type: "application",
      position: { x: 50, y: 180 },
      data: {
        id: "csp-rs",
        label: "CSP RS",
        name: "CSP RS",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["API"] }
      }
    },
    {
      id: "clarity",
      type: "application",
      position: { x: 50, y: 260 },
      data: {
        id: "clarity",
        label: "Clarity",
        name: "Clarity",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["API"] }
      }
    },
    {
      id: "fuse-api",
      type: "application",
      position: { x: 50, y: 340 },
      data: {
        id: "fuse-api",
        label: "FuSE API",
        name: "FuSE API",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    {
      id: "digital-service",
      type: "application",
      position: { x: 50, y: 420 },
      data: {
        id: "digital-service",
        label: "Digital Service Layer",
        name: "Digital Service Layer",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    {
      id: "partner-bridge",
      type: "application",
      position: { x: 50, y: 500 },
      data: {
        id: "partner-bridge",
        label: "Partner Service Bridge",
        name: "Partner Service Bridge",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    {
      id: "pldt-bridge",
      type: "application",
      position: { x: 50, y: 580 },
      data: {
        id: "pldt-bridge",
        label: "PLDT Service Bridge",
        name: "PLDT Service Bridge",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    {
      id: "home-rewards",
      type: "application",
      position: { x: 50, y: 660 },
      data: {
        id: "home-rewards",
        label: "Home Rewards",
        name: "Home Rewards",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    {
      id: "relay-bridge",
      type: "application",
      position: { x: 50, y: 740 },
      data: {
        id: "relay-bridge",
        label: "Relay Bridge 500",
        name: "Relay Bridge 500",
        type: "External System",
        status: "active",
        connections: { input: [], output: ["DB Integration"] }
      }
    },
    // Right side systems
    {
      id: "epfs",
      type: "application",
      position: { x: 850, y: 100 },
      data: {
        id: "epfs",
        label: "EPFS",
        name: "EPFS",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "inld-emm",
      type: "application",
      position: { x: 850, y: 180 },
      data: {
        id: "inld-emm",
        label: "INLD/EMM",
        name: "INLD/EMM",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "sap-fi",
      type: "application",
      position: { x: 850, y: 260 },
      data: {
        id: "sap-fi",
        label: "SAP FI (AFR/Telcon)",
        name: "SAP FI (AFR/Telcon)",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "aia",
      type: "application",
      position: { x: 850, y: 340 },
      data: {
        id: "aia",
        label: "AIA",
        name: "AIA",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "cares",
      type: "application",
      position: { x: 850, y: 420 },
      data: {
        id: "cares",
        label: "CARES",
        name: "CARES",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "mvpr",
      type: "application",
      position: { x: 850, y: 500 },
      data: {
        id: "mvpr",
        label: "MVPR",
        name: "MVPR",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "uws",
      type: "application",
      position: { x: 850, y: 580 },
      data: {
        id: "uws",
        label: "UWS",
        name: "UWS",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "engage1",
      type: "application",
      position: { x: 850, y: 660 },
      data: {
        id: "engage1",
        label: "Engage1",
        name: "Engage1",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "ivrs",
      type: "application",
      position: { x: 850, y: 740 },
      data: {
        id: "ivrs",
        label: "IVRS",
        name: "IVRS",
        type: "External System",
        status: "active",
        connections: { input: ["FILE"], output: [] }
      }
    },
    {
      id: "easy",
      type: "application",
      position: { x: 850, y: 820 },
      data: {
        id: "easy",
        label: "Easy",
        name: "Easy",
        type: "External System",
        status: "active",
        connections: { input: ["DB Integration"], output: [] }
      }
    },
    {
      id: "smeg-bills",
      type: "application",
      position: { x: 850, y: 900 },
      data: {
        id: "smeg-bills",
        label: "SMEG Bills Info",
        name: "SMEG Bills Info",
        type: "External System",
        status: "active",
        connections: { input: ["DB Integration"], output: [] }
      }
    },
    // Title and notes
    {
      id: "title",
      type: "text",
      position: { x: 50, y: 20 },
      data: {
        text: "Kenan Upgrade - Integration Scope",
        fontSize: 28,
        textColor: "#ff9966",
        bold: true
      }
    },
    {
      id: "notes",
      type: "text",
      position: { x: 900, y: 200 },
      data: {
        text: "Newly added integrations\nto be considered:\n\n1. UCPM\n2. Transunion (existing not listed)\n3. CVM\n4. OneInvoice ??\n5. Cloud Migration (Ph1 & Ph2)\n6. OSS",
        fontSize: 14,
        textColor: "#ffffff",
        textAlign: "left"
      }
    }
  ];

  // Define the edges
  const edges = [
    // Left side connections to KENAN
    {
      id: "csp-ap-kenan",
      source: "csp-ap",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "csp-rs-kenan",
      source: "csp-rs",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "clarity-kenan",
      source: "clarity",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "fuse-kenan",
      source: "fuse-api",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "digital-kenan",
      source: "digital-service",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "partner-kenan",
      source: "partner-bridge",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "pldt-kenan",
      source: "pldt-bridge",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "home-kenan",
      source: "home-rewards",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "relay-kenan",
      source: "relay-bridge",
      target: "kenan-central",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    // Right side connections from KENAN
    {
      id: "kenan-epfs",
      source: "kenan-central",
      target: "epfs",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-inld",
      source: "kenan-central",
      target: "inld-emm",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-sap",
      source: "kenan-central",
      target: "sap-fi",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-aia",
      source: "kenan-central",
      target: "aia",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-cares",
      source: "kenan-central",
      target: "cares",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-mvpr",
      source: "kenan-central",
      target: "mvpr",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-uws",
      source: "kenan-central",
      target: "uws",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-engage1",
      source: "kenan-central",
      target: "engage1",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-ivrs",
      source: "kenan-central",
      target: "ivrs",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "FILE(FTP/SFTP)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-easy",
      source: "kenan-central",
      target: "easy",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    },
    {
      id: "kenan-smeg",
      source: "kenan-central",
      target: "smeg-bills",
      sourceHandle: "right-source",
      targetHandle: "left-target",
      type: "smoothstep",
      animated: true,
      label: "DB (DB Integration)",
      style: { stroke: "#66ff66", strokeWidth: 2 }
    }
  ];

  try {
    // Create the project
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `kenan-upgrade-${Date.now()}`,
        name: "Kenan Upgrade - Integration Scope",
        description: "Integration scope diagram for Kenan upgrade showing all connected systems and data flow",
        category: "architecture",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        metadata: JSON.stringify({
          nodeCount: nodes.length,
          edgeCount: edges.length,
          complexity: "Complex",
          createdBy: "admin",
          tags: ["kenan", "integration", "upgrade", "architecture"]
        }),
        author: "admin",
        isTeamProject: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    console.log("Successfully created Kenan Upgrade project:", project);
    console.log("Project ID:", project.id);
    console.log("Project Name:", project.name);
    console.log("Total Nodes:", nodes.length);
    console.log("Total Edges:", edges.length);
    
    process.exit(0);
  } catch (error) {
    console.error("Error creating project:", error);
    process.exit(1);
  }
}

// Run the script
createKenanUpgradeProject();