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

// N8n-style Application Node
const ApplicationNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        background: '#1e293b',
        border: selected ? '2px solid #3b82f6' : '2px solid #475569',
        borderRadius: '16px',
        padding: '0',
        minWidth: '280px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#64748b',
          width: '16px',
          height: '16px',
          border: '2px solid #475569',
          borderRadius: '50%',
          left: '-8px',
        }}
      />
      
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #475569',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: data.color || '#3b82f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}>
          {data.icon || '🌐'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            {data.label}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
            {data.description}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '16px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '8px',
          fontSize: '12px'
        }}>
          {data.properties && Object.entries(data.properties).map(([key, value]) => (
            <div key={key}>
              <span style={{ color: '#64748b' }}>{key}:</span>
              <span style={{ color: '#e2e8f0', marginLeft: '4px' }}>{value}</span>
            </div>
          ))}
        </div>
        
        {data.status && (
          <div style={{ 
            marginTop: '12px', 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: data.status === 'active' ? '#10b981' : '#ef4444'
            }} />
            <span style={{
              background: data.status === 'active' ? '#10b981' : '#ef4444',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              {data.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#3b82f6',
          width: '16px',
          height: '16px',
          border: '2px solid #2563eb',
          borderRadius: '50%',
          right: '-8px',
        }}
      />
    </div>
  );
};

// N8n-style Interface Node
const InterfaceNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        background: '#1e293b',
        border: selected ? '2px solid #8b5cf6' : '2px solid #475569',
        borderRadius: '16px',
        padding: '0',
        minWidth: '240px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#64748b',
          width: '16px',
          height: '16px',
          border: '2px solid #475569',
          borderRadius: '50%',
          left: '-8px',
        }}
      />
      
      {/* Header */}
      <div style={{
        borderBottom: '1px solid #475569',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: data.color || '#8b5cf6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
        }}>
          {data.icon || '🔌'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
            {data.label}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
            {data.description}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
        {data.method && (
          <span style={{
            background: data.method === 'GET' ? '#10b981' : 
                       data.method === 'POST' ? '#3b82f6' : 
                       data.method === 'PUT' ? '#f59e0b' : '#ef4444',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {data.method}
          </span>
        )}
        {data.endpoint && (
          <div style={{ 
            color: '#94a3b8', 
            fontSize: '11px', 
            marginTop: '8px',
            fontFamily: 'monospace'
          }}>
            {data.endpoint}
          </div>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#8b5cf6',
          width: '16px',
          height: '16px',
          border: '2px solid #7c3aed',
          borderRadius: '50%',
          right: '-8px',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  application: ApplicationNode,
  interface: InterfaceNode,
};

// Sample nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'application',
    position: { x: 50, y: 100 },
    data: { 
      label: 'E-commerce Web App',
      description: 'Customer-facing web application',
      icon: '🛒',
      color: '#3b82f6',
      status: 'active',
      properties: {
        Framework: 'React',
        Deployment: 'Docker',
        Scaling: 'Horizontal'
      }
    },
  },
  {
    id: '2',
    type: 'interface',
    position: { x: 400, y: 50 },
    data: { 
      label: 'Product API',
      description: 'RESTful API for products',
      icon: '📦',
      color: '#8b5cf6',
      method: 'GET',
      endpoint: '/api/v1/products'
    },
  },
  {
    id: '3',
    type: 'interface',
    position: { x: 400, y: 200 },
    data: { 
      label: 'Order API',
      description: 'RESTful API for orders',
      icon: '📋',
      color: '#8b5cf6',
      method: 'POST',
      endpoint: '/api/v1/orders'
    },
  },
  {
    id: '4',
    type: 'application',
    position: { x: 700, y: 125 },
    data: { 
      label: 'Order Service',
      description: 'Microservice for order processing',
      icon: '⚙️',
      color: '#10b981',
      status: 'active',
      properties: {
        Runtime: 'Node.js',
        Framework: 'Express',
        Database: 'MongoDB'
      }
    },
  },
  {
    id: '5',
    type: 'application',
    position: { x: 1000, y: 125 },
    data: { 
      label: 'Payment Gateway',
      description: 'External payment processor',
      icon: '💳',
      color: '#f59e0b',
      status: 'active',
      properties: {
        Provider: 'Stripe',
        Region: 'US-East',
        SLA: '99.95%'
      }
    },
  },
];

// Sample edges
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#3b82f6',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#3b82f6',
    },
    label: 'HTTP Request',
    labelStyle: { fill: '#e2e8f0', fontSize: 12 },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#3b82f6',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#3b82f6',
    },
    label: 'HTTP Request',
    labelStyle: { fill: '#e2e8f0', fontSize: 12 },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#10b981',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#10b981',
    },
    label: 'Service Call',
    labelStyle: { fill: '#e2e8f0', fontSize: 12 },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
  },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#f59e0b',
      strokeWidth: 2,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#f59e0b',
    },
    label: 'Payment Request',
    labelStyle: { fill: '#e2e8f0', fontSize: 12 },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
  },
];

export default function TestN8nStyle() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: '#64748b',
          strokeWidth: 2,
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
    <div style={{ width: '100%', height: '100vh', background: '#0f172a' }}>
      <div style={{ 
        padding: '20px', 
        background: '#1e293b', 
        borderBottom: '1px solid #475569',
        color: 'white'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          N8n-Style Interface Builder Test
        </h1>
        <p style={{ color: '#94a3b8' }}>
          This demonstrates the rounded rectangle nodes with proper edge connections
        </p>
      </div>
      
      <div style={{ height: 'calc(100vh - 100px)' }}>
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
            },
          }}
        >
          <Background color="#1e293b" variant={BackgroundVariant.Dots} gap={20} />
          <Controls style={{ background: '#1e293b', border: '1px solid #475569' }} />
        </ReactFlow>
      </div>
    </div>
  );
}