import { Project } from "@/types/project";

// Convert server project to client format
function toClientFormat(serverProject: any): Project {
  // Parse JSON fields if they're strings with error handling
  let nodes = [];
  let edges = [];
  let metadata = {};
  
  try {
    if (typeof serverProject.nodes === 'string') {
      nodes = JSON.parse(serverProject.nodes);
    } else if (serverProject.nodes) {
      nodes = serverProject.nodes;
    }
    // Ensure nodes is an array
    if (!Array.isArray(nodes)) {
      console.error('Nodes is not an array:', nodes);
      nodes = [];
    }
  } catch (e) {
    console.error('Error parsing nodes:', e);
    nodes = [];
  }
  
  try {
    if (typeof serverProject.edges === 'string') {
      edges = JSON.parse(serverProject.edges);
    } else if (serverProject.edges) {
      edges = serverProject.edges;
    }
    // Ensure edges is an array
    if (!Array.isArray(edges)) {
      console.error('Edges is not an array:', edges);
      edges = [];
    }
  } catch (e) {
    console.error('Error parsing edges:', e);
    edges = [];
  }
  
  try {
    if (typeof serverProject.metadata === 'string') {
      metadata = JSON.parse(serverProject.metadata);
    } else if (serverProject.metadata) {
      metadata = serverProject.metadata;
    }
  } catch (e) {
    console.error('Error parsing metadata:', e);
    metadata = {};
  }
  
  return {
    // Use projectId field as the project ID
    id: serverProject.projectId || serverProject.id.toString(),
    name: serverProject.name,
    description: serverProject.description || '',
    category: serverProject.category || 'Custom',
    nodes: nodes,
    edges: edges,
    createdAt: serverProject.createdAt,
    updatedAt: serverProject.updatedAt,
    metadata: {
      ...metadata,
      version: (metadata as any).version || serverProject.version || '1.0',
      author: serverProject.author || serverProject.userId,
      tags: (metadata as any).tags || (serverProject.category ? [serverProject.category] : []),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      complexity: nodes.length <= 3 ? 'Simple' : 
                  nodes.length <= 8 ? 'Medium' : 'Complex'
    }
  };
}

export interface ProjectStorageService {
  // Common Team Projects (Database)
  getTeamProjects(): Promise<Project[]>;
  saveTeamProject(project: Project): Promise<Project>;
  updateTeamProject(id: string, project: Partial<Project>): Promise<Project>;
  deleteTeamProject(id: string): Promise<void>;

  // Local Projects (File System)
  getLocalProjects(): Promise<Project[]>;
  saveLocalProject(project: Project): Promise<Project>;
  updateLocalProject(id: string, project: Partial<Project>): Promise<Project>;
  deleteLocalProject(id: string): Promise<void>;
  importFromTeamToLocal(teamProjectId: string): Promise<Project>;

  // Example Projects (Templates)
  getExampleProjects(): Promise<Project[]>;
  createFromExample(exampleId: string, newName: string): Promise<Project>;

  // New Project Creation
  createNewProject(name: string, description?: string, template?: string): Promise<Project>;
}

export class ProjectStorageServiceImpl implements ProjectStorageService {
  private baseUrl = "/api";

  // Common Team Projects (Database)
  async getTeamProjects(): Promise<Project[]> {
    // Add cache busting to ensure fresh data
    const response = await fetch(`${this.baseUrl}/interface-builder/projects?t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache',
      }
    });
    if (!response.ok) throw new Error("Failed to fetch team projects");
    const data = await response.json();
    // Convert each project from server format to client format
    return data.map(toClientFormat);
  }

  async saveTeamProject(project: Project): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/interface-builder/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error("Failed to save team project");
    const data = await response.json();
    return toClientFormat(data);
  }

  async updateTeamProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/interface-builder/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error("Failed to update team project");
    const data = await response.json();
    return toClientFormat(data);
  }

  async deleteTeamProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/interface-builder/projects/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete team project");
  }

  // Local Projects (File System)
  async getLocalProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/local-projects`);
    if (!response.ok) throw new Error("Failed to fetch local projects");
    return response.json();
  }

  async saveLocalProject(project: Project): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/local-projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error("Failed to save local project");
    return response.json();
  }

  async updateLocalProject(id: string, project: Partial<Project>): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/local-projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });
    if (!response.ok) throw new Error("Failed to update local project");
    return response.json();
  }

  async deleteLocalProject(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/local-projects/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete local project");
  }

  async importFromTeamToLocal(teamProjectId: string): Promise<Project> {
    try {
      // First get the team project
      console.log('Fetching team project:', teamProjectId);
      const teamProject = await this.getTeamProject(teamProjectId);
      console.log('Team project fetched:', teamProject);
      
      // Then save it as local project via import endpoint
      const response = await fetch(`${this.baseUrl}/local-projects/import/${teamProjectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamProject),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Import failed:', response.status, errorText);
        throw new Error(`Failed to import project to local storage: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Import successful:', result);
      return result;
    } catch (error) {
      console.error('Error in importFromTeamToLocal:', error);
      throw error;
    }
  }

  // Example Projects (Templates)
  async getExampleProjects(): Promise<Project[]> {
    const response = await fetch(`${this.baseUrl}/local-projects/templates`);
    if (!response.ok) throw new Error("Failed to fetch example projects");
    return response.json();
  }

  async createFromExample(exampleId: string, newName: string): Promise<Project> {
    // Get the example project
    const examples = await this.getExampleProjects();
    const example = examples.find(p => p.id === exampleId);
    if (!example) throw new Error("Example project not found");

    // Create new project based on example
    const newProject: Project = {
      ...example,
      id: `example-${Date.now()}`,
      name: newName,
      description: `Based on ${example.name}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        ...example.metadata,
        source: "example",
        basedOn: example.name,
        author: "current-user", // This would be set by the backend
      },
    };

    // Save as local project
    return this.saveLocalProject(newProject);
  }

  // New Project Creation
  async createNewProject(name: string, description?: string, template?: string): Promise<Project> {
    const newProject: Project = {
      id: `new-${Date.now()}`,
      name,
      description: description || "",
      category: "User Created",
      nodes: [],
      edges: [],
      metadata: {
        version: "1.0.0",
        author: "current-user", // This would be set by the backend
        tags: [],
        nodeCount: 0,
        edgeCount: 0,
        complexity: "simple",
        template: template || "blank",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save as local project by default
    return this.saveLocalProject(newProject);
  }

  // Helper method to get a single team project
  private async getTeamProject(id: string): Promise<Project> {
    const response = await fetch(`${this.baseUrl}/interface-builder/projects/${id}`);
    if (!response.ok) throw new Error("Failed to fetch team project");
    const data = await response.json();
    return toClientFormat(data);
  }
}

// Export singleton instance
export const projectStorage = new ProjectStorageServiceImpl();

// Export project storage types
export enum ProjectStorageType {
  TEAM = "team",
  LOCAL = "local", 
  EXAMPLE = "example",
  NEW = "new"
}

export interface ProjectWithStorage extends Project {
  storageType: ProjectStorageType;
  fileInfo?: {
    fileName?: string;
    filePath?: string;
    size?: number;
    lastModified?: string;
  };
}