import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useInitiative } from "@/components/initiatives/initiative-context";
import { api } from "@/lib/api";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RefreshCw } from "lucide-react";
import SequenceDiagramNode from "@/components/diagram/sequence-diagram-node";
import SequenceDiagramBottomNode from "@/components/diagram/sequence-diagram-bottom-node";
import SequenceDiagramEdgeDraggable from "@/components/diagram/sequence-diagram-edge-draggable";
import SelfLoopEdge from "@/components/diagram/self-loop-edge";
import SelfLoopEdgeDraggable from "@/components/diagram/self-loop-edge-draggable";
import TextBoxNode from "@/components/diagram/text-box-node";
import ProcessGroupNode from "@/components/diagram/process-group-node";
import ProcessLaneNode from "@/components/diagram/process-lane-node";
import EmptyProcessNode from "@/components/diagram/empty-process-node";

const nodeTypes = {
  sequenceNode: SequenceDiagramNode,
  sequenceBottomNode: SequenceDiagramBottomNode,
  textBox: TextBoxNode,
  processGroup: ProcessGroupNode,
  processLane: ProcessLaneNode,
  emptyProcess: EmptyProcessNode,
};

const edgeTypes = {
  sequence: SequenceDiagramEdgeDraggable,
  selfloop: SelfLoopEdge,
  selfloopDraggable: SelfLoopEdgeDraggable,
};

function ComparisonDiagram({ 
  title, 
  businessProcessId, 
  interfaces, 
  businessProcess,
  childProcesses = [],
  allChildInterfaces = [],
  isProduction = false 
}: {
  title: string;
  businessProcessId: number;
  interfaces: any[];
  businessProcess: any;
  childProcesses?: any[];
  allChildInterfaces?: any[];
  isProduction?: boolean;
}) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const { currentInitiative } = useInitiative();

  // Fetch changed artifacts if viewing initiative changes
  const { data: changedArtifacts } = useQuery({
    queryKey: ["initiative-changes", currentInitiative?.initiativeId],
    queryFn: async () => {
      if (!currentInitiative || isProduction) return { interfaces: [], businessProcesses: [] };
      
      try {
        const response = await api.get(`/api/version-control/initiative/${currentInitiative.initiativeId}/changes`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch initiative changes:', error);
        return { interfaces: [], businessProcesses: [] };
      }
    },
    enabled: !!currentInitiative && !isProduction,
  });

  // Helper function to check if an interface has changed
  const isInterfaceChanged = (interfaceId: number) => {
    if (!changedArtifacts || !currentInitiative || isProduction) return null;
    
    const change = changedArtifacts.interfaces?.find((c: any) => c.artifactId === interfaceId);
    if (!change) return null;
    
    return {
      changeType: change.changeType,
      changedFields: change.changedFields || []
    };
  };

  // Simplified diagram generation (from business-process-diagram.tsx)
  const generateDiagram = () => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Filter only active interfaces
    const activeInterfaces = interfaces.filter(iface => iface.status === 'active');
    
    // Collect unique applications
    const uniqueApps = new Map<number, any>();
    
    activeInterfaces.forEach((iface) => {
      if (iface.providerApp && !uniqueApps.has(iface.providerApplicationId)) {
        uniqueApps.set(iface.providerApplicationId, iface.providerApp);
      }
      if (iface.consumerApp && !uniqueApps.has(iface.consumerApplicationId)) {
        uniqueApps.set(iface.consumerApplicationId, iface.consumerApp);
      }
    });

    // Create application nodes
    let xPosition = 100;
    const xSpacing = 250;
    const yPosition = 50;
    const lifelineHeight = 600;

    uniqueApps.forEach((app, appId) => {
      nodes.push({
        id: `seq-${appId}`,
        type: 'sequenceNode',
        position: { x: xPosition, y: yPosition },
        data: {
          application: app,
          interfaces: [],
          lifelineHeight: lifelineHeight
        },
        draggable: false,
        style: {
          zIndex: 10,
        }
      });

      nodes.push({
        id: `seq-bottom-${appId}`,
        type: 'sequenceBottomNode',
        position: { x: xPosition, y: yPosition + 80 + lifelineHeight },
        data: {
          application: app,
          interfaces: [],
        },
        draggable: false,
        style: {
          zIndex: 10,
        }
      });

      xPosition += xSpacing;
    });

    // Create edges
    let yOffset = 150;
    const ySpacing = 80;

    activeInterfaces.forEach((iface) => {
      if (iface.providerApplicationId && iface.consumerApplicationId) {
        const isFileInterface = iface.interfaceType?.toLowerCase() === 'file';
        
        let sourceId, targetId;
        if (isFileInterface) {
          sourceId = `seq-${iface.providerApplicationId}`;
          targetId = `seq-${iface.consumerApplicationId}`;
        } else {
          sourceId = `seq-${iface.consumerApplicationId}`;
          targetId = `seq-${iface.providerApplicationId}`;
        }

        // Check if interface has changed in initiative
        const changeInfo = isInterfaceChanged(iface.interfaceId);
        let strokeColor = iface.status === 'active' ? '#10b981' : '#6b7280';
        let strokeWidth = 2;
        let strokeDasharray = undefined;
        
        if (changeInfo && !isProduction) {
          switch (changeInfo.changeType) {
            case 'create':
              strokeColor = '#3b82f6'; // Blue for new
              strokeWidth = 3;
              break;
            case 'update':
              strokeColor = '#f59e0b'; // Yellow/Orange for modified
              strokeWidth = 3;
              strokeDasharray = '5,5';
              break;
            case 'delete':
              strokeColor = '#ef4444'; // Red for deleted
              strokeWidth = 3;
              strokeDasharray = '2,2';
              break;
          }
        }

        edges.push({
          id: `seq-edge-${iface.id}`,
          source: sourceId,
          target: targetId,
          type: 'sequence',
          sourceHandle: 'lifeline',
          targetHandle: 'lifeline',
          data: {
            interface: iface,
            sequenceNumber: iface.sequenceNumber || 1,
            yPosition: yOffset,
            changeInfo: changeInfo
          },
          style: {
            strokeWidth,
            stroke: strokeColor,
            strokeDasharray
          },
          zIndex: 1000,
          markerEnd: 'url(#arrowclosed)'
        });

        yOffset += ySpacing;
      }
    });

    return { nodes, edges };
  };

  useEffect(() => {
    const { nodes, edges } = generateDiagram();
    setNodes(nodes);
    setEdges(edges);
  }, [interfaces, changedArtifacts]);

  return (
    <Card className="flex-1 bg-gray-900 border-gray-800">
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {!isProduction && currentInitiative && (
          <p className="text-sm text-blue-400 mt-1">Initiative: {currentInitiative.name}</p>
        )}
      </div>
      <div className="h-[calc(100vh-250px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          panOnDrag={false}
          preventScrolling={false}
        >
          <Background color="#374151" gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </Card>
  );
}

function BusinessProcessComparisonInner() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { currentInitiative } = useInitiative();
  const businessProcessId = parseInt(params.id as string);

  // Fetch business process details
  const { data: businessProcess } = useQuery({
    queryKey: ["business-process", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}`);
      if (!response.ok) throw new Error("Failed to fetch business process");
      return response.json();
    },
  });

  // Fetch production interfaces
  const { data: productionInterfaces = [] } = useQuery({
    queryKey: ["business-process-interfaces-production", businessProcessId],
    queryFn: async () => {
      const response = await fetch(`/api/business-processes/${businessProcessId}/interfaces`);
      if (!response.ok) throw new Error("Failed to fetch interfaces");
      return response.json();
    },
  });

  // Fetch initiative interfaces (if in initiative context)
  const { data: initiativeInterfaces = [] } = useQuery({
    queryKey: ["business-process-interfaces-initiative", businessProcessId, currentInitiative?.initiativeId],
    queryFn: async () => {
      if (!currentInitiative) return productionInterfaces;
      
      // For now, we'll use the same interfaces but with change indicators
      // In a real implementation, this would fetch the modified interfaces from the initiative
      return productionInterfaces;
    },
    enabled: !!currentInitiative,
  });

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/business-processes/${businessProcessId}/diagram`)}
              className="text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">
              Compare: {businessProcess?.businessProcess}
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Change Legend */}
      {currentInitiative && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-2">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-400 font-medium">Legend:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-blue-500"></div>
                <span className="text-gray-300">New Interface</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-orange-500" style={{ borderTop: '2px dashed #f59e0b' }}></div>
                <span className="text-gray-300">Modified Interface</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }}></div>
                <span className="text-gray-300">Deleted Interface</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-green-500"></div>
                <span className="text-gray-300">Unchanged</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 p-4 gap-4 flex">
        <ComparisonDiagram
          title="Production Baseline"
          businessProcessId={businessProcessId}
          interfaces={productionInterfaces}
          businessProcess={businessProcess}
          isProduction={true}
        />
        {currentInitiative && (
          <ComparisonDiagram
            title="Initiative Changes"
            businessProcessId={businessProcessId}
            interfaces={initiativeInterfaces}
            businessProcess={businessProcess}
            isProduction={false}
          />
        )}
      </div>
    </div>
  );
}

export default function BusinessProcessComparison() {
  return (
    <ReactFlowProvider>
      <BusinessProcessComparisonInner />
    </ReactFlowProvider>
  );
}