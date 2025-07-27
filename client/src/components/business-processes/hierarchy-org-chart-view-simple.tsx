import { useState, useCallback, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save, ZoomIn, ZoomOut, Maximize, Minimize } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

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

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  level: number;
}

export default function HierarchyOrgChartViewSimple({ 
  hierarchy, 
  title = "Organization Chart",
  onSave 
}: HierarchyOrgChartViewProps) {
  const { toast } = useToast();
  const [zoom, setZoom] = useState(1);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const calculateLayout = useCallback((hierarchyNodes: HierarchyNode[]) => {
    const positions: NodePosition[] = [];
    
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
      parentId?: string
    ) => {
      const y = level * levelGap + 50; // Add some top padding
      
      positions.push({
        id: node.id,
        x,
        y,
        width: nodeWidth,
        height: nodeHeight,
        parentId,
        level
      });
      
      if (node.children && node.children.length > 0) {
        const subtreeWidth = calculateSubtreeWidth(node);
        let childX = x - subtreeWidth / 2 + nodeWidth / 2;
        
        node.children.forEach(child => {
          const childWidth = calculateSubtreeWidth(child);
          processNode(child, level + 1, childX + childWidth / 2 - nodeWidth / 2, node.id);
          childX += childWidth;
        });
      }
    };
    
    let totalX = 50; // Add some left padding
    hierarchyNodes.forEach((rootNode) => {
      const treeWidth = calculateSubtreeWidth(rootNode);
      processNode(rootNode, 0, totalX + treeWidth / 2 - nodeWidth / 2);
      totalX += treeWidth;
    });
    
    return positions;
  }, []);

  useEffect(() => {
    const positions = calculateLayout(hierarchy);
    setNodePositions(positions);
  }, [hierarchy, calculateLayout]);

  const handleExport = useCallback(async () => {
    const element = document.getElementById('org-chart-container');
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
        positions: nodePositions,
        timestamp: new Date().toISOString(),
      });
      toast({
        title: "Success", 
        description: "Organization chart saved successfully",
      });
    }
  }, [nodePositions, onSave, toast]);

  const getNodeData = (nodeId: string, nodes: HierarchyNode[]): HierarchyNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = getNodeData(nodeId, node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const levelColors = [
    "bg-blue-600", // Level A
    "bg-green-600", // Level B  
    "bg-purple-600", // Level C
    "bg-orange-600", // Level D+
  ];

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <Card className="w-full h-full bg-gray-800 border-gray-700 flex items-center justify-center">
        <CardContent className="p-8 text-center text-gray-400">
          <p>No hierarchy data available</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate SVG dimensions
  const maxX = Math.max(...nodePositions.map(p => p.x + p.width)) + 100;
  const maxY = Math.max(...nodePositions.map(p => p.y + p.height)) + 100;

  const chartContent = (
    <>
      <style>{`
        .org-chart-scroll::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .org-chart-scroll::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 5px;
        }
        .org-chart-scroll::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 5px;
        }
        .org-chart-scroll::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
        .org-chart-scroll::-webkit-scrollbar-corner {
          background: #374151;
        }
      `}</style>
      <div 
        className="border border-gray-700 rounded-lg bg-gray-900 h-full flex flex-col"
      >
        {/* Controls Header Inside Border */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700 bg-gray-800/50">
          <span className="text-sm text-gray-300">Zoom: {Math.round(zoom * 100)}%</span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
              className="h-7 px-2 text-xs text-gray-300 hover:bg-gray-700"
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(1)}
              className="h-7 px-2 text-xs text-gray-300 hover:bg-gray-700"
            >
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setZoom(z => Math.min(2, z + 0.1))}
              className="h-7 px-2 text-xs text-gray-300 hover:bg-gray-700"
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
            <div className="w-px bg-gray-600 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(true)}
              className="h-7 px-2 text-xs text-gray-300 hover:bg-gray-700"
            >
              <Maximize className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Scrollable Content Area */}
        <div 
          className="flex-1 relative"
          style={{
            overflow: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B7280 #374151'
          }}
        >
          <div 
            id="org-chart-container"
            className="relative"
            style={{
              width: maxX * zoom,
              height: maxY * zoom,
              minWidth: '100%',
              minHeight: '100%'
            }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                width: maxX,
                height: maxY,
                position: 'absolute',
                transition: 'transform 0.2s'
              }}
            >
              {/* Draw edges first (behind nodes) */}
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: maxX,
                  height: maxY,
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              >
              {nodePositions.map(node => {
                if (!node.parentId) return null;
                const parent = nodePositions.find(p => p.id === node.parentId);
                if (!parent) return null;
                
                const startX = parent.x + parent.width / 2;
                const startY = parent.y + parent.height;
                const endX = node.x + node.width / 2;
                const endY = node.y;
                const midY = startY + (endY - startY) / 2;
                
                return (
                  <g key={`edge-${parent.id}-${node.id}`}>
                    <path
                      d={`M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`}
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle
                      cx={endX}
                      cy={endY}
                      r="4"
                      fill="white"
                    />
                  </g>
                );
              })}
              </svg>
              
              {/* Draw nodes */}
              {nodePositions.map(pos => {
                const nodeData = getNodeData(pos.id, hierarchy);
                if (!nodeData) return null;
                
                const bgColor = levelColors[Math.min(pos.level, 3)];
                
                return (
                  <div
                    key={pos.id}
                    className={`absolute ${bgColor} text-white rounded-lg shadow-lg p-4 text-center border-2 border-white/20`}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: pos.width,
                      height: pos.height,
                      zIndex: 2
                    }}
                  >
                    <div className="font-semibold text-sm truncate">{nodeData.name}</div>
                    <div className="text-xs opacity-90 mt-1">
                      Level {pos.level === 0 ? 'A' : pos.level === 1 ? 'B' : pos.level === 2 ? 'C' : 'D+'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
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
          {chartContent}
        </CardContent>
      </Card>

      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-full max-h-full w-screen h-screen p-0 bg-gray-900 border-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">{title} - Fullscreen</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-gray-300 hover:bg-gray-700"
              >
                <Minimize className="h-4 w-4 mr-2" />
                Exit Fullscreen
              </Button>
            </div>
            <div className="flex-1 p-4">
              {chartContent}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}