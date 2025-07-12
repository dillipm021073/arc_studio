import { db } from "./server/db";
import { interfaceBuilderProjects } from "./shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function recoverKenanProject() {
  try {
    console.log("Recovering Kenan project...\n");
    
    // Get the Kenan project by ID
    const [project] = await db
      .select()
      .from(interfaceBuilderProjects)
      .where(eq(interfaceBuilderProjects.id, 21));
    
    if (!project) {
      console.log("Project with ID 21 not found!");
      process.exit(1);
    }
    
    console.log(`Found project: ${project.name}`);
    console.log(`Author: ${project.author}`);
    console.log(`Created: ${project.createdAt}`);
    console.log(`Last updated: ${project.updatedAt}\n`);
    
    // Parse nodes and edges
    const nodes = JSON.parse(project.nodes);
    const edges = JSON.parse(project.edges);
    
    console.log(`Total nodes: ${nodes.length}`);
    console.log(`Total edges: ${edges.length}\n`);
    
    // Create recovery directory
    const recoveryDir = path.join(process.cwd(), "InterfaceBuilder", "RecoveredProjects");
    if (!fs.existsSync(recoveryDir)) {
      fs.mkdirSync(recoveryDir, { recursive: true });
    }
    
    // Create project backup with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `Kenan_V7_Recovery_${timestamp}.json`;
    const backupPath = path.join(recoveryDir, backupFileName);
    
    // Prepare the full project data
    const projectData = {
      id: project.id,
      name: project.name,
      author: project.author,
      isTeamProject: project.isTeamProject,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      nodes: nodes,
      edges: edges,
      metadata: {
        recoveredAt: new Date().toISOString(),
        originalId: project.id,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
    
    // Write the backup file
    fs.writeFileSync(backupPath, JSON.stringify(projectData, null, 2));
    console.log(`✅ Project recovered successfully!`);
    console.log(`📁 Backup saved to: ${backupPath}\n`);
    
    // Also create a simplified visualization file
    const vizFileName = `Kenan_V7_Visualization_${timestamp}.txt`;
    const vizPath = path.join(recoveryDir, vizFileName);
    
    let vizContent = `KENAN PROJECT VISUALIZATION\n`;
    vizContent += `===========================\n\n`;
    vizContent += `Project: ${project.name}\n`;
    vizContent += `Created: ${project.createdAt}\n\n`;
    
    // Group nodes by type
    const nodesByType = {};
    nodes.forEach(node => {
      const type = node.type || 'unknown';
      if (!nodesByType[type]) nodesByType[type] = [];
      nodesByType[type].push(node);
    });
    
    vizContent += `NODES BY TYPE:\n`;
    vizContent += `--------------\n`;
    Object.entries(nodesByType).forEach(([type, typeNodes]) => {
      vizContent += `\n${type.toUpperCase()} (${typeNodes.length}):\n`;
      typeNodes.forEach(node => {
        const label = node.data?.text || node.data?.label || 'No label';
        vizContent += `  - ${node.id}: ${label}\n`;
      });
    });
    
    vizContent += `\n\nCONNECTIONS:\n`;
    vizContent += `------------\n`;
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const sourceLabel = sourceNode?.data?.text || sourceNode?.data?.label || edge.source;
      const targetLabel = targetNode?.data?.text || targetNode?.data?.label || edge.target;
      vizContent += `${sourceLabel} --> ${targetLabel}\n`;
    });
    
    fs.writeFileSync(vizPath, vizContent);
    console.log(`📊 Visualization saved to: ${vizPath}\n`);
    
    // Show summary of what was recovered
    console.log("RECOVERY SUMMARY:");
    console.log("=================");
    console.log(`Project Name: ${project.name}`);
    console.log(`Total Components: ${nodes.length} nodes, ${edges.length} connections`);
    console.log("\nNode Types Found:");
    Object.entries(nodesByType).forEach(([type, typeNodes]) => {
      console.log(`  - ${type}: ${typeNodes.length}`);
    });
    
    console.log("\n✨ The Kenan_V7 project has been successfully recovered!");
    console.log("You can now access it through the Interface Builder UI or use the backup files.");
    
  } catch (error) {
    console.error("Error recovering project:", error);
  }
  process.exit(0);
}

recoverKenanProject();