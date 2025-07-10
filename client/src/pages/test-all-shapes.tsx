import { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  addEdge,
  Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ShapeNode from '@/components/interface-builder/nodes/shape-node';

const nodeTypes: NodeTypes = {
  shape: ShapeNode,
};

const initialNodes: Node[] = [
  // First row - Basic shapes
  {
    id: 'rect-1',
    type: 'shape',
    position: { x: 50, y: 50 },
    data: {
      id: 'rectangle',
      label: 'Rectangle',
      type: 'shape',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Rectangle',
      fontSize: 14,
      textColor: '#ffffff',
    },
  },
  {
    id: 'circle-1',
    type: 'shape',
    position: { x: 250, y: 50 },
    data: {
      id: 'circle',
      label: 'Circle',
      type: 'shape',
      radius: 50,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
    },
  },
  {
    id: 'triangle-1',
    type: 'shape',
    position: { x: 450, y: 50 },
    data: {
      id: 'triangle',
      label: 'Triangle',
      type: 'shape',
      width: 120,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Triangle',
      triangleType: 'equilateral',
    },
  },
  {
    id: 'ellipse-1',
    type: 'shape',
    position: { x: 650, y: 50 },
    data: {
      id: 'ellipse',
      label: 'Ellipse',
      type: 'shape',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Ellipse',
    },
  },
  
  // Second row - Polygon shapes
  {
    id: 'pentagon-1',
    type: 'shape',
    position: { x: 50, y: 200 },
    data: {
      id: 'pentagon',
      label: 'Pentagon',
      type: 'shape',
      width: 120,
      height: 120,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Pentagon',
    },
  },
  {
    id: 'hexagon-1',
    type: 'shape',
    position: { x: 250, y: 200 },
    data: {
      id: 'hexagon',
      label: 'Hexagon',
      type: 'shape',
      width: 120,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Hexagon',
    },
  },
  {
    id: 'diamond-1',
    type: 'shape',
    position: { x: 450, y: 200 },
    data: {
      id: 'diamond',
      label: 'Diamond',
      type: 'shape',
      width: 120,
      height: 120,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Diamond',
    },
  },
  {
    id: 'star-1',
    type: 'shape',
    position: { x: 650, y: 200 },
    data: {
      id: 'star',
      label: 'Star',
      type: 'shape',
      width: 120,
      height: 120,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Star',
      points: 5,
      innerRadius: 0.4,
    },
  },
  
  // Third row - Special shapes
  {
    id: 'parallelogram-1',
    type: 'shape',
    position: { x: 50, y: 350 },
    data: {
      id: 'parallelogram',
      label: 'Parallelogram',
      type: 'shape',
      width: 150,
      height: 80,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Parallelogram',
      skewAngle: 20,
    },
  },
  {
    id: 'trapezoid-1',
    type: 'shape',
    position: { x: 250, y: 350 },
    data: {
      id: 'trapezoid',
      label: 'Trapezoid',
      type: 'shape',
      width: 150,
      height: 80,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      text: 'Trapezoid',
      topWidth: 0.6,
    },
  },
  {
    id: 'database-1',
    type: 'shape',
    position: { x: 450, y: 350 },
    data: {
      id: 'database',
      label: 'Database',
      type: 'shape',
      width: 120,
      height: 80,
      fillColor: '#2d3748',
      strokeColor: '#ffffff',
      strokeWidth: 2,
      line1: 'Users',
      line2: 'MySQL',
    },
  },
  {
    id: 'drawing-box-1',
    type: 'shape',
    position: { x: 650, y: 350 },
    data: {
      id: 'drawing-box',
      label: 'Drawing Box',
      type: 'shape',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      text: 'Drawing Box',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
      resizable: true,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'rect-1',
    target: 'pentagon-1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
  },
  {
    id: 'e2-3',
    source: 'circle-1',
    target: 'hexagon-1',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
  },
];

export default function TestAllShapes() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      })
    );
  }, [setNodes]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  const handleNodeDuplicate = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find((node) => node.id === nodeId);
    if (!nodeToDuplicate) return;

    const newNode = {
      ...nodeToDuplicate,
      id: `${nodeToDuplicate.id}-copy-${Date.now()}`,
      position: {
        x: nodeToDuplicate.position.x + 50,
        y: nodeToDuplicate.position.y + 50,
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [nodes, setNodes]);

  // Enhance nodes with callbacks
  const enhancedNodes = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onUpdate: (data: any) => handleNodeUpdate(node.id, data),
      onDelete: () => handleNodeDelete(node.id),
      onDuplicate: () => handleNodeDuplicate(node.id),
    },
  }));

  return (
    <div className="h-screen w-full">
      <div className="absolute top-4 left-4 z-10 bg-gray-800 p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-white mb-2">All Shape Nodes Test</h2>
        <p className="text-gray-300 text-sm">
          Click on any shape to edit its text. Right-click for context menu.
        </p>
        <div className="mt-2 text-gray-400 text-xs space-y-1">
          <p>• Rectangle, Circle, Triangle, Ellipse</p>
          <p>• Pentagon, Hexagon, Diamond, Star</p>
          <p>• Parallelogram, Trapezoid, Database, Drawing Box</p>
        </div>
      </div>
      
      <ReactFlow
        nodes={enhancedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <Background color="#374151" gap={16} />
        <Controls className="bg-gray-800 border-gray-700 text-white" />
        <MiniMap 
          className="bg-gray-800 border-gray-700"
          nodeColor={() => '#4B5563'}
          maskColor="rgb(0, 0, 0, 0.8)"
        />
      </ReactFlow>
    </div>
  );
}