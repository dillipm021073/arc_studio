import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge } from 'reactflow';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Palette, 
  Save, 
  Share2, 
  Settings, 
  Info,
  BookOpen,
  Lightbulb,
  Zap,
  FolderOpen,
  Plus,
  Box,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  GitBranch,
  Code,
  TestTube2,
  HelpCircle,
  ImageIcon,
  Undo2,
  Redo2,
  Copy,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';

import ComponentLibrary, { ComponentTemplate } from '@/components/interface-builder/component-library';
import DragDropCanvas from '@/components/interface-builder/drag-drop-canvas';
import ProjectManager from '@/components/interface-builder/project-manager';
import Simple3DFallback from '@/components/interface-builder/3d-viewer/simple-3d-fallback';
import ViewerControls from '@/components/interface-builder/3d-viewer/viewer-controls';
import { projectStorage, ProjectStorageType } from '@/services/project-storage';
import type { ProjectWithStorage } from '@/services/project-storage';
import SaveAsDialog from '@/components/interface-builder/save-as-dialog';
import GenerateFromLobDialog from '@/components/interface-builder/generate-from-lob-dialog';
import { UmlManagerDialog } from '@/components/interface-builder/uml-manager-dialog';
import { useToast } from '@/hooks/use-toast';
import { InterfaceProject } from '@/data/example-projects';
import { interfaceBuilderApi } from '@/services/interface-builder-api';
import { logEdgeDetails, validateEdges } from '@/utils/test-edge-persistence';
import { api } from '@/lib/api';

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

export default function InterfaceBuilder() {
  const { toast } = useToast();
  const [selectedComponent, setSelectedComponent] = useState<ComponentTemplate | null>(null);
  const [showProperties, setShowProperties] = useState(false);
  const [currentProject, setCurrentProject] = useState<InterfaceProject | null>(null);
  const [currentProjectStorageType, setCurrentProjectStorageType] = useState<'team' | 'local' | null>(null);
  const [canvasData, setCanvasData] = useState<{ nodes: Node[], edges: Edge[] }>({
    nodes: [],
    edges: []
  });
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [view3DControls, setView3DControls] = useState({
    animationEnabled: true,
    labelsEnabled: true,
    gridEnabled: true,
    connectionsEnabled: true,
    animationSpeed: 1
  });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [copiedEdges, setCopiedEdges] = useState<Edge[]>([]);
  const [showSaveAsDialog, setShowSaveAsDialog] = useState(false);
  const [showGenerateFromLobDialog, setShowGenerateFromLobDialog] = useState(false);
  const [isLibraryMinimized, setIsLibraryMinimized] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [canvasKey, setCanvasKey] = useState(0);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showUmlManager, setShowUmlManager] = useState(false);
  
  // Canvas toolbar state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedNodesCount, setSelectedNodesCount] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [showValidationDetails, setShowValidationDetails] = useState(true);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Canvas ref for accessing methods
  const canvasRef = useRef<any>(null);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        // First, sync any localStorage projects to the database
        await interfaceBuilderApi.syncFromLocalStorage();

        // Load current project ID from localStorage
        const savedProjectId = localStorage.getItem('interface-builder-current-project-id');
        if (savedProjectId) {
          // Load project from API
          const project = await interfaceBuilderApi.getProject(savedProjectId);
          if (project) {
            setCurrentProject(project);
            // Ensure nodes and edges are arrays
            const safeNodes = Array.isArray(project.nodes) ? project.nodes : [];
            const safeEdges = Array.isArray(project.edges) ? project.edges : [];
            setCanvasData({ nodes: safeNodes, edges: safeEdges });
            // Force canvas re-render
            setCanvasKey(prev => prev + 1);
          } else {
            // Project ID exists but project not found (may have been deleted)
            localStorage.removeItem('interface-builder-current-project-id');
          }
        }
        
        // Remove old canvas data from localStorage if it exists (cleanup)
        localStorage.removeItem('interface-builder-current-canvas');

        // Load UI state
        const savedUIState = localStorage.getItem('interface-builder-ui-state');
        if (savedUIState) {
          const uiState = JSON.parse(savedUIState);
          setViewMode(uiState.viewMode || '2d');
          setIsLibraryMinimized(uiState.isLibraryMinimized || false);
          if (uiState.view3DControls) {
            setView3DControls(uiState.view3DControls);
          }
        }
      } catch (error) {
        console.error('Failed to load persisted state:', error);
        toast({
          title: 'Error Loading Project',
          description: 'Failed to load your saved project. You can continue working offline.',
          variant: 'destructive'
        });
      }
    };

    loadPersistedState();
  }, [toast]);

  // Remove auto-persist to localStorage - only save to database when user triggers save
  // Canvas data is now persisted through the database via the save functionality

  useEffect(() => {
    const persistCurrentProject = () => {
      try {
        if (currentProject) {
          localStorage.setItem('interface-builder-current-project-id', currentProject.id);
        } else {
          localStorage.removeItem('interface-builder-current-project-id');
        }
      } catch (error) {
        console.error('Failed to persist current project:', error);
      }
    };

    persistCurrentProject();
  }, [currentProject]);

  useEffect(() => {
    const persistUIState = () => {
      try {
        const uiState = {
          viewMode,
          isLibraryMinimized,
          view3DControls
        };
        localStorage.setItem('interface-builder-ui-state', JSON.stringify(uiState));
      } catch (error) {
        console.error('Failed to persist UI state:', error);
      }
    };

    persistUIState();
  }, [viewMode, isLibraryMinimized, view3DControls]);

  // Handle component selection from library
  const handleComponentSelect = useCallback((component: ComponentTemplate) => {
    console.log('Component selected:', component.type, component.id);
    
    // Check if it's a UML component
    if (component.type === 'uml' || component.id === 'uml-folder') {
      console.log('Opening UML manager');
      setShowUmlManager(true);
      return;
    }
    
    setSelectedComponent(component);
    setShowProperties(true);
    
    toast({
      title: 'Component Selected',
      description: `Selected ${component.name}. Drag it to the canvas to add it.`,
    });
  }, [toast]);

  // Handle project loading
  const handleLoadProject = useCallback((project: InterfaceProject | ProjectWithStorage) => {
    
    setCurrentProject(project);
    
    // Check if it's a ProjectWithStorage and set storage type
    if ('storageType' in project) {
      setCurrentProjectStorageType(project.storageType === ProjectStorageType.TEAM ? 'team' : 'local');
    } else {
      // Default to team storage for backwards compatibility
      setCurrentProjectStorageType('team');
    }
    
    // Ensure nodes and edges are arrays
    const safeNodes = Array.isArray(project.nodes) ? project.nodes : [];
    const safeEdges = Array.isArray(project.edges) ? project.edges : [];
    
    
    setCanvasData({ nodes: safeNodes, edges: safeEdges });
    setSelectedComponent(null);
    setShowProperties(false);
    
    // Force canvas re-render with new data
    setCanvasKey(prev => prev + 1);
    
    toast({
      title: 'Project Loaded',
      description: `${project.name} loaded successfully.`,
    });
  }, [toast]);

  // Handle project saving
  const handleSaveProject = useCallback(async (projectData: { name: string; description: string; category: string }) => {
    setSaveStatus('saving');
    try {
      if (currentProject) {
        // Check if this is an example project - they cannot be directly saved
        if ('storageType' in currentProject && (currentProject as any).storageType === ProjectStorageType.EXAMPLE) {
          // Force save as new project
          setShowSaveAsDialog(true);
          setSaveStatus('saved');
          toast({
            title: 'Save As Required',
            description: 'Example projects are read-only. Please use "Save As" to create your own copy.',
            variant: 'default'
          });
          return;
        }
        
        // Update existing project
        const updatedProject: InterfaceProject = {
          ...currentProject,
          name: projectData.name,
          description: projectData.description,
          category: projectData.category as any,
          nodes: canvasData.nodes,
          edges: canvasData.edges,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...currentProject.metadata,
            nodeCount: canvasData.nodes.length,
            edgeCount: canvasData.edges.length,
            complexity: canvasData.nodes.length <= 3 ? 'Simple' : 
                       canvasData.nodes.length <= 8 ? 'Medium' : 'Complex'
          }
        };
        
        // Save to appropriate storage based on current storage type
        let savedProject: InterfaceProject;
        
        if (currentProjectStorageType === 'local') {
          savedProject = await projectStorage.updateLocalProject(updatedProject.id, updatedProject);
        } else {
          savedProject = await interfaceBuilderApi.updateProject(updatedProject);
        }
        
        setCurrentProject(savedProject);
        setSaveStatus('saved');
        
        toast({
          title: 'Project Saved',
          description: `${savedProject.name} has been saved to ${currentProjectStorageType === 'local' ? 'local storage' : 'the database'} successfully`,
        });
      } else {
        // Create new project
        const newProject: InterfaceProject = {
          id: '', // Will be assigned by server
          name: projectData.name,
          description: projectData.description,
          category: projectData.category as any,
          nodes: canvasData.nodes,
          edges: canvasData.edges,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            nodeCount: canvasData.nodes.length,
            edgeCount: canvasData.edges.length,
            complexity: canvasData.nodes.length <= 3 ? 'Simple' : 
                       canvasData.nodes.length <= 8 ? 'Medium' : 'Complex',
            tags: [projectData.category]
          }
        };
        
        // Create in API
        const savedProject = await interfaceBuilderApi.createProject(newProject);
        setCurrentProject(savedProject);
        setSaveStatus('saved');
        
        toast({
          title: 'Project Created',
          description: `${savedProject.name} has been created and saved to the database`,
        });
      }
    } catch (error) {
      setSaveStatus('unsaved');
      console.error('Failed to save project:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save project to database. Your changes are preserved locally.',
        variant: 'destructive'
      });
    }
  }, [currentProject, canvasData, currentProjectStorageType, toast]);

  // Add save in progress flag to prevent duplicate saves
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle canvas save (user-triggered)
  const handleCanvasSave = useCallback(async (nodes: Node[], edges: Edge[]) => {
    // Prevent duplicate saves
    if (isSaving) {
      return;
    }
    
    setCanvasData({ nodes, edges });
    
    // Auto-update current project if available
    if (currentProject) {
      setIsSaving(true);
      setSaveStatus('saving');
      try {
        // Clean nodes and edges to remove React Flow internal properties
        const cleanNodes = nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          // Only include width/height if they exist
          ...(node.width && { width: node.width }),
          ...(node.height && { height: node.height })
        }));
        
        const cleanEdges = edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle }),
          ...(edge.targetHandle && { targetHandle: edge.targetHandle }),
          ...(edge.type && { type: edge.type }),
          ...(edge.animated && { animated: edge.animated }),
          ...(edge.data && { data: edge.data }),
          ...(edge.style && { style: edge.style }),
          ...(edge.label && { label: edge.label }),
          ...(edge.labelStyle && { labelStyle: edge.labelStyle }),
          ...(edge.labelBgStyle && { labelBgStyle: edge.labelBgStyle }),
          ...(edge.labelBgPadding && { labelBgPadding: edge.labelBgPadding }),
          ...(edge.labelBgBorderRadius && { labelBgBorderRadius: edge.labelBgBorderRadius }),
          ...(edge.markerEnd && { markerEnd: edge.markerEnd })
        }));
        
        const updatedProject: InterfaceProject = {
          ...currentProject,
          nodes: cleanNodes,
          edges: cleanEdges,
          updatedAt: new Date().toISOString(),
          metadata: {
            ...currentProject.metadata,
            nodeCount: nodes.length,
            edgeCount: edges.length,
            complexity: nodes.length <= 3 ? 'Simple' : 
                       nodes.length <= 8 ? 'Medium' : 'Complex'
          }
        };
        
        
        // Save to appropriate storage based on current storage type
        let savedProject: InterfaceProject;
        
        if (currentProjectStorageType === 'local') {
          savedProject = await projectStorage.updateLocalProject(updatedProject.id, updatedProject);
        } else {
          savedProject = await interfaceBuilderApi.updateProject(updatedProject);
        }
        
        
        let verifiedProject: InterfaceProject;
        
        if (currentProjectStorageType === 'local') {
          // For local storage, the response is already accurate
          verifiedProject = savedProject;
        } else {
          // For database storage, fetch again to verify with cache busting
          const fetchedProject = await interfaceBuilderApi.getProject(savedProject.id, true);
          if (!fetchedProject) {
            throw new Error('Failed to verify saved project');
          }
          verifiedProject = fetchedProject;
        }
        
        
        setCurrentProject(verifiedProject);
        setSaveStatus('saved');
        
        toast({
          title: 'Canvas Saved',
          description: `Your interface design has been saved to ${currentProjectStorageType === 'local' ? 'local storage' : 'the database'}.`,
        });
      } catch (error) {
        setSaveStatus('unsaved');
        console.error('Failed to save canvas:', error);
        
        toast({
          title: 'Save Failed',
          description: 'Failed to save changes to database. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      // No project loaded
      setSaveStatus('unsaved');
      
      toast({
        title: 'No Project Loaded',
        description: 'Please save your work as a project to persist changes.',
        variant: 'default'
      });
    }
  }, [currentProject, currentProjectStorageType, toast]);

  // Remove auto-save functionality - user must manually save

  // Handle canvas export
  const handleCanvasExport = useCallback((data: any) => {
    
    toast({
      title: 'Design Exported',
      description: 'Interface design exported as JSON file.',
    });
  }, [toast]);

  // Custom validation logic
  const handleCanvasValidate = useCallback(async (nodes: Node[], edges: Edge[]): Promise<ValidationResult[]> => {
    try {
      const results: ValidationResult[] = [];
      
      // Safety checks
      if (!Array.isArray(nodes)) {
        console.error('Invalid nodes array in validation');
        return results;
      }
      
      if (!Array.isArray(edges)) {
        console.error('Invalid edges array in validation');
        return results;
      }
      
      // Advanced validation rules
      const apiNodes = nodes.filter(n => n?.type === 'interface' && n?.data?.id?.includes('api'));
      const appNodes = nodes.filter(n => n?.type === 'application');
      const processNodes = nodes.filter(n => n?.type === 'process');
      
      // Check for architectural best practices
      if (apiNodes.length === 0 && appNodes.length > 1) {
        results.push({
          type: 'warning',
          message: 'Consider adding API interfaces for better service decoupling',
        });
      }
      
      // Check for security considerations
      const hasSecureConnections = edges.some(e => e?.data?.security === 'encrypted');
      if (edges.length > 0 && !hasSecureConnections) {
        results.push({
          type: 'warning',
          message: 'No encrypted connections found. Consider adding security measures.',
        });
      }
      
      // Check process coverage
      if (processNodes.length > 0 && appNodes.length === 0) {
        results.push({
          type: 'info',
          message: 'Business processes defined but no supporting applications identified',
        });
      }
      
      // Performance analysis
      edges.forEach(edge => {
        if (edge?.data?.errorRate && edge.data.errorRate > 10) {
          results.push({
            type: 'error',
            message: `High error rate (${edge.data.errorRate}%) detected in connection`,
            edgeId: edge.id,
          });
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error in handleCanvasValidate:', error);
      return [];
    }
  }, []);

  // Handle close project
  const handleCloseProject = useCallback(() => {
    setCurrentProject(null);
    setCanvasData({ nodes: [], edges: [] });
    setSelectedComponent(null);
    setShowProperties(false);
    setSaveStatus('saved');
    
    // Clear from localStorage
    localStorage.removeItem('interface-builder-current-project-id');
    localStorage.removeItem('interface-builder-current-canvas');
    
    toast({
      title: 'Project Closed',
      description: 'The project has been closed. You can start fresh or load another project.',
    });
  }, [toast]);

  // 3D view handlers
  const handle3DNodeClick = useCallback((nodeId: string) => {
    const node = canvasData.nodes.find(n => n.id === nodeId);
    if (node && node.data) {
      setSelectedComponent({
        id: node.data.id,
        type: node.type as any,
        category: node.data.category || 'Custom',
        name: node.data.name,
        description: node.data.description,
        icon: node.data.icon,
        color: node.data.color,
        properties: node.data.properties,
        connectionPoints: node.data.connectionPoints
      });
      setShowProperties(true);
    }
  }, [canvasData.nodes]);

  const handle3DControlChange = useCallback((key: string, value: any) => {
    setView3DControls(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle copy operation
  const handleCopy = useCallback((selectedNodes?: Node[], selectedEdges?: Edge[]) => {
    // If selectedNodes is provided, use those (from DragDropCanvas)
    // Otherwise, copy all nodes (for menu copy action)
    const nodesToCopy = selectedNodes || canvasData.nodes;
    const edgesToCopy = selectedEdges || canvasData.edges;
    
    if (nodesToCopy.length > 0) {
      setCopiedNodes(nodesToCopy);
      setCopiedEdges(edgesToCopy);
      toast({
        title: 'Copied to Clipboard',
        description: `${nodesToCopy.length} components and ${edgesToCopy.length} connections copied`,
      });
    }
  }, [canvasData, toast]);

  // Handle generate from LOB
  const handleGenerateFromLob = useCallback((data: any) => {
    // Clear existing canvas if needed
    if (canvasData.nodes.length > 0 || canvasData.edges.length > 0) {
      const confirmClear = window.confirm('This will clear the current canvas. Continue?');
      if (!confirmClear) return;
    }

    // Set the generated nodes and edges
    setCanvasData({
      nodes: data.nodes,
      edges: data.edges
    });

    // Force canvas re-render by updating key
    setCanvasKey(prev => prev + 1);

    // Update save status
    setSaveStatus('unsaved');

    toast({
      title: 'Diagram Generated',
      description: `Generated ${data.nodes.length} applications and ${data.edges.length} interfaces from ${data.metadata.lobs.join(', ')}`,
    });
  }, [canvasData, toast]);

  // Handle node selection from canvas
  const handleNodeSelection = useCallback((node: Node | null) => {
    setSelectedNode(node);
    if (node) {
      setSelectedComponent(null); // Clear component library selection when node is selected
      setShowProperties(true);
    }
  }, []);

  // Canvas toolbar handlers
  const handleDownloadPNG = useCallback(() => {
    canvasRef.current?.downloadPNG();
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  const handleValidate = useCallback(() => {
    canvasRef.current?.validate();
  }, []);

  const handleSelectAll = useCallback(() => {
    canvasRef.current?.selectAll();
  }, []);

  const handleDeselectAll = useCallback(() => {
    canvasRef.current?.deselectAll();
  }, []);

  const handleClearCanvas = useCallback(() => {
    canvasRef.current?.clear();
  }, []);

  // Handle node save
  const handleNodeSave = useCallback(async (nodeId: string, data: any) => {
    
    // Update local state first
    setCanvasData((prev) => {
      const updatedData = {
        ...prev,
        nodes: prev.nodes.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data: { ...node.data, ...data } };
          }
          return node;
        })
      };
      
      // Update selected node if it's the one being edited
      setSelectedNode(currentSelectedNode => 
        currentSelectedNode && currentSelectedNode.id === nodeId
          ? { ...currentSelectedNode, data: { ...currentSelectedNode.data, ...data } }
          : currentSelectedNode
      );
      
      // Save to database if project is loaded
      if (currentProject) {
        setSaveStatus('saving');
        const saveProject = async () => {
          try {
            const updatedProject: InterfaceProject = {
              ...currentProject,
              nodes: updatedData.nodes,
              edges: updatedData.edges,
              updatedAt: new Date().toISOString(),
              metadata: {
                ...currentProject.metadata,
                nodeCount: updatedData.nodes.length,
                edgeCount: updatedData.edges.length,
                complexity: updatedData.nodes.length <= 3 ? 'Simple' : 
                           updatedData.nodes.length <= 8 ? 'Medium' : 'Complex'
              }
            };
            
            // Save to API
            const savedProject = await interfaceBuilderApi.updateProject(updatedProject);
            setCurrentProject(savedProject);
            setSaveStatus('saved');
          } catch (error) {
            setSaveStatus('unsaved');
            console.error('Failed to save node changes:', error);
            
            // Still save to localStorage as backup
            localStorage.setItem('interface-builder-current-canvas', JSON.stringify(updatedData));
            
            toast({
              title: 'Save Error',
              description: 'Failed to save to database. Changes saved locally.',
              variant: 'destructive'
            });
          }
        };
        
        // Execute save asynchronously
        saveProject();
      } else {
        setSaveStatus('unsaved');
        // Save to localStorage if no project
        localStorage.setItem('interface-builder-current-canvas', JSON.stringify(updatedData));
      }
      
      return updatedData;
    });
    
    toast({
      title: 'Component Updated',
      description: `${data.name} has been updated successfully`,
    });
  }, [currentProject, toast]);

  // Handle paste operation
  const handlePaste = useCallback(() => {
    if (copiedNodes.length > 0) {
      const offset = 100; // Offset for pasted nodes
      const timestamp = Date.now();
      
      // Create new nodes with offset positions and new IDs
      const nodeIdMap = new Map<string, string>();
      const newNodes = copiedNodes.map(node => {
        const newId = `${node.id}-copy-${timestamp}`;
        nodeIdMap.set(node.id, newId);
        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offset,
            y: node.position.y + offset,
          },
          data: {
            ...node.data,
            name: `${node.data.name} (Copy)`,
          },
          selected: false, // Ensure pasted nodes are not selected
        };
      });
      
      // Create new edges with updated node references
      const newEdges = copiedEdges
        .filter(edge => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
        .map(edge => ({
          ...edge,
          id: `${edge.id}-copy-${timestamp}`,
          source: nodeIdMap.get(edge.source)!,
          target: nodeIdMap.get(edge.target)!,
        }));
      
      // First, deselect all existing nodes
      setCanvasData(prev => ({
        nodes: [
          ...prev.nodes.map(node => ({ ...node, selected: false })),
          ...newNodes
        ],
        edges: [...prev.edges, ...newEdges],
      }));
      
      toast({
        title: 'Pasted Successfully',
        description: `Added ${newNodes.length} components and ${newEdges.length} connections`,
      });
      
      // Return the new nodes for DragDropCanvas to handle
      return newNodes;
    } else {
      toast({
        title: 'Nothing to Paste',
        description: 'Copy components from a project first',
        variant: 'destructive',
      });
      return [];
    }
  }, [copiedNodes, copiedEdges, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Copy: Ctrl/Cmd + C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        handleCopy();
      }
      
      // Paste: Ctrl/Cmd + V
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        handlePaste();
      }
      
      // Save: Ctrl/Cmd + S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (currentProject) {
          // Check if this is an example project
          if ('storageType' in currentProject && (currentProject as any).storageType === ProjectStorageType.EXAMPLE) {
            setShowSaveAsDialog(true);
            toast({
              title: 'Save As Required',
              description: 'Example projects are read-only. Please use "Save As" to create your own copy.',
              variant: 'default'
            });
            return;
          }
          
          // Prevent duplicate saves
          if (isSaving || saveStatus === 'saving') {
            return;
          }
          
          // Save project (this will handle both canvas and project save)
          handleSaveProject({
            name: currentProject.name,
            description: currentProject.description,
            category: currentProject.category
          });
        }
      }
      
      // Toggle library: Ctrl/Cmd + L
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        if (viewMode === '2d') {
          setIsLibraryMinimized(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, currentProject, handleSaveProject]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        {/* First row */}
        <div className="flex items-center justify-between p-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Palette className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Interface Builder</h1>
                {currentProject && (
                  <Badge variant="outline" className="text-xs border-blue-600 text-blue-400">
                    {currentProject.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-400">Design and visualize your system architecture</p>
            </div>
          </div>
          
          {/* Component and Connection Counts */}
          <div className="flex items-center gap-4 px-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Components:</span>
              <span className="text-white font-medium">{canvasData.nodes.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Connections:</span>
              <span className="text-white font-medium">{canvasData.edges.length}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 text-sm">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-600 hover:bg-gray-700 h-7 px-2"
              onClick={() => setShowGenerateFromLobDialog(true)}
            >
              <GitBranch className="h-3 w-3 mr-1" />
              Generate LOB
            </Button>
            
            <ProjectManager
              currentProject={currentProject}
              onLoadProject={handleLoadProject}
              onSaveProject={handleSaveProject}
            >
              <Button variant="outline" size="sm" className="border-gray-600 hover:bg-gray-700 h-7 px-2">
                <FolderOpen className="h-3 w-3 mr-1" />
                Load Project
              </Button>
            </ProjectManager>
            
            {currentProject && (
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-600 hover:bg-gray-700 h-7 px-2"
                onClick={handleCloseProject}
                title="Close current project"
              >
                <X className="h-3 w-3 mr-1" />
                Close Project
              </Button>
            )}
            
            {/* View Mode Toggle */}
            <div className="flex border border-gray-600 rounded-md overflow-hidden">
              <Button
                size="sm"
                variant={viewMode === '2d' ? 'default' : 'ghost'}
                onClick={() => setViewMode('2d')}
                className="rounded-none border-0 h-7 px-2"
              >
                <Layers className="h-3 w-3 mr-1" />
                2D
              </Button>
              <Button
                size="sm"
                variant={viewMode === '3d' ? 'default' : 'ghost'}
                onClick={() => setViewMode('3d')}
                className="rounded-none border-0 h-7 px-2"
              >
                <Box className="h-3 w-3 mr-1" />
                3D
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-600 hover:bg-gray-700 h-7 px-2"
              onClick={() => setShowHelpDialog(true)}
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Guide
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="border-gray-600 hover:bg-gray-700 h-7 px-2"
              onClick={() => {
                if (currentProject) {
                  const shareData = {
                    title: currentProject.name,
                    text: `Check out this ${currentProject.name} architecture built with Interface Builder`,
                    url: window.location.href,
                  };
                  
                  if (navigator.share) {
                    navigator.share(shareData).catch(() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({
                        title: 'Link Copied!',
                        description: 'Project link has been copied to clipboard',
                      });
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: 'Link Copied!',
                      description: 'Project link has been copied to clipboard',
                    });
                  }
                } else {
                  toast({
                    title: 'No Project to Share',
                    description: 'Please load a project first before sharing',
                    variant: 'destructive',
                  });
                }
              }}
            >
              <Share2 className="h-3 w-3 mr-1" />
              Share
            </Button>
          </div>
          
          <div className="flex gap-1.5">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 h-7 px-2"
              onClick={async () => {
                if (currentProject) {
                  if ('storageType' in currentProject && (currentProject as any).storageType === ProjectStorageType.EXAMPLE) {
                    setShowSaveAsDialog(true);
                    toast({
                      title: 'Save As Required',
                      description: 'Example projects are read-only. Please use "Save As" to create your own copy.',
                      variant: 'default'
                    });
                    return;
                  }
                  
                  // Prevent duplicate saves
                  if (isSaving || saveStatus === 'saving') {
                    return;
                  }
                  
                  try {
                    // First update canvas data
                    await handleCanvasSave(canvasData.nodes, canvasData.edges);
                    
                    // Then save project (handleSaveProject will show the toast)
                    await handleSaveProject({
                      name: currentProject.name,
                      description: currentProject.description,
                      category: currentProject.category
                    });
                  } catch (error) {
                    console.error('Save failed:', error);
                  }
                } else {
                  toast({
                    title: 'No Project Loaded',
                    description: 'Please load or create a project first',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Save className="h-3 w-3 mr-1" />
              Save
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="border-gray-600 hover:bg-gray-700 h-7 px-2"
              onClick={() => {
                if (canvasData.nodes.length > 0) {
                  setShowSaveAsDialog(true);
                } else {
                  toast({
                    title: 'Canvas Empty',
                    description: 'Add some components before saving as a new project',
                    variant: 'destructive'
                  });
                }
              }}
            >
              <Save className="h-3 w-3 mr-1" />
              Save As
            </Button>
          </div>
        </div>
        
        {/* Second row - Canvas Toolbar */}
        <div className="flex items-center gap-2 px-3 pb-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.downloadPNG()}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
          >
            <ImageIcon className="h-3 w-3 mr-1" />
            Download PNG
          </Button>
          <div className="border-l border-gray-600 h-5" />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.undo()}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="h-3 w-3 mr-1" />
            Undo
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.redo()}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="h-3 w-3 mr-1" />
            Redo
          </Button>
          <div className="border-l border-gray-600 h-5" />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCopy}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
            disabled={canvasData.nodes.length === 0}
          >
            <Copy className="h-3 w-3 mr-1" />
            Copy
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handlePaste}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
          >
            <FileText className="h-3 w-3 mr-1" />
            Paste
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.validate()}
            onDoubleClick={() => canvasRef.current?.hideValidation()}
            disabled={isValidating}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
            title="Click to validate, double-click to hide results"
          >
            <Eye className="h-3 w-3 mr-1" />
            Validate
          </Button>
          <div className="border-l border-gray-600 h-5" />
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.selectAll()}
            disabled={canvasData.nodes.length === 0}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
          >
            Select All
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.deselectAll()}
            disabled={selectedNodesCount === 0}
            className="border-gray-600 hover:bg-gray-700 h-7 px-2"
          >
            Deselect
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => canvasRef.current?.clear()}
            className="border-red-600 text-red-400 hover:bg-red-900/20 h-7 px-2"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
          {/* Selected nodes indicator */}
          {selectedNodesCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-700/50 rounded text-sm ml-2">
              <span className="text-blue-400">Selected:</span>
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                {selectedNodesCount}
              </Badge>
            </div>
          )}
          
          {/* Validation Results Panel */}
          {Array.isArray(validationResults) && validationResults.length > 0 && (
            <div className="flex items-center ml-2">
              <Card className="bg-gray-700/50 border-gray-600 h-7">
                <div className="flex items-center px-3 h-full">
                  <button
                    className="flex items-center gap-1 hover:bg-gray-600/50 rounded px-1 transition-colors"
                    onClick={() => setShowValidationDetails(!showValidationDetails)}
                    title={showValidationDetails ? "Click to hide details" : "Click to show details"}
                  >
                    <span className="text-xs font-medium text-gray-300">Validation:</span>
                    {validationResults.filter(r => r?.type === 'error').length > 0 && (
                      <Badge variant="destructive" className="text-xs h-4">
                        {validationResults.filter(r => r?.type === 'error').length}
                      </Badge>
                    )}
                    {validationResults.filter(r => r?.type === 'warning').length > 0 && (
                      <Badge variant="outline" className="text-xs h-4 text-yellow-400 border-yellow-400">
                        {validationResults.filter(r => r?.type === 'warning').length}
                      </Badge>
                    )}
                    {validationResults.filter(r => r?.type === 'info').length > 0 && (
                      <Badge variant="outline" className="text-xs h-4 text-blue-400 border-blue-400">
                        {validationResults.filter(r => r?.type === 'info').length}
                      </Badge>
                    )}
                    {showValidationDetails ? (
                      <ChevronUp className="h-3 w-3 text-gray-400 ml-1" />
                    ) : (
                      <ChevronDown className="h-3 w-3 text-gray-400 ml-1" />
                    )}
                  </button>
                </div>
              </Card>
            </div>
          )}
        </div>
        
        {/* Validation Details Panel - Shows below header when expanded */}
        {validationResults.length > 0 && showValidationDetails && (
          <div className="px-3 pb-2">
            <Card className="bg-gray-800/95 border-gray-700">
              <div className="p-2 max-h-48 overflow-y-auto">
                <div className="space-y-1">
                  {validationResults.map((result, index) => (
                    <div 
                      key={index} 
                      className={`text-xs p-2 rounded ${
                        result.type === 'error' 
                          ? 'bg-red-900/20 border border-red-700 text-red-400' 
                          : result.type === 'warning' 
                          ? 'bg-yellow-900/20 border border-yellow-700 text-yellow-400'
                          : 'bg-blue-900/20 border border-blue-700 text-blue-400'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="font-semibold uppercase">{result.type}:</span>
                        <span className="flex-1">{result.message}</span>
                      </div>
                      {result.nodeId && (
                        <div className="mt-1 text-gray-500">
                          Component: {canvasData.nodes.find(n => n.id === result.nodeId)?.data?.name || result.nodeId}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Component Library Sidebar - Only show in 2D mode */}
        {viewMode === '2d' && (
          <div className={`transition-all duration-300 ${isLibraryMinimized ? 'w-12' : 'w-80'} relative`}>
            {isLibraryMinimized ? (
              <div className="h-full bg-gray-900 border-r border-gray-700 flex flex-col items-center py-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLibraryMinimized(false)}
                  className="mb-4 hover:bg-gray-800 transition-colors"
                  title="Expand Component Library"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="flex-1 flex items-center justify-center">
                  <div className="writing-mode-vertical text-sm text-gray-400 select-none">
                    Component Library
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLibraryMinimized(false)}
                  className="mt-4 hover:bg-gray-800 transition-colors"
                  title="Expand Component Library"
                >
                  <Layers className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="relative h-full">
                <ComponentLibrary onComponentSelect={handleComponentSelect} />
                {/* Minimize button */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsLibraryMinimized(true)}
                  className="absolute top-4 right-2 z-10 hover:bg-gray-800"
                  title="Minimize Component Library (Ctrl+L)"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* Canvas Area */}
        <div className="flex-1 flex relative">
          {/* Floating Component Library Button - Show when minimized in 2D mode */}
          {viewMode === '2d' && isLibraryMinimized && (
            <Button
              size="lg"
              className="absolute top-4 left-4 z-40 bg-blue-600 hover:bg-blue-700 shadow-lg"
              onClick={() => setIsLibraryMinimized(false)}
              title="Open Component Library (Ctrl+L)"
            >
              <Layers className="h-5 w-5 mr-2" />
              Components
            </Button>
          )}
          {viewMode === '2d' ? (
            <div className="flex-1 flex flex-col">
              <DragDropCanvas
                ref={canvasRef}
                key={`canvas-${currentProject?.id || 'empty'}-${canvasKey}`}
                initialNodes={canvasData.nodes}
                initialEdges={canvasData.edges}
                projectName={currentProject?.name || 'Untitled_Project'}
                onSave={handleCanvasSave}
                onExport={handleCanvasExport}
                onValidate={handleCanvasValidate}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onNodeSelect={handleNodeSelection}
                onChange={(nodes, edges) => {
                  // Clear any existing debounce timer
                  if (debounceTimerRef.current) {
                    clearTimeout(debounceTimerRef.current);
                  }
                  
                  // Debounce the state update to prevent infinite loops
                  debounceTimerRef.current = setTimeout(() => {
                    setCanvasData({ nodes, edges });
                  }, 100);
                }}
                onHistoryChange={(canUndo, canRedo) => {
                  setCanUndo(canUndo);
                  setCanRedo(canRedo);
                }}
                onSelectionCountChange={(count) => {
                  setSelectedNodesCount(count);
                }}
                onValidationStateChange={(isValidating) => {
                  setIsValidating(isValidating);
                }}
                hideToolbar={true}
              />
            </div>
          ) : (
            <>
              {/* 3D Viewer */}
              <div className="flex-1">
                <Simple3DFallback
                  nodes={canvasData.nodes}
                  edges={canvasData.edges}
                  onNodeClick={handle3DNodeClick}
                />
              </div>
              
              {/* 3D Controls Sidebar */}
              <div className="w-80 p-4 bg-gray-900 border-l border-gray-700 flex flex-col gap-4">
                <ViewerControls
                  animationEnabled={view3DControls.animationEnabled}
                  labelsEnabled={view3DControls.labelsEnabled}
                  gridEnabled={view3DControls.gridEnabled}
                  connectionsEnabled={view3DControls.connectionsEnabled}
                  animationSpeed={view3DControls.animationSpeed}
                  nodeCount={canvasData.nodes.length}
                  edgeCount={canvasData.edges.length}
                  onToggleAnimation={(enabled) => handle3DControlChange('animationEnabled', enabled)}
                  onToggleLabels={(enabled) => handle3DControlChange('labelsEnabled', enabled)}
                  onToggleGrid={(enabled) => handle3DControlChange('gridEnabled', enabled)}
                  onToggleConnections={(enabled) => handle3DControlChange('connectionsEnabled', enabled)}
                  onSpeedChange={(speed) => handle3DControlChange('animationSpeed', speed)}
                />
                
                
                {/* Quick Stats */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Network Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-700/50 p-2 rounded">
                        <div className="text-gray-400">Applications</div>
                        <div className="text-white font-medium">
                          {canvasData.nodes.filter(n => n.type === 'application').length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <div className="text-gray-400">Interfaces</div>
                        <div className="text-white font-medium">
                          {canvasData.nodes.filter(n => n.type === 'interface').length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <div className="text-gray-400">Processes</div>
                        <div className="text-white font-medium">
                          {canvasData.nodes.filter(n => n.type === 'process').length}
                        </div>
                      </div>
                      <div className="bg-gray-700/50 p-2 rounded">
                        <div className="text-gray-400">Data Flows</div>
                        <div className="text-white font-medium">
                          {canvasData.edges.filter(e => e.animated).length}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
        
        {/* Properties Sidebar */}
        {showProperties && selectedComponent && (
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Properties</h3>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowProperties(false)}
                  className="h-6 w-6 p-0 hover:bg-gray-700"
                >
                  ×
                </Button>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Component Info */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${selectedComponent.color} text-white`}>
                      <selectedComponent.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm text-white">{selectedComponent.name}</CardTitle>
                      <Badge variant="outline" className="text-xs text-gray-400 border-gray-600 mt-1">
                        {selectedComponent.category}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-gray-400">{selectedComponent.description}</p>
                </CardContent>
              </Card>

              {/* Properties */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {selectedComponent.properties && Object.entries(selectedComponent.properties).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-gray-300">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Connection Points */}
              {selectedComponent.connectionPoints && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Connection Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {selectedComponent.connectionPoints.input && selectedComponent.connectionPoints.input.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Inputs</div>
                        {selectedComponent.connectionPoints.input.map((point: any, index: number) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-400">{point.type}</span>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {point.position}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {selectedComponent.connectionPoints.input && selectedComponent.connectionPoints.output && 
                     selectedComponent.connectionPoints.input.length > 0 && selectedComponent.connectionPoints.output.length > 0 && (
                      <Separator className="bg-gray-700" />
                    )}
                    
                    {selectedComponent.connectionPoints.output && selectedComponent.connectionPoints.output.length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Outputs</div>
                        {selectedComponent.connectionPoints.output.map((point: any, index: number) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-gray-400">{point.type}</span>
                            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {point.position}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Best Practices */}
              {selectedComponent.bestPractices && selectedComponent.bestPractices.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Best Practices
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {selectedComponent.bestPractices.map((practice: string, index: number) => (
                        <li key={index} className="text-xs text-gray-400 flex items-start gap-1">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span>{practice}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Examples */}
              {selectedComponent.examples && selectedComponent.examples.length > 0 && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Examples
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {selectedComponent.examples.map((example: string, index: number) => (
                        <div key={index} className="bg-gray-900 p-2 rounded text-xs">
                          <code className="text-gray-300">{example}</code>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Save As Dialog */}
      <SaveAsDialog
        isOpen={showSaveAsDialog}
        onClose={() => setShowSaveAsDialog(false)}
        currentFolderPath="/" // Default to root for now
        onSave={async (projectData) => {
          setSaveStatus('saving');
          try {
            const newProject: InterfaceProject = {
              id: `project-${Date.now()}`,
              name: projectData.name,
              description: projectData.description,
              category: projectData.category,
              nodes: canvasData.nodes,
              edges: canvasData.edges,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              metadata: {
                version: '1.0',
                author: 'Current User',
                tags: [projectData.category],
                nodeCount: canvasData.nodes.length,
                edgeCount: canvasData.edges.length,
                complexity: canvasData.nodes.length <= 3 ? 'Simple' : 
                           canvasData.nodes.length <= 8 ? 'Medium' : 'Complex'
              }
            };
            
            let savedProject;
            if (projectData.storageLocation === 'local') {
              // Save to local storage
              savedProject = await projectStorage.saveLocalProject(newProject);
              toast({
                title: 'Project Created',
                description: `${savedProject.name} has been saved locally`,
              });
            } else {
              // Save to team storage (database)
              savedProject = await interfaceBuilderApi.createProject({
                ...newProject,
                isTeamProject: true,
                folderPath: projectData.folderPath || '/'
              });
              toast({
                title: 'Project Created',
                description: `${savedProject.name} has been saved as a team project`,
              });
            }
            
            setCurrentProject(savedProject);
            setSaveStatus('saved');
            
            // Update localStorage with current project ID
            localStorage.setItem('interface-builder-current-project-id', savedProject.id);
            
            setShowSaveAsDialog(false);
          } catch (error: any) {
            setSaveStatus('unsaved');
            console.error('Failed to create project:', error);
            
            // Check for role-based access errors
            let errorMessage = 'Failed to create project. Please try again.';
            if (error.message?.includes('role') || error.message?.includes('permission') || error.message?.includes('access')) {
              errorMessage = `Based on your role/access, you do not have privilege to save in ${projectData.storageLocation === 'team' ? 'Team Project' : 'Local Storage'} location.`;
            } else if (error.response?.data?.message) {
              errorMessage = error.response.data.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            toast({
              title: 'Creation Failed',
              description: errorMessage,
              variant: 'destructive'
            });
          }
        }}
        existingName={currentProject?.name}
        existingDescription={currentProject?.description}
        existingCategory={currentProject?.category}
      />

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>Components: {canvasData.nodes.length}</span>
            <span>Connections: {canvasData.edges.length}</span>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
              {viewMode.toUpperCase()} View
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                saveStatus === 'saved' ? 'border-green-600 text-green-400' :
                saveStatus === 'saving' ? 'border-yellow-600 text-yellow-400' :
                'border-gray-600 text-gray-300'
              }`}
            >
              {saveStatus === 'saved' ? '✓ Saved' :
               saveStatus === 'saving' ? '⟳ Saving...' :
               '○ Unsaved'}
            </Badge>
            {copiedNodes.length > 0 && (
              <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                📋 {copiedNodes.length} copied
              </Badge>
            )}
            {currentProject && (
              <Badge variant="outline" className="text-xs border-green-600 text-green-400">
                {currentProject.metadata.complexity}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-3 w-3" />
            <span>
              {viewMode === '2d' 
                ? 'Drag components from the library to start building' 
                : 'Click and drag to explore the 3D network topology'
              }
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Ctrl+A: Select All</span>
            <span>Ctrl+C: Copy</span>
            <span>Ctrl+V: Paste</span>
            <span>Ctrl+S: Save</span>
            <span>Del: Delete</span>
            <span>Esc: Deselect</span>
          </div>
        </div>
      </div>

      {/* Generate from LOB Dialog */}
      <GenerateFromLobDialog
        isOpen={showGenerateFromLobDialog}
        onClose={() => setShowGenerateFromLobDialog(false)}
        onGenerate={handleGenerateFromLob}
      />

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Interface Builder Guide</DialogTitle>
            <DialogDescription className="text-gray-400">
              Learn how to use the Interface Builder effectively
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Keyboard Shortcuts */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Keyboard Shortcuts</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+A</kbd>
                  <span className="ml-2">Select All</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+C</kbd>
                  <span className="ml-2">Copy</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+V</kbd>
                  <span className="ml-2">Paste</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+S</kbd>
                  <span className="ml-2">Save</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Z</kbd>
                  <span className="ml-2">Undo</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+Y</kbd>
                  <span className="ml-2">Redo</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Del</kbd>
                  <span className="ml-2">Delete Selected</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Esc</kbd>
                  <span className="ml-2">Deselect</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">R</kbd>
                  <span className="ml-2">Toggle Resize Mode</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">E</kbd>
                  <span className="ml-2">Toggle Line Extend Mode</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Ctrl+L</kbd>
                  <span className="ml-2">Toggle Library Panel</span>
                </div>
                <div className="bg-gray-700/50 p-3 rounded">
                  <kbd className="px-2 py-1 bg-gray-600 rounded text-xs">Space+Drag</kbd>
                  <span className="ml-2">Pan Canvas</span>
                </div>
              </div>
            </div>

            {/* Basic Operations */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Basic Operations</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">Adding Components:</span> Drag components from the library panel on the left to the canvas</p>
                <p><span className="text-white font-medium">Connecting Nodes:</span> Drag from output port (right side) to input port (left side) of another node</p>
                <p><span className="text-white font-medium">Editing Nodes:</span> Double-click on a node or right-click and select "Edit"</p>
                <p><span className="text-white font-medium">Deleting:</span> Select nodes/edges and press Delete key or right-click and select "Delete"</p>
                <p><span className="text-white font-medium">Multi-select:</span> Hold Ctrl and click multiple nodes or drag to select area</p>
              </div>
            </div>

            {/* Resize Mode */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Resize Mode</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">Enable:</span> Press 'R' to toggle resize mode</p>
                <p><span className="text-white font-medium">Resize:</span> Click and drag the blue handles around selected components</p>
                <p><span className="text-white font-medium">Constraints:</span> Each component has minimum and maximum size limits</p>
                <p><span className="text-white font-medium">Text Scaling:</span> Text automatically scales with component size for better readability</p>
                <p><span className="text-white font-medium">Exit:</span> Press 'R' again or Esc to exit resize mode</p>
              </div>
            </div>

            {/* Line Drawing */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Line Drawing & Shapes</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">Line Tool:</span> Select from library, click start point, then click end point</p>
                <p><span className="text-white font-medium">Extend Mode:</span> Press 'E' when a line is selected to add more segments</p>
                <p><span className="text-white font-medium">Shapes:</span> Drag shapes from library, resize with handles when in resize mode</p>
                <p><span className="text-white font-medium">Text:</span> Double-click text nodes to edit content, use right-click menu for styling</p>
              </div>
            </div>

            {/* Validation */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Validation & Testing</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p><span className="text-white font-medium">Validate:</span> Click the Validate button to check for configuration issues</p>
                <p><span className="text-white font-medium">View Details:</span> Click on validation summary to see detailed messages</p>
                <p><span className="text-white font-medium">Hide Results:</span> Double-click the Validate button to clear results and free canvas space</p>
                <p><span className="text-white font-medium">Clear Canvas:</span> Use the Clear button to remove all components and reset counts</p>
              </div>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">Tips & Best Practices</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>• Save your work frequently with Ctrl+S</p>
                <p>• Use descriptive names for components to improve clarity</p>
                <p>• Group related components close together</p>
                <p>• Use different connection colors to distinguish interface types</p>
                <p>• Add text annotations to explain complex relationships</p>
                <p>• Export as PNG for documentation purposes</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* UML Manager Dialog */}
      <UmlManagerDialog
        open={showUmlManager}
        onOpenChange={setShowUmlManager}
        onRenderDiagram={async (diagram) => {
          try {
            // First render the PlantUML to SVG
            const response = await api.post('/api/uml/render', {
              content: diagram.content,
              format: 'svg'
            });

            // Convert SVG to data URL
            const svgString = response.data.svg;
            console.log('SVG Response received, length:', svgString.length);
            
            // Check if we got a fallback response
            if (response.data.isFallback) {
              toast({
                title: 'PlantUML Server Unavailable',
                description: 'Using fallback view for the diagram',
                variant: 'default'
              });
            }
            
            // Extract dimensions from SVG if possible
            let svgWidth = 800;
            let svgHeight = 600;
            
            const widthMatch = svgString.match(/width="(\d+)(?:px)?"/);
            const heightMatch = svgString.match(/height="(\d+)(?:px)?"/);
            
            if (widthMatch && heightMatch) {
              svgWidth = parseInt(widthMatch[1]);
              svgHeight = parseInt(heightMatch[1]);
              
              // Scale down if too large for the canvas
              const maxWidth = 1200;
              const maxHeight = 800;
              
              if (svgWidth > maxWidth || svgHeight > maxHeight) {
                const scale = Math.min(maxWidth / svgWidth, maxHeight / svgHeight);
                svgWidth = Math.round(svgWidth * scale);
                svgHeight = Math.round(svgHeight * scale);
              }
            }
            
            // Always use svgBackground node for direct canvas rendering
            const newNode = {
              id: `uml-svg-${diagram.id}-${Date.now()}`,
              type: 'svgBackground',
              position: { 
                x: 100, 
                y: 100 
              },
              data: {
                svg: svgString,
                width: svgWidth,
                height: svgHeight,
                label: diagram.name
              },
              // Make the node dimensions match the SVG
              style: {
                width: svgWidth,
                height: svgHeight,
                background: 'transparent',
                border: 'none',
                padding: 0
              },
              // Prevent selection box
              selectable: true,
              dragHandle: '.drag-handle'
            };
            
            console.log('Adding SVG background node to canvas');
            console.log('SVG dimensions:', svgWidth, 'x', svgHeight);
            
            setCanvasData(prev => ({
              ...prev,
              nodes: [...prev.nodes, newNode]
            }));
            
            setShowUmlManager(false);
            
            toast({
              title: 'UML Diagram Added',
              description: `${diagram.name} has been rendered directly on the canvas`,
            });
            
            return;
            
            // For simpler diagrams, continue with image node approach
            // Clean and encode the SVG
            const cleanedSvg = svgString
              .replace(/^\uFEFF/, '') // Remove BOM if present
              .trim();
            
            // Create data URL directly without blob for better compatibility
            const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(cleanedSvg)));
            
            console.log('Created SVG data URL');
            
            // Try to get dimensions with error handling
            let width = 400; // Default width
            let height = 300; // Default height
            
            try {
              // Create a temporary image to get dimensions
              const img = new Image();
              img.src = svgDataUrl;
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  console.log('Image loaded successfully, dimensions:', img.naturalWidth, 'x', img.naturalHeight);
                  resolve(true);
                };
                img.onerror = (error) => {
                  console.error('Image failed to load:', error);
                  reject(error);
                };
                // Timeout after 5 seconds
                setTimeout(() => reject(new Error('Image load timeout')), 5000);
              }).catch(err => {
                console.warn('Could not load image for dimensions, using defaults:', err);
              });

              if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                // Calculate appropriate size
                const maxWidth = 800;
                const maxHeight = 600;
                width = img.naturalWidth;
                height = img.naturalHeight;
                
                // Scale if too large
                if (width > maxWidth || height > maxHeight) {
                  const scale = Math.min(maxWidth / width, maxHeight / height);
                  width = Math.round(width * scale);
                  height = Math.round(height * scale);
                }
                
                // Ensure minimum size
                width = Math.max(width, 400);
                height = Math.max(height, 300);
              }
            } catch (error) {
              console.warn('Error getting image dimensions, using defaults:', error);
            }

            console.log('Final dimensions:', width, 'x', height);

            // Create an image node with explicit dimensions
            const newNode = {
              id: `uml-image-${diagram.id}-${Date.now()}`,
              type: 'image',
              position: { 
                x: Math.random() * 300 + 100, 
                y: Math.random() * 300 + 100 
              },
              style: {
                width: width,
                height: height
              },
              data: {
                label: diagram.name,
                imageUrl: svgDataUrl,
                alt: `${diagram.name} - ${diagram.diagramType} diagram`,
                width: width,  // Pass dimensions in data
                height: height,
                maintainAspectRatio: true,
                opacity: 1,
                borderStyle: 'solid',
                borderWidth: 2,
                borderColor: '#9333ea'
              }
            };

            console.log('Adding node to canvas:', newNode);

            // Add the node to the canvas
            setCanvasData(prev => {
              const updated = {
                ...prev,
                nodes: [...prev.nodes, newNode]
              };
              console.log('Canvas updated with new node count:', updated.nodes.length);
              return updated;
            });

            // Close the UML manager
            setShowUmlManager(false);

            toast({
              title: 'UML Diagram Added',
              description: `${diagram.name} has been added to the canvas as an image`,
            });
            
          } catch (error) {
            console.error('Failed to render UML diagram:', error);
            toast({
              title: 'Error',
              description: 'Failed to render UML diagram on canvas',
              variant: 'destructive'
            });
          }
        }}
      />
    </div>
  );
}