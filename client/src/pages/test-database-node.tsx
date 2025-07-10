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

// Create database nodes
const initialNodes: Node[] = [
  {
    id: 'db1',
    type: 'shape',
    position: { x: 100, y: 100 },
    data: {
      id: 'database',
      label: 'User Database',
      type: 'shape',
      name: 'Database',
      width: 120,
      height: 80,
      fillColor: '#1a365d',
      strokeColor: '#63b3ed',
      strokeWidth: 2,
      line1: 'users_table',
      line2: 'public.users',
      fontSize: 12,
      textColor: '#ffffff',
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
      onUpdate: (data: any) => console.log('Updated:', data),
    },
  },
  {
    id: 'db2',
    type: 'shape',
    position: { x: 300, y: 100 },
    data: {
      id: 'database',
      label: 'Orders Database',
      type: 'shape',
      name: 'Database',
      width: 120,
      height: 80,
      fillColor: '#2d3748',
      strokeColor: '#4a5568',
      strokeWidth: 2,
      line1: 'orders',
      line2: 'ecommerce.db',
      fontSize: 12,
      textColor: '#ffffff',
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
      onUpdate: (data: any) => console.log('Updated:', data),
    },
  },
  {
    id: 'app1',
    type: 'shape',
    position: { x: 200, y: 250 },
    data: {
      id: 'drawing-box',
      label: 'Application',
      type: 'shape',
      name: 'Drawing Box',
      width: 150,
      height: 60,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 0,
      text: 'API Service',
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

// Create connections
const initialEdges: Edge[] = [
  {
    id: 'e1',
    source: 'app1',
    target: 'db1',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 2,
      stroke: '#6366f1'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#6366f1',
    },
    label: 'Query',
  },
  {
    id: 'e2',
    source: 'app1',
    target: 'db2',
    sourceHandle: 'top',
    targetHandle: 'bottom',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 2,
      stroke: '#6366f1'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 15,
      height: 15,
      color: '#6366f1',
    },
    label: 'Read/Write',
  },
];

export default function TestDatabaseNode() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: '#6366f1',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: '#6366f1',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ padding: '20px', color: '#ffffff', background: '#2d2d2d' }}>
        <h2>Database Node Test</h2>
        <p>Database cylinder shapes with editable text (click on text to edit)</p>
        <ul style={{ fontSize: '14px', marginTop: '10px' }}>
          <li>✓ 4 connection points (top, right, bottom, left)</li>
          <li>✓ Editable text - Line 1: Table name, Line 2: Schema/database</li>
          <li>✓ Classic database cylinder shape</li>
          <li>✓ Can connect to any other node</li>
        </ul>
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