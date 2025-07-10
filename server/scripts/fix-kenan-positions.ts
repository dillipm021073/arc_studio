import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq } from "drizzle-orm";

async function fixKenanPositions() {
  try {
    // Get the project
    const [project] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"));
    
    if (project) {
      const nodes = JSON.parse(project.nodes);
      
      // Update the main KENAN rectangle to not include inner components
      const kenanCentral = nodes.find(n => n.id === "kenan-central");
      if (kenanCentral) {
        kenanCentral.data.height = 200; // Reduce height since we're not nesting
      }
      
      // Remove the inner KENAN components - they should be separate
      const updatedNodes = nodes.filter(n => !["kenan-cc", "kenan-catalog", "kenan-om", "kenan-billing"].includes(n.id));
      
      // Update positions to spread out better
      updatedNodes.forEach(node => {
        if (node.id === "title") {
          node.position = { x: 300, y: 20 };
        } else if (node.id === "notes") {
          node.position = { x: 1100, y: 200 };
        }
      });
      
      // Update the project
      await db
        .update(interfaceBuilderProjects)
        .set({
          nodes: JSON.stringify(updatedNodes),
          updatedAt: new Date()
        })
        .where(eq(interfaceBuilderProjects.id, project.id));
      
      console.log("Updated project positions successfully");
      console.log("Removed nested rectangles");
      console.log("New node count:", updatedNodes.length);
    }
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

fixKenanPositions();