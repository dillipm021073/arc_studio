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
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom node with clear labels
const CustomNode = ({ data }: any) => {
  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '8px',
      background: data.color || '#333',
      color: 'white',
      border: '2px solid #555',
      minWidth: '120px',
      textAlign: 'center',
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555' }}
      />
      <div style={{ fontWeight: 'bold' }}>{data.label}</div>
      <div style={{ fontSize: '12px', marginTop: '4px' }}>{data.role}</div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: '#555' }}
      />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 50, y: 100 },
    data: { 
      label: 'Start', 
      role: '(Source)',
      color: '#e74c3c'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Process', 
      role: '(Middle)',
      color: '#3498db'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 450, y: 100 },
    data: { 
      label: 'End', 
      role: '(Target)',
      color: '#2ecc71'
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    label: 'Flow →',
    style: {
      stroke: '#e74c3c',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#e74c3c',
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'smoothstep',
    animated: true,
    label: 'Flow →',
    style: {
      stroke: '#3498db',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#3498db',
    },
  },
];

export default function TestArrowFix() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connection:', params);
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        label: `${params.source} → ${params.target}`,
        style: {
          stroke: '#666',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#666',
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1a1a1a' }}>
      <div style={{ padding: '20px', color: 'white', background: '#2a2a2a' }}>
        <h2>Arrow Direction Test</h2>
        <p>The arrows should point in the direction of flow: Start → Process → End</p>
        <p style={{ fontSize: '14px', color: '#888' }}>
          In React Flow, markerEnd creates an arrow at the end of the edge (pointing to the target node)
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
        defaultEdgeOptions={{
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
        }}
      >
        <Background variant={BackgroundVariant.Dots} color="#333" />
        <Controls />
      </ReactFlow>
    </div>
  );
}