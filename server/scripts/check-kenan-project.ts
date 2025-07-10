import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function checkKenanProject() {
  try {
    // Get the project we just created
    const projects = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"));
    
    if (projects.length > 0) {
      const project = projects[0];
      console.log("Project found:", project.id);
      console.log("Project name:", project.name);
      console.log("Is team project:", project.isTeamProject);
      console.log("Author:", project.author);
      
      // Parse and check nodes
      const nodes = JSON.parse(project.nodes);
      console.log("\nNodes count:", nodes.length);
      console.log("Node types:");
      const nodeTypes = new Set(nodes.map(n => n.type));
      nodeTypes.forEach(type => {
        const count = nodes.filter(n => n.type === type).length;
        console.log(`  - ${type}: ${count}`);
      });
      
      // Check for rectangle nodes specifically
      const rectangleNodes = nodes.filter(n => n.type === "rectangle");
      console.log("\nRectangle nodes:", rectangleNodes.length);
      rectangleNodes.forEach(node => {
        console.log(`  - ${node.id}: ${node.data.text || node.data.label}`);
      });
      
      // Parse and check edges
      const edges = JSON.parse(project.edges);
      console.log("\nEdges count:", edges.length);
      
      // Check if edges have handle IDs
      const edgesWithHandles = edges.filter(e => e.sourceHandle && e.targetHandle);
      console.log("Edges with handle IDs:", edgesWithHandles.length);
      
      // Sample edge
      if (edges.length > 0) {
        console.log("\nSample edge:", JSON.stringify(edges[0], null, 2));
      }
      
      // Write to a file for inspection
      const fs = require("fs");
      fs.writeFileSync("kenan-project-data.json", JSON.stringify({ nodes, edges }, null, 2));
      console.log("\nFull data written to kenan-project-data.json");
      
    } else {
      console.log("Project not found!");
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkKenanProject();