import { Router } from "express";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { z } from "zod";
import { requireAuth } from "../auth";

const router = Router();

// Middleware to authenticate all routes
router.use(requireAuth);

// Define the local projects directory structure
const getLocalProjectsPath = (username?: string) => {
  const baseDir = path.join(os.homedir(), "InterfaceBuilder");
  if (username) {
    return path.join(baseDir, "Projects", "user_projects", username);
  }
  return path.join(baseDir, "Projects");
};

const getTemplatesPath = () => {
  // Use project directory for templates in development
  const projectDir = process.cwd();
  return path.join(projectDir, "InterfaceBuilder", "Templates");
};

const getBackupsPath = () => {
  const baseDir = path.join(os.homedir(), "InterfaceBuilder");
  return path.join(baseDir, "Backups");
};

// Ensure directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Schema for project data
const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  nodes: z.array(z.any()).optional().default([]),
  edges: z.array(z.any()).optional().default([]),
  metadata: z.any().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  fileInfo: z.any().optional(),
});

// Get template projects - MUST come before /:projectId route
router.get("/templates", async (req, res) => {
  try {
    const templatesPath = getTemplatesPath();
    
    await ensureDir(templatesPath);
    
    const files = await fs.readdir(templatesPath);
    const templateFiles = files.filter(file => file.endsWith('.json'));
    
    const templates = [];
    
    for (const file of templateFiles) {
      try {
        const filePath = path.join(templatesPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const template = JSON.parse(content);
        
        template.fileInfo = {
          fileName: file,
          filePath: filePath,
        };
        
        templates.push(template);
      } catch (error) {
        console.error(`Error reading template file ${file}:`, error);
      }
    }
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
});

// Get all local projects for the current user
router.get("/", async (req, res) => {
  try {
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    await ensureDir(userProjectsPath);
    
    const files = await fs.readdir(userProjectsPath);
    const projectFiles = files.filter(file => file.endsWith('.json'));
    
    const projects = [];
    
    for (const file of projectFiles) {
      try {
        const filePath = path.join(userProjectsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const project = JSON.parse(content);
        
        // Ensure nodes and edges are arrays (parse if they're JSON strings)
        if (typeof project.nodes === 'string') {
          try {
            project.nodes = JSON.parse(project.nodes);
          } catch {
            project.nodes = [];
          }
        }
        if (typeof project.edges === 'string') {
          try {
            project.edges = JSON.parse(project.edges);
          } catch {
            project.edges = [];
          }
        }
        
        // Ensure they're arrays
        project.nodes = Array.isArray(project.nodes) ? project.nodes : [];
        project.edges = Array.isArray(project.edges) ? project.edges : [];
        
        // Add file metadata
        const stats = await fs.stat(filePath);
        project.fileInfo = {
          fileName: file,
          filePath: filePath,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
        };
        
        projects.push(project);
      } catch (error) {
        console.error(`Error reading project file ${file}:`, error);
      }
    }
    
    // Sort by last modified
    projects.sort((a, b) => 
      new Date(b.fileInfo.lastModified).getTime() - new Date(a.fileInfo.lastModified).getTime()
    );
    
    res.json(projects);
  } catch (error) {
    console.error("Error fetching local projects:", error);
    res.status(500).json({ error: "Failed to fetch local projects" });
  }
});

// Get a specific local project
router.get("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    const filePath = path.join(userProjectsPath, `${projectId}.json`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const project = JSON.parse(content);
      
      // Ensure nodes and edges are arrays (parse if they're JSON strings)
      if (typeof project.nodes === 'string') {
        try {
          project.nodes = JSON.parse(project.nodes);
        } catch {
          project.nodes = [];
        }
      }
      if (typeof project.edges === 'string') {
        try {
          project.edges = JSON.parse(project.edges);
        } catch {
          project.edges = [];
        }
      }
      
      // Ensure they're arrays
      project.nodes = Array.isArray(project.nodes) ? project.nodes : [];
      project.edges = Array.isArray(project.edges) ? project.edges : [];
      
      res.json(project);
    } catch (error) {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Error fetching local project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Save a project locally
router.post("/", async (req, res) => {
  try {
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    await ensureDir(userProjectsPath);
    
    // Validate project data
    const projectData = {
      ...req.body,
      id: req.body.id || `local-${Date.now()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...req.body.metadata,
        author: username,
        lastSaved: new Date().toISOString(),
      }
    };
    
    const validation = projectSchema.safeParse(projectData);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const project = validation.data;
    const fileName = `${project.id}.json`;
    const filePath = path.join(userProjectsPath, fileName);
    
    // Write to file
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
    
    // Add file info
    const stats = await fs.stat(filePath);
    project.fileInfo = {
      fileName,
      filePath,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
    
    res.json(project);
  } catch (error) {
    console.error("Error saving local project:", error);
    res.status(500).json({ error: "Failed to save project" });
  }
});

// Update an existing local project
router.put("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    const filePath = path.join(userProjectsPath, `${projectId}.json`);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Read existing project
    let existingContent: string;
    try {
      existingContent = await fs.readFile(filePath, 'utf-8');
    } catch (readError) {
      console.error('Error reading project file:', readError);
      return res.status(500).json({ error: "Failed to read project file" });
    }
    
    // Check if file is empty
    if (!existingContent || existingContent.trim() === '') {
      console.error('Project file is empty:', filePath);
      existingContent = '{}';
    }
    
    let existingProject;
    try {
      existingProject = JSON.parse(existingContent);
    } catch (parseError) {
      console.error('Error parsing existing project:', parseError);
      console.error('File content:', existingContent);
      // If parsing fails, use the request body as the full project data
      existingProject = {};
    }
    
    // Update project data
    const projectData = {
      ...existingProject,
      ...req.body,
      id: projectId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
      metadata: {
        ...existingProject.metadata,
        ...req.body.metadata,
        author: username,
        lastSaved: new Date().toISOString(),
      }
    };
    
    const validation = projectSchema.safeParse(projectData);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }
    
    const project = validation.data;
    
    // Write updated project
    await fs.writeFile(filePath, JSON.stringify(project, null, 2), 'utf-8');
    
    // Add file info
    const stats = await fs.stat(filePath);
    project.fileInfo = {
      fileName: `${projectId}.json`,
      filePath,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
    
    res.json(project);
  } catch (error) {
    console.error("Error updating local project:", error);
    res.status(500).json({ error: "Failed to update project" });
  }
});

// Delete a local project
router.delete("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    const filePath = path.join(userProjectsPath, `${projectId}.json`);
    
    try {
      await fs.unlink(filePath);
      res.json({ success: true, message: "Project deleted successfully" });
    } catch (error) {
      res.status(404).json({ error: "Project not found" });
    }
  } catch (error) {
    console.error("Error deleting local project:", error);
    res.status(500).json({ error: "Failed to delete project" });
  }
});

// Import project from database to local storage
router.post("/import/:dbProjectId", async (req, res) => {
  try {
    console.log('Import request received for project:', req.params.dbProjectId);
    console.log('User:', req.user?.username);
    console.log('Request body keys:', Object.keys(req.body || {}));
    
    const { dbProjectId } = req.params;
    const username = req.user?.username || 'default';
    const userProjectsPath = getLocalProjectsPath(username);
    
    console.log('User projects path:', userProjectsPath);
    
    await ensureDir(userProjectsPath);
    
    // The project data is passed in the request body
    const dbProject = req.body;
    
    if (!dbProject || !dbProject.name) {
      console.error('Invalid project data received:', JSON.stringify(dbProject, null, 2));
      return res.status(400).json({ error: "Valid project data required" });
    }
    
    // Ensure nodes and edges are arrays (they might be JSON strings from the database)
    let nodes = dbProject.nodes || [];
    let edges = dbProject.edges || [];
    
    // Parse if they're strings
    if (typeof nodes === 'string') {
      try {
        nodes = JSON.parse(nodes);
      } catch (e) {
        console.error('Error parsing nodes:', e);
        nodes = [];
      }
    }
    if (typeof edges === 'string') {
      try {
        edges = JSON.parse(edges);
      } catch (e) {
        console.error('Error parsing edges:', e);
        edges = [];
      }
    }
    
    // Ensure they're arrays
    nodes = Array.isArray(nodes) ? nodes : [];
    edges = Array.isArray(edges) ? edges : [];
    
    // Convert database project to local project format
    const localProject = {
      id: `imported-${dbProjectId}-${Date.now()}`,
      name: `${dbProject.name} (Imported)`,
      description: dbProject.description || '',
      category: dbProject.category || 'Imported',
      nodes: nodes,
      edges: edges,
      metadata: {
        ...(dbProject.metadata || {}),
        author: username,
        originalDbId: dbProjectId,
        importedAt: new Date().toISOString(),
        source: 'team',
        nodeCount: nodes.length,
        edgeCount: edges.length,
        complexity: nodes.length <= 3 ? 'Simple' : nodes.length <= 8 ? 'Medium' : 'Complex'
      },
      createdAt: dbProject.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const fileName = `${localProject.id}.json`;
    const filePath = path.join(userProjectsPath, fileName);
    
    // Write to file
    await fs.writeFile(filePath, JSON.stringify(localProject, null, 2), 'utf-8');
    
    // Add file info
    const stats = await fs.stat(filePath);
    localProject.fileInfo = {
      fileName,
      filePath,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
    
    console.log('Successfully imported project:', localProject.id);
    res.json(localProject);
  } catch (error) {
    console.error("Error importing project:", error);
    console.error("Error details:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    res.status(500).json({ error: "Failed to import project", details: error.message });
  }
});

export { router as localProjectsRouter };