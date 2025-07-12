import { db } from "./server/db";
import { interfaceBuilderProjects } from "./shared/schema";
import { like, or } from "drizzle-orm";

async function findKenanProjects() {
  try {
    console.log("Searching for Kenan projects in Interface Builder...\n");
    
    // Search for any project with Kenan in the name
    const projects = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(or(
        like(interfaceBuilderProjects.name, '%Kenan%'),
        like(interfaceBuilderProjects.name, '%kenan%'),
        like(interfaceBuilderProjects.name, '%KENAN%')
      ));
    
    if (projects.length === 0) {
      console.log("No Kenan projects found.\n");
      
      // Let's see all projects
      const allProjects = await db.select().from(interfaceBuilderProjects);
      console.log(`Total projects in Interface Builder: ${allProjects.length}\n`);
      
      if (allProjects.length > 0) {
        console.log("Available projects:");
        allProjects.forEach(p => {
          console.log(`- ID: ${p.id}, Name: ${p.name}, Author: ${p.author}, Created: ${p.createdAt}`);
        });
      }
    } else {
      console.log(`Found ${projects.length} Kenan project(s):\n`);
      
      projects.forEach((project, index) => {
        console.log(`Project ${index + 1}:`);
        console.log(`- ID: ${project.id}`);
        console.log(`- Name: ${project.name}`);
        console.log(`- Author: ${project.author}`);
        console.log(`- Team Project: ${project.isTeamProject}`);
        console.log(`- Created: ${project.createdAt}`);
        console.log(`- Updated: ${project.updatedAt}`);
        
        // Parse nodes and edges to show counts
        try {
          const nodes = JSON.parse(project.nodes);
          const edges = JSON.parse(project.edges);
          console.log(`- Nodes: ${nodes.length}`);
          console.log(`- Edges: ${edges.length}`);
        } catch (e) {
          console.log(`- Error parsing nodes/edges: ${e.message}`);
        }
        console.log();
      });
      
      // Ask if you want to export the project
      console.log("\nTo recover/export a project, you can use its ID to create a backup file.");
    }
    
  } catch (error) {
    console.error("Error searching for projects:", error);
  }
  process.exit(0);
}

findKenanProjects();