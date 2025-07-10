import { useState, useEffect } from 'react';
import { Node, Edge } from 'reactflow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  Info,
  Box,
  Activity,
  Database,
  Layers
} from 'lucide-react';

interface Simple3DFallbackProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export default function Simple3D({ nodes, edges, onNodeClick, className }: Simple3DFallbackProps) {
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Auto rotate animation
  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 1) % 360);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Calculate 3D-ish positions for nodes
  const nodePositions = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    const radius = Math.max(200, nodes.length * 30);
    const layer = Math.floor(index / 8);
    
    const x = Math.cos(angle + (rotation * Math.PI / 180)) * radius;
    const y = Math.sin(angle + (rotation * Math.PI / 180)) * radius;
    const z = layer * 50 - (Math.floor(nodes.length / 8) * 25); // Simulate depth
    
    return {
      ...node,
      x: x * zoom + 400,
      y: y * zoom + 300,
      z: z,
      scale: 1 + (z / 200) // Perspective scaling
    };
  });

  const getNodeColor = (nodeType: string, nodeId: string) => {
    if (nodeType === 'application') {
      if (nodeId.includes('web')) return '#3b82f6';
      if (nodeId.includes('mobile')) return '#8b5cf6';
      if (nodeId.includes('api') || nodeId.includes('service')) return '#10b981';
      if (nodeId.includes('database')) return '#6b7280';
      if (nodeId.includes('cloud')) return '#06b6d4';
    }
    if (nodeType === 'interface') {
      if (nodeId.includes('rest') || nodeId.includes('graphql')) return '#3b82f6';
      if (nodeId.includes('message')) return '#f59e0b';
      if (nodeId.includes('file')) return '#22c55e';
    }
    if (nodeType === 'process') {
      return '#6366f1';
    }
    return '#64748b';
  };

  const getNodeIcon = (nodeType: string, nodeId: string) => {
    if (nodeType === 'application') {
      if (nodeId.includes('database')) return Database;
      return Box;
    }
    if (nodeType === 'interface') {
      return Layers;
    }
    if (nodeType === 'process') {
      return Activity;
    }
    return Box;
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
    onNodeClick?.(nodeId);
  };

  return (
    <div className={`w-full h-full relative bg-gray-900 ${className}`}>
      {/* Pseudo-3D Canvas */}
      <div className="w-full h-full overflow-hidden relative">
        <svg 
          width="100%" 
          height="100%" 
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at center, #1f2937 0%, #111827 70%)' }}
        >
          {/* Grid lines for depth effect */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="1" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Connection lines */}
          {edges.map((edge, index) => {
            const sourcePos = nodePositions.find(n => n.id === edge.source);
            const targetPos = nodePositions.find(n => n.id === edge.target);
            
            if (!sourcePos || !targetPos) return null;
            
            return (
              <line
                key={edge.id}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke={edge.style?.stroke || '#64748b'}
                strokeWidth={2}
                opacity={0.6}
                strokeDasharray={edge.animated ? "5,5" : "none"}
              >
                {edge.animated && (
                  <animate
                    attributeName="stroke-dashoffset"
                    values="0;10"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}
          
          {/* Nodes */}
          {nodePositions.map((nodePos) => {
            const Icon = getNodeIcon(nodePos.type || '', nodePos.data.id);
            const isSelected = selectedNode === nodePos.id;
            const size = 20 * nodePos.scale * (isSelected ? 1.3 : 1);
            
            return (
              <g key={nodePos.id}>
                <circle
                  cx={nodePos.x}
                  cy={nodePos.y}
                  r={size}
                  fill={getNodeColor(nodePos.type || '', nodePos.data.id)}
                  stroke={isSelected ? '#3b82f6' : '#ffffff'}
                  strokeWidth={isSelected ? 3 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => handleNodeClick(nodePos.id)}
                  opacity={0.8 + (nodePos.z / 500)}
                >
                  <animate
                    attributeName="r"
                    values={`${size};${size * 1.1};${size}`}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                
                {/* Node status indicator */}
                {nodePos.data.status === 'active' && (
                  <circle
                    cx={nodePos.x + size * 0.7}
                    cy={nodePos.y - size * 0.7}
                    r={4}
                    fill="#22c55e"
                  />
                )}
                
                {nodePos.data.status === 'error' && (
                  <circle
                    cx={nodePos.x + size * 0.7}
                    cy={nodePos.y - size * 0.7}
                    r={4}
                    fill="#ef4444"
                  />
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Node labels */}
        {nodePositions.map((nodePos) => (
          <div
            key={`label-${nodePos.id}`}
            className="absolute pointer-events-none transition-all duration-200"
            style={{
              left: nodePos.x - 50,
              top: nodePos.y + 30 * nodePos.scale,
              transform: `scale(${nodePos.scale})`,
              zIndex: Math.round(100 + nodePos.z)
            }}
          >
            <div className="bg-gray-900/90 text-white px-2 py-1 rounded text-xs text-center max-w-[100px] truncate">
              {nodePos.data.name}
            </div>
          </div>
        ))}
      </div>
      
      {/* Controls overlay */}
      <div className="absolute top-4 left-4 space-y-2">
        <Card className="bg-gray-800/95 border-gray-700 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-white flex items-center gap-2">
              <Eye className="h-3 w-3" />
              3D Network View
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setRotation(0)}
                className="text-xs border-gray-600 hover:bg-gray-700"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
                className="text-xs border-gray-600 hover:bg-gray-700"
              >
                <ZoomIn className="h-3 w-3" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                className="text-xs border-gray-600 hover:bg-gray-700"
              >
                <ZoomOut className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="text-xs text-gray-400">
              <div>Nodes: {nodes.length}</div>
              <div>Connections: {edges.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Info overlay */}
      <div className="absolute bottom-4 right-4">
        <Card className="bg-blue-900/20 border-blue-800/30">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <Info className="h-3 w-3 text-blue-400 mt-0.5" />
              <div className="text-xs text-blue-300">
                <div className="font-medium mb-1">3D Network Topology</div>
                <div>Click nodes to select</div>
                <div>Auto-rotating view</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}