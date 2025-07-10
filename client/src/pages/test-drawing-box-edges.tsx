import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import ShapeNode from '../components/interface-builder/nodes/shape-node';

const nodeTypes = {
  shape: ShapeNode,
};

// Create drawing-box nodes exactly as they would be created in the interface builder
const initialNodes: Node[] = [
  {
    id: 'drawing-box-1',
    type: 'shape',
    position: { x: 100, y: 100 },
    data: {
      id: 'drawing-box',
      label: 'Drawing Box 1',
      type: 'shape',
      name: 'Drawing Box',
      description: 'Simple box with text and connections',
      color: 'bg-gray-500',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 0,
      text: 'Box 1',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
      resizable: true,
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      },
      onDelete: () => console.log('Delete'),
      onDuplicate: () => console.log('Duplicate'),
    },
  },
  {
    id: 'drawing-box-2',
    type: 'shape',
    position: { x: 400, y: 100 },
    data: {
      id: 'drawing-box',
      label: 'Drawing Box 2',
      type: 'shape',
      name: 'Drawing Box',
      description: 'Simple box with text and connections',
      color: 'bg-gray-500',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 0,
      text: 'Box 2',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
      resizable: true,
      connectionPoints: {
        input: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ],
        output: [
          { id: 'top', type: 'data', position: 'top' },
          { id: 'right', type: 'data', position: 'right' },
          { id: 'bottom', type: 'data', position: 'bottom' },
          { id: 'left', type: 'data', position: 'left' }
        ]
      },
      onDelete: () => console.log('Delete'),
      onDuplicate: () => console.log('Duplicate'),
    },
  },
];

// Create edges with high visibility
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'drawing-box-1',
    target: 'drawing-box-2',
    sourceHandle: 'right',
    targetHandle: 'left-target',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 4,
      stroke: '#ff0000',
      opacity: 1,
      zIndex: 1000,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 25,
      height: 25,
      color: '#ff0000',
    },
  },
];

export default function TestDrawingBoxEdges() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connection params:', params);
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth: 4,
          stroke: '#00ff00',
          opacity: 1,
          zIndex: 1000,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
          color: '#00ff00',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ padding: '10px', color: '#ffffff' }}>
        <h2>Drawing Box Edge Test</h2>
        <p>Testing edges between drawing boxes - Red edge should be visible!</p>
        <p>Try connecting boxes - new edges will be green</p>
        <div style={{ marginTop: '10px' }}>
          <h3>Debug Info:</h3>
          <p>Nodes: {nodes.length}</p>
          <p>Edges: {edges.length}</p>
          {edges.map(edge => (
            <div key={edge.id} style={{ fontSize: '12px', marginTop: '5px' }}>
              Edge {edge.id}: {edge.source} ({edge.sourceHandle}) → {edge.target} ({edge.targetHandle})
            </div>
          ))}
        </div>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: {
            strokeWidth: 4,
            stroke: '#0000ff',
            opacity: 1,
            zIndex: 1000,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 25,
            height: 25,
            color: '#0000ff',
          },
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1}
          color="#363636" 
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}