import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";

async function createTestProject() {
  try {
    // Create very simple test nodes
    const nodes = [
      {
        id: "app1",
        type: "application",
        position: { x: 200, y: 200 },
        data: {
          id: "app1",
          name: "Test App 1",
          label: "Test App 1",
          type: "application",
          status: "active",
          isConfigured: true
        }
      },
      {
        id: "app2",
        type: "application",
        position: { x: 600, y: 200 },
        data: {
          id: "app2",
          name: "Test App 2",
          label: "Test App 2",
          type: "application",
          status: "active",
          isConfigured: true
        }
      }
    ];
    
    const edges = [
      {
        id: "edge1",
        source: "app1",
        target: "app2",
        type: "smoothstep"
      }
    ];
    
    const [project] = await db
      .insert(interfaceBuilderProjects)
      .values({
        projectId: `test-${Date.now()}`,
        name: "Test Project - Debug",
        description: "Simple test project to debug rendering",
        category: "custom",
        nodes: JSON.stringify(nodes),
        edges: JSON.stringify(edges),
        metadata: JSON.stringify({
          nodeCount: nodes.length,
          edgeCount: edges.length
        }),
        author: "admin",
        isTeamProject: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    console.log("Created test project:", project.id);
    console.log("Nodes:", JSON.stringify(nodes, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

createTestProject();