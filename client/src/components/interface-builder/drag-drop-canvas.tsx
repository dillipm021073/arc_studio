import { useState, useCallback, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  BackgroundVariant,
  Panel,
  SelectionMode,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Undo2, 
  Redo2, 
  ZoomIn, 
  ZoomOut, 
  Maximize,
  Play,
  Settings,
  Eye,
  Code,
  FileText,
  Edit,
  Copy,
  X,
  ImageIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toPng } from 'html-to-image';

import InterfaceNode from './nodes/interface-node';
import ApplicationNode from './nodes/application-node';
import ProcessNode from './nodes/process-node';
import TextNode from './nodes/text-node';
import LineNode from './nodes/line-node';
import ShapeNode from './nodes/shape-node';
import InternalActivityNode from './nodes/internal-activity-node';
import DecisionNode from './nodes/decision-node';
import RectangleNode from './nodes/rectangle-node';
import ContainerNode from './nodes/container-node';
import RoundedRectangleNode from './nodes/rounded-rectangle-node';
import { ImageNode } from './nodes/ImageNode';
import UmlNode from './nodes/uml-node';
import SvgBackgroundNode from './nodes/svg-background-node';
import SmartEdge from './edges/smart-edge';
import { ComponentTemplate } from './component-library';
import EdgeEditDialog from './edge-edit-dialog';
import NodeEditDialog from './node-edit-dialog';

// Custom node types
const nodeTypes: NodeTypes = {
  interface: InterfaceNode,
  application: ApplicationNode,
  process: ProcessNode,
  text: TextNode,
  line: LineNode,
  shape: ShapeNode,
  internalActivity: InternalActivityNode,
  decision: DecisionNode,
  rectangle: RectangleNode,
  container: ContainerNode,
  roundedRectangle: RoundedRectangleNode,
  image: ImageNode,
  uml: UmlNode,
  svgBackground: SvgBackgroundNode,
};

// Custom edge types
const edgeTypes: EdgeTypes = {
  smart: SmartEdge,
  // smoothstep is built-in to React Flow, no need to register
};

// Default edge options
const defaultEdgeOptions = {
  type: 'smoothstep',
  animated: true,
  style: { 
    strokeWidth: 2,
    stroke: '#64748b', // Default gray color
    zIndex: 999
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 15,
    height: 15,
    color: '#64748b',
  },
  selectable: true,
  focusable: true,
};


interface DragDropCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  projectName?: string;
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onExport?: (data: any) => void;
  onValidate?: (nodes: Node[], edges: Edge[]) => Promise<ValidationResult[]>;
  onCopy?: (nodes: Node[], edges: Edge[]) => void;
  onPaste?: () => Node[] | void;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
  onNodeSelect?: (node: Node | null) => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  onSelectionCountChange?: (count: number) => void;
  onValidationStateChange?: (isValidating: boolean) => void;
  hideToolbar?: boolean;
}

interface ValidationResult {
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
}

function DragDropCanvasInner({ 
  initialNodes = [], 
  initialEdges = [], 
  projectName = 'interface-design',
  onSave, 
  onExport, 
  onValidate,
  onNodeSelect,
  onCopy,
  onPaste,
  onChange,
  onHistoryChange,
  onSelectionCountChange,
  onValidationStateChange,
  hideToolbar = false
}: DragDropCanvasProps, ref: any) {
  const { toast } = useToast();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  // Initialize nodes without handlers first
  const [nodes, setNodes, _onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, _onEdgesChange] = useEdgesState(initialEdges || []);
  
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { getNodes, getViewport, fitView } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // Update nodes and edges when initialNodes/initialEdges change
  useEffect(() => {
    if (initialNodes !== undefined) {
      console.log('DragDropCanvas: Received initialNodes:', initialNodes);
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);
  
  useEffect(() => {
    if (initialEdges !== undefined) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    node: Node;
  } | null>(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
    edge: Edge;
  } | null>(null);
  const [edgeEditDialogOpen, setEdgeEditDialogOpen] = useState(false);
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [nodeEditDialogOpen, setNodeEditDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [isResizeMode, setIsResizeMode] = useState(false);
  const [isLineExtendMode, setIsLineExtendMode] = useState(false);
  const [extendingLine, setExtendingLine] = useState<{ nodeId: string; startPoint: 'start' | 'end' } | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(true);
  
  // Undo/Redo state management
  const [history, setHistory] = useState<Array<{ nodes: Node[], edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isUndoRedo, setIsUndoRedo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCtrlPressed, setIsCtrlPressed] = useState(false);
  const maxHistorySize = 50; // Maximum number of history states to keep

  // Notify parent about history state changes
  useEffect(() => {
    if (onHistoryChange) {
      const canUndo = historyIndex > 0;
      const canRedo = historyIndex < history.length - 1;
      onHistoryChange(canUndo, canRedo);
    }
  }, [historyIndex, history.length, onHistoryChange]);

  // Notify parent about selection changes
  useEffect(() => {
    if (onSelectionCountChange) {
      onSelectionCountChange(selectedNodes.length);
    }
  }, [selectedNodes.length, onSelectionCountChange]);

  // Notify parent about validation state changes
  useEffect(() => {
    if (onValidationStateChange) {
      onValidationStateChange(isValidating);
    }
  }, [isValidating, onValidationStateChange]);

  // Define handler functions first (moving them here for proper scope)
  const handleDownloadPNG = useCallback(async () => {
    const reactFlowViewport = reactFlowWrapper.current?.querySelector('.react-flow') as HTMLElement;
    
    if (!reactFlowViewport) {
      toast({
        title: 'Export Failed',
        description: 'Could not find the canvas to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      const viewportBox = reactFlowViewport.getBoundingClientRect();
      
      // Get all nodes to calculate bounds
      const nodeElements = reactFlowViewport.querySelectorAll('.react-flow__node');
      if (nodeElements.length === 0) {
        toast({
          title: 'Canvas Empty',
          description: 'Add some components before downloading',
          variant: 'destructive',
        });
        return;
      }

      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodeElements.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const relativeX = rect.left - viewportBox.left;
        const relativeY = rect.top - viewportBox.top;
        
        minX = Math.min(minX, relativeX);
        minY = Math.min(minY, relativeY);
        maxX = Math.max(maxX, relativeX + rect.width);
        maxY = Math.max(maxY, relativeY + rect.height);
      });

      // Add padding
      const padding = 50;
      const width = maxX - minX + 2 * padding;
      const height = maxY - minY + 2 * padding;

      // Temporarily adjust viewport for capture
      const viewport = getViewport();
      const captureElement = document.createElement('div');
      captureElement.style.position = 'absolute';
      captureElement.style.left = `${minX - padding}px`;
      captureElement.style.top = `${minY - padding}px`;
      captureElement.style.width = `${width}px`;
      captureElement.style.height = `${height}px`;
      captureElement.style.overflow = 'hidden';
      
      // Clone the viewport content
      const clonedViewport = reactFlowViewport.cloneNode(true) as HTMLElement;
      clonedViewport.style.position = 'relative';
      clonedViewport.style.left = `${-(minX - padding)}px`;
      clonedViewport.style.top = `${-(minY - padding)}px`;
      
      captureElement.appendChild(clonedViewport);
      document.body.appendChild(captureElement);

      // Generate PNG
      const dataUrl = await toPng(captureElement, {
        backgroundColor: '#111827',
        width,
        height,
        pixelRatio: 2,
      });

      // Clean up
      document.body.removeChild(captureElement);

      // Download
      const link = document.createElement('a');
      link.download = `${projectName}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: 'Download Complete',
        description: 'Your interface design has been exported as PNG',
      });
    } catch (error) {
      console.error('Failed to export PNG:', error);
      toast({
        title: 'Export Failed',
        description: 'There was an error exporting the image',
        variant: 'destructive',
      });
    }
  }, [toast, getNodes, getViewport, projectName]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedo(true);
      const previousState = history[historyIndex - 1];
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
      setHistoryIndex(historyIndex - 1);
      
      setTimeout(() => {
        setIsUndoRedo(false);
      }, 100);
      
      toast({
        title: 'Undo',
        description: 'Reverted to previous state',
      });
    }
  }, [history, historyIndex, setNodes, setEdges, toast]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true);
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setHistoryIndex(historyIndex + 1);
      
      setTimeout(() => {
        setIsUndoRedo(false);
      }, 100);
      
      toast({
        title: 'Redo',
        description: 'Restored to next state',
      });
    }
  }, [history, historyIndex, setNodes, setEdges, toast]);

  const handleValidate = useCallback(async () => {
    setIsValidating(true);
    
    const results: ValidationResult[] = [];
    
    // Safety check: ensure nodes is an array
    const nodeArray = Array.isArray(nodes) ? nodes : [];
    const edgeArray = Array.isArray(edges) ? edges : [];
    
    // Basic validations
    nodeArray.forEach(node => {
      if (!node.data.isConfigured) {
        results.push({
          type: 'warning',
          message: `${node.data.name} is not fully configured`,
          nodeId: node.id,
        });
      }
    });

    // Check for isolated nodes
    const connectedNodeIds = new Set([
      ...edgeArray.map(e => e.source),
      ...edgeArray.map(e => e.target),
    ]);
    
    nodeArray.forEach(node => {
      if (!connectedNodeIds.has(node.id)) {
        results.push({
          type: 'info',
          message: `${node.data.name} has no connections`,
          nodeId: node.id,
        });
      }
    });

    // Custom validation from props
    if (onValidate) {
      const customResults = await onValidate(nodes, edges);
      results.push(...customResults);
    }

    setValidationResults(results);
    setIsValidating(false);
    setShowValidationDetails(true); // Show details when validation runs

    toast({
      title: 'Validation Complete',
      description: `Found ${results.length} items to review. Check the panel on the right for details.`,
    });
  }, [nodes, edges, onValidate, toast]);

  const handleValidateDoubleClick = useCallback(() => {
    setValidationResults([]);
    setShowValidationDetails(false);
    toast({
      title: 'Validation Cleared',
      description: 'Validation results have been hidden',
    });
  }, [toast]);

  const handleSelectAll = useCallback(() => {
    const allNodes = getNodes();
    setSelectedNodes(allNodes);
    
    // Update ReactFlow's internal selection state
    const nodeIds = allNodes.map(n => n.id);
    reactFlowInstance?.setNodes(allNodes.map(node => ({
      ...node,
      selected: true
    })));
    
    toast({
      title: 'Select All',
      description: `Selected ${allNodes.length} components`,
    });
  }, [getNodes, reactFlowInstance, toast]);

  const handleDeselectAll = useCallback(() => {
    setSelectedNodes([]);
    
    // Update ReactFlow's internal selection state
    const allNodes = getNodes();
    reactFlowInstance?.setNodes(allNodes.map(node => ({
      ...node,
      selected: false
    })));
    
    toast({
      title: 'Deselect All',
      description: 'All components deselected',
    });
  }, [getNodes, reactFlowInstance, toast]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setSelectedNodes([]);
    setValidationResults([]);
    setHistory([]);
    setHistoryIndex(-1);
    
    // Notify parent component to update counts
    if (onChange) {
      onChange([], []);
    }
    
    // Reset any other states
    setIsResizeMode(false);
    setIsLineExtendMode(false);
    setExtendingLine(null);
    setShowValidationDetails(true);
    
    toast({
      title: 'Canvas Cleared',
      description: 'All components have been removed',
    });
  }, [setNodes, setEdges, onChange, toast]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    downloadPNG: handleDownloadPNG,
    undo: handleUndo,
    redo: handleRedo,
    validate: handleValidate,
    hideValidation: handleValidateDoubleClick,
    selectAll: handleSelectAll,
    deselectAll: handleDeselectAll,
    clear: handleClear
  }), [handleDownloadPNG, handleUndo, handleRedo, handleValidate, handleValidateDoubleClick, handleSelectAll, handleDeselectAll, handleClear]);

  // Keyboard event handlers for Ctrl detection and resize shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        setIsCtrlPressed(true);
        if (selectedNode && selectedNode.type === 'line') {
          setIsLineExtendMode(true);
        }

        // Resize shortcuts with Ctrl+Arrow keys - works for all resizable components
        if (selectedNode) {
          // Check if node is resizable (exclude line nodes as they have different behavior)
          const isResizable = selectedNode.type !== 'line' && 
                            selectedNode.type !== 'edge' && 
                            selectedNode.data.width !== undefined;
          
          if (isResizable) {
            const currentWidth = selectedNode.data.width || 150;
            const currentHeight = selectedNode.data.height || 100;
            const step = event.shiftKey ? 20 : 10; // Hold Shift for larger increments
            const aspectRatio = currentWidth / currentHeight;

            let newWidth = currentWidth;
            let newHeight = currentHeight;
            let shouldUpdate = false;

            // Ctrl + Up = Increase size (proportionally)
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              newWidth = currentWidth + step;
              newHeight = currentHeight + step;
              shouldUpdate = true;
            }
            // Ctrl + Down = Decrease size (proportionally)
            else if (event.key === 'ArrowDown') {
              event.preventDefault();
              newWidth = Math.max(30, currentWidth - step);
              newHeight = Math.max(30, currentHeight - step);
              shouldUpdate = true;
            }
            // Ctrl + Right = Increase width only
            else if (event.key === 'ArrowRight') {
              event.preventDefault();
              newWidth = currentWidth + step;
              if (event.altKey) {
                // Alt+Ctrl+Right maintains aspect ratio
                newHeight = newWidth / aspectRatio;
              }
              shouldUpdate = true;
            }
            // Ctrl + Left = Decrease width only
            else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              newWidth = Math.max(30, currentWidth - step);
              if (event.altKey) {
                // Alt+Ctrl+Left maintains aspect ratio
                newHeight = newWidth / aspectRatio;
              }
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              setNodes((nds) => {
                const updatedNodes = nds.map(node =>
                  node.id === selectedNode.id
                    ? {
                        ...node,
                        data: {
                          ...node.data,
                          width: Math.round(newWidth),
                          height: Math.round(newHeight)
                        }
                      }
                    : node
                );

                // Notify parent of changes for database persistence
                if (onChange) {
                  onChange(updatedNodes, edges);
                }

                return updatedNodes;
              });

              // Show size in a toast for user feedback
              toast({
                title: "Resized",
                description: `${Math.round(newWidth)} × ${Math.round(newHeight)}px`,
                duration: 1000,
              });
            }
          }
        }
      }
      
      if (event.key === 'r' || event.key === 'R') {
        if (selectedNode) {
          setIsResizeMode(!isResizeMode);
          // Update the selected node with the new resize mode
          setNodes((nds) => nds.map(node =>
            node.id === selectedNode.id
              ? { ...node, data: { ...node.data, isResizeMode: !isResizeMode } }
              : node
          ));
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        setIsCtrlPressed(false);
        setIsLineExtendMode(false);
        setExtendingLine(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedNode, isResizeMode, setNodes, onChange, edges]);

  // Save current state to history
  const saveToHistory = useCallback(() => {
    if (isUndoRedo) return; // Don't save history during undo/redo
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({
      nodes: nodes.map(n => ({ ...n })),
      edges: edges.map(e => ({ ...e }))
    });
    
    // Keep history size under control
    if (newHistory.length > maxHistorySize) {
      newHistory.shift();
    }
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [nodes, edges, history, historyIndex, isUndoRedo]);

  // Initialize history with initial state
  useEffect(() => {
    if (history.length === 0 && (nodes.length > 0 || edges.length > 0)) {
      setHistory([{
        nodes: nodes.map(n => ({ ...n })),
        edges: edges.map(e => ({ ...e }))
      }]);
      setHistoryIndex(0);
    }
  }, []);

  // Enhanced node change handler to track drag state
  const onNodesChange = useCallback((changes: any) => {
    _onNodesChange(changes);
    
    // Log node data changes for debugging
    changes.forEach((change: any) => {
      if (change.type === 'dimensions' || change.type === 'data') {
        console.log('Node change:', change);
      }
    });
    
    // Check if drag started
    const hasDragStart = changes.some((change: any) => change.type === 'position' && change.dragging === true);
    if (hasDragStart && !isDragging) {
      setIsDragging(true);
    }
    
    // Check if drag ended
    const hasDragEnd = changes.some((change: any) => change.type === 'position' && change.dragging === false);
    if (hasDragEnd && isDragging) {
      setIsDragging(false);
      // Save to history after drag ends
      setTimeout(saveToHistory, 100);
    }
  }, [_onNodesChange, isDragging, saveToHistory]);
  
  const onEdgesChange = useCallback((changes: any[]) => {
    _onEdgesChange(changes);
    
    // Check if any edges were deleted
    const hasDeletedEdges = changes.some(change => change.type === 'remove');
    
    if (hasDeletedEdges && onChange) {
      // Get the updated edges after the change
      setTimeout(() => {
        onChange(nodes, edges);
        saveToHistory();
      }, 50);
    }
  }, [_onEdgesChange, onChange, nodes, edges, saveToHistory]);

  // Auto-layout and positioning
  const getNextPosition = useCallback(() => {
    const existingNodes = nodes;
    const gridSize = 200;
    const columns = Math.ceil(Math.sqrt(existingNodes.length + 1));
    const row = Math.floor(existingNodes.length / columns);
    const col = existingNodes.length % columns;
    
    return {
      x: 50 + (col * gridSize),
      y: 50 + (row * gridSize),
    };
  }, [nodes]);

  // Handle drag and drop from component library
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds || !reactFlowInstance) return;

      const componentData = event.dataTransfer.getData('application/reactflow');
      if (!componentData) return;

      try {
        const component: ComponentTemplate = JSON.parse(componentData);
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeId = `${component.id}-${Date.now()}`;
        
        // Handle image upload for image nodes
        if (component.type === 'image') {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageUrl = event.target?.result as string;
                const newNode: Node = {
                  id: nodeId,
                  type: component.type,
                  position,
                  data: {
                    ...component,
                    ...component.properties,
                    imageUrl,
                    label: file.name,
                    isConfigured: false,
                    connectionPoints: component.connectionPoints,
                    onEdit: () => {
                      setEditingNode(newNode);
                      setNodeEditDialogOpen(true);
                    },
                    onDelete: () => handleDeleteNode(nodeId),
                    onDuplicate: () => {
                      const duplicatedNode = {
                        ...newNode,
                        id: `${newNode.data.id}-copy-${Date.now()}`,
                        position: {
                          x: newNode.position.x + 50,
                          y: newNode.position.y + 50,
                        },
                        selected: false,
                        data: {
                          ...newNode.data,
                          onDelete: () => handleDeleteNode(duplicatedNode.id),
                          onDuplicate: () => {},
                          onUpdate: (updatedData: any) => {
                            setNodes((nds) => {
                              const updatedNodes = nds.map(n => 
                                n.id === duplicatedNode.id 
                                  ? { ...n, data: { ...n.data, ...updatedData } }
                                  : n
                              );
                              
                              if (onChange) {
                                setEdges((currentEdges) => {
                                  onChange(updatedNodes, currentEdges);
                                  return currentEdges;
                                });
                              }
                              
                              return updatedNodes;
                            });
                          },
                        },
                        draggable: true,
                      };
                      setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(duplicatedNode));
                    },
                    onUpdate: (updatedData: any) => {
                      setNodes((nds) => {
                        const updatedNodes = nds.map(n => 
                          n.id === nodeId 
                            ? { ...n, data: { ...n.data, ...updatedData } }
                            : n
                        );
                        
                        if (onChange) {
                          setEdges((currentEdges) => {
                            onChange(updatedNodes, currentEdges);
                            return currentEdges;
                          });
                        }
                        
                        return updatedNodes;
                      });
                    },
                  },
                  draggable: true,
                };

                setNodes((nds) => {
                  const updatedNodes = [...nds, newNode];
                  
                  if (onChange) {
                    onChange(updatedNodes, edges);
                  }
                  
                  return updatedNodes;
                });
                
                setTimeout(saveToHistory, 100);
                
                toast({
                  title: 'Image Added',
                  description: `${file.name} has been added to the canvas`,
                });
              };
              reader.readAsDataURL(file);
            }
          };
          input.click();
          return;
        }
        
        const newNode: Node = {
          id: nodeId,
          type: component.type,
          position,
          style: {
            zIndex: component.type === 'container' ? -1 : 0
          },
          data: {
            ...component,
            ...component.properties,
            label: component.name,
            isConfigured: false,
            connectionPoints: component.connectionPoints,
            zIndex: component.type === 'container' ? -1 : 0,
            onEdit: () => {
              setEditingNode(newNode);
              setNodeEditDialogOpen(true);
            },
            onDelete: () => handleDeleteNode(nodeId),
            onDuplicate: () => {
              const duplicatedNode = {
                ...newNode,
                id: `${newNode.data.id}-copy-${Date.now()}`,
                position: {
                  x: newNode.position.x + 50,
                  y: newNode.position.y + 50,
                },
                selected: false, // Ensure duplicated node is not selected
                data: {
                  ...newNode.data,
                  onDelete: () => handleDeleteNode(duplicatedNode.id),
                  onDuplicate: () => {},
                  onToggleResize: (component.type === 'text' || component.type === 'shape') ? () => {} : undefined,
                  onUpdate: (component.type === 'text' || component.type === 'shape' || component.type === 'application' || component.type === 'rectangle' || component.type === 'container' || component.type === 'roundedRectangle') ? (updatedData: any) => {
                    setNodes((nds) => {
                      const updatedNodes = nds.map(n => 
                        n.id === duplicatedNode.id 
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      );
                      
                      // Notify parent of changes for database persistence
                      if (onChange) {
                        setEdges((currentEdges) => {
                          onChange(updatedNodes, currentEdges);
                          return currentEdges;
                        });
                      }
                      
                      return updatedNodes;
                    });
                  } : undefined,
                },
                draggable: true, // Ensure duplicated nodes are draggable
              };
              setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(duplicatedNode));
            },
            onToggleResize: (component.type === 'text' || component.type === 'shape') ? () => {
              setNodes((nds) => nds.map(n => 
                n.id === nodeId 
                  ? { ...n, data: { ...n.data, isResizing: !n.data.isResizing } }
                  : n
              ));
            } : undefined,
            onUpdate: (component.type === 'text' || component.type === 'shape' || component.type === 'application' || component.type === 'rectangle' || component.type === 'container' || component.type === 'roundedRectangle' || component.type === 'image') ? (updatedData: any) => {
              setNodes((nds) => {
                const updatedNodes = nds.map(n => {
                  if (n.id === nodeId) {
                    const newNode = { ...n, data: { ...n.data, ...updatedData } };
                    // Update style zIndex if zIndex property changes
                    if (updatedData.zIndex !== undefined) {
                      newNode.style = { ...newNode.style, zIndex: updatedData.zIndex };
                    }
                    return newNode;
                  }
                  return n;
                });
                
                // Notify parent of changes for database persistence
                // Use setEdges callback to get current edges state
                if (onChange) {
                  setEdges((currentEdges) => {
                    onChange(updatedNodes, currentEdges);
                    return currentEdges; // Return same edges, no changes
                  });
                }
                
                return updatedNodes;
              });
            } : undefined,
          },
          dragHandle: ['text', 'line', 'shape', 'container', 'roundedRectangle', 'rectangle', 'image'].includes(component.type) ? undefined : '.drag-handle',
          draggable: true, // Ensure all nodes are draggable
        };

        setNodes((nds) => {
          const updatedNodes = [...nds, newNode];
          
          // Notify parent of changes for database persistence
          if (onChange) {
            onChange(updatedNodes, edges);
          }
          
          return updatedNodes;
        });
        
        // Save to history after adding node
        setTimeout(saveToHistory, 100);
        
        toast({
          title: 'Component Added',
          description: `${component.name} has been added to the canvas`,
        });
      } catch (error) {
        console.error('Error parsing dropped component:', error);
        toast({
          title: 'Error',
          description: 'Failed to add component to canvas',
          variant: 'destructive',
        });
      }
    },
    [reactFlowInstance, setNodes, toast, edges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);


  // Handle connections between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      // Deselect all nodes when making a connection to prevent interference
      handleDeselectAll();
      
      // Validate connection compatibility
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;

      // Smart connection validation
      const isValidConnection = validateConnection(sourceNode, targetNode, params);
      
      if (isValidConnection.valid) {
        // Debug connection direction
        console.log('Creating edge:', {
          source: params.source,
          sourceHandle: params.sourceHandle,
          target: params.target,
          targetHandle: params.targetHandle,
        });
        
        const newEdge = {
          ...params,
          id: `edge-${params.source}-${params.target}-${Date.now()}`,
          type: 'smoothstep',
          data: {
            connectionType: isValidConnection.connectionType,
            dataFlow: isValidConnection.dataFlow,
          },
          style: {
            stroke: isValidConnection.color || '#64748b',
            strokeWidth: 2,
            zIndex: 999,
          },
          animated: true,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 15,
            height: 15,
            color: isValidConnection.color || '#64748b',
          },
          label: isValidConnection.connectionType,
          labelStyle: { fill: '#e2e8f0', fontSize: 12 },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8 },
        };
        
        setEdges((eds) => {
          const updatedEdges = addEdge(newEdge, eds);
          
          // Notify parent of changes for database persistence
          if (onChange) {
            onChange(nodes, updatedEdges);
          }
          
          return updatedEdges;
        });
        
        // Save to history after creating connection
        setTimeout(saveToHistory, 100);
        
        toast({
          title: 'Connection Created',
          description: `${sourceNode.data.name} connected to ${targetNode.data.name}`,
        });
      } else {
        toast({
          title: 'Invalid Connection',
          description: isValidConnection.reason,
          variant: 'destructive',
        });
      }
    },
    [nodes, setEdges, toast, handleDeselectAll, onChange, edges, saveToHistory]
  );

  // Connection validation logic - more permissive
  const validateConnection = (sourceNode: Node, targetNode: Node, params: Connection) => {
    const sourceId = sourceNode.data.id || sourceNode.type;
    const targetId = targetNode.data.id || targetNode.type;
    
    // Don't allow self-connections
    if (sourceNode.id === targetNode.id) {
      return {
        valid: false,
        reason: 'Cannot connect a node to itself'
      };
    }
    
    // Allow connections for shape nodes with connection points, but not for text or line nodes
    const nonConnectableTypes = ['text', 'line'];
    
    // Special handling for shape nodes - always allow if they have connection points
    if (sourceNode.type === 'shape' || targetNode.type === 'shape') {
      // Check if shape nodes have connection points
      const sourceHasConnections = sourceNode.type === 'shape' && 
        sourceNode.data.connectionPoints && 
        (sourceNode.data.connectionPoints.input?.length > 0 || sourceNode.data.connectionPoints.output?.length > 0);
      
      const targetHasConnections = targetNode.type === 'shape' && 
        targetNode.data.connectionPoints && 
        (targetNode.data.connectionPoints.input?.length > 0 || targetNode.data.connectionPoints.output?.length > 0);
      
      // If either is a shape without connections, reject
      if ((sourceNode.type === 'shape' && !sourceHasConnections) || 
          (targetNode.type === 'shape' && !targetHasConnections)) {
        return {
          valid: false,
          reason: 'Shape component needs connection points'
        };
      }
      
      // If both are shapes with connections, or one is shape and other is connectable, allow
      if ((sourceNode.type === 'shape' && sourceHasConnections) || 
          (targetNode.type === 'shape' && targetHasConnections)) {
        return {
          valid: true,
          connectionType: 'Connection',
          color: '#94a3b8',
          dataFlow: 'unidirectional'
        };
      }
    }
    
    // Block text and line nodes
    if (nonConnectableTypes.includes(sourceNode.type || '') || 
        nonConnectableTypes.includes(targetNode.type || '')) {
      return {
        valid: false,
        reason: 'This component cannot have connections'
      };
    }

    // Define connection rules based on node data.id or type
    const connectionRules: Record<string, any> = {
      // Applications
      'web-application': {
        canConnectTo: ['api-service', 'rest-api', 'graphql-api', 'api-gateway', 'message-queue', 'webhook', 'soap-service'],
        connectionType: 'HTTP Request',
        color: '#3b82f6'
      },
      'mobile-app': {
        canConnectTo: ['api-service', 'rest-api', 'graphql-api', 'api-gateway', 'webhook'],
        connectionType: 'API Call',
        color: '#8b5cf6'
      },
      'legacy-application': {
        canConnectTo: ['file-transfer', 'message-queue', 'database-system', 'plsql-procedure', 'soap-service'],
        connectionType: 'Legacy Integration',
        color: '#6b7280'
      },
      'weblogic-application': {
        canConnectTo: ['ejb-interface', 'soap-service', 'rest-api', 'database-system', 'message-queue', 'plsql-procedure'],
        connectionType: 'J2EE Integration',
        color: '#dc2626'
      },
      'spring-boot-application': {
        canConnectTo: ['rest-api', 'soap-service', 'graphql-api', 'database-system', 'message-queue', 'webhook', 'file-transfer', 'cloud-service', 'api-service', 'web-application', 'mobile-app', 'legacy-application'],
        connectionType: 'Spring Integration',
        color: '#10b981'
      },
      'api-service': {
        canConnectTo: ['database-system', 'message-queue', 'cloud-service', 'rest-api', 'api-service', 'file-transfer', 'plsql-procedure'],
        connectionType: 'Service Call',
        color: '#10b981'
      },
      'database-system': {
        canConnectTo: ['api-service', 'cloud-service', 'plsql-procedure'],
        connectionType: 'Data Sync',
        color: '#6b7280'
      },
      'cloud-service': {
        canConnectTo: ['api-service', 'database-system', 'message-queue'],
        connectionType: 'Cloud Integration',
        color: '#06b6d4'
      },
      
      // Interfaces
      'rest-api': {
        canConnectTo: ['api-service', 'database-system', 'cloud-service', 'message-queue', 'web-application', 'mobile-app', 'weblogic-application', 'spring-boot-application'],
        connectionType: 'REST Request',
        color: '#3b82f6'
      },
      'graphql-api': {
        canConnectTo: ['api-service', 'database-system', 'cloud-service'],
        connectionType: 'GraphQL Query',
        color: '#8b5cf6'
      },
      'soap-service': {
        canConnectTo: ['legacy-application', 'weblogic-application', 'spring-boot-application', 'api-service', 'web-application'],
        connectionType: 'SOAP/XML',
        color: '#f97316'
      },
      'ejb-interface': {
        canConnectTo: ['weblogic-application', 'spring-boot-application', 'api-service', 'database-system'],
        connectionType: 'EJB Remote',
        color: '#dc2626'
      },
      'plsql-procedure': {
        canConnectTo: ['database-system', 'api-service', 'weblogic-application', 'spring-boot-application', 'legacy-application'],
        connectionType: 'PL/SQL Call',
        color: '#b91c1c'
      },
      'message-queue': {
        canConnectTo: ['api-service', 'cloud-service', 'notification-service'],
        connectionType: 'Message',
        color: '#f59e0b'
      },
      'webhook': {
        canConnectTo: ['api-service', 'cloud-service', 'web-application'],
        connectionType: 'Webhook',
        color: '#f59e0b'
      },
      'file-transfer': {
        canConnectTo: ['api-service', 'cloud-service', 'database-system'],
        connectionType: 'File Transfer',
        color: '#22c55e'
      },
      'database-connection': {
        canConnectTo: ['database-system', 'api-service'],
        connectionType: 'DB Connection',
        color: '#6b7280'
      },
      
      // Process nodes
      'process': {
        canConnectTo: ['application', 'interface', 'process'],
        connectionType: 'Process Flow',
        color: '#6366f1'
      },
      
      // Text nodes - no connections allowed
      'text': {
        canConnectTo: [],
        connectionType: 'None',
        color: '#000000'
      },
      'text-box': {
        canConnectTo: [],
        connectionType: 'None',
        color: '#000000'
      },
      // Drawing box/shapes - allow all connections
      'drawing-box': {
        canConnectTo: [],
        connectionType: 'Connection',
        color: '#94a3b8'
      },
      'shape': {
        canConnectTo: [],
        connectionType: 'Connection', 
        color: '#94a3b8'
      },
      'database': {
        canConnectTo: [],
        connectionType: 'Data Flow',
        color: '#6366f1'
      },
      // Container shapes - allow all connections
      'container': {
        canConnectTo: [],
        connectionType: 'Connection',
        color: '#94a3b8'
      },
      'rectangle': {
        canConnectTo: [],
        connectionType: 'Connection',
        color: '#94a3b8'
      },
      'roundedRectangle': {
        canConnectTo: [],
        connectionType: 'Connection',
        color: '#94a3b8'
      }
    };

    // Check source node rules
    let sourceRules = connectionRules[sourceId] || connectionRules[sourceNode.type || ''];
    
    // If no specific rules found, allow connections based on node type
    if (!sourceRules) {
      if (sourceNode.type === 'application') {
        sourceRules = {
          canConnectTo: ['interface', 'application', 'process'],
          connectionType: 'Connection',
          color: '#64748b'
        };
      } else if (sourceNode.type === 'interface') {
        sourceRules = {
          canConnectTo: ['application', 'interface', 'process'],
          connectionType: 'Interface',
          color: '#64748b'
        };
      } else if (sourceNode.type === 'process') {
        sourceRules = {
          canConnectTo: ['application', 'interface', 'process'],
          connectionType: 'Process',
          color: '#6366f1'
        };
      } else if (sourceNode.type === 'container' || sourceNode.type === 'rectangle' || sourceNode.type === 'roundedRectangle') {
        // Allow container, rectangle, and rounded rectangle nodes to connect to anything
        sourceRules = {
          canConnectTo: [],
          connectionType: 'Connection',
          color: '#64748b'
        };
      } else {
        // Allow all connections by default
        sourceRules = {
          canConnectTo: [],
          connectionType: 'Connection',
          color: '#64748b'
        };
      }
    }

    // If canConnectTo is empty or includes target, allow connection
    if (sourceRules.canConnectTo.length === 0 || 
        sourceRules.canConnectTo.includes(targetId) || 
        sourceRules.canConnectTo.includes(targetNode.type)) {
      return {
        valid: true,
        connectionType: sourceRules.connectionType,
        color: sourceRules.color,
        dataFlow: 'bidirectional'
      };
    }

    return {
      valid: false,
      reason: `${sourceNode.data.name} cannot connect to ${targetNode.data.name}`
    };
  };

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setContextMenu(null);
    // Notify parent component of node selection
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  // Handle node double-click for editing
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Open edit dialog on double-click (except for geometric nodes)
    if (node.type !== 'text' && node.type !== 'line' && node.type !== 'shape' && node.type !== 'rectangle' && node.type !== 'container' && node.type !== 'roundedRectangle') {
      setEditingNode(node);
      setNodeEditDialogOpen(true);
    }
    // Also notify parent component of node selection
    onNodeSelect?.(node);
  }, [onNodeSelect]);

  // Handle selection changes
  const onSelectionChange = useCallback((params: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodes(params.nodes);
    if (params.nodes.length === 1) {
      setSelectedNode(params.nodes[0]);
      onNodeSelect?.(params.nodes[0]);
    } else {
      setSelectedNode(null);
      onNodeSelect?.(null);
    }
  }, [onNodeSelect]);

  // Handle node resize
  const handleNodeResize = useCallback((nodeId: string, width: number, height: number) => {
    setNodes(nds => nds.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          style: {
            ...node.style,
            width: `${width}px`,
            height: `${height}px`
          },
          data: {
            ...node.data,
            width,
            height
          }
        };
      }
      return node;
    }));
  }, [setNodes]);

  // Handle right-click on node
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    
    // Get the clicked element's bounding rect
    const targetElement = event.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    
    // Position menu at the center top of the node
    const menuX = rect.left + rect.width / 2;
    const menuY = rect.top - 10; // 10px above the node
    
    // Ensure menu doesn't go off-screen
    const adjustedX = Math.min(menuX, window.innerWidth - 200); // 200px is approximate menu width
    const adjustedY = Math.max(10, Math.min(menuY, window.innerHeight - 300)); // Keep on screen
    
    setContextMenu({
      mouseX: adjustedX,
      mouseY: adjustedY,
      node,
    });
    setSelectedNode(node);
  }, []);

  // Handle edge click
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
  }, []);

  // Handle edge context menu
  const onEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.preventDefault();
    setEdgeContextMenu({
      mouseX: event.clientX,
      mouseY: event.clientY,
      edge,
    });
  }, []);

  // Handle node deletion - define before using in enhanceNodesWithHandlers
  const handleDeleteNode = useCallback((nodeId: string) => {
    const updatedNodes = nodes.filter((node) => node.id !== nodeId);
    const updatedEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setSelectedNode(null);
    
    // Notify parent of changes for database persistence
    if (onChange) {
      onChange(updatedNodes, updatedEdges);
    }
    
    // Save to history after deleting node
    setTimeout(saveToHistory, 100);
    
    toast({
      title: 'Node Deleted',
      description: 'Component and its connections have been removed',
    });
  }, [nodes, edges, setNodes, setEdges, toast, saveToHistory, onChange]);


  // Handle deletion of selected nodes
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodes.length > 0) {
      const nodeIdsToDelete = selectedNodes.map(node => node.id);
      const updatedNodes = nodes.filter(node => !nodeIdsToDelete.includes(node.id));
      const updatedEdges = edges.filter(edge => 
        !nodeIdsToDelete.includes(edge.source) && 
        !nodeIdsToDelete.includes(edge.target)
      );
      
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setSelectedNodes([]);
      setSelectedNode(null);
      
      // Save to history after deleting selected nodes
      setTimeout(saveToHistory, 100);
      
      toast({
        title: 'Nodes Deleted',
        description: `Removed ${nodeIdsToDelete.length} components and their connections`,
      });
    } else if (selectedNode) {
      handleDeleteNode(selectedNode.id);
    }
  }, [selectedNodes, nodes, edges, setNodes, setEdges, selectedNode, handleDeleteNode, toast, saveToHistory]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Undo with Ctrl+Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
        return;
      }

      // Redo with Ctrl+Y or Ctrl+Shift+Z
      if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault();
        handleRedo();
        return;
      }

      // Select all with Ctrl+A
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        handleSelectAll();
        return;
      }
      
      // Copy with Ctrl+C
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        event.preventDefault();
        const selectedNodes = nodes.filter(node => node.selected);
        if (selectedNodes.length > 0 && onCopy) {
          // Get selected node IDs
          const selectedNodeIds = selectedNodes.map(node => node.id);
          // Find edges that connect selected nodes
          const selectedEdges = edges.filter(edge => 
            selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target)
          );
          onCopy(selectedNodes, selectedEdges);
          toast({
            title: 'Copied',
            description: `${selectedNodes.length} item(s) and ${selectedEdges.length} connection(s) copied`,
            duration: 1500,
          });
        }
        return;
      }
      
      // Paste with Ctrl+V
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        event.preventDefault();
        if (onPaste) {
          const pastedNodes = onPaste();
          if (pastedNodes && pastedNodes.length > 0) {
            // Enhance pasted nodes with handlers
            const enhancedNodes = pastedNodes.map(node => ({
              ...node,
              selected: false, // Ensure pasted nodes are not selected
              data: {
                ...node.data,
                onEdit: node.type !== 'line' ? () => {
                  setEditingNode(node);
                  setNodeEditDialogOpen(true);
                } : undefined,
                onDelete: () => handleDeleteNode(node.id),
                onDuplicate: () => {
                  const duplicatedNode = {
                    ...node,
                    id: `${node.data.id}-copy-${Date.now()}`,
                    position: {
                      x: node.position.x + 50,
                      y: node.position.y + 50,
                    },
                    selected: false, // Ensure duplicated node is not selected
                  };
                  setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(duplicatedNode));
                },
                onToggleResize: (node.type === 'text' || node.type === 'shape') ? () => {
                  setNodes((nds) => nds.map(n => 
                    n.id === node.id 
                      ? { ...n, data: { ...n.data, isResizing: !n.data.isResizing } }
                      : n
                  ));
                } : undefined,
                onUpdate: (node.type === 'text' || node.type === 'shape' || node.type === 'application' || node.type === 'rectangle' || node.type === 'container' || node.type === 'roundedRectangle') ? (updatedData: any) => {
                  setNodes((nds) => {
                    const updatedNodes = nds.map(n => 
                      n.id === node.id 
                        ? { ...n, data: { ...n.data, ...updatedData } }
                        : n
                    );
                    
                    // Notify parent of changes for database persistence
                    if (onChange) {
                      setEdges((currentEdges) => {
                        onChange(updatedNodes, currentEdges);
                        return currentEdges;
                      });
                    }
                    
                    return updatedNodes;
                  });
                } : undefined,
              }
            }));
            setNodes((nds) => {
              const updatedNodes = [...nds, ...enhancedNodes];
              
              // Notify parent of changes for database persistence
              if (onChange) {
                onChange(updatedNodes, edges);
              }
              
              return updatedNodes;
            });
            toast({
              title: 'Pasted',
              description: `${enhancedNodes.length} item(s) pasted`,
            });
          }
        }
        return;
      }

      // Deselect all with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        handleDeselectAll();
        return;
      }

      // Delete selected nodes with Delete or Backspace key
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        handleDeleteSelected();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectAll, handleDeselectAll, handleDeleteSelected, handleUndo, handleRedo, nodes, onCopy, onPaste, toast, handleDeleteNode, setNodes]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setEdgeContextMenu(null);
    };

    if (contextMenu || edgeContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu, edgeContextMenu]);

  // Canvas actions
  const handleSave = useCallback(() => {
    console.log('=== CANVAS SAVE TRIGGERED ===');
    
    // Force blur on any active textarea to commit text changes
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      console.log('Blurring active textarea to commit changes');
      (activeElement as HTMLTextAreaElement).blur();
      
      // Give a small delay for the blur event to process
      setTimeout(() => {
        console.log('Current nodes after blur:', nodes.map(n => ({
          id: n.id,
          type: n.type,
          text: n.data?.text
        })));
        
        // Find nodes with BIL text for debugging
        const bilNodes = nodes.filter(n => n.data?.text?.includes('BIL'));
        if (bilNodes.length > 0) {
          console.log('BIL nodes found:', bilNodes.map(n => ({
            id: n.id,
            text: n.data.text
          })));
        }
        
        if (onSave) {
          onSave(nodes, edges);
        }
        
        toast({
          title: 'Canvas Saved',
          description: 'Your interface design has been saved',
        });
      }, 100);
    } else {
      console.log('Current nodes:', nodes.map(n => ({
        id: n.id,
        type: n.type,
        text: n.data?.text
      })));
      
      // Find nodes with BIL text for debugging
      const bilNodes = nodes.filter(n => n.data?.text?.includes('BIL'));
      if (bilNodes.length > 0) {
        console.log('BIL nodes found:', bilNodes.map(n => ({
          id: n.id,
          text: n.data.text
        })));
      }
      
      if (onSave) {
        onSave(nodes, edges);
      }
      
      toast({
        title: 'Canvas Saved',
        description: 'Your interface design has been saved',
      });
    }
  }, [nodes, edges, onSave, toast]);

  // Enhance initial nodes with handlers after component mount
  useEffect(() => {
    if (initialNodes.length > 0 && nodes.length > 0 && handleDeleteNode) {
      // Only enhance if nodes don't have handlers yet
      const needsEnhancement = nodes.some(node => !node.data.onDelete);
      if (needsEnhancement) {
        const enhancedNodes = nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onEdit: node.type !== 'line' ? () => {
              setEditingNode(node);
              setNodeEditDialogOpen(true);
            } : undefined,
            onDelete: () => handleDeleteNode(node.id),
            onDuplicate: () => {
              const newNode = {
                ...node,
                id: `${node.data.id}-copy-${Date.now()}`,
                position: {
                  x: node.position.x + 50,
                  y: node.position.y + 50,
                },
                selected: false, // Ensure duplicated node is not selected
              };
              setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
            },
            onToggleResize: (node.type === 'text' || node.type === 'shape') ? () => {
              setNodes((nds) => nds.map(n => 
                n.id === node.id 
                  ? { ...n, data: { ...n.data, isResizing: !n.data.isResizing } }
                  : n
              ));
            } : undefined,
            onUpdate: (node.type === 'text' || node.type === 'shape' || node.type === 'application' || node.type === 'rectangle' || node.type === 'container' || node.type === 'roundedRectangle' || node.type === 'image') ? (updatedData: any) => {
              setNodes((nds) => {
                const updatedNodes = nds.map(n => {
                  if (n.id === node.id) {
                    const newNode = { ...n, data: { ...n.data, ...updatedData } };
                    // Update style zIndex if zIndex property changes
                    if (updatedData.zIndex !== undefined) {
                      newNode.style = { ...newNode.style, zIndex: updatedData.zIndex };
                    }
                    return newNode;
                  }
                  return n;
                });
                
                // Notify parent of changes for database persistence
                if (onChange) {
                  onChange(updatedNodes, edges);
                }
                
                return updatedNodes;
              });
            } : undefined,
          },
        }));
        setNodes(enhancedNodes);
      }
    }
  }, [initialNodes.length, nodes.length, handleDeleteNode, onChange, edges]);

  const handleExport = useCallback(() => {
    const exportData = {
      version: '1.0',
      metadata: {
        createdAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      },
      design: {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: edge.data,
        })),
      },
    };

    if (onExport) {
      onExport(exportData);
    }

    // Download as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interface-design-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Design Exported',
      description: 'Interface design has been exported as JSON',
    });
  }, [nodes, edges, onExport, toast]);


  // Handle double-click on validate button to hide validation results

  // Memoized validation summary
  const validationSummary = useMemo(() => {
    const errors = validationResults.filter(r => r.type === 'error').length;
    const warnings = validationResults.filter(r => r.type === 'warning').length;
    const infos = validationResults.filter(r => r.type === 'info').length;
    
    return { errors, warnings, infos };
  }, [validationResults]);

  return (
    <div className="flex-1 h-full relative bg-gray-900">
      <div
        className="w-full h-full"
        ref={reactFlowWrapper}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeClick={onEdgeClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onSelectionChange={onSelectionChange}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView={false}
          attributionPosition="bottom-left"
          className="bg-gray-900"
          panOnScroll={true}
          panOnDrag={!isResizeMode}
          zoomOnScroll={true}
          zoomOnPinch={true}
          zoomOnDoubleClick={false}
          preventScrolling={false}
          minZoom={0.05}
          maxZoom={8}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          selectionMode={SelectionMode.Partial}
          multiSelectionKeyCode="Control"
          deleteKeyCode="Delete"
          selectNodesOnDrag={!isResizeMode}
          nodesDraggable={!isResizeMode}
          connectionMode="loose"
          connectionRadius={50}
          edgeUpdaterRadius={50}
          elevateEdgesOnSelect={true}
          edgesFocusable={true}
          edgesUpdatable={true}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            color="#475569" 
            size={0.5} 
          />
          <Controls 
            position="bottom-left" 
            showInteractive={false}
            className="bg-gray-800 border-gray-700"
          />
          

          {/* Status Panel - Moved to parent component header */}
          {/* Keeping validation results panel - positioned below toolbar */}
          {validationResults.length > 0 && (
            <Panel position="top-center" className="mt-20">
              <Card className="bg-gray-800/95 border-gray-700 backdrop-blur-sm">
                <div className="p-3 space-y-2 min-w-[300px] max-w-[400px]">
                  <div 
                      className="pt-2 border-t border-gray-600 space-y-1 cursor-pointer hover:bg-gray-700/20 p-2 -m-2 rounded transition-colors"
                      onClick={() => setShowValidationDetails(!showValidationDetails)}
                      title={showValidationDetails ? "Click to hide details" : "Click to show details"}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-300">Validation Results</span>
                        {showValidationDetails ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      {validationSummary.errors > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-red-400">Errors:</span>
                          <Badge variant="destructive" className="text-xs">
                            {validationSummary.errors}
                          </Badge>
                        </div>
                      )}
                      {validationSummary.warnings > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-400">Warnings:</span>
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                            {validationSummary.warnings}
                          </Badge>
                        </div>
                      )}
                      {validationSummary.infos > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-400">Info:</span>
                          <Badge variant="outline" className="text-xs text-blue-400 border-blue-400">
                            {validationSummary.infos}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Detailed validation messages - collapsible */}
                    {showValidationDetails && (
                      <div className="pt-2 border-t border-gray-600 max-h-60 overflow-y-auto">
                        <div className="space-y-2">
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
                                  Component: {nodes.find(n => n.id === result.nodeId)?.data?.name || result.nodeId}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
            </Card>
          </Panel>
          )}

          {/* Empty State */}
          {nodes.length === 0 && (
            <Panel position="center">
              <Card className="bg-gray-800/95 border-gray-700 backdrop-blur-sm p-8 text-center max-w-md">
                <div className="text-gray-400 space-y-4">
                  <div className="text-6xl">🎨</div>
                  <h3 className="text-lg font-medium text-white">Start Building Your Interface</h3>
                  <p className="text-sm">
                    Drag components from the library on the left to start designing your system architecture.
                  </p>
                  <div className="flex justify-center gap-2 text-xs">
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      Drag & Drop
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      Auto-Connect
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-400">
                      Validate
                    </Badge>
                  </div>
                </div>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>
      
      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-gray-800 border border-gray-700 rounded-md shadow-lg py-2 z-[9999] min-w-[180px]"
          style={{ 
            top: `${contextMenu.mouseY}px`, 
            left: `${contextMenu.mouseX}px`,
            transform: 'translate(-50%, -10px)' // Center horizontally and slightly above
          }}
        >
          {/* Edit option - only for non-geometric nodes */}
          {contextMenu.node.type !== 'text' && contextMenu.node.type !== 'line' && contextMenu.node.type !== 'shape' && contextMenu.node.type !== 'rectangle' && contextMenu.node.type !== 'container' && contextMenu.node.type !== 'roundedRectangle' && (
            <>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                onClick={() => {
                  setEditingNode(contextMenu.node);
                  setNodeEditDialogOpen(true);
                  setContextMenu(null);
                }}
              >
                <Edit className="h-4 w-4" />
                Edit Properties
              </button>
              
              <div className="border-t border-gray-700 my-1"></div>
            </>
          )}
          
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
            onClick={() => {
              const newNode = {
                ...contextMenu.node,
                id: `${contextMenu.node.data.id}-copy-${Date.now()}`,
                position: {
                  x: contextMenu.node.position.x + 50,
                  y: contextMenu.node.position.y + 50,
                },
                selected: false, // Ensure duplicated node is not selected
                data: {
                  ...contextMenu.node.data,
                  onDelete: () => handleDeleteNode(newNode.id),
                  onDuplicate: () => {
                    const duplicatedNode = {
                      ...newNode,
                      id: `${newNode.data.id}-copy-${Date.now()}`,
                      position: {
                        x: newNode.position.x + 50,
                        y: newNode.position.y + 50,
                      },
                      selected: false, // Ensure duplicated node is not selected
                    };
                    setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(duplicatedNode));
                  },
                  onUpdate: (contextMenu.node.type === 'text' || contextMenu.node.type === 'shape' || contextMenu.node.type === 'application' || contextMenu.node.type === 'rectangle' || contextMenu.node.type === 'container' || contextMenu.node.type === 'roundedRectangle') ? (updatedData: any) => {
                    setNodes((nds) => {
                      const updatedNodes = nds.map(n => 
                        n.id === newNode.id 
                          ? { ...n, data: { ...n.data, ...updatedData } }
                          : n
                      );
                      
                      // Notify parent of changes for database persistence
                      if (onChange) {
                        setEdges((currentEdges) => {
                          onChange(updatedNodes, currentEdges);
                          return currentEdges;
                        });
                      }
                      
                      return updatedNodes;
                    });
                  } : undefined,
                },
              };
              setNodes((nds) => {
                const updatedNodes = nds.map(n => ({ ...n, selected: false })).concat(newNode);
                
                // Notify parent of changes for database persistence
                if (onChange) {
                  onChange(updatedNodes, edges);
                }
                
                return updatedNodes;
              });
              toast({
                title: 'Component Duplicated',
                description: 'A copy of the component has been created',
              });
              setContextMenu(null);
            }}
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </button>
          
          <div className="border-t border-gray-700 my-1"></div>
          
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 w-full text-left"
            onClick={() => {
              handleDeleteNode(contextMenu.node.id);
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}

      {/* Edge Context Menu */}
      {edgeContextMenu && (
        <div
          className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]"
          style={{
            left: `${edgeContextMenu.mouseX}px`,
            top: `${edgeContextMenu.mouseY}px`,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center gap-2"
            onClick={() => {
              setEditingEdge(edgeContextMenu.edge);
              setEdgeEditDialogOpen(true);
              setEdgeContextMenu(null);
            }}
          >
            <Edit className="h-4 w-4" />
            Edit Connection
          </button>
          <div className="border-t border-gray-700 my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 flex items-center gap-2"
            onClick={() => {
              setEdges((eds) => {
                const updatedEdges = eds.filter((e) => e.id !== edgeContextMenu.edge.id);
                
                // Notify parent of changes for database persistence
                if (onChange) {
                  onChange(nodes, updatedEdges);
                }
                
                return updatedEdges;
              });
              setEdgeContextMenu(null);
              
              // Save to history after deleting edge
              setTimeout(saveToHistory, 100);
              
              toast({
                title: 'Connection Removed',
                description: 'Connection has been deleted',
              });
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Connection
          </button>
        </div>
      )}
      

      {/* Edge Edit Dialog */}
      <EdgeEditDialog
        isOpen={edgeEditDialogOpen}
        onClose={() => {
          setEdgeEditDialogOpen(false);
          setEditingEdge(null);
        }}
        edge={editingEdge}
        onSave={(edgeId, data) => {
          const updatedEdges = edges.map((edge) =>
            edge.id === edgeId
              ? {
                  ...edge,
                  data: {
                    ...edge.data,
                    ...data,
                  },
                  label: data.latency ? `${data.latency}ms` : undefined,
                  labelStyle: { fill: '#9ca3af', fontSize: 11 },
                  labelBgStyle: { fill: '#1f2937', fillOpacity: 0.8 },
                }
              : edge
          );
          
          setEdges(updatedEdges);
          
          // Notify parent of changes for database persistence
          if (onChange) {
            onChange(nodes, updatedEdges);
          }
          
          setEdgeEditDialogOpen(false);
          setEditingEdge(null);
          
          // Save to history after editing edge
          setTimeout(saveToHistory, 100);
          
          toast({
            title: 'Connection Updated',
            description: 'Connection properties have been saved',
          });
        }}
      />

      {/* Node Edit Dialog */}
      <NodeEditDialog
        isOpen={nodeEditDialogOpen}
        onClose={() => {
          setNodeEditDialogOpen(false);
          setEditingNode(null);
        }}
        node={editingNode}
        onSave={(nodeId, data) => {
          const updatedNodes = nodes.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...data,
                  },
                }
              : node
          );
          
          setNodes(updatedNodes);
          
          // Notify parent of changes for database persistence
          if (onChange) {
            onChange(updatedNodes, edges);
          }
          
          setNodeEditDialogOpen(false);
          setEditingNode(null);
          
          // Save to history after editing node
          setTimeout(saveToHistory, 100);
          
          toast({
            title: 'Node Updated',
            description: 'Component properties have been updated',
          });
        }}
      />
    </div>
  );
}

const DragDropCanvasInnerForwarded = forwardRef(DragDropCanvasInner);
DragDropCanvasInnerForwarded.displayName = 'DragDropCanvasInner';

// Export wrapper component with ReactFlowProvider
const DragDropCanvas = forwardRef<any, DragDropCanvasProps>(
  (props, ref) => {
    return (
      <ReactFlowProvider>
        <DragDropCanvasInnerForwarded ref={ref} {...props} />
      </ReactFlowProvider>
    );
  }
);

DragDropCanvas.displayName = 'DragDropCanvas';

export default DragDropCanvas;