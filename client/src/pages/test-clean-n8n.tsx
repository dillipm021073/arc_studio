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
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';

// Clean n8n-style Node
const CleanNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        background: '#404040',
        border: `2px solid ${selected ? '#ff6d5a' : '#303030'}`,
        borderRadius: '15px',
        minWidth: '200px',
        boxShadow: selected ? '0 0 0 2px #ff6d5a40' : '0 2px 5px rgba(0,0,0,0.3)',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#303030',
          width: '14px',
          height: '14px',
          border: '2px solid #303030',
          borderRadius: '50%',
          left: '-8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ff6d5a';
          e.currentTarget.style.borderColor = '#ff6d5a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#303030';
          e.currentTarget.style.borderColor = '#303030';
        }}
      />
      
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          background: data.color || '#ff6d5a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          {data.icon || '📦'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500',
            lineHeight: '1.2',
          }}>
            {data.label}
          </div>
          {data.subLabel && (
            <div style={{
              color: '#909090',
              fontSize: '12px',
              marginTop: '2px',
            }}>
              {data.subLabel}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#303030',
          width: '14px',
          height: '14px',
          border: '2px solid #303030',
          borderRadius: '50%',
          right: '-8px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ff6d5a';
          e.currentTarget.style.borderColor = '#ff6d5a';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#303030';
          e.currentTarget.style.borderColor = '#303030';
        }}
      />
    </div>
  );
};

const nodeTypes = {
  cleanNode: CleanNode,
};

// Sample nodes in a clean layout
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'cleanNode',
    position: { x: 50, y: 200 },
    data: { 
      label: 'Web Application',
      subLabel: 'React Frontend',
      icon: '🌐',
      color: '#5296d8'
    },
  },
  {
    id: '2',
    type: 'cleanNode',
    position: { x: 300, y: 100 },
    data: { 
      label: 'API Gateway',
      subLabel: 'Kong',
      icon: '🚪',
      color: '#ff6d5a'
    },
  },
  {
    id: '3',
    type: 'cleanNode',
    position: { x: 300, y: 300 },
    data: { 
      label: 'Load Balancer',
      subLabel: 'Nginx',
      icon: '⚖️',
      color: '#ff6d5a'
    },
  },
  {
    id: '4',
    type: 'cleanNode',
    position: { x: 550, y: 200 },
    data: { 
      label: 'User Service',
      subLabel: 'Node.js',
      icon: '👤',
      color: '#5bbf2d'
    },
  },
  {
    id: '5',
    type: 'cleanNode',
    position: { x: 800, y: 100 },
    data: { 
      label: 'User Database',
      subLabel: 'PostgreSQL',
      icon: '🗄️',
      color: '#336791'
    },
  },
  {
    id: '6',
    type: 'cleanNode',
    position: { x: 800, y: 300 },
    data: { 
      label: 'Cache',
      subLabel: 'Redis',
      icon: '⚡',
      color: '#dc382d'
    },
  },
];

// Clean edges without overlaps
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
  {
    id: 'e2-4',
    source: '2',
    target: '4',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#606060',
      strokeWidth: 2,
    },
  },
];

export default function TestCleanN8n() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#606060',
          strokeWidth: 2,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return (
    <div style={{ width: '100%', height: '100vh', background: '#282828' }}>
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
            stroke: '#606060',
          },
        }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={15} 
          size={0.5}
          color="#363636" 
        />
        <Controls 
          style={{ 
            background: '#404040', 
            border: '1px solid #303030',
            borderRadius: '8px',
          }} 
        />
      </ReactFlow>
    </div>
  );
}