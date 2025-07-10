import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function debugRectangleHandles() {
  try {
    // Load the Rectangle Connection Test project
    const [project] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Rectangle Connection Test"));
    
    if (!project) {
      console.error("Rectangle Connection Test project not found!");
      return;
    }
    
    const nodes = JSON.parse(project.nodes);
    const edges = JSON.parse(project.edges);
    
    console.log("=== RECTANGLE HANDLES DEBUG ===");
    console.log("Total nodes:", nodes.length);
    console.log("Total edges:", edges.length);
    
    // Check each node's structure
    console.log("\n=== NODE DETAILS ===");
    nodes.forEach((node: any) => {
      console.log(`\nNode: ${node.id}`);
      console.log("Type:", node.type);
      console.log("Position:", node.position);
      console.log("Data keys:", Object.keys(node.data).join(", "));
      if (node.data.connectionPoints) {
        console.log("Connection Points:", JSON.stringify(node.data.connectionPoints, null, 2));
      }
    });
    
    // Check each edge's structure
    console.log("\n=== EDGE DETAILS ===");
    edges.forEach((edge: any) => {
      console.log(`\nEdge: ${edge.id}`);
      console.log("Source:", edge.source, "Handle:", edge.sourceHandle || "NONE");
      console.log("Target:", edge.target, "Handle:", edge.targetHandle || "NONE");
      console.log("Type:", edge.type);
      console.log("Label:", edge.label);
    });
    
    // Now let's create a simpler test
    console.log("\n=== CREATING MINIMAL TEST ===");
    
    await db
      .delete(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Minimal Handle Test"));
    
    const minimalNodes = [
      {
        id: "box1",
        type: "rectangle",
        position: { x: 100, y: 100 },
        data: {
          id: "box1",
          label: "Box 1",
          width: 100,
          height: 60,
          color: "#3b82f6",
          borderColor: "#3b82f6",
          borderWidth: 2,
          text: "Box 1"
        }
      },
      {
        id: "box2",
        type: "rectangle",
        position: { x: 300, y: 100 },
        data: {
          id: "box2",
          label: "Box 2",
          width: 100,
          height: 60,
          color: "#10b981",
          borderColor: "#10b981",
          borderWidth: 2,
          text: "Box 2"
        }
      }
    ];
    
    const minimalEdges = [
      {
        id: "test-edge",
        source: "box1",
        target: "box2",
        sourceHandle: "right",
        targetHandle: "left",
        type: "smoothstep"
      }
    ];
    
    const [minimalProject] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `minimal-test-${Date.now()}`,
        name: "Minimal Handle Test",
        description: "Minimal test for handle connections",
        category: "custom",
        nodes: JSON.stringify(minimalNodes),
        edges: JSON.stringify(minimalEdges),
        metadata: JSON.stringify({}),
        author: "admin",
        isTeamProject: false,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("\nMinimal test project created:", minimalProject.id);
    console.log("Edge has handles:", minimalEdges[0].sourceHandle, "->", minimalEdges[0].targetHandle);
    
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

debugRectangleHandles();