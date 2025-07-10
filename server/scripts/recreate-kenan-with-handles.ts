import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function recreateKenanDiagram() {
  try {
    // First, delete any existing Kenan project
    await db
      .delete(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"));
    
    console.log("Deleted existing Kenan project");
    
    // Create the central KENAN box
    const kenanNode = {
      id: "kenan-main",
      type: "rectangle",
      position: { x: 450, y: 200 },
      data: {
        id: "kenan-main",
        label: "KENAN",
        width: 200,
        height: 400,
        color: "#ea580c",
        borderColor: "#ea580c",
        borderWidth: 2,
        borderRadius: 0,
        fillOpacity: 0.9,
        zIndex: 0,
        text: "KENAN",
        fontSize: 24,
        fontWeight: "bold",
        textColor: "#ffffff"
      }
    };

    // Create the black header
    const headerNode = {
      id: "header",
      type: "rectangle",
      position: { x: 100, y: 50 },
      data: {
        id: "header",
        label: "Kenan Upgrade - Integration Scope",
        width: 900,
        height: 60,
        color: "#000000",
        borderColor: "#000000",
        borderWidth: 0,
        borderRadius: 0,
        fillOpacity: 1,
        zIndex: 1,
        text: "Kenan Upgrade - Integration Scope",
        fontSize: 20,
        fontWeight: "bold",
        textColor: "#ffffff"
      }
    };

    // Create left side boxes
    const leftBoxes = [
      { id: "cap-ap", label: "CAP-AP", y: 150 },
      { id: "clarity", label: "Clarity", y: 200 },
      { id: "clarity-2", label: "Clarity", y: 250 },
      { id: "cap-ob", label: "CAP-OB", y: 300 },
      { id: "order-manager", label: "Order Manager", y: 350 },
      { id: "kenan-ix", label: "Kenan IX", y: 400 },
      { id: "fleet-maps", label: "Fleet Maps", y: 450 },
      { id: "c-omni", label: "C-OMNI", y: 500 },
      { id: "ssm", label: "SSM", y: 550 }
    ];

    const leftNodes = leftBoxes.map(box => ({
      id: box.id,
      type: "rectangle",
      position: { x: 100, y: box.y },
      data: {
        id: box.id,
        label: box.label,
        width: 120,
        height: 40,
        color: "#ea580c",
        borderColor: "#ea580c",
        borderWidth: 2,
        borderRadius: 4,
        fillOpacity: 0.9,
        zIndex: 2,
        text: box.label,
        fontSize: 14,
        fontWeight: "normal",
        textColor: "#ffffff"
      }
    }));

    // Create black FILE/FTP/SFTP boxes on the left
    const leftBlackBoxes = [
      { id: "file-ftp-1", y: 155 },
      { id: "file-ftp-2", y: 205 },
      { id: "file-ftp-3", y: 255 },
      { id: "file-ftp-4", y: 305 },
      { id: "file-ftp-5", y: 355 },
      { id: "file-ftp-6", y: 405 },
      { id: "file-ftp-7", y: 455 },
      { id: "file-ftp-8", y: 505 },
      { id: "file-ftp-9", y: 555 }
    ];

    const leftBlackNodes = leftBlackBoxes.map(box => ({
      id: box.id,
      type: "rectangle",
      position: { x: 240, y: box.y },
      data: {
        id: box.id,
        label: "FILE/FTP/SFTP",
        width: 110,
        height: 30,
        color: "#000000",
        borderColor: "#000000",
        borderWidth: 1,
        borderRadius: 2,
        fillOpacity: 0.9,
        zIndex: 2,
        text: "FILE/FTP/SFTP",
        fontSize: 11,
        fontWeight: "normal",
        textColor: "#ffffff"
      }
    }));

    // Create the green boxes in the middle
    const greenBoxes = [
      { id: "middleware", label: "Middleware", y: 250 },
      { id: "middleware-sw", label: "MIDDLEWARE-SW", y: 300 },
      { id: "nbn-api", label: "NBN-API", y: 350 },
      { id: "sync-bc-cap", label: "SYNC BC-CAP", y: 400 }
    ];

    const greenNodes = greenBoxes.map(box => ({
      id: box.id,
      type: "rectangle",
      position: { x: 480, y: box.y },
      data: {
        id: box.id,
        label: box.label,
        width: 140,
        height: 40,
        color: "#22c55e",
        borderColor: "#22c55e",
        borderWidth: 2,
        borderRadius: 4,
        fillOpacity: 0.9,
        zIndex: 3,
        text: box.label,
        fontSize: 14,
        fontWeight: "normal",
        textColor: "#ffffff"
      }
    }));

    // Create right side boxes
    const rightBoxes = [
      { id: "ea1", label: "EA1", y: 150 },
      { id: "ms-sql", label: "MS SQL", y: 200 },
      { id: "cap", label: "CAP", y: 250 },
      { id: "caps", label: "CAPS", y: 300 },
      { id: "cmma", label: "CMMA", y: 350 },
      { id: "viya", label: "Viya", y: 400 },
      { id: "paynet", label: "Paynet", y: 450 },
      { id: "pims", label: "PIMS", y: 500 },
      { id: "bnc-ms", label: "BNC-MS", y: 550 }
    ];

    const rightNodes = rightBoxes.map(box => ({
      id: box.id,
      type: "rectangle",
      position: { x: 880, y: box.y },
      data: {
        id: box.id,
        label: box.label,
        width: 120,
        height: 40,
        color: "#ea580c",
        borderColor: "#ea580c",
        borderWidth: 2,
        borderRadius: 4,
        fillOpacity: 0.9,
        zIndex: 2,
        text: box.label,
        fontSize: 14,
        fontWeight: "normal",
        textColor: "#ffffff"
      }
    }));

    // Create black FILE/FTP/SFTP boxes on the right
    const rightBlackBoxes = [
      { id: "file-ftp-r1", y: 155 },
      { id: "file-ftp-r2", y: 205 },
      { id: "file-ftp-r3", y: 255 },
      { id: "file-ftp-r4", y: 305 },
      { id: "file-ftp-r5", y: 355 },
      { id: "file-ftp-r6", y: 405 },
      { id: "file-ftp-r7", y: 455 },
      { id: "file-ftp-r8", y: 505 },
      { id: "file-ftp-r9", y: 555 }
    ];

    const rightBlackNodes = rightBlackBoxes.map(box => ({
      id: box.id,
      type: "rectangle",
      position: { x: 750, y: box.y },
      data: {
        id: box.id,
        label: "FILE/FTP/SFTP",
        width: 110,
        height: 30,
        color: "#000000",
        borderColor: "#000000",
        borderWidth: 1,
        borderRadius: 2,
        fillOpacity: 0.9,
        zIndex: 2,
        text: "FILE/FTP/SFTP",
        fontSize: 11,
        fontWeight: "normal",
        textColor: "#ffffff"
      }
    }));

    // Combine all nodes
    const nodes = [
      headerNode,
      kenanNode,
      ...leftNodes,
      ...leftBlackNodes,
      ...greenNodes,
      ...rightNodes,
      ...rightBlackNodes
    ];

    // Create edges with proper handle IDs
    const edges = [];

    // Left side connections (from orange boxes to black boxes)
    leftBoxes.forEach((box, index) => {
      edges.push({
        id: `edge-left-${box.id}`,
        source: box.id,
        target: leftBlackBoxes[index].id,
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      });
    });

    // Black boxes to green boxes (only specific connections)
    edges.push(
      {
        id: "edge-black-green-1",
        source: "file-ftp-3",
        target: "middleware",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-black-green-2",
        source: "file-ftp-4",
        target: "middleware-sw",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-black-green-3",
        source: "file-ftp-5",
        target: "nbn-api",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-black-green-4",
        source: "file-ftp-7",
        target: "sync-bc-cap",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      }
    );

    // Green boxes to right black boxes
    edges.push(
      {
        id: "edge-green-black-1",
        source: "middleware",
        target: "file-ftp-r3",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-green-black-2",
        source: "middleware-sw",
        target: "file-ftp-r4",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-green-black-3",
        source: "nbn-api",
        target: "file-ftp-r5",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      },
      {
        id: "edge-green-black-4",
        source: "sync-bc-cap",
        target: "file-ftp-r6",
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      }
    );

    // Right black boxes to orange boxes
    rightBoxes.forEach((box, index) => {
      edges.push({
        id: `edge-right-${box.id}`,
        source: rightBlackBoxes[index].id,
        target: box.id,
        sourceHandle: "right-source",
        targetHandle: "left-target",
        type: "smoothstep",
        animated: false,
        style: { stroke: "#666666", strokeWidth: 2 }
      });
    });

    // Create the project
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `kenan-upgrade-${Date.now()}`,
        name: "Kenan Upgrade - Integration Scope",
        description: "Integration scope diagram for Kenan upgrade showing all connected systems",
        category: "custom",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        metadata: JSON.stringify({
          nodeCount: nodes.length,
          edgeCount: edges.length,
          tags: ["kenan", "integration", "upgrade"],
          notes: [
            "Newly added integrations to be considered:",
            "1. UCRM",
            "2. Transaction (existing not listed)",
            "3. CVPA", 
            "4. OSS Portal (SAP, BCA)",
            "5. Cloud Migration (PH & PH2)",
            "6. OSS"
          ]
        }),
        author: "admin",
        isTeamProject: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Kenan diagram recreated successfully!");
    console.log("Project ID:", project.id);
    console.log("Total nodes:", nodes.length);
    console.log("Total edges:", edges.length);
    
    // Verify edges have handles
    const edgesWithHandles = edges.filter(e => e.sourceHandle && e.targetHandle).length;
    console.log("Edges with proper handles:", edgesWithHandles, "/", edges.length);
    
  } catch (error) {
    console.error("Error creating Kenan diagram:", error);
  }
  process.exit(0);
}

recreateKenanDiagram();