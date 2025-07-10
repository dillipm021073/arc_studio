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
  MarkerType,
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
import { Save, Plus, ArrowLeft, Undo2, Redo2, Type, Download, FileBox, RefreshCw } from "lucide-react";
import { toPng } from 'html-to-image';
import SequenceDiagramNode from "@/components/diagram/sequence-diagram-node";
import SequenceDiagramBottomNode from "@/components/diagram/sequence-diagram-bottom-node";
import SequenceDiagramEdgeDraggable from "@/components/diagram/sequence-diagram-edge-draggable";
import SelfLoopEdge from "@/components/diagram/self-loop-edge";
import SelfLoopEdgeDraggable from "@/components/diagram/self-loop-edge-draggable";
import TextBoxNode from "@/components/diagram/text-box-node";
import ProcessGroupNode from "@/components/diagram/process-group-node";
import ProcessLaneNode from "@/components/diagram/process-lane-node";
import EmptyProcessNode from "@/components/diagram/empty-process-node";
import IMLDetailsDialog from "@/components/diagram/iml-details-dialog";
import ApplicationDetailsDialog from "@/components/diagram/application-details-dialog";
import DiagramContextMenu from "@/components/diagram/diagram-context-menu";
import { TextFormattingDialog } from "@/components/diagram/text-formatting-dialog";
import BusinessProcessDetailsModal from "@/components/modals/BusinessProcessDetailsModal";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { generateSIDUMLDiagram } from "@/components/diagram/sid-uml-generator";
import { generateSIDUMLDiagramV2 } from "@/components/diagram/sid-uml-generator-v2";
import { generateSIDUMLDiagramV3 } from "@/components/diagram/sid-uml-generator-v3";

const nodeTypes: NodeTypes = {
  sequenceNode: SequenceDiagramNode,
  sequenceBottomNode: SequenceDiagramBottomNode,
  textBox: TextBoxNode,
  processGroup: ProcessGroupNode,
  processLane: ProcessLaneNode,
  emptyProcess: EmptyProcessNode,
  // Note: 'group' and 'default' are built-in React Flow node types
};

const edgeTypes = {
  sequence: SequenceDiagramEdgeDraggable,
  selfloop: SelfLoopEdge,
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

function BusinessProcessDiagramInner() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const businessProcessId = parseInt(params.id as string);

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
  const [selectedBusinessProcessId, setSelectedBusinessProcessId] = useState<number | null>(null);
  const [isBusinessProcessDetailsOpen, setIsBusinessProcessDetailsOpen] = useState(false);
  const [copiedNode, setCopiedNode] = useState<Node | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTextFormattingOpen, setIsTextFormattingOpen] = useState(false);
  const [selectedTextNode, setSelectedTextNode] = useState<Node | null>(null);
  const [lifelineHeight, setLifelineHeight] = useState(600);
  const [diagramMode, setDiagramMode] = useState<'sequence' | 'sid-uml'>('sequence');

  // Undo/Redo state management
  const {
    state: diagramHistory,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
    isUndoRedo,
  } = useUndoRedo({ nodes: [], edges: [] });

  // Fetch business process details
  const { data: businessProcess } = useQuery({
    queryKey: ["business-process", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch business process");
      return response.json();
    },
  });

  // Fetch child processes (for Level A and B processes)
  const { data: childProcesses = [], isLoading: childProcessesLoading } = useQuery({
    queryKey: ["business-processes", businessProcessId, "children"],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/children`);
      if (!response.ok) throw new Error("Failed to fetch child processes");
      return response.json();
    },
    enabled: businessProcess?.level === 'A' || businessProcess?.level === 'B', // Fetch children for Level A and B processes
  });

  // Fetch business process interfaces
  const { data: bpInterfaces = [], isLoading: bpInterfacesLoading } = useQuery({
    queryKey: ["business-process-interfaces", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/interfaces`);
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
  });

  // Fetch interfaces for all child processes (only for Level A processes)
  const { data: allChildInterfaces = [], isLoading: childInterfacesLoading } = useQuery({
    queryKey: ["child-process-interfaces", childProcesses],
    queryFn: async () => {
      if (childProcesses.length === 0) return [];
      
      const allInterfaces = await Promise.all(
        childProcesses.map(async (childProcess: any) => {
          const response = await fetch(`/api/business-processes/${childProcess.id}/interfaces`);
          if (!response.ok) return [];
          const interfaces = await response.json();
          return interfaces.map((iface: any) => ({
            ...iface,
            businessProcessId: childProcess.id,
            businessProcessName: childProcess.businessProcess
          }));
        })
      );
      
      return allInterfaces.flat();
    },
    enabled: childProcesses.length > 0 && (businessProcess?.level === 'A' || businessProcess?.level === 'B'),
  });

  // Fetch diagram data
  const { data: diagram } = useQuery({
    queryKey: ["business-process-diagram", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/diagram`);
      if (response.status === 404) return null;
      if (!response.ok) throw new Error("Failed to fetch diagram");
      return response.json();
    },
  });

  // Generate nodes and edges from interfaces (UML Sequence Diagram)
  const generateSequenceDiagram = (interfaces: any[], extendHandler: (applicationId: number, newHeight: number) => void) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Filter only active interfaces
    const activeInterfaces = interfaces.filter(iface => iface.status === 'active');
    
    // Get internal activities directly
    const internalActivities = currentProcessActivities.map((item: any) => item.activity) || [];
    
    
    // For processes without children (Level C or Level B without children), use simple diagram
    if (childProcesses.length === 0) {
      // Filter interfaces that specifically belong to this business process
      const directInterfaces = activeInterfaces.filter(iface => 
        iface.businessProcessId === businessProcessId || 
        (!iface.businessProcessId && iface.businessProcessName === businessProcess.businessProcess)
      );
      
      return generateSimpleSequenceDiagram(directInterfaces, extendHandler, internalActivities);
    }
    
    // For processes with children (Level A or Level B with children), use complex logic
    const processGroups = new Map();
    const directInterfaces: any[] = [];
    
    // Fetch child process interfaces separately
    // Always include child processes, even if they have no interfaces
    childProcesses.forEach((childProcess: any) => {
      const childInterfaces = activeInterfaces.filter(iface => 
        iface.businessProcessId === childProcess.id
      );
      processGroups.set(childProcess.id, {
        process: childProcess,
        interfaces: childInterfaces
      });
    });
    
    // Interfaces that belong to the current (parent) process
    activeInterfaces.forEach(iface => {
      const belongsToChild = childProcesses.some((cp: any) => 
        iface.businessProcessId === cp.id
      );
      if (!belongsToChild) {
        directInterfaces.push(iface);
      }
    });
    
    // Collect all unique applications
    const uniqueApps = new Map<number, any>();
    const appInterfaces = new Map<number, any[]>();
    
    activeInterfaces.forEach((iface) => {
      if (iface.providerApp && !uniqueApps.has(iface.providerApplicationId)) {
        uniqueApps.set(iface.providerApplicationId, iface.providerApp);
        appInterfaces.set(iface.providerApplicationId, []);
      }
      if (iface.consumerApp && !uniqueApps.has(iface.consumerApplicationId)) {
        uniqueApps.set(iface.consumerApplicationId, iface.consumerApp);
        appInterfaces.set(iface.consumerApplicationId, []);
      }
    });

    // Map interfaces to applications
    activeInterfaces.forEach((iface) => {
      if (iface.providerApplicationId) {
        appInterfaces.get(iface.providerApplicationId)?.push(iface);
      }
      if (iface.consumerApplicationId) {
        appInterfaces.get(iface.consumerApplicationId)?.push(iface);
      }
    });

    // Create sequence diagram nodes (systems with lifelines)
    let xPosition = 100;
    const xSpacing = 250;
    const yPosition = 50;

    // Calculate required lifeline height based on number of interfaces and activities
    const initialYOffset = 200; // Increased to provide more space after lane start
    const ySpacing = 120; // Increased from 80 to prevent IML box overlap
    
    // Calculate total height needed including process groups
    const directItemsCount = directInterfaces.length + internalActivities.length;
    let totalHeight = initialYOffset + (directItemsCount * ySpacing) + 100;
    processGroups.forEach((group) => {
      totalHeight += Math.max(200, (group.interfaces.length * ySpacing) + 100) + 50;
    });
    
    const lifelineHeight = Math.max(600, totalHeight + 200);

    uniqueApps.forEach((app, appId) => {
      // Top application node
      nodes.push({
        id: `seq-${appId}`,
        type: 'sequenceNode',
        position: { x: xPosition, y: yPosition },
        data: {
          application: app,
          interfaces: appInterfaces.get(appId) || [],
          lifelineHeight: lifelineHeight
        },
        dragHandle: '.drag-handle',
        style: {
          zIndex: 50, // Ensure application nodes are above process groups
        }
      });


      // Bottom application node (mirror)
      nodes.push({
        id: `seq-bottom-${appId}`,
        type: 'sequenceBottomNode',
        position: { x: xPosition, y: yPosition + 80 + lifelineHeight }, // Position at end of lifeline
        data: {
          application: app,
          interfaces: appInterfaces.get(appId) || [],
          onExtendLifeline: extendHandler,
          currentHeight: lifelineHeight
        },
        dragHandle: '.drag-handle',
        style: {
          zIndex: 10,
        }
      });

      xPosition += xSpacing;
    });

    // Calculate positioning for process groups based on their interfaces
    const processGroupPositions = new Map();
    // Start after Level A interfaces and activities
    const levelAItemCount = directInterfaces.length + internalActivities.length;
    let groupYOffset = initialYOffset + (levelAItemCount * ySpacing) + 50;
    
    // Iterate through childProcesses in sequence order
    childProcesses.forEach((childProcess: any) => {
      const group = processGroups.get(childProcess.id);
      if (group) {
        const groupInterfaceCount = group.interfaces.length;
        const groupHeight = Math.max(200, (groupInterfaceCount * ySpacing) + 100);
        
        processGroupPositions.set(childProcess.id, {
          y: groupYOffset,
          height: groupHeight
        });
        
        groupYOffset += groupHeight + 100; // Increased space between process groups for better readability
      }
    });

    // Add process boxes for child processes (Level B) using ProcessGroupNode
    processGroupPositions.forEach((position, processId) => {
      const group = processGroups.get(processId);
      if (group) {
        // Add full process box for Level B process
        nodes.push({
          id: `process-group-${processId}`,
          type: 'processGroup',
          position: { x: 0, y: position.y - 30 },
          data: {
            businessProcess: group.process,
            childInterfaces: group.interfaces,
            parentProcesses: []
          },
          draggable: true,
          selectable: true,
          resizing: true,
          style: {
            width: (uniqueApps.size * xSpacing) + 200,
            height: position.height + 50,
            zIndex: -5 // Process boxes in background
          }
        });
      }
    });

    // Add start lane for Level A process (end lane will be added after all child processes)
    if (businessProcess) {
      const laneWidth = uniqueApps.size > 0 ? (uniqueApps.size * xSpacing) + 200 : 600;
      
      // Start lane for Level A process
      nodes.push({
        id: `lane-start-${businessProcess.id}`,
        type: 'processLane',
        position: { x: 0, y: initialYOffset - 100 },
        data: {
          type: 'start',
          processName: businessProcess.businessProcess,
          processLevel: businessProcess.level || 'A',
          description: businessProcess.description || 'Main business process'
        },
        draggable: false,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });
    }

    // Create sequence edges (interface arrows and internal activities)
    // First, combine direct interfaces and internal activities for Level A
    const directSequenceItems = [
      ...directInterfaces.map((iface, index) => ({
        type: 'interface' as const,
        data: iface,
        sequenceNumber: iface.sequenceNumber || 999 + index
      })),
      ...internalActivities.map((activity: any) => ({
        type: 'activity' as const,
        data: activity,
        sequenceNumber: activity.sequenceNumber || 999
      }))
    ].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    let yOffset = initialYOffset;

    directSequenceItems.forEach((item, index) => {
      if (item.type === 'interface') {
        const iface = item.data;
      if (iface.providerApplicationId && iface.consumerApplicationId) {
        const isFileInterface = iface.interfaceType?.toLowerCase() === 'file';
        
        // Determine source and target based on interface type
        let sourceId, targetId;
        if (isFileInterface) {
          // File interfaces: provider → consumer (provider sends/pushes file to consumer)
          sourceId = `seq-${iface.providerApplicationId}`;
          targetId = `seq-${iface.consumerApplicationId}`;
        } else {
          // Online interfaces (REST, SOAP, etc): consumer → provider (consumer calls provider)
          sourceId = `seq-${iface.consumerApplicationId}`;
          targetId = `seq-${iface.providerApplicationId}`;
        }

        edges.push({
          id: `seq-edge-${iface.id}`,
          source: sourceId,
          target: targetId,
          type: 'sequence',
          sourceHandle: 'lifeline',
          targetHandle: 'lifeline',
          data: {
            interface: {
              id: iface.interfaceId,
              imlNumber: iface.imlNumber,
              interfaceType: iface.interfaceType,
              status: iface.status,
              version: iface.version,
              description: iface.interfaceDescription || iface.description,
              providerApplicationId: iface.providerApplicationId,
              consumerApplicationId: iface.consumerApplicationId,
              providerApp: iface.providerApp,
              consumerApp: iface.consumerApp,
              businessProcessName: iface.businessProcessName,
              customerFocal: iface.customerFocal,
              providerOwner: iface.providerOwner,
              consumerOwner: iface.consumerOwner,
              lastChangeDate: iface.lastChangeDate,
              connectivityTestSteps: iface.connectivityTestSteps,
              sampleTestCode: iface.sampleTestCode,
              sampleResponse: iface.sampleResponse,
              consumerDescription: iface.consumerDescription,
            },
            sequenceNumber: iface.sequenceNumber || index + 1,
            yPosition: yOffset,
            businessProcessLevel: 'A'
          },
          style: {
            strokeWidth: 2,
            stroke: iface.status === 'active' ? '#10b981' : '#6b7280'
          },
          zIndex: 1000, // Ensure interface arrows are above everything
          markerEnd: iface.status === 'active' ? 'url(#arrowclosed)' : 'url(#arrowclosed-inactive)'
        });

        yOffset += ySpacing;
      }
      } else if (item.type === 'activity') {
        const activity = item.data;
        
        // Create a self-loop edge for the internal activity on the application that performs it
        if (activity.applicationId) {
          edges.push({
            id: `activity-edge-${activity.id}`,
            source: `seq-${activity.applicationId}`,
            target: `seq-${activity.applicationId}`,
            type: 'selfloopDraggable',
            sourceHandle: 'lifeline',
            targetHandle: 'lifeline',
            data: {
              activity: {
                id: activity.id,
                activityName: activity.activityName,
                activityType: activity.activityType,
                description: activity.description,
                sequenceNumber: activity.sequenceNumber,
                applicationId: activity.applicationId,
              },
              sequenceNumber: item.sequenceNumber,
              yPosition: yOffset,
              label: `${activity.activityName}`,
              sublabel: activity.activityType,
              businessProcessId: businessProcessId,
              businessProcessLevel: businessProcess?.level || 'B'
            },
            style: {
              strokeWidth: 2,
              stroke: '#16a34a', // Green for internal activities
            },
            zIndex: 900,
          });
        }
        
        yOffset += ySpacing;
      }
    });

    // Then, render Level B interfaces within their process groups (in sequence order)
    childProcesses.forEach((childProcess: any) => {
      const group = processGroups.get(childProcess.id);
      if (!group) return;
      
      const processId = childProcess.id;
      // Get the calculated position for this process group
      const position = processGroupPositions.get(processId);
      let groupYOffset = position ? position.y + 60 : yOffset + 100;

      // If child process has no interfaces, add an empty process node
      if (group.interfaces.length === 0) {
        nodes.push({
          id: `empty-process-${processId}`,
          type: 'emptyProcess',
          position: { x: 100, y: groupYOffset },
          data: {
            processName: childProcess.businessProcess,
            processLevel: childProcess.level || 'C',
            description: childProcess.description,
            lob: childProcess.LOB,
            product: childProcess.product
          },
          draggable: true,
          style: {
            zIndex: 10
          }
        });
      }

      group.interfaces.forEach((iface: any, index: number) => {
        if (iface.providerApplicationId && iface.consumerApplicationId) {
          const isFileInterface = iface.interfaceType?.toLowerCase() === 'file';
          
          // Determine source and target based on interface type
          let sourceId, targetId;
          if (isFileInterface) {
            sourceId = `seq-${iface.providerApplicationId}`;
            targetId = `seq-${iface.consumerApplicationId}`;
          } else {
            sourceId = `seq-${iface.consumerApplicationId}`;
            targetId = `seq-${iface.providerApplicationId}`;
          }

          edges.push({
            id: `seq-edge-${iface.id}`,
            source: sourceId,
            target: targetId,
            type: 'sequence',
            sourceHandle: 'lifeline',
            targetHandle: 'lifeline',
            data: {
              interface: {
                id: iface.interfaceId,
                imlNumber: iface.imlNumber,
                interfaceType: iface.interfaceType,
                status: iface.status,
                version: iface.version,
                description: iface.interfaceDescription || iface.description,
                providerApplicationId: iface.providerApplicationId,
                consumerApplicationId: iface.consumerApplicationId,
                providerApp: iface.providerApp,
                consumerApp: iface.consumerApp,
                businessProcessName: iface.businessProcessName,
                customerFocal: iface.customerFocal,
                providerOwner: iface.providerOwner,
                consumerOwner: iface.consumerOwner,
                lastChangeDate: iface.lastChangeDate,
                connectivityTestSteps: iface.connectivityTestSteps,
                sampleTestCode: iface.sampleTestCode,
                sampleResponse: iface.sampleResponse,
                consumerDescription: iface.consumerDescription,
              },
              sequenceNumber: iface.sequenceNumber || index + 1,
              yPosition: groupYOffset,
              businessProcessLevel: group.process.level,
              businessProcessId: processId
            },
            style: {
              strokeWidth: 2,
              stroke: iface.status === 'active' ? '#3b82f6' : '#6b7280', // Different color for Level B
              strokeDasharray: '5,5' // Dashed line to show it's within a process group
            },
            zIndex: 1000, // Ensure interface arrows are above everything
            markerEnd: iface.status === 'active' ? 'url(#arrowclosed-blue)' : 'url(#arrowclosed-inactive)'
          });

          groupYOffset += ySpacing;
        }
      });
    });

    // Now add the Level A end lane after all child processes are positioned
    if (businessProcess) {
      const laneWidth = uniqueApps.size > 0 ? (uniqueApps.size * xSpacing) + 200 : 600;
      
      // Calculate the final end position considering all content
      const hasDirectItems = directInterfaces.length + internalActivities.length > 0;
      const directItemsEndY = hasDirectItems 
        ? initialYOffset + (directInterfaces.length + internalActivities.length) * ySpacing
        : initialYOffset;
      
      // Find the maximum Y position from all process groups
      let maxChildProcessY = directItemsEndY;
      processGroupPositions.forEach((position) => {
        const childEndY = position.y + position.height;
        if (childEndY > maxChildProcessY) {
          maxChildProcessY = childEndY;
        }
      });
      
      // Use the maximum Y position plus some padding
      const levelAEndY = Math.max(directItemsEndY, maxChildProcessY) + 100;
      
      // End lane for Level A process
      nodes.push({
        id: `lane-end-${businessProcess.id}`,
        type: 'processLane',
        position: { x: 0, y: levelAEndY },
        data: {
          type: 'end',
          processName: businessProcess.businessProcess,
          processLevel: businessProcess.level || 'A',
          description: businessProcess.description
        },
        draggable: false,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });
    }

    return { nodes, edges };
  };

  // Generate simple sequence diagram for Level B/C processes (no child processes)
  const generateSimpleSequenceDiagram = (interfaces: any[], extendHandler: (applicationId: number, newHeight: number) => void, internalActivities: any[] = []) => {
    console.log("generateSimpleSequenceDiagram called with interfaces:", interfaces.length);
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Collect all unique applications from interfaces
    const uniqueApps = new Map<number, any>();
    const appInterfaces = new Map<number, any[]>();
    
    interfaces.forEach((iface) => {
      if (iface.providerApp && !uniqueApps.has(iface.providerApplicationId)) {
        uniqueApps.set(iface.providerApplicationId, iface.providerApp);
        appInterfaces.set(iface.providerApplicationId, []);
      }
      if (iface.consumerApp && !uniqueApps.has(iface.consumerApplicationId)) {
        uniqueApps.set(iface.consumerApplicationId, iface.consumerApp);
        appInterfaces.set(iface.consumerApplicationId, []);
      }
    });

    // Map interfaces to applications
    interfaces.forEach((iface) => {
      if (iface.providerApplicationId) {
        appInterfaces.get(iface.providerApplicationId)?.push(iface);
      }
      if (iface.consumerApplicationId) {
        appInterfaces.get(iface.consumerApplicationId)?.push(iface);
      }
    });

    console.log("Found unique applications:", uniqueApps.size);
    console.log("Applications:", Array.from(uniqueApps.values()).map(app => app.name));
    console.log("Internal activities:", internalActivities.length);

    // Calculate total items for lifeline height
    const totalItems = interfaces.length + internalActivities.length;

    // Create sequence diagram nodes (systems with lifelines)
    let xPosition = 100;
    const xSpacing = 250;
    const yPosition = 50;
    const initialYOffset = 150; // Start position for first sequence item
    const ySpacing = 120; // Increased from 80 to prevent IML box overlap
    const lifelineHeight = Math.max(600, initialYOffset + (totalItems * ySpacing) + 200);

    uniqueApps.forEach((app, appId) => {
      // Top application node
      nodes.push({
        id: `seq-${appId}`,
        type: 'sequenceNode',
        position: { x: xPosition, y: yPosition },
        data: {
          application: app,
          interfaces: appInterfaces.get(appId) || [],
          lifelineHeight: lifelineHeight
        },
        dragHandle: '.drag-handle',
        style: {
          zIndex: 50,
        }
      });


      // Bottom application node (mirror)
      nodes.push({
        id: `seq-bottom-${appId}`,
        type: 'sequenceBottomNode',
        position: { x: xPosition, y: yPosition + 80 + lifelineHeight }, // Position at end of lifeline
        data: {
          application: app,
          interfaces: appInterfaces.get(appId) || [],
          onExtendLifeline: extendHandler,
          currentHeight: lifelineHeight
        },
        dragHandle: '.drag-handle',
        style: {
          zIndex: 10,
        }
      });

      xPosition += xSpacing;
    });

    // Add process lanes for single process
    if (businessProcess) {
      // If no items, add empty process node
      if (totalItems === 0 && uniqueApps.size === 0) {
        nodes.push({
          id: `empty-process-${businessProcess.id}`,
          type: 'emptyProcess',
          position: { x: 100, y: 150 },
          data: {
            processName: businessProcess.businessProcess,
            processLevel: businessProcess.level || 'C',
            description: businessProcess.description,
            lob: businessProcess.LOB,
            product: businessProcess.product
          },
          draggable: true,
          style: {
            zIndex: 10
          }
        });
      }
      
      // Always add process lanes
      const laneWidth = totalItems === 0 && uniqueApps.size === 0 ? 500 : (uniqueApps.size * xSpacing) + 200;
      
      // Start lane
      nodes.push({
        id: `lane-start-${businessProcess.id}`,
        type: 'processLane',
        position: { x: 0, y: initialYOffset - 40 },
        data: {
          type: 'start',
          processName: businessProcess.businessProcess,
          processLevel: businessProcess.level || 'B',
          description: businessProcess.description || 'Business process'
        },
        draggable: false,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });

      // End lane
      const endY = totalItems > 0 ? initialYOffset + (totalItems * ySpacing) : 350;
      nodes.push({
        id: `lane-end-${businessProcess.id}`,
        type: 'processLane',
        position: { x: 0, y: endY + 20 },
        data: {
          type: 'end',
          processName: businessProcess.businessProcess,
          processLevel: businessProcess.level || 'B',
          description: businessProcess.description
        },
        draggable: false,
        selectable: true,
        style: {
          width: laneWidth,
          zIndex: 0
        }
      });
    }

    // Combine interfaces and internal activities, sort by sequence number
    const allSequenceItems = [
      ...interfaces.map((iface, index) => ({
        type: 'interface' as const,
        data: iface,
        sequenceNumber: iface.sequenceNumber || 999 + index // Use high number if no sequence number
      })),
      ...internalActivities.map((activity: any) => ({
        type: 'activity' as const,
        data: activity,
        sequenceNumber: activity.sequenceNumber || 999
      }))
    ].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    console.log("All sequence items sorted:", allSequenceItems.map(item => ({
      type: item.type,
      sequenceNumber: item.sequenceNumber,
      name: item.type === 'interface' ? item.data.imlNumber : item.data.activityName
    })));

    // Create sequence edges (interface arrows and internal activities)
    let yOffset = initialYOffset;

    allSequenceItems.forEach((item, index) => {
      if (item.type === 'interface') {
        const iface = item.data;
        if (iface.providerApplicationId && iface.consumerApplicationId) {
          const isFileInterface = iface.interfaceType?.toLowerCase() === 'file';
          
          // Determine source and target based on interface type
          let sourceId, targetId;
          if (isFileInterface) {
            // File interfaces: provider → consumer (provider sends/pushes file to consumer)
            sourceId = `seq-${iface.providerApplicationId}`;
            targetId = `seq-${iface.consumerApplicationId}`;
          } else {
            // Online interfaces (REST, SOAP, etc): consumer → provider (consumer calls provider)
            sourceId = `seq-${iface.consumerApplicationId}`;
            targetId = `seq-${iface.providerApplicationId}`;
          }

          edges.push({
            id: `seq-edge-${iface.id}`,
            source: sourceId,
            target: targetId,
            type: 'sequence',
            sourceHandle: 'lifeline',
            targetHandle: 'lifeline',
            data: {
              interface: {
                id: iface.interfaceId,
                imlNumber: iface.imlNumber,
                interfaceType: iface.interfaceType,
                status: iface.status,
                version: iface.version,
                description: iface.interfaceDescription || iface.description,
                providerApplicationId: iface.providerApplicationId,
                consumerApplicationId: iface.consumerApplicationId,
                providerApp: iface.providerApp,
                consumerApp: iface.consumerApp,
                businessProcessName: iface.businessProcessName,
                customerFocal: iface.customerFocal,
                providerOwner: iface.providerOwner,
                consumerOwner: iface.consumerOwner,
                lastChangeDate: iface.lastChangeDate,
                connectivityTestSteps: iface.connectivityTestSteps,
                sampleTestCode: iface.sampleTestCode,
                sampleResponse: iface.sampleResponse,
                consumerDescription: iface.consumerDescription,
              },
              sequenceNumber: item.sequenceNumber,
              yPosition: yOffset,
              businessProcessId: businessProcessId,
              businessProcessLevel: businessProcess?.level || 'B'
            },
            style: {
              strokeWidth: 2,
              stroke: iface.status === 'active' ? '#3b82f6' : '#6b7280'
            },
            zIndex: 900,
            markerEnd: iface.status === 'active' ? 'url(#arrowclosed-blue)' : 'url(#arrowclosed-inactive)'
          });
        }
      } else if (item.type === 'activity') {
        const activity = item.data;
        
        // Create a self-loop edge for the internal activity on the application that performs it
        if (activity.applicationId) {
          edges.push({
            id: `activity-edge-${activity.id}`,
            source: `seq-${activity.applicationId}`,
            target: `seq-${activity.applicationId}`,
            type: 'selfloopDraggable',
            sourceHandle: 'lifeline',
            targetHandle: 'lifeline',
            data: {
              activity: {
                id: activity.id,
                activityName: activity.activityName,
                activityType: activity.activityType,
                description: activity.description,
                sequenceNumber: activity.sequenceNumber,
                applicationId: activity.applicationId,
              },
              sequenceNumber: item.sequenceNumber,
              yPosition: yOffset,
              label: `${activity.activityName}`,
              sublabel: activity.activityType,
              businessProcessId: businessProcessId,
              businessProcessLevel: businessProcess?.level || 'B'
            },
            style: {
              strokeWidth: 2,
              stroke: '#16a34a', // Green for internal activities
            },
            zIndex: 900,
          });
        }
        
      }
      
      yOffset += ySpacing;
    });

    return { nodes, edges };
  };

  // Fetch business process sequences (includes internal activities)
  const { data: businessProcessSequences = [], isLoading: sequencesLoading } = useQuery({
    queryKey: ["business-process-sequences", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-process-sequences/business-process/${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch business process sequences");
      return response.json();
    },
    enabled: !!businessProcessId,
  });

  // Fetch grandchildren processes (for Level B viewing Level C)
  const { data: grandchildProcesses = [], isLoading: grandchildProcessesLoading } = useQuery({
    queryKey: ["grandchild-processes", childProcesses],
    queryFn: async () => {
      if (childProcesses.length === 0) return [];
      
      const allGrandchildren = await Promise.all(
        childProcesses.map(async (childProcess: any) => {
          const response = await fetch(`/api/business-processes/${childProcess.id}/children`);
          if (!response.ok) return [];
          const grandchildren = await response.json();
          return grandchildren.map((gc: any) => ({
            ...gc,
            parentId: childProcess.id,
            parentName: childProcess.businessProcess
          }));
        })
      );
      
      return allGrandchildren.flat();
    },
    enabled: childProcesses.length > 0 && businessProcess?.level === 'A',
  });

  // Fetch grandchild interfaces (Level C interfaces for Level A processes)
  const { data: grandchildInterfaces = [], isLoading: grandchildInterfacesLoading } = useQuery({
    queryKey: ["grandchild-process-interfaces", grandchildProcesses],
    queryFn: async () => {
      if (grandchildProcesses.length === 0) return [];
      
      const allInterfaces = await Promise.all(
        grandchildProcesses.map(async (grandchildProcess: any) => {
          const response = await fetch(`/api/business-processes/${grandchildProcess.id}/interfaces`);
          if (!response.ok) return [];
          const interfaces = await response.json();
          return interfaces.map((iface: any) => ({
            ...iface,
            businessProcessId: grandchildProcess.id,
            businessProcessName: grandchildProcess.businessProcess,
            businessProcessLevel: grandchildProcess.level
          }));
        })
      );
      
      return allInterfaces.flat();
    },
    enabled: grandchildProcesses.length > 0 && businessProcess?.level === 'A',
  });

  // Fetch internal activities for all child and grandchild processes
  const { data: allDescendantActivities = [], isLoading: descendantActivitiesLoading } = useQuery({
    queryKey: ["descendant-activities", childProcesses, grandchildProcesses],
    queryFn: async () => {
      const allProcessesToFetch = [...childProcesses, ...grandchildProcesses];
      if (allProcessesToFetch.length === 0) return [];
      
      const allActivities = await Promise.all(
        allProcessesToFetch.map(async (process: any) => {
          const response = await fetch(`/api/internal-activities?businessProcessId=${process.id}`);
          if (!response.ok) return [];
          const activities = await response.json();
          return activities.map((item: any) => ({
            ...item,
            activity: {
              ...item.activity,
              businessProcessId: process.id,
              businessProcessName: process.businessProcess
            }
          }));
        })
      );
      
      return allActivities.flat();
    },
    enabled: childProcesses.length > 0 || grandchildProcesses.length > 0,
  });

  // Fetch internal activities for current business process
  const { data: currentProcessActivities = [] } = useQuery({
    queryKey: ["internal-activities", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/internal-activities?businessProcessId=${businessProcessId}`);
      if (!response.ok) return [];
      const activities = await response.json();
      return activities; // Return full data including application
    },
    enabled: !!businessProcessId,
  });

  // Generate SID UML diagram with business processes containing IMLs and internal activities
  const generateSIDUMLView = useCallback(() => {
    if (!businessProcess) return;

    // Use internal activities directly from the API
    const internalActivities = currentProcessActivities.map((item: any) => ({
      id: item.activity.id,
      activityName: item.activity.activityName,
      activityType: item.activity.activityType,
      description: item.activity.description,
      sequenceNumber: item.activity.sequenceNumber,
      applicationId: item.application?.id,
      application: item.application
    }));

    // Prepare data for SID UML generation
    const processData = {
      id: businessProcess.id,
      businessProcess: businessProcess.businessProcess,
      level: businessProcess.level || 'A',
      sequenceNumber: businessProcess.sequenceNumber || 1,
      interfaces: bpInterfaces.map((iface: any, index: number) => ({
        id: iface.id,
        imlNumber: iface.imlNumber,
        interfaceType: iface.interfaceType,
        providerApp: iface.providerApp,
        consumerApp: iface.consumerApp,
        sequenceNumber: iface.sequenceNumber || index + 1,
      })),
      internalActivities: internalActivities,
      childProcesses: childProcesses.map((child: any) => {
        // Extract internal activities for this child process
        const childInternalActivities = allDescendantActivities
          .filter((item: any) => item.activity.businessProcessId === child.id)
          .map((item: any) => ({
            id: item.activity.id,
            activityName: item.activity.activityName,
            activityType: item.activity.activityType,
            description: item.activity.description,
            sequenceNumber: item.activity.sequenceNumber,
            applicationId: item.application?.id,
            application: item.application
          }));
          
        console.log(`Child process ${child.businessProcess} (${child.id}) has ${childInternalActivities.length} internal activities`);

        // Find grandchildren for this child process (only if we're at Level A looking at Level B children)
        const childGrandchildren = businessProcess?.level === 'A' && grandchildProcesses
          ? grandchildProcesses.filter((gc: any) => gc.parentId === child.id)
          : [];

        return {
          id: child.id,
          businessProcess: child.businessProcess,
          level: child.level || (businessProcess.level === 'A' ? 'B' : 'C'),
          sequenceNumber: child.sequenceNumber || 1,
          interfaces: (() => {
            const childInterfaces = allChildInterfaces.filter((iface: any) => iface.businessProcessId === child.id);
            console.log(`Filtering interfaces for child ${child.businessProcess} (id: ${child.id}):`, {
              allChildInterfacesCount: allChildInterfaces.length,
              filteredCount: childInterfaces.length,
              childInterfaces: childInterfaces
            });
            return childInterfaces.map((iface: any, index: number) => ({
              id: iface.id,
              imlNumber: iface.imlNumber,
              interfaceType: iface.interfaceType,
              providerApp: iface.providerApp,
              consumerApp: iface.consumerApp,
              sequenceNumber: iface.sequenceNumber || index + 1,
            }));
          })(),
          internalActivities: childInternalActivities,
          // Recursively add grandchildren with their internal activities (only for Level A)
          childProcesses: childGrandchildren.map((grandchild: any) => {
            const grandchildInternalActivities = allDescendantActivities
              .filter((item: any) => item.activity.businessProcessId === grandchild.id)
              .map((item: any) => ({
                id: item.activity.id,
                activityName: item.activity.activityName,
                activityType: item.activity.activityType,
                description: item.activity.description,
                sequenceNumber: item.activity.sequenceNumber,
                applicationId: item.application?.id,
                application: item.application
              }));


            // Get interfaces for this grandchild (Level C) process
            const grandchildProcessInterfaces = grandchildInterfaces.filter(
              (iface: any) => iface.businessProcessId === grandchild.id
            ).map((iface: any, index: number) => ({
              id: iface.id,
              imlNumber: iface.imlNumber,
              interfaceType: iface.interfaceType,
              providerApp: iface.providerApp,
              consumerApp: iface.consumerApp,
              sequenceNumber: iface.sequenceNumber || index + 1,
            }));

            return {
              id: grandchild.id,
              businessProcess: grandchild.businessProcess,
              level: grandchild.level || 'C',
              sequenceNumber: grandchild.sequenceNumber || 1,
              interfaces: grandchildProcessInterfaces,
              internalActivities: grandchildInternalActivities,
              childProcesses: [], // No further nesting for now
            };
          }),
        };
      }),
    };

    try {
      console.log('Generating SID UML with processData:', {
        id: processData.id,
        businessProcess: processData.businessProcess,
        level: processData.level,
        interfacesCount: processData.interfaces.length,
        internalActivitiesCount: processData.internalActivities.length,
        childProcessesCount: processData.childProcesses.length
      });
      
      // Debug child processes
      processData.childProcesses.forEach((child: any) => {
        console.log(`Child process ${child.businessProcess}:`, {
          id: child.id,
          level: child.level,
          interfacesCount: child.interfaces?.length || 0,
          interfaces: child.interfaces
        });
      });
      
      const { nodes: sidNodes, edges: sidEdges } = generateSIDUMLDiagramV3([processData], {
        showChildProcesses: true, // Always show child processes if they exist
        showInterfaceDetails: true,
        layoutDirection: 'vertical',
        currentProcessActivities: currentProcessActivities
      });
      
      console.log('SID UML result:', { nodesCount: sidNodes?.length, nodes: sidNodes });
      
      // Enhance edges with click handlers for internal activities and interfaces
      const enhancedEdges = sidEdges.map(edge => {
        if (edge.type === 'sequence' && edge.data?.interface) {
          return {
            ...edge,
            data: {
              ...edge.data,
              onContextMenu: (e: React.MouseEvent) => {
                e.preventDefault();
                setSelectedEdge(edge);
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
                setSelectedInterface(edge.data.interface);
                setSelectedIMLId(edge.data.interface.id);
              }
            }
          };
        } else if (edge.type === 'selfloopDraggable' && edge.data?.activity) {
          return {
            ...edge,
            data: {
              ...edge.data,
              onClick: () => {
                console.log('Internal activity clicked:', edge.data.activity);
                toast({
                  title: edge.data.activity.activityName,
                  description: edge.data.activity.description || 'No description available',
                  duration: 5000,
                });
              },
              onDoubleClick: () => {
                console.log('Internal activity double-clicked:', edge.data.activity);
                // Show details dialog for internal activity
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
              },
              onContextMenu: (e: React.MouseEvent) => {
                e.preventDefault();
                setSelectedEdge(edge);
                setContextMenuPosition({ x: e.clientX, y: e.clientY });
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
            }
          };
        }
        return edge;
      });
      
      setNodes(sidNodes || []);
      setEdges(enhancedEdges || []);
      // Don't push state for SID UML view as it's auto-generated

      toast({
        title: "SID UML View Generated",
        description: "Switched to SID UML diagram view with business processes, their IMLs, and internal activities",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error generating SID UML:', error);
      toast({
        title: "Error",
        description: "Failed to generate SID UML view",
        variant: "destructive",
      });
    }
  }, [businessProcess, bpInterfaces, childProcesses, allChildInterfaces, currentProcessActivities, allDescendantActivities, grandchildProcesses, grandchildInterfaces, setNodes, setEdges, toast]);

  // Track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load diagram data when fetched
  useEffect(() => {
    // Skip if we're still loading data
    const isLoading = businessProcess?.level === 'A' || businessProcess?.level === 'B'
      ? (bpInterfacesLoading || childInterfacesLoading || childProcessesLoading || sequencesLoading || descendantActivitiesLoading || grandchildProcessesLoading || grandchildInterfacesLoading)
      : (bpInterfacesLoading || sequencesLoading);
    
    if (isLoading) {
      console.log("Still loading data, skipping diagram generation");
      return;
    }

    // Only run once when all data is loaded
    if (initialLoadComplete) {
      console.log("Initial load already complete, skipping");
      return;
    }

    console.log("Initial diagram load - all data loaded");

    if (diagram?.diagramData) {
      console.log("Loading saved diagram data");
      try {
        const data = JSON.parse(diagram.diagramData);
        if (data.nodes) setNodes(data.nodes);
        if (data.edges) setEdges(data.edges);
        resetHistory({ nodes: data.nodes || [], edges: data.edges || [] });
        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Failed to parse diagram data:", error);
      }
    } else if (diagram === null) {
      // Generate new diagram only once
      const hasInterfaces = businessProcess?.level === 'A' || businessProcess?.level === 'B'
        ? (bpInterfaces.length > 0 || allChildInterfaces.length > 0 || grandchildInterfaces.length > 0)
        : bpInterfaces.length > 0;
      
      // Always generate diagram structure, even for empty processes
      console.log("Generating initial sequence diagram");
      
      let allInterfaces;
      if (childProcesses.length > 0) {
        // Combine all interfaces: direct, child, and grandchild
        allInterfaces = [...bpInterfaces, ...allChildInterfaces, ...grandchildInterfaces];
      } else {
        allInterfaces = bpInterfaces;
      }
      
      const { nodes, edges } = generateSequenceDiagram(allInterfaces, handleExtendLifeline);
      
      // If we have a structure (nodes/edges) or need to show empty process
      if (nodes.length > 0 || edges.length > 0 || businessProcess) {
        setNodes(nodes);
        setEdges(edges);
        resetHistory({ nodes, edges });
        setInitialLoadComplete(true);
        
        if (hasInterfaces) {
          toast({
            title: "Diagram Generated",
            description: `Created diagram with ${allInterfaces.length} interface${allInterfaces.length !== 1 ? 's' : ''}`,
            duration: 2000,
          });
        } else {
          toast({
            title: "Diagram Structure Generated",
            description: "Process structure created (no interfaces defined)",
            duration: 2000,
          });
        }
      } else {
        // Fallback for unexpected cases
        setNodes([]);
        setEdges([]);
        resetHistory({ nodes: [], edges: [] });
        setInitialLoadComplete(true);
      }
    }
  }, [
    diagram,
    businessProcess?.level,
    bpInterfacesLoading,
    childInterfacesLoading,
    childProcessesLoading,
    grandchildProcessesLoading,
    grandchildInterfacesLoading,
    sequencesLoading,
    initialLoadComplete
  ]);

  // Debounce timer ref for pushState
  const pushStateTimerRef = useRef<NodeJS.Timeout>();

  // Track changes to nodes and edges for undo/redo with debouncing
  useEffect(() => {
    if (!isUndoRedo && nodes.length > 0 && diagramMode === 'sequence') {
      // Clear any existing timer
      if (pushStateTimerRef.current) {
        clearTimeout(pushStateTimerRef.current);
      }
      
      // Set a new timer to push state after 500ms of no changes
      pushStateTimerRef.current = setTimeout(() => {
        pushState({ nodes, edges });
      }, 500);
    }
    
    // Cleanup on unmount
    return () => {
      if (pushStateTimerRef.current) {
        clearTimeout(pushStateTimerRef.current);
      }
    };
  }, [nodes, edges, pushState, isUndoRedo, diagramMode]);

  // Apply undo/redo state changes
  useEffect(() => {
    if (isUndoRedo) {
      setNodes(diagramHistory.nodes);
      setEdges(diagramHistory.edges);
    }
  }, [diagramHistory, setNodes, setEdges, isUndoRedo]);

  // Save diagram mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { nodes: Node[]; edges: Edge[] }) => {
      const diagramData = JSON.stringify(data);
      const url = diagram
        ? `/api/diagrams/${diagram.id}`
        : `/api/business-processes/${businessProcessId}/diagram`;
      const method = diagram ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessProcessId,
          diagramData,
          notes: "",
        }),
      });

      if (!response.ok) throw new Error("Failed to save diagram");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-process-diagram", businessProcessId] });
      toast({
        title: "Success",
        description: "Diagram saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save diagram",
        variant: "destructive",
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleExtendLifeline = useCallback((applicationId: number, newHeight: number) => {
    setLifelineHeight(newHeight);
    setNodes((nds) =>
      nds.map((node) => {
        // Update top sequence nodes
        if (node.type === 'sequenceNode' && node.data?.application?.id === applicationId) {
          return {
            ...node,
            data: {
              ...node.data,
              lifelineHeight: newHeight,
            },
          };
        }
        // Update bottom sequence nodes position while maintaining horizontal alignment
        if (node.type === 'sequenceBottomNode' && node.data?.application?.id === applicationId) {
          // Find the corresponding top node to get its X position
          const topNode = nds.find(n => 
            n.type === 'sequenceNode' && n.data?.application?.id === applicationId
          );
          const topNodeX = topNode?.position.x || node.position.x;
          
          return {
            ...node,
            position: {
              x: topNodeX, // Perfect alignment with top node
              y: 50 + 80 + newHeight, // Adjust position based on new height
            },
            data: {
              ...node.data,
              currentHeight: newHeight,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onNodeDoubleClick = useCallback((_: any, node: Node) => {
    if (node.type === "sequenceNode" && node.data?.application) {
      setSelectedAppId(node.data.application.id);
      setSelectedApp(node.data.application);
      setIsAppDetailsOpen(true);
    } else if (node.type === "processGroup" && node.data?.businessProcess) {
      // Handle double-click on business process boxes
      setSelectedBusinessProcessId(node.data.businessProcess.id);
      setIsBusinessProcessDetailsOpen(true);
    } else if (node.type === "processLane") {
      // Handle double-click on swim lanes
      // Extract business process ID from node ID (e.g., "lane-start-123" or "lane-end-123")
      const match = node.id.match(/lane-(?:start|end)-(\d+)/);
      if (match && match[1]) {
        const processId = parseInt(match[1]);
        setSelectedBusinessProcessId(processId);
        setIsBusinessProcessDetailsOpen(true);
      }
    } else if (node.type === "emptyProcess") {
      // Handle double-click on empty process nodes
      // Extract business process ID from node ID (e.g., "empty-process-123")
      const match = node.id.match(/empty-process-(\d+)/);
      if (match && match[1]) {
        const processId = parseInt(match[1]);
        setSelectedBusinessProcessId(processId);
        setIsBusinessProcessDetailsOpen(true);
      }
    }
  }, []);

  const onNodeDrag = useCallback((event: any, node: Node) => {
    if (node.type === "sequenceNode" && node.data?.application) {
      // When top node is dragged, move bottom node and lifeline with it
      const applicationId = node.data.application.id;
      const lifelineHeight = node.data.lifelineHeight || 600;
      
      setNodes((nds) =>
        nds.map((n) => {
          // Move bottom node - check both ID patterns
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
      // When bottom node is dragged, only allow vertical movement for stretching
      // Don't move the top node, but update the lifeline height
      const applicationId = node.data.application.id;
      
      // Find the top node to get its position
      // Check both seq- and app- prefixed IDs for compatibility with different diagram modes
      const topNode = nodes.find(n => 
        n.type === 'sequenceNode' && n.data?.application?.id === applicationId
      );
      
      if (topNode) {
        // Calculate new lifeline height based on bottom node position
        const newLifelineHeight = Math.max(200, node.position.y - topNode.position.y - 100);
        
        // Update both top and bottom nodes
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              // Update bottom node position (lock x, allow y)
              return {
                ...n,
                position: {
                  x: topNode.position.x, // Lock x position
                  y: node.position.y // Allow y movement
                }
              };
            } else if (n.type === 'sequenceNode' && n.data?.application?.id === applicationId) {
              // Update top node with new lifeline height and bottom node position
              return {
                ...n,
                data: {
                  ...n.data,
                  lifelineHeight: newLifelineHeight,
                  bottomNodePosition: { x: topNode.position.x, y: node.position.y },
                  topNodePosition: { x: topNode.position.x, y: topNode.position.y }
                }
              };
            }
            return n;
          })
        );
      }
    }
  }, [setNodes, nodes]);

  const onNodeDragStop = useCallback((event: any, node: Node) => {
    if (node.type === "sequenceBottomNode" && node.data?.application) {
      const applicationId = node.data.application.id;
      
      // Find the corresponding top node
      const topNode = nodes.find(n => 
        n.type === 'sequenceNode' && n.data?.application?.id === applicationId
      );
      
      if (topNode) {
        const minDistance = 200;
        const newHeight = Math.max(minDistance, node.position.y - topNode.position.y - 80);
        
        // Update the lifeline height
        setNodes((nds) =>
          nds.map((n) => {
            if (n.type === 'sequenceNode' && n.data?.application?.id === applicationId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  lifelineHeight: newHeight
                }
              };
            }
            if (n.type === 'sequenceBottomNode' && n.data?.application?.id === applicationId) {
              return {
                ...n,
                data: {
                  ...n.data,
                  currentHeight: newHeight
                }
              };
            }
            return n;
          })
        );
        
        // Show feedback
        if (Math.abs(newHeight - (node.data?.currentHeight || 600)) > 10) {
          toast({
            title: "Lifeline Extended",
            description: `Height updated to ${Math.round(newHeight)}px`,
            duration: 2000,
          });
        }
      }
    }
  }, [nodes, setNodes, toast]);

  const onNodeResize = useCallback((event: any, node: Node) => {
    if (node.type === "processGroup") {
      toast({
        title: "Process Group Resized",
        description: `${node.data?.businessProcess?.businessProcess} resized to ${Math.round(node.width || 0)}×${Math.round(node.height || 0)}px`,
        duration: 2000,
      });
    }
  }, [toast]);

  const handleCopy = useCallback(() => {
    if (selectedNode) {
      setCopiedNode(selectedNode);
      toast({
        title: "Copied",
        description: selectedNode.type === 'textBox' ? "Text box copied" : "Node copied to clipboard",
      });
    }
  }, [selectedNode, toast]);

  const handlePaste = useCallback(() => {
    if (copiedNode && nodes.length > 0) {
      const newNode: Node = {
        ...copiedNode,
        id: `${copiedNode.id}-copy-${Date.now()}`,
        position: {
          x: copiedNode.position.x + 50,
          y: copiedNode.position.y + 50,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      toast({
        title: "Pasted",
        description: "Node pasted successfully",
      });
    }
  }, [copiedNode, nodes, setNodes, toast]);

  const handleDelete = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
      toast({
        title: "Deleted",
        description: selectedNode.type === 'textBox' ? "Text box deleted" : "Node deleted successfully",
      });
    }
  }, [selectedNode, setNodes, setEdges, toast]);

  const handleEdit = useCallback(() => {
    if (selectedNode?.type === "iml") {
      setIsEditDialogOpen(true);
    }
  }, [selectedNode]);

  const handleViewDetails = useCallback(() => {
    if (selectedNode?.type === "sequenceNode" && selectedNode.data?.application) {
      setSelectedAppId(selectedNode.data.application.id);
      setSelectedApp(selectedNode.data.application);
      setIsAppDetailsOpen(true);
    } else if (selectedEdge?.data?.interface) {
      setSelectedIMLId(selectedEdge.data.interface.id);
      setSelectedInterface(selectedEdge.data.interface);
      setIsDetailsOpen(true);
    }
  }, [selectedNode, selectedEdge]);

  const handleTextFormatting = useCallback(() => {
    if (selectedNode?.type === "textBox") {
      setSelectedTextNode(selectedNode);
      setIsTextFormattingOpen(true);
    }
  }, [selectedNode]);

  const handleApplyTextFormatting = useCallback((settings: any) => {
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
  }, [selectedTextNode, setNodes, toast]);

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

      // Get all nodes to calculate bounds
      const allNodes = getNodes();
      
      if (allNodes.length === 0) {
        toast({
          title: "Warning",
          description: "No content to export",
          variant: "default",
        });
        return;
      }

      // Calculate the bounding box of all nodes
      const padding = 100;
      let bounds = {
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
      };

      if (Array.isArray(allNodes)) {
        allNodes.forEach(node => {
          // Get actual node dimensions - sequence nodes have specific sizes
          let nodeWidth = node.width || 200;
          let nodeHeight = node.height || 100;
          
          // Special handling for sequence diagram nodes
          if (node.type === 'sequenceNode' || node.type === 'sequenceBottomNode') {
            nodeWidth = 150; // Standard width for sequence nodes
            nodeHeight = 80; // Standard height
          } else if (node.type === 'processGroup') {
            // Process groups have their width/height in style
            nodeWidth = node.style?.width || 800;
            nodeHeight = node.style?.height || 200;
          }
        
          bounds.minX = Math.min(bounds.minX, node.position.x);
          bounds.minY = Math.min(bounds.minY, node.position.y);
          bounds.maxX = Math.max(bounds.maxX, node.position.x + nodeWidth);
          bounds.maxY = Math.max(bounds.maxY, node.position.y + nodeHeight);
        });
      } else {
        console.error('allNodes is not an array in business-process-diagram:', allNodes);
      }

      // Calculate dimensions with padding
      const width = Math.ceil(bounds.maxX - bounds.minX + (padding * 2));
      const height = Math.ceil(bounds.maxY - bounds.minY + (padding * 2));

      // Create a temporary container for high-res capture
      const viewport = getViewport();
      const pixelRatio = 2; // Export at 2x resolution for better quality

      // Store original transform
      const originalTransform = (element as HTMLElement).style.transform;
      
      // Temporarily adjust the viewport for capture
      (element as HTMLElement).style.transform = 
        `translate(${-bounds.minX * viewport.zoom + padding}px, ${-bounds.minY * viewport.zoom + padding}px) scale(${viewport.zoom})`;

      const dataUrl = await toPng(element as HTMLElement, {
        backgroundColor: '#1e1e1e',
        width: width * viewport.zoom,
        height: height * viewport.zoom,
        pixelRatio: pixelRatio,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${viewport.zoom})`,
        },
        filter: (domNode) => {
          // Exclude controls and panels from export
          if (domNode.classList && 
              (domNode.classList.contains('react-flow__controls') || 
               domNode.classList.contains('react-flow__panel'))) {
            return false;
          }
          return true;
        }
      });

      // Restore original transform
      (element as HTMLElement).style.transform = originalTransform;

      const link = document.createElement('a');
      link.download = `${businessProcess?.businessProcess || 'diagram'}-${new Date().toISOString().split('T')[0]}-highres.png`;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Success",
        description: `High-resolution diagram exported (${width * pixelRatio}×${height * pixelRatio}px)`,
      });
    } catch (error) {
      console.error('Failed to download diagram:', error);
      toast({
        title: "Error",
        description: "Failed to download diagram",
        variant: "destructive",
      });
    }
  };

  // Create a new text box node
  const handleAddTextBox = useCallback((position?: { x: number; y: number }) => {
    const newNode: Node = {
      id: `text-${Date.now()}`,
      type: 'textBox',
      position: position || { x: 300, y: 300 },
      data: {
        text: 'New Text Box',
        fontSize: 14,
        textAlign: 'left',
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        backgroundColor: '#fef3c7',
        width: 200,
        height: 60,
      },
      dragHandle: '.drag-handle',
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast({
      title: "Text Box Added",
      description: "Double-click to edit the text",
      duration: 2000,
    });
  }, [setNodes, toast]);

  // Update node data function for text boxes
  useEffect(() => {
    window.updateNodeData = (nodeId: string, data: any) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }
          return node;
        })
      );
    };

    return () => {
      delete window.updateNodeData;
    };
  }, [setNodes]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) {
          undo();
          toast({
            title: "Undo",
            description: "Action undone",
            duration: 1500,
          });
        }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) {
          redo();
          toast({
            title: "Redo",
            description: "Action redone",
            duration: 1500,
          });
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        handleAddTextBox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, handleDelete, handleAddTextBox, undo, redo, canUndo, canRedo, toast]);

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-700 p-4 flex items-center justify-between bg-gray-800">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/business-processes")}
              className="text-gray-400 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold text-white">
                {businessProcess?.businessProcess || "Loading..."}
              </h2>
              <p className="text-sm text-gray-400">
                {diagramMode === 'sid-uml' 
                  ? 'SID UML View • Business Processes with IMLs' 
                  : 'IML Flow Diagram Editor • Click Level B boxes to resize'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={undo}
              disabled={!canUndo || diagramMode === 'sid-uml'}
              title="Undo (Ctrl+Z)"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={redo}
              disabled={!canRedo || diagramMode === 'sid-uml'}
              title="Redo (Ctrl+Y)"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600 disabled:opacity-50"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-600 mx-2" />
            <Button
              variant="outline"
              size="icon"
              onClick={async () => {
                if (diagramMode === 'sequence') {
                  // First, refetch the saved diagram data
                  await queryClient.invalidateQueries({ queryKey: ["business-process-diagram", businessProcessId] });
                  
                  // Fetch the diagram data directly
                  try {
                    const response = await fetch(`/api/business-processes/${businessProcessId}/diagram`);
                    const diagramData = response.ok && response.status !== 404 ? await response.json() : null;
                    
                    if (diagramData?.diagramData) {
                      // Load saved diagram
                      try {
                        const data = JSON.parse(diagramData.diagramData);
                        if (data.nodes) setNodes(data.nodes);
                        if (data.edges) setEdges(data.edges);
                        resetHistory({ nodes: data.nodes || [], edges: data.edges || [] });
                        toast({
                          title: "Diagram Refreshed",
                          description: "Loaded saved diagram configuration",
                          duration: 2000,
                        });
                      } catch (error) {
                        console.error("Failed to parse diagram data:", error);
                        // Fall back to regenerating
                        const allInterfaces = businessProcess?.level === 'A' 
                          ? [...bpInterfaces, ...allChildInterfaces]
                          : bpInterfaces;
                        const { nodes, edges } = generateSequenceDiagram(allInterfaces, handleExtendLifeline);
                        setNodes(nodes);
                        setEdges(edges);
                        resetHistory({ nodes, edges });
                        toast({
                          title: "Diagram Refreshed",
                          description: "Regenerated diagram from interfaces",
                          duration: 2000,
                        });
                      }
                    } else {
                      // No saved diagram, regenerate from interfaces
                      const allInterfaces = businessProcess?.level === 'A' 
                        ? [...bpInterfaces, ...allChildInterfaces]
                        : bpInterfaces;
                      const { nodes, edges } = generateSequenceDiagram(allInterfaces, handleExtendLifeline);
                      setNodes(nodes);
                      setEdges(edges);
                      resetHistory({ nodes, edges });
                      toast({
                        title: "Diagram Refreshed",
                        description: "Regenerated diagram from interfaces",
                        duration: 2000,
                      });
                    }
                  } catch (error) {
                    // If fetch fails, just regenerate
                    console.error("Failed to fetch diagram:", error);
                    const allInterfaces = childProcesses.length > 0
                      ? [...bpInterfaces, ...allChildInterfaces]
                      : bpInterfaces;
                    const { nodes, edges } = generateSequenceDiagram(allInterfaces, handleExtendLifeline);
                    setNodes(nodes);
                    setEdges(edges);
                    resetHistory({ nodes, edges });
                    toast({
                      title: "Diagram Refreshed",
                      description: "Regenerated diagram from interfaces",
                      duration: 2000,
                    });
                  }
                } else {
                  generateSIDUMLView();
                }
              }}
              title="Refresh Diagram"
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant={diagramMode === 'sid-uml' ? 'default' : 'outline'}
              onClick={() => {
                if (diagramMode === 'sequence') {
                  setDiagramMode('sid-uml');
                  generateSIDUMLView();
                } else {
                  setDiagramMode('sequence');
                  // Regenerate sequence diagram
                  const allInterfaces = childProcesses.length > 0
                    ? [...bpInterfaces, ...allChildInterfaces]
                    : bpInterfaces;
                  const { nodes, edges } = generateSequenceDiagram(allInterfaces, handleExtendLifeline);
                  setNodes(nodes);
                  setEdges(edges);
                  resetHistory({ nodes, edges });
                }
              }}
              title="Toggle SID UML View"
              className={diagramMode === 'sid-uml' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'}
            >
              <FileBox className="mr-2 h-4 w-4" />
              {diagramMode === 'sid-uml' ? 'SID UML' : 'Sequence'}
            </Button>
            {diagramMode === 'sequence' && (
              <Button
                onClick={() => handleAddTextBox()}
                title="Add Text Box"
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Type className="mr-2 h-4 w-4" />
                Add Text
              </Button>
            )}
            <Button
              onClick={handleDownload}
              title="Download Diagram as PNG"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {diagramMode === 'sequence' && (
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-blue-600 text-white hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Diagram"}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 relative">
          <DiagramContextMenu
            onCopy={handleCopy}
            onPaste={handlePaste}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onAddTextBox={() => {
              handleAddTextBox(contextMenuPosition || undefined);
              setContextMenuPosition(null);
            }}
            onTextFormatting={handleTextFormatting}
            hasCopiedNode={!!copiedNode}
            isTextNode={selectedNode?.type === "textBox"}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={diagramMode === 'sequence' ? onNodesChange : undefined}
              onEdgesChange={diagramMode === 'sequence' ? onEdgesChange : undefined}
              onConnect={diagramMode === 'sequence' ? onConnect : undefined}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              onNodeResize={diagramMode === 'sequence' ? onNodeResize : undefined}
              nodesDraggable={true}
              nodesConnectable={diagramMode === 'sequence'}
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
                  toast({
                    title: edge.data.activity.activityName,
                    description: edge.data.activity.description || 'No description available',
                    duration: 5000,
                  });
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
                if (edge.data?.interface) {
                  setSelectedInterface(edge.data.interface);
                  setSelectedIMLId(edge.data.interface.id);
                  // Show context menu position
                  setContextMenuPosition({ x: event.clientX, y: event.clientY });
                } else if (edge.data?.activity) {
                  // For internal activities, show the same details dialog as IMLs
                  // but with activity-specific information
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
              onPaneContextMenu={(event) => {
                event.preventDefault();
                // For now, let's just add the text box at a default position
                // when right-clicking on empty space
                handleAddTextBox({ x: 400, y: 300 });
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
                    id="arrow-return"
                    viewBox="0 0 10 10"
                    refX="9"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#9ca3af" stroke="#9ca3af" strokeWidth="1" />
                  </marker>
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
                    id="arrowclosed-inactive"
                    viewBox="0 0 20 20"
                    refX="19"
                    refY="10"
                    markerWidth="10"
                    markerHeight="10"
                    orient="auto"
                  >
                    <path d="M 0 0 L 20 10 L 0 20 z" fill="#6b7280" stroke="#6b7280" />
                  </marker>
                  <marker
                    id="arrowclosed-blue"
                    viewBox="0 0 20 20"
                    refX="19"
                    refY="10"
                    markerWidth="10"
                    markerHeight="10"
                    orient="auto"
                  >
                    <path d="M 0 0 L 20 10 L 0 20 z" fill="#3b82f6" stroke="#3b82f6" />
                  </marker>
                  <marker
                    id="arrowclosed-gray"
                    viewBox="0 0 20 20"
                    refX="19"
                    refY="10"
                    markerWidth="10"
                    markerHeight="10"
                    orient="auto"
                  >
                    <path d="M 0 0 L 20 10 L 0 20 z" fill="#9ca3af" stroke="#9ca3af" />
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

      <BusinessProcessDetailsModal
        businessProcessId={selectedBusinessProcessId}
        open={isBusinessProcessDetailsOpen}
        onOpenChange={(open) => {
          setIsBusinessProcessDetailsOpen(open);
          if (!open) {
            setSelectedBusinessProcessId(null);
          }
        }}
      />

      {/* Text Formatting Dialog */}
      <TextFormattingDialog
        open={isTextFormattingOpen}
        onOpenChange={setIsTextFormattingOpen}
        currentSettings={selectedTextNode?.data || {}}
        onApply={handleApplyTextFormatting}
      />
    </div>
  );
}

// Export wrapper component with ReactFlowProvider
export default function BusinessProcessDiagram() {
  return (
    <ReactFlowProvider>
      <BusinessProcessDiagramInner />
    </ReactFlowProvider>
  );
}