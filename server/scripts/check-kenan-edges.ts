import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

async function checkKenanEdges() {
  try {
    const [kenanProject] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.name, "Kenan Upgrade - Integration Scope"))
      .orderBy(desc(interfaceBuilderProjects.id))
      .limit(1);
    
    if (!kenanProject) {
      console.log("Kenan project not found");
      return;
    }
    
    console.log("Found Kenan project ID:", kenanProject.id);
    
    const nodes = JSON.parse(kenanProject.nodes);
    const edges = JSON.parse(kenanProject.edges);
    
    console.log("Total edges:", edges.length);
    
    // Check rectangle nodes
    const rectangleNodes = nodes.filter(n => n.type === "rectangle");
    console.log("\nRectangle nodes:", rectangleNodes.length);
    
    // Check edges without handles
    const edgesWithoutHandles = edges.filter(e => !e.sourceHandle || !e.targetHandle);
    
    if (edgesWithoutHandles.length > 0) {
      console.log("\nWARNING: Edges WITHOUT handle IDs:", edgesWithoutHandles.length);
      edgesWithoutHandles.forEach(e => {
        console.log(`- Edge ${e.id}:`);
        console.log(`  Source: ${e.source} (handle: ${e.sourceHandle || 'MISSING'})`);
        console.log(`  Target: ${e.target} (handle: ${e.targetHandle || 'MISSING'})`);
      });
    } else {
      console.log("\n✓ All edges have proper handle IDs");
    }
    
    // Sample some edges
    console.log("\nSample edges:");
    edges.slice(0, 3).forEach(edge => {
      console.log(`- ${edge.id}: ${edge.source} (${edge.sourceHandle}) -> ${edge.target} (${edge.targetHandle})`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

checkKenanEdges();