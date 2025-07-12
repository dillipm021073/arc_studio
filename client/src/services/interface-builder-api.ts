import { InterfaceProject } from '@/data/example-projects';

const API_BASE = '/api/interface-builder/projects';

export interface StoredInterfaceProject extends InterfaceProject {
  id: number; // Database ID
  author: string;
  createdAt: string;
  updatedAt: string;
}

// Convert client project to server format
function toServerFormat(project: InterfaceProject & { isTeamProject?: boolean; folderPath?: string }) {
  return {
    name: project.name,
    description: project.description,
    category: project.category,
    nodes: project.nodes,
    edges: project.edges,
    metadata: project.metadata,
    isTeamProject: project.isTeamProject,
    folderPath: project.folderPath
  };
}

// Convert server project to client format
function toClientFormat(serverProject: any): InterfaceProject {
  console.log('=== TO CLIENT FORMAT START ===');
  console.log('Server project:', serverProject);
  console.log('Nodes type from server:', typeof serverProject.nodes);
  console.log('Edges type from server:', typeof serverProject.edges);
  
  // Parse JSON fields if they're strings with error handling
  let nodes = [];
  let edges = [];
  let metadata = {};
  
  try {
    if (typeof serverProject.nodes === 'string') {
      console.log('Parsing nodes from string, length:', serverProject.nodes.length);
      nodes = JSON.parse(serverProject.nodes);
      console.log('Parsed nodes count:', nodes.length);
      
      // Log text nodes specifically
      const textNodes = nodes.filter((n: any) => n.type === 'textBox' || n.data?.text);
      if (textNodes.length > 0) {
        console.log('Text nodes after parsing:', textNodes.map((n: any) => ({
          id: n.id,
          text: n.data?.text,
          type: n.type
        })));
      }
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
    console.error('Nodes string that failed to parse:', serverProject.nodes?.substring(0, 500));
    nodes = [];
  }
  
  try {
    if (typeof serverProject.edges === 'string') {
      console.log('Parsing edges from string, length:', serverProject.edges.length);
      edges = JSON.parse(serverProject.edges);
      console.log('Parsed edges count:', edges.length);
      // Log first edge to check handles
      if (edges.length > 0) {
        console.log('First edge details:', {
          id: edges[0].id,
          source: edges[0].source,
          target: edges[0].target,
          sourceHandle: edges[0].sourceHandle,
          targetHandle: edges[0].targetHandle
        });
      }
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
  
  console.log('=== TO CLIENT FORMAT END ===');
  console.log('Final nodes count:', nodes.length);
  console.log('Final edges count:', edges.length);
  
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
      version: metadata.version || serverProject.version || '1.0',
      author: serverProject.author || serverProject.userId,
      tags: metadata.tags || (serverProject.category ? [serverProject.category] : []),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      complexity: nodes.length <= 3 ? 'Simple' : 
                  nodes.length <= 8 ? 'Medium' : 'Complex'
    },
    isTeamProject: serverProject.isTeamProject || false
  };
}

export const interfaceBuilderApi = {
  // Get all projects for the current user
  async getAllProjects(): Promise<InterfaceProject[]> {
    try {
      const response = await fetch(API_BASE, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map(toClientFormat);
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },

  // Get a specific project
  async getProject(projectId: string, bustCache: boolean = false): Promise<InterfaceProject | null> {
    try {
      console.log('=== API GET PROJECT START ===');
      console.log('Fetching project ID:', projectId);
      console.log('Cache busting:', bustCache);
      
      // Add cache-busting query parameter to ensure fresh data
      const url = bustCache 
        ? `${API_BASE}/${projectId}?t=${Date.now()}`
        : `${API_BASE}/${projectId}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (response.status === 404) {
        console.log('Project not found');
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw project data from server:', data);
      console.log('Nodes type:', typeof data.nodes);
      console.log('Edges type:', typeof data.edges);
      
      const formatted = toClientFormat(data);
      console.log('Formatted project:', formatted);
      console.log('=== API GET PROJECT END ===');
      
      return formatted;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Create a new project
  async createProject(project: InterfaceProject & { isTeamProject?: boolean }): Promise<InterfaceProject> {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(toServerFormat(project)),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create project: ${response.statusText}`);
      }

      const data = await response.json();
      return toClientFormat(data);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  // Update an existing project
  async updateProject(project: InterfaceProject): Promise<InterfaceProject> {
    try {
      console.log('=== API UPDATE PROJECT START ===');
      console.log('Project ID:', project.id);
      console.log('Project to update:', project);
      
      const serverData = toServerFormat(project);
      console.log('Data being sent to server:', serverData);
      console.log('Stringified body:', JSON.stringify(serverData));
      
      const response = await fetch(`${API_BASE}/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(serverData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Server error response:', error);
        throw new Error(error.error || `Failed to update project: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Raw server response:', data);
      
      const formattedData = toClientFormat(data);
      console.log('Formatted response:', formattedData);
      console.log('=== API UPDATE PROJECT END ===');
      
      return formattedData;
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  },

  // Delete a project
  async deleteProject(projectId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete project: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  },

  // Sync projects from localStorage to database (migration helper)
  async syncFromLocalStorage(): Promise<void> {
    try {
      // Check if migration has already been done
      const migrationDone = localStorage.getItem('interface-builder-migration-complete');
      if (migrationDone === 'true') {
        return;
      }

      const localProjects = JSON.parse(localStorage.getItem('interface-builder-projects') || '[]');
      
      if (localProjects.length === 0) {
        // Mark migration as complete even if no projects to migrate
        localStorage.setItem('interface-builder-migration-complete', 'true');
        return;
      }

      // Get existing server projects
      const serverProjects = await this.getAllProjects();
      const serverProjectIds = new Set(serverProjects.map(p => p.id));

      // Upload projects that don't exist on server
      let syncedCount = 0;
      for (const localProject of localProjects) {
        if (!serverProjectIds.has(localProject.id)) {
          try {
            await this.createProject(localProject);
            console.log(`Synced project ${localProject.name} to server`);
            syncedCount++;
          } catch (error) {
            console.error(`Failed to sync project ${localProject.name}:`, error);
          }
        }
      }

      // Clear localStorage and mark migration as complete
      localStorage.removeItem('interface-builder-projects');
      localStorage.setItem('interface-builder-migration-complete', 'true');
      console.log(`LocalStorage projects migrated to database. Synced ${syncedCount} projects.`);
    } catch (error) {
      console.error('Error syncing projects from localStorage:', error);
    }
  }
};