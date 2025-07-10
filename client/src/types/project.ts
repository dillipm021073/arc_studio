import { Node, Edge } from 'reactflow';

export interface Project {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    version?: string;
    author?: string;
    tags?: string[];
    nodeCount?: number;
    edgeCount?: number;
    complexity?: string;
    lastSaved?: string;
    template?: string;
    source?: string;
    basedOn?: string;
    originalDbId?: string;
    importedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMetadata {
  version: string;
  author: string;
  tags: string[];
  nodeCount: number;
  edgeCount: number;
  complexity: 'Simple' | 'Medium' | 'Complex';
  lastSaved?: string;
  template?: string;
  source?: string;
  basedOn?: string;
  originalDbId?: string;
  importedAt?: string;
}

export interface InterfaceProject extends Project {
  // Legacy interface for compatibility
  metadata: ProjectMetadata;
}