import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  Position,
  EdgeTypes,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, ArrowLeft, Undo2, Redo2, Type, Download, RefreshCw } from "lucide-react";
import { toPng } from 'html-to-image';
import SequenceDiagramNode from "@/components/diagram/sequence-diagram-node";
import SequenceDiagramBottomNode from "@/components/diagram/sequence-diagram-bottom-node";
import SequenceDiagramEdgeDraggable from "@/components/diagram/sequence-diagram-edge-draggable";
import SelfLoopEdgeDraggable from "@/components/diagram/self-loop-edge-draggable";
import TextBoxNode from "@/components/diagram/text-box-node";
import ProcessLaneNode from "@/components/diagram/process-lane-node";
import IMLDetailsDialog from "@/components/diagram/iml-details-dialog";
import ApplicationDetailsDialog from "@/components/diagram/application-details-dialog";
import DiagramContextMenu from "@/components/diagram/diagram-context-menu";
import { TextFormattingDialog } from "@/components/diagram/text-formatting-dialog";
import { useUndoRedo } from "@/hooks/use-undo-redo";

const nodeTypes: NodeTypes = {
  sequenceNode: SequenceDiagramNode,
  sequenceBottomNode: SequenceDiagramBottomNode,
  textBox: TextBoxNode,
  processLane: ProcessLaneNode,
};

const edgeTypes = {
  sequence: SequenceDiagramEdgeDraggable,
  selfloopDraggable: SelfLoopEdgeDraggable,
};

const defaultEdgeOptions = {
  animated: true,
  style: {
    strokeWidth: 2,
    cursor: 'pointer',
  },
  interactionWidth: 20,
};

function TechnicalProcessDiagramInner() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const technicalProcessId = parseInt(params.id as string);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { getNodes, getViewport } = useReactFlow();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedIMLId, setSelectedIMLId] = useState<number | null>(null);
  const [selectedInterface, setSelectedInterface] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [copiedNode, setCopiedNode] = useState<Node | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTextFormattingOpen, setIsTextFormattingOpen] = useState(false);
  const [selectedTextNode, setSelectedTextNode] = useState<Node | null>(null);
  const [lifelineHeight, setLifelineHeight] = useState(600);

  // Undo/Redo state management
  const {
    state: diagramHistory,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    isUndoRedo,
    reset,
  } = useUndoRedo({ nodes: [], edges: [] });

  // Fetch technical process details
  const { data: technicalProcess, isLoading: processLoading } = useQuery({
    queryKey: [`/api/technical-processes/${technicalProcessId}`],
    enabled: !!technicalProcessId,
  });

  // Fetch all interfaces to get full details
  const { data: allInterfaces = [] } = useQuery({
    queryKey: ["/api/interfaces"],
    enabled: !!technicalProcess,
  });

  // Fetch saved diagram
  const { data: diagram } = useQuery({
    queryKey: ["technical-process-diagram", technicalProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/technical-process-diagrams/${technicalProcessId}`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch diagram");
      return response.json();
    },
    enabled: !!technicalProcessId,
  });

  // Generate technical process diagram
  const generateTechnicalProcessDiagram = (process: any) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Get unique applications from interfaces and internal activities
    const uniqueApps = new Map<number, any>();
    const interfacesBySequence: Array<{ sequence: number; interface: any; fullInterface: any }> = [];
    
    // Get the application that owns this technical process
    if (process.applicationId && process.applicationName) {
      uniqueApps.set(process.applicationId, {
        id: process.applicationId,
        name: process.applicationName
      });
    }
    
    // Process interfaces to find all involved applications
    process.interfaces?.forEach((intf: any) => {
      if (intf.interfaceId) {
        // Find the full interface details
        const fullInterface = allInterfaces.find((i: any) => i.id === intf.interfaceId);
        if (fullInterface) {
          // Add provider application
          if (fullInterface.providerApplicationId && fullInterface.providerApplicationName) {
            uniqueApps.set(fullInterface.providerApplicationId, {
              id: fullInterface.providerApplicationId,
              name: fullInterface.providerApplicationName
            });
          }
          
          // Add consumer application
          if (fullInterface.consumerApplicationId && fullInterface.consumerApplicationName) {
            uniqueApps.set(fullInterface.consumerApplicationId, {
              id: fullInterface.consumerApplicationId,
              name: fullInterface.consumerApplicationName
            });
          }
          
          interfacesBySequence.push({
            sequence: intf.sequenceNumber || 0, // Use sequence number from interface
            interface: intf,
            fullInterface
          });
        }
      }
    });
    
    // From internal activities
    const activities = process.internalActivities || [];
    
    // Merge interfaces and activities into a single sequence
    const allSequenceItems: Array<{
      type: 'interface' | 'activity';
      sequence: number;
      data: any;
    }> = [];
    
    // Add interfaces to sequence
    interfacesBySequence.forEach(item => {
      allSequenceItems.push({
        type: 'interface',
        sequence: item.sequence,
        data: item
      });
    });
    
    // Add activities to sequence
    activities.forEach((activity: any) => {
      allSequenceItems.push({
        type: 'activity',
        sequence: activity.sequenceNumber || 0,
        data: activity
      });
    });
    
    // Sort all items by sequence number
    allSequenceItems.sort((a, b) => a.sequence - b.sequence);
    
    // Calculate positioning
    let xPosition = 100;
    const xSpacing = 300; // Increased from 250 for better horizontal spacing
    const yPosition = 50;
    const initialYOffset = 250; // Increased from 150 for more space after process start
    const ySpacing = 120; // Increased from 80 to prevent overlaps between activities
    const totalItems = allSequenceItems.length;
    const calculatedHeight = Math.max(600, initialYOffset + (totalItems * ySpacing) + 200);
    
    // Create application nodes
    uniqueApps.forEach((app, appId) => {
      // Top application node
      nodes.push({
        id: `app-${appId}`,
        type: 'sequenceNode',
        position: { x: xPosition, y: yPosition },
        data: {
          application: app,
          interfaces: [],
          lifelineHeight: calculatedHeight
        },
        draggable: true,
        style: { zIndex: 50 }
      });
      
      // Bottom application node
      nodes.push({
        id: `app-bottom-${appId}`,
        type: 'sequenceBottomNode',
        position: { x: xPosition, y: yPosition + 80 + calculatedHeight },
        data: {
          application: app,
          interfaces: [],
          currentHeight: calculatedHeight
        },
        draggable: true,
        style: { zIndex: 10 }
      });
      
      xPosition += xSpacing;
    });
    
    // Add process lane
    nodes.push({
      id: `lane-start-${process.id}`,
      type: 'processLane',
      position: { x: 0, y: initialYOffset - 80 }, // Adjusted for increased offset
      data: {
        type: 'start',
        processName: process.name,
        processLevel: 'Technical',
        description: process.description || 'Technical process'
      },
      draggable: true,
      selectable: true,
      style: {
        width: (uniqueApps.size * xSpacing) + 300, // Adjusted for increased spacing
        zIndex: 0
      }
    });
    
    // Create edges for interfaces and internal activities in sequence
    let yOffset = initialYOffset;
    
    // Process all sequence items in order
    allSequenceItems.forEach((item) => {
      if (item.type === 'interface') {
        const { interface: intf, fullInterface } = item.data;
        if (fullInterface.providerApplicationId && fullInterface.consumerApplicationId) {
        // Determine arrow direction based on interface type
        const isFileInterface = fullInterface.interfaceType?.toLowerCase() === 'file';
        
        // Debug logging to understand arrow direction
        console.log(`IML ${fullInterface.imlNumber}:`, {
          type: fullInterface.interfaceType,
          provider: fullInterface.providerApp?.name || fullInterface.providerApplicationName || 'Unknown',
          providerId: fullInterface.providerApplicationId,
          consumer: fullInterface.consumerApp?.name || fullInterface.consumerApplicationName || 'Unknown', 
          consumerId: fullInterface.consumerApplicationId,
          isFileInterface,
          expectedFlow: isFileInterface 
            ? `${fullInterface.providerApp?.name || 'Provider'} → ${fullInterface.consumerApp?.name || 'Consumer'}` 
            : `${fullInterface.consumerApp?.name || fullInterface.consumerApplicationName || 'Consumer'} → ${fullInterface.providerApp?.name || fullInterface.providerApplicationName || 'Provider'}`
        });
        
        const source = isFileInterface 
          ? `app-${fullInterface.providerApplicationId}` // File: provider sends to consumer
          : `app-${fullInterface.consumerApplicationId}`; // Service: consumer calls provider
        const target = isFileInterface
          ? `app-${fullInterface.consumerApplicationId}` // File: consumer receives
          : `app-${fullInterface.providerApplicationId}`; // Service: provider responds
        
          edges.push({
            id: `iml-${fullInterface.id}`,
            source,
            target,
            type: 'sequence',
            data: {
              interface: fullInterface,
              sequenceNumber: item.sequence,
              yPosition: yOffset,
              businessProcessId: process.id,
              businessProcessLevel: 'Technical',
              usageType: intf.usageType
            },
            label: `${item.sequence}. ${fullInterface.imlNumber}${intf.usageType ? ` (${intf.usageType})` : ''}`,
            labelStyle: {
              fill: '#fff',
              fontSize: 12,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: '#1e293b',
              fillOpacity: 0.8,
            },
            style: {
              stroke: '#10b981',
              strokeWidth: 3,
              zIndex: 999,
              cursor: 'pointer'
            },
            animated: true,
            markerEnd: 'url(#arrowclosed)',
          });
        }
      } else if (item.type === 'activity') {
        const activityItem = item.data;
        const activity = activityItem.activity;
        if (process.applicationId && activity) {
          edges.push({
            id: `activity-${activity.id}`,
            source: `app-${process.applicationId}`,
            target: `app-${process.applicationId}`,
            type: 'selfloopDraggable',
            data: {
              isInternalActivity: true,
              activity: activity,
              sequenceNumber: activityItem.sequenceNumber,
              yPosition: yOffset,
              businessProcessId: process.id,
              businessProcessLevel: 'Technical'
            },
            label: `${item.sequence}. ${activity.activityName}`,
            labelStyle: {
              fill: '#fff',
              fontSize: 12,
              fontWeight: 600,
            },
            labelBgStyle: {
              fill: '#1e293b',
              fillOpacity: 0.8,
            },
            style: {
              stroke: '#16a34a',
              strokeWidth: 3,
              zIndex: 999,
              cursor: 'pointer'
            },
            animated: false,
            selectable: true,
            focusable: true,
            interactionWidth: 30
          });
        }
      }
      
      yOffset += ySpacing;
    });
    
    // Add end lane
    nodes.push({
      id: `lane-end-${process.id}`,
      type: 'processLane',
      position: { x: 0, y: yOffset + 80 }, // Adjusted for better end spacing
      data: {
        type: 'end',
        processName: process.name,
        processLevel: 'Technical'
      },
      draggable: true,
      selectable: true,
      style: {
        width: (uniqueApps.size * xSpacing) + 300, // Adjusted for increased spacing
        zIndex: 0
      }
    });
    
    return { nodes, edges };
  };

  // Load diagram when data is ready
  useEffect(() => {
    if (!technicalProcess || processLoading) return;

    if (diagram?.diagramData) {
      try {
        const data = JSON.parse(diagram.diagramData);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        // Reset history with initial state
        reset({ nodes: data.nodes || [], edges: data.edges || [] });
      } catch (error) {
        console.error("Failed to parse diagram data:", error);
      }
    } else if (diagram === null) {
      // Generate new diagram
      const { nodes, edges } = generateTechnicalProcessDiagram(technicalProcess);
      setNodes(nodes);
      setEdges(edges);
      // Reset history with initial state
      reset({ nodes, edges });
    }
  }, [diagram, technicalProcess, processLoading, allInterfaces]);

  // Save diagram mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { nodes: Node[]; edges: Edge[] }) => {
      const response = await fetch(`/api/technical-process-diagrams/${technicalProcessId}`, {
        method: diagram ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technicalProcessId,
          diagramData: JSON.stringify(data),
        }),
      });
      if (!response.ok) throw new Error("Failed to save diagram");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Diagram saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["technical-process-diagram", technicalProcessId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ nodes, edges });
  };

  const handleDownload = async () => {
    try {
      const element = document.querySelector('.react-flow');
      if (!element) {
        toast({
          title: "Error",
          description: "Could not find diagram element",
          variant: "destructive",
        });
        return;
      }

      // Get the actual dimensions of the diagram
      const rect = element.getBoundingClientRect();
      const nodes = getNodes();
      
      // Find the bounds of all nodes to capture the entire diagram
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      nodes.forEach(node => {
        minX = Math.min(minX, node.position.x);
        minY = Math.min(minY, node.position.y);
        maxX = Math.max(maxX, node.position.x + (node.width || 200));
        maxY = Math.max(maxY, node.position.y + (node.height || 100));
      });
      
      // Add padding
      const padding = 100;
      const diagramWidth = Math.max(1920, maxX - minX + padding * 2);
      const diagramHeight = Math.max(1080, maxY - minY + padding * 2);

      const dataUrl = await toPng(element as HTMLElement, {
        quality: 0.95,
        width: diagramWidth,
        height: diagramHeight,
        backgroundColor: '#1e1e1e',
        pixelRatio: 2, // Higher resolution
      });

      const link = document.createElement('a');
      link.download = `technical-process-${technicalProcess?.name || 'diagram'}.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Success",
        description: "Diagram downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading diagram:', error);
      toast({
        title: "Error",
        description: "Failed to download diagram",
        variant: "destructive",
      });
    }
  };

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: any, node: Node) => {
    setSelectedNode(node);
    if (node.type === "sequenceNode" && node.data?.application) {
      setSelectedAppId(node.data.application.id);
      setSelectedApp(node.data.application);
    }
  }, []);

  const onNodeDoubleClick = useCallback((event: any, node: Node) => {
    if (node.type === "sequenceNode" && node.data?.application) {
      setIsAppDetailsOpen(true);
    }
  }, []);

  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (node.type === "sequenceNode" && node.data?.application) {
      const applicationId = node.data.application.id;
      const lifelineHeight = node.data.lifelineHeight || 600;
      
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type === 'sequenceBottomNode' && n.data?.application?.id === applicationId) {
            return {
              ...n,
              position: {
                x: node.position.x,
                y: node.position.y + 80 + lifelineHeight
              }
            };
          }
          return n;
        })
      );
    } else if (node.type === "sequenceBottomNode" && node.data?.application) {
      const applicationId = node.data.application.id;
      const currentHeight = node.data.currentHeight || 600;
      
      setNodes((nds) =>
        nds.map((n) => {
          if (n.type === 'sequenceNode' && n.data?.application?.id === applicationId) {
            // Calculate new height based on bottom node position
            const newHeight = node.position.y - n.position.y - 80;
            return {
              ...n,
              data: {
                ...n.data,
                lifelineHeight: Math.max(200, newHeight) // Minimum height of 200
              }
            };
          }
          return n;
        })
      );
    }
  }, [setNodes]);

  const handleAddTextBox = useCallback((position?: { x: number; y: number }) => {
    const viewport = getViewport();
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'textBox',
      position: position || {
        x: (400 - viewport.x) / viewport.zoom,
        y: (300 - viewport.y) / viewport.zoom,
      },
      data: {
        text: 'New Text Box',
        fontSize: 14,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#ffffff',
        backgroundColor: '#1e293b',
        borderColor: '#475569',
        borderWidth: 1,
        padding: 8,
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNode(newNode);
    setSelectedTextNode(newNode);
    setIsTextFormattingOpen(true);
  }, [getViewport, setNodes]);

  // Context menu handlers
  const handleCopy = useCallback(() => {
    if (selectedNode) {
      setCopiedNode(selectedNode);
      toast({
        title: "Copied",
        description: "Element copied to clipboard",
      });
    }
  }, [selectedNode]);

  const handlePaste = useCallback(() => {
    if (copiedNode && contextMenuPosition) {
      const viewport = getViewport();
      const newNode: Node = {
        ...copiedNode,
        id: `${copiedNode.id}-copy-${Date.now()}`,
        position: {
          x: (contextMenuPosition.x - viewport.x) / viewport.zoom,
          y: (contextMenuPosition.y - viewport.y) / viewport.zoom,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      if (!isUndoRedo) {
        pushState({ nodes: [...nodes, newNode], edges });
      }
    }
  }, [copiedNode, contextMenuPosition, getViewport, setNodes, nodes, edges, isUndoRedo, pushState]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setSelectedNode(null);
      if (!isUndoRedo) {
        pushState({ nodes: nodes.filter((n) => n.id !== selectedNode.id), edges });
      }
    } else if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      setSelectedEdge(null);
      if (!isUndoRedo) {
        pushState({ nodes, edges: edges.filter((e) => e.id !== selectedEdge.id) });
      }
    }
  }, [selectedNode, selectedEdge, setNodes, setEdges, nodes, edges, isUndoRedo, pushState]);

  const handleEdit = useCallback(() => {
    if (selectedNode?.type === 'textBox') {
      setSelectedTextNode(selectedNode);
      setIsTextFormattingOpen(true);
    } else if (selectedEdge) {
      setIsEditDialogOpen(true);
    }
  }, [selectedNode, selectedEdge]);

  const handleViewDetails = useCallback(() => {
    if (selectedNode?.type === 'sequenceNode' && selectedNode.data?.application) {
      setIsAppDetailsOpen(true);
    } else if (selectedEdge?.data?.interface) {
      setIsDetailsOpen(true);
    } else if (selectedEdge?.data?.activity) {
      setIsDetailsOpen(true);
    }
  }, [selectedNode, selectedEdge]);

  const handleTextFormatting = useCallback(() => {
    if (selectedNode?.type === 'textBox') {
      setSelectedTextNode(selectedNode);
      setIsTextFormattingOpen(true);
    }
  }, [selectedNode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (canUndo) undo();
            break;
          case 'y':
            e.preventDefault();
            if (canRedo) redo();
            break;
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode || selectedEdge) {
          e.preventDefault();
          handleDelete();
        }
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleAddTextBox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, handleSave, handleCopy, handlePaste, handleDelete, selectedNode, selectedEdge, handleAddTextBox]);

  if (processLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-400">Loading technical process...</div>
      </div>
    );
  }

  if (!technicalProcess) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-lg font-medium text-white">Technical process not found</div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/technical-processes")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Technical Processes
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 p-4 flex items-center justify-between bg-gray-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/technical-processes/${technicalProcessId}`)}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">
                {technicalProcess?.name || "Loading..."}
              </h2>
              <p className="text-sm text-gray-400">
                Technical Process Diagram • Internal Activities Flow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                const { nodes, edges } = generateTechnicalProcessDiagram(technicalProcess);
                setNodes(nodes);
                setEdges(edges);
                reset({ nodes, edges });
                toast({
                  title: "Diagram Refreshed",
                  description: "Regenerated diagram from process data",
                  duration: 2000,
                });
              }}
              title="Refresh Diagram"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => handleAddTextBox()}
              title="Add Text Box"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Type className="mr-2 h-4 w-4" />
              Add Text
            </Button>
            <Button
              onClick={handleDownload}
              title="Download Diagram as PNG"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
              <Save className="mr-2 h-4 w-4" />
              {saveMutation.isPending ? "Saving..." : "Save Diagram"}
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          <DiagramContextMenu
            onCopy={handleCopy}
            onPaste={handlePaste}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onAddTextBox={() => handleAddTextBox(contextMenuPosition)}
            onTextFormatting={handleTextFormatting}
            hasCopiedNode={!!copiedNode}
            isTextNode={selectedNode?.type === "textBox"}
          >
            <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={(event, node) => {
              // Push state after drag is complete for undo/redo
              if (!isUndoRedo) {
                pushState({ nodes, edges });
              }
            }}
            onNodeContextMenu={(event, node) => {
              event.preventDefault();
              setSelectedNode(node);
              setContextMenuPosition({ x: event.clientX, y: event.clientY });
              if (node.type === "sequenceNode" && node.data?.application) {
                setSelectedAppId(node.data.application.id);
                setSelectedApp(node.data.application);
              }
            }}
            nodesDraggable={true}
            nodesConnectable={true}
            elementsSelectable={true}
            panOnDrag={true}
            selectionOnDrag={false}
            panOnScroll={true}
            zoomOnScroll={true}
            onEdgeClick={(_, edge) => {
              setSelectedEdge(edge);
              if (edge.data?.interface) {
                setSelectedInterface(edge.data.interface);
                setSelectedIMLId(edge.data.interface.id);
              } else if (edge.data?.activity) {
                console.log('Internal activity clicked:', edge.data.activity);
              }
            }}
            onEdgeDoubleClick={(_, edge) => {
              if (edge.data?.interface) {
                setSelectedInterface(edge.data.interface);
                setSelectedIMLId(edge.data.interface.id);
                setIsDetailsOpen(true);
              } else if (edge.data?.activity) {
                // For internal activities, show the same details dialog as IMLs
                setSelectedInterface({
                  id: edge.data.activity.id,
                  imlNumber: edge.data.activity.activityName,
                  interfaceType: edge.data.activity.activityType,
                  description: edge.data.activity.description,
                  status: 'active',
                  isInternalActivity: true
                });
                setSelectedIMLId(edge.data.activity.id);
                setIsDetailsOpen(true);
              }
            }}
            onEdgeContextMenu={(event, edge) => {
              event.preventDefault();
              setSelectedEdge(edge);
              setContextMenuPosition({ x: event.clientX, y: event.clientY });
              if (edge.data?.interface) {
                setSelectedInterface(edge.data.interface);
                setSelectedIMLId(edge.data.interface.id);
              } else if (edge.data?.activity) {
                // Handle internal activities in context menu
                setSelectedInterface({
                  id: edge.data.activity.id,
                  imlNumber: edge.data.activity.activityName,
                  interfaceType: edge.data.activity.activityType,
                  description: edge.data.activity.description,
                  status: 'active',
                  isInternalActivity: true
                });
                setSelectedIMLId(edge.data.activity.id);
              }
            }}
            onPaneContextMenu={(event) => {
              event.preventDefault();
              setContextMenuPosition({ x: event.clientX, y: event.clientY });
              setSelectedNode(null);
              setSelectedEdge(null);
            }}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            fitView
            style={{
              backgroundColor: '#1e1e1e',
              backgroundImage: 'radial-gradient(circle at 1px 1px, #2a2a2a 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
            >
              <Controls className="react-flow__controls" style={{ backgroundColor: '#2a2a2a', border: '1px solid #3a3a3a' }} />
            <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
              <defs>
                <marker
                  id="arrowclosed"
                  viewBox="0 0 20 20"
                  refX="19"
                  refY="10"
                  markerWidth="10"
                  markerHeight="10"
                  orient="auto"
                >
                  <path d="M 0 0 L 20 10 L 0 20 z" fill="#10b981" stroke="#10b981" />
                </marker>
                <marker
                  id="arrowclosed-green"
                  viewBox="0 0 20 20"
                  refX="19"
                  refY="10"
                  markerWidth="10"
                  markerHeight="10"
                  orient="auto"
                >
                  <path d="M 0 0 L 20 10 L 0 20 z" fill="#16a34a" stroke="#16a34a" />
                </marker>
                <marker
                  id="arrow-return"
                  viewBox="0 0 20 20"
                  refX="19"
                  refY="10"
                  markerWidth="8"
                  markerHeight="8"
                  orient="auto"
                >
                  <path d="M 0 0 L 20 10 L 0 20 z" fill="#9ca3af" stroke="#9ca3af" />
                </marker>
              </defs>
            </svg>
            </ReactFlow>
          </DiagramContextMenu>
        </div>
      </div>

      <IMLDetailsDialog
        imlId={selectedIMLId}
        interfaceData={selectedInterface}
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open);
          if (!open) {
            setSelectedInterface(null);
          }
        }}
      />

      <ApplicationDetailsDialog
        applicationId={selectedAppId}
        applicationData={selectedApp}
        open={isAppDetailsOpen}
        onOpenChange={(open) => {
          setIsAppDetailsOpen(open);
          if (!open) {
            setSelectedApp(null);
          }
        }}
      />

      <TextFormattingDialog
        open={isTextFormattingOpen}
        onOpenChange={setIsTextFormattingOpen}
        currentSettings={selectedTextNode?.data || {}}
        onApply={(settings) => {
          if (selectedTextNode) {
            setNodes((nds) =>
              nds.map((node) =>
                node.id === selectedTextNode.id
                  ? {
                      ...node,
                      data: {
                        ...node.data,
                        ...settings,
                      },
                    }
                  : node
              )
            );
            toast({
              title: "Formatting Applied",
              description: "Text formatting updated successfully",
            });
          }
        }}
      />
    </div>
  );
}

// Export wrapper component with ReactFlowProvider
export default function TechnicalProcessDiagram() {
  return (
    <ReactFlowProvider>
      <TechnicalProcessDiagramInner />
    </ReactFlowProvider>
  );
}