import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function createKenanWithRectangles() {
  try {
    // Delete any existing project with this name
    await db
      .delete(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"));
    
    // Create nodes using rectangles
    const nodes = [
      // Title text
      {
        id: "title",
        type: "text",
        position: { x: 100, y: 30 },
        data: {
          text: "Kenan Upgrade - Integration Scope",
          fontSize: 32,
          textColor: "#ff9966",
          bold: true,
          label: "Title"
        }
      },
      // Large KENAN background rectangle (sent to back)
      {
        id: "kenan-bg",
        type: "rectangle",
        position: { x: 400, y: 150 },
        data: {
          label: "KENAN Background",
          text: "",
          width: 350,
          height: 500,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          borderRadius: 15,
          zIndex: 0
        }
      },
      // KENAN label at top of rectangle
      {
        id: "kenan-label",
        type: "text",
        position: { x: 550, y: 620 },
        data: {
          text: "KENAN",
          fontSize: 28,
          textColor: "#ffffff",
          bold: true,
          label: "KENAN Label"
        }
      },
      // Green rectangles inside KENAN
      {
        id: "kenan-cc",
        type: "rectangle",
        position: { x: 450, y: 200 },
        data: {
          label: "KENAN CC",
          text: "KENAN CC",
          width: 250,
          height: 60,
          fillColor: "#66cc66",
          strokeColor: "#ffffff",
          strokeWidth: 1,
          textColor: "#ffffff",
          fontSize: 16,
          textAlign: "center",
          zIndex: 1
        }
      },
      {
        id: "kenan-catalog",
        type: "rectangle",
        position: { x: 450, y: 280 },
        data: {
          label: "KENAN CATALOG",
          text: "KENAN CATALOG",
          width: 250,
          height: 60,
          fillColor: "#66cc66",
          strokeColor: "#ffffff",
          strokeWidth: 1,
          textColor: "#ffffff",
          fontSize: 16,
          textAlign: "center",
          zIndex: 1
        }
      },
      {
        id: "kenan-om",
        type: "rectangle",
        position: { x: 450, y: 360 },
        data: {
          label: "KENAN OM",
          text: "KENAN OM",
          width: 250,
          height: 60,
          fillColor: "#66cc66",
          strokeColor: "#ffffff",
          strokeWidth: 1,
          textColor: "#ffffff",
          fontSize: 16,
          textAlign: "center",
          zIndex: 1
        }
      },
      {
        id: "kenan-billing",
        type: "rectangle",
        position: { x: 450, y: 440 },
        data: {
          label: "KENAN BILLING",
          text: "KENAN BILLING",
          width: 250,
          height: 60,
          fillColor: "#66cc66",
          strokeColor: "#ffffff",
          strokeWidth: 1,
          textColor: "#ffffff",
          fontSize: 16,
          textAlign: "center",
          zIndex: 1
        }
      },
      // Left side systems - Orange rectangles
      {
        id: "csp-ap",
        type: "rectangle",
        position: { x: 50, y: 150 },
        data: {
          label: "CSP AP",
          text: "CSP AP",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "csp-rs",
        type: "rectangle",
        position: { x: 50, y: 220 },
        data: {
          label: "CSP RS",
          text: "CSP RS",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "clarity",
        type: "rectangle",
        position: { x: 50, y: 290 },
        data: {
          label: "Clarity",
          text: "Clarity",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "fuse-api",
        type: "rectangle",
        position: { x: 50, y: 360 },
        data: {
          label: "FuSE API",
          text: "FuSE API",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "digital-service",
        type: "rectangle",
        position: { x: 50, y: 430 },
        data: {
          label: "Digital Service Layer",
          text: "Digital\nService Layer",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "partner-bridge",
        type: "rectangle",
        position: { x: 50, y: 500 },
        data: {
          label: "Partner Service Bridge",
          text: "Partner\nService Bridge",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "pldt-bridge",
        type: "rectangle",
        position: { x: 50, y: 570 },
        data: {
          label: "PLDT Service Bridge",
          text: "PLDT Service\nBridge",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "home-rewards",
        type: "rectangle",
        position: { x: 50, y: 640 },
        data: {
          label: "Home Rewards",
          text: "Home\nRewards",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "relay-bridge",
        type: "rectangle",
        position: { x: 50, y: 710 },
        data: {
          label: "Relay Bridge 500",
          text: "Relay Bridge\n500",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      // Right side systems - Orange rectangles
      {
        id: "epfs",
        type: "rectangle",
        position: { x: 900, y: 150 },
        data: {
          label: "EPFS",
          text: "EPFS",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "inld-emm",
        type: "rectangle",
        position: { x: 900, y: 220 },
        data: {
          label: "INLD/EMM",
          text: "INLD/EMM",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "sap-fi",
        type: "rectangle",
        position: { x: 900, y: 290 },
        data: {
          label: "SAP FI",
          text: "SAP FI\n(AFR/Telcon)",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "aia",
        type: "rectangle",
        position: { x: 900, y: 360 },
        data: {
          label: "AIA",
          text: "AIA",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "cares",
        type: "rectangle",
        position: { x: 900, y: 430 },
        data: {
          label: "CARES",
          text: "CARES",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "mvpr",
        type: "rectangle",
        position: { x: 900, y: 500 },
        data: {
          label: "MVPR",
          text: "MVPR",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "uws",
        type: "rectangle",
        position: { x: 900, y: 570 },
        data: {
          label: "UWS",
          text: "UWS",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "engage1",
        type: "rectangle",
        position: { x: 900, y: 640 },
        data: {
          label: "Engage1",
          text: "Engage1",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "ivrs",
        type: "rectangle",
        position: { x: 900, y: 710 },
        data: {
          label: "IVRS",
          text: "IVRS",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "easy",
        type: "rectangle",
        position: { x: 900, y: 780 },
        data: {
          label: "Easy",
          text: "Easy",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      {
        id: "smeg-bills",
        type: "rectangle",
        position: { x: 900, y: 850 },
        data: {
          label: "SMEG Bills Info",
          text: "SMEG Bills\nInfo",
          width: 150,
          height: 50,
          fillColor: "#ff9966",
          strokeColor: "#ffffff",
          strokeWidth: 2,
          textColor: "#ffffff",
          fontSize: 14,
          textAlign: "center"
        }
      },
      // Notes
      {
        id: "notes",
        type: "text",
        position: { x: 1100, y: 200 },
        data: {
          text: "Newly added integrations\nto be considered:\n\n1. UCPM\n2. Transunion (existing not listed)\n3. CVM\n4. OneInvoice ??\n5. Cloud Migration (Ph1 & Ph2)\n6. OSS",
          fontSize: 16,
          textColor: "#ffffff",
          textAlign: "left",
          label: "Notes"
        }
      }
    ];
    
    // Create edges with proper handle IDs
    const edges = [
      // Left side to KENAN
      {
        id: "edge1",
        source: "csp-ap",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 },
        labelStyle: { fill: "#ffffff", fontSize: 12 },
        labelBgStyle: { fill: "#333333" }
      },
      {
        id: "edge2",
        source: "csp-rs",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge3",
        source: "clarity",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge4",
        source: "fuse-api",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge5",
        source: "digital-service",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge6",
        source: "partner-bridge",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge7",
        source: "pldt-bridge",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge8",
        source: "home-rewards",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge9",
        source: "relay-bridge",
        target: "kenan-bg",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      // KENAN to right side
      {
        id: "edge10",
        source: "kenan-bg",
        target: "epfs",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge11",
        source: "kenan-bg",
        target: "inld-emm",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge12",
        source: "kenan-bg",
        target: "sap-fi",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge13",
        source: "kenan-bg",
        target: "aia",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge14",
        source: "kenan-bg",
        target: "cares",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge15",
        source: "kenan-bg",
        target: "mvpr",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge16",
        source: "kenan-bg",
        target: "uws",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge17",
        source: "kenan-bg",
        target: "engage1",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge18",
        source: "kenan-bg",
        target: "ivrs",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "FILE(FTP/SFTP)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge19",
        source: "kenan-bg",
        target: "easy",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      },
      {
        id: "edge20",
        source: "kenan-bg",
        target: "smeg-bills",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: true,
        label: "DB (DB Integration)",
        style: { stroke: "#66ff66", strokeWidth: 2 }
      }
    ];
    
    // Create the project
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `kenan-rect-${Date.now()}`,
        name: "Kenan Upgrade - Integration Scope",
        description: "Integration scope diagram for Kenan upgrade using rectangle components",
        category: "architecture",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        metadata: JSON.stringify({
          nodeCount: nodes.length,
          edgeCount: edges.length,
          complexity: "Complex",
          tags: ["kenan", "integration", "upgrade", "architecture"]
        }),
        author: "admin",
        isTeamProject: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Successfully created Kenan project with rectangles");
    console.log("Project ID:", project.id);
    console.log("Project Name:", project.name);
    console.log("Total Nodes:", nodes.length);
    console.log("Total Edges:", edges.length);
    
  } catch (error) {
    console.error("Error creating project:", error);
  }
  process.exit(0);
}

createKenanWithRectangles();