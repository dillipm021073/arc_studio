import { useState, useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  NodeMouseHandler,
  MarkerType,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import "@/styles/org-chart-override.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface HierarchyNode {
  id: string;
  name: string;
  characteristics: Record<string, string>;
  children: HierarchyNode[];
  expanded?: boolean;
}

interface HierarchyOrgChartViewProps {
  hierarchy: HierarchyNode[];
  title?: string;
  onSave?: (data: any) => void;
}

const nodeWidth = 200;
const nodeHeight = 80;
const levelGap = 120;
const siblingGap = 40;

const OrgChartNode = ({ data }: { data: any }) => {
  const levelColors = [
    "bg-blue-600", // Level A
    "bg-green-600", // Level B  
    "bg-purple-600", // Level C
    "bg-orange-600", // Level D+
  ];
  
  const bgColor = levelColors[Math.min(data.level, 3)];
  
  return (
    <div className={`${bgColor} text-white rounded-lg shadow-lg p-4 min-w-[180px] text-center border-2 border-white/20`}>
      <div className="font-semibold text-sm truncate">{data.label}</div>
      <div className="text-xs opacity-90 mt-1">
        Level {data.level === 0 ? 'A' : data.level === 1 ? 'B' : data.level === 2 ? 'C' : 'D+'}
      </div>
    </div>
  );
};

const nodeTypes = {
  orgChart: OrgChartNode,
};

export default function HierarchyOrgChartView({ 
  hierarchy, 
  title = "Organization Chart",
  onSave 
}: HierarchyOrgChartViewProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const calculateLayout = useCallback((hierarchyNodes: HierarchyNode[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const calculateSubtreeWidth = (node: HierarchyNode): number => {
      if (!node.children || node.children.length === 0) {
        return nodeWidth + siblingGap;
      }
      return node.children.reduce((sum, child) => sum + calculateSubtreeWidth(child), 0);
    };
    
    const processNode = (
      node: HierarchyNode, 
      level: number, 
      x: number, 
      parentId?: string,
      parentX?: number,
      parentY?: number
    ) => {
      const nodeId = node.id;
      const y = level * levelGap;
      
      nodes.push({
        id: nodeId,
        type: "orgChart",
        position: { x, y },
        data: { 
          label: node.name,
          level,
          characteristics: node.characteristics,
          parentId,
          parentX,
          parentY
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });
      
      if (parentId && parentX !== undefined && parentY !== undefined) {
        edges.push({
          id: `edge-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: "default",
          style: { 
            stroke: "#ffffff",
            strokeWidth: 2,
          },
        });
      }
      
      if (node.children && node.children.length > 0) {
        const subtreeWidth = calculateSubtreeWidth(node);
        let childX = x - subtreeWidth / 2 + nodeWidth / 2;
        
        node.children.forEach(child => {
          const childWidth = calculateSubtreeWidth(child);
          processNode(child, level + 1, childX + childWidth / 2 - nodeWidth / 2, nodeId, x, y);
          childX += childWidth;
        });
      }
    };
    
    let totalX = 0;
    hierarchyNodes.forEach((rootNode, index) => {
      const treeWidth = calculateSubtreeWidth(rootNode);
      processNode(rootNode, 0, totalX + treeWidth / 2 - nodeWidth / 2);
      totalX += treeWidth;
    });
    
    return { nodes, edges };
  }, []);

  useEffect(() => {
    const { nodes, edges } = calculateLayout(hierarchy);
    console.log('Org Chart - Nodes:', nodes);
    console.log('Org Chart - Edges:', edges);
    setNodes(nodes);
    setEdges(edges);
  }, [hierarchy, calculateLayout, setNodes, setEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleExport = useCallback(async () => {
    const element = document.querySelector(".react-flow") as HTMLElement;
    if (!element) return;

    try {
      const dataUrl = await toPng(element, {
        backgroundColor: "#1a1a1a",
        quality: 0.95,
      });
      
      const link = document.createElement("a");
      link.download = `hierarchy-orgchart-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Success",
        description: "Organization chart exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export organization chart",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({
        type: "orgchart",
        nodes,
        edges,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Success", 
        description: "Organization chart saved successfully",
      });
    }
  }, [nodes, edges, onSave, toast]);

  const fitViewOptions = useMemo(() => ({
    padding: 0.2,
    includeHiddenNodes: false,
  }), []);

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <Card className="w-full h-full bg-gray-800 border-gray-700 flex items-center justify-center">
        <CardContent className="p-8 text-center text-gray-400">
          <p>No hierarchy data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full bg-gray-800 border-gray-700 flex flex-col">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">{title}</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Download className="h-3 w-3 mr-1" />
              Export
            </Button>
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col min-h-0">
        <div className="border border-gray-700 rounded-lg bg-gray-900 flex-1 overflow-hidden">
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <style>{`
              .org-chart-flow .react-flow__edges {
                z-index: 1 !important;
              }
              .org-chart-flow .react-flow__edge-path {
                stroke: white !important;
                stroke-width: 2px !important;
              }
              .org-chart-flow .react-flow__nodes {
                z-index: 2 !important;
              }
            `}</style>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              proOptions={{ hideAttribution: true }}
              fitView
              fitViewOptions={fitViewOptions}
              className="org-chart-flow"
              style={{
                backgroundColor: '#111827',
                width: '100%',
                height: '100%',
              }}
            >
            <Background color="#444" gap={16} variant="dots" />
            <Controls 
              className="bg-gray-800 border-gray-700"
              showInteractive={false}
            />
            </ReactFlow>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}