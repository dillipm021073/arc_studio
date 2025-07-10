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

// Create drawing-box nodes exactly as they would be in the interface builder
const initialNodes: Node[] = [
  {
    id: 'box1',
    type: 'shape',
    position: { x: 100, y: 100 },
    data: {
      id: 'drawing-box',
      label: 'Box 1',
      type: 'shape',
      name: 'Drawing Box',
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
    },
  },
  {
    id: 'box2',
    type: 'shape',
    position: { x: 400, y: 100 },
    data: {
      id: 'drawing-box',
      label: 'Box 2',
      type: 'shape',
      name: 'Drawing Box',
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
    },
  },
  {
    id: 'box3',
    type: 'shape',
    position: { x: 250, y: 300 },
    data: {
      id: 'drawing-box',
      label: 'Box 3',
      type: 'shape',
      name: 'Drawing Box',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 0,
      text: 'Box 3',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
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
    },
  },
];

// Test edges
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'box1',
    target: 'box2',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 2,
      stroke: '#64748b'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#64748b',
    },
  },
];

export default function TestDrawingBoxesFinal() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('New connection:', params);
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: '#64748b',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#64748b',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ padding: '20px', color: '#ffffff', background: '#2d2d2d' }}>
        <h2>Drawing Boxes Test - 4 Connection Points</h2>
        <p>Each box has 4 connection points (top, right, bottom, left)</p>
        <p>You can connect from any point to any other point on any box</p>
        <p style={{ color: '#64748b' }}>
          Try dragging from any handle to connect boxes. Handles will turn blue on hover.
        </p>
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
            strokeWidth: 2,
            stroke: '#64748b',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: '#64748b',
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