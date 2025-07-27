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
} from "reactflow";
import "reactflow/dist/style.css";
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

interface HierarchyMindMapViewProps {
  hierarchy: HierarchyNode[];
  title?: string;
  onSave?: (data: any) => void;
}

const MindMapNode = ({ data }: { data: any }) => {
  const levelColors = [
    "bg-purple-600", // Center/Root
    "bg-blue-500",   // Level 1
    "bg-green-500",  // Level 2
    "bg-yellow-500", // Level 3+
  ];
  
  const sizes = [
    "w-48 h-48",    // Center node - larger
    "w-32 h-32",    // Level 1
    "w-24 h-24",    // Level 2
    "w-20 h-20",    // Level 3+
  ];
  
  const bgColor = levelColors[Math.min(data.level, 3)];
  const size = sizes[Math.min(data.level, 3)];
  const fontSize = data.level === 0 ? "text-base" : data.level === 1 ? "text-sm" : "text-xs";
  
  return (
    <div className={`${bgColor} ${size} text-white rounded-full shadow-lg flex items-center justify-center p-3 border-2 border-gray-700`}>
      <div className="text-center">
        <div className={`font-semibold ${fontSize} break-words`}>{data.label}</div>
        {data.level > 0 && (
          <div className="text-xs opacity-75 mt-1">
            Level {data.level === 1 ? 'B' : data.level === 2 ? 'C' : 'D+'}
          </div>
        )}
      </div>
    </div>
  );
};

const nodeTypes = {
  mindMap: MindMapNode,
};

export default function HierarchyMindMapView({ 
  hierarchy, 
  title = "Mind Map",
  onSave 
}: HierarchyMindMapViewProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const calculateRadialLayout = useCallback((hierarchyNodes: HierarchyNode[]) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const centerX = 400;
    const centerY = 300;
    
    // For single root, place it at center
    if (hierarchyNodes.length === 1) {
      const rootNode = hierarchyNodes[0];
      
      const processRadialNode = (
        node: HierarchyNode,
        level: number,
        angle: number,
        parentId?: string,
        parentX?: number,
        parentY?: number
      ) => {
        const radius = level * 200; // Distance from center
        const x = level === 0 ? centerX : parentX! + Math.cos(angle) * radius;
        const y = level === 0 ? centerY : parentY! + Math.sin(angle) * radius;
        
        nodes.push({
          id: node.id,
          type: "mindMap",
          position: { x: x - 50, y: y - 50 }, // Adjust for node size
          data: {
            label: node.name,
            level,
            characteristics: node.characteristics
          },
        });
        
        if (parentId) {
          edges.push({
            id: `${parentId}-${node.id}`,
            source: parentId,
            target: node.id,
            type: "bezier",
            style: {
              stroke: "#666",
              strokeWidth: Math.max(1, 4 - level),
            },
          });
        }
        
        if (node.children && node.children.length > 0) {
          const angleStep = (2 * Math.PI) / node.children.length;
          const startAngle = angle - (angleStep * (node.children.length - 1)) / 2;
          
          node.children.forEach((child, index) => {
            const childAngle = startAngle + index * angleStep;
            processRadialNode(child, level + 1, childAngle, node.id, x, y);
          });
        }
      };
      
      processRadialNode(rootNode, 0, 0);
    } else {
      // Multiple roots - arrange them in a circle
      const angleStep = (2 * Math.PI) / hierarchyNodes.length;
      
      hierarchyNodes.forEach((rootNode, index) => {
        const angle = index * angleStep;
        const x = centerX + Math.cos(angle) * 150;
        const y = centerY + Math.sin(angle) * 150;
        
        const processNode = (
          node: HierarchyNode,
          level: number,
          nodeX: number,
          nodeY: number,
          parentId?: string
        ) => {
          nodes.push({
            id: node.id,
            type: "mindMap",
            position: { x: nodeX - 50, y: nodeY - 50 },
            data: {
              label: node.name,
              level,
              characteristics: node.characteristics
            },
          });
          
          if (parentId) {
            edges.push({
              id: `${parentId}-${node.id}`,
              source: parentId,
              target: node.id,
              type: "bezier",
              style: {
                stroke: "#666",
                strokeWidth: Math.max(1, 4 - level),
              },
            });
          }
          
          if (node.children && node.children.length > 0) {
            const childAngleStep = Math.PI / (node.children.length + 1);
            const baseAngle = angle - Math.PI / 2;
            
            node.children.forEach((child, idx) => {
              const childAngle = baseAngle + (idx + 1) * childAngleStep;
              const radius = 120;
              const childX = nodeX + Math.cos(childAngle) * radius;
              const childY = nodeY + Math.sin(childAngle) * radius;
              processNode(child, level + 1, childX, childY, node.id);
            });
          }
        };
        
        processNode(rootNode, 0, x, y);
      });
    }
    
    return { nodes, edges };
  }, []);

  useEffect(() => {
    const { nodes, edges } = calculateRadialLayout(hierarchy);
    setNodes(nodes);
    setEdges(edges);
  }, [hierarchy, calculateRadialLayout, setNodes, setEdges]);

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
      link.download = `hierarchy-mindmap-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Success",
        description: "Mind map exported successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export mind map",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({
        type: "mindmap",
        nodes,
        edges,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Success",
        description: "Mind map saved successfully",
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
    <Card className="w-full h-full bg-gray-800 border-gray-700 flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 pb-3">
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
      <CardContent className="flex-1 overflow-hidden p-4 pt-0">
        <style>{`
          .mindmap-scroll::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          .mindmap-scroll::-webkit-scrollbar-track {
            background: #374151;
            border-radius: 5px;
          }
          .mindmap-scroll::-webkit-scrollbar-thumb {
            background: #6B7280;
            border-radius: 5px;
          }
          .mindmap-scroll::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF;
          }
          .mindmap-scroll::-webkit-scrollbar-corner {
            background: #374151;
          }
          .react-flow__viewport {
            overflow: visible !important;
          }
          .react-flow__pane {
            overflow: visible !important;
          }
        `}</style>
        <div 
          className="border border-gray-700 rounded-lg bg-gray-900 h-full overflow-auto mindmap-scroll"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B7280 #374151'
          }}
        >
          <div style={{ width: '2000px', height: '1500px', position: 'relative' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={fitViewOptions}
              className="react-flow"
              style={{ width: '100%', height: '100%' }}
            >
              <Background color="#333" gap={16} />
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