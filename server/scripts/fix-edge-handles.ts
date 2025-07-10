import { db } from "../db";
import { interfaceBuilderProjects } from "../../shared/schema";

async function fixEdgeHandles() {
  try {
    // Get all projects
    const projects = await db
      .select()
      .from(interfaceBuilderProjects);
    
    console.log(`Found ${projects.length} projects to check`);
    
    let fixedCount = 0;
    
    for (const project of projects) {
      const nodes = JSON.parse(project.nodes);
      const edges = JSON.parse(project.edges);
      
      let needsUpdate = false;
      
      // Fix edges with -source and -target suffixes
      const fixedEdges = edges.map((edge: any) => {
        let updated = false;
        const newEdge = { ...edge };
        
        // Remove -source and -target suffixes from handle IDs
        if (edge.sourceHandle && edge.sourceHandle.endsWith('-source')) {
          newEdge.sourceHandle = edge.sourceHandle.replace('-source', '');
          updated = true;
        }
        if (edge.targetHandle && edge.targetHandle.endsWith('-target')) {
          newEdge.targetHandle = edge.targetHandle.replace('-target', '');
          updated = true;
        }
        
        if (updated) {
          needsUpdate = true;
        }
        
        return newEdge;
      });
      
      if (needsUpdate) {
        // Update the project with fixed edges
        await db
          .update(interfaceBuilderProjects)
          .set({
            edges: JSON.stringify(fixedEdges),
            updatedAt: new Date()
          })
          .where(eq(interfaceBuilderProjects.id, project.id));
        
        console.log(`Fixed project: ${project.name} (ID: ${project.id})`);
        fixedCount++;
      }
    }
    
    console.log(`\nFixed ${fixedCount} projects with edge handle issues`);
    
  } catch (error) {
    console.error("Error fixing edge handles:", error);
  }
  process.exit(0);
}

import { eq } from "drizzle-orm";
fixEdgeHandles();