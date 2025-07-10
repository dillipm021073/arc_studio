import React, { useCallback, useEffect, useState } from 'react';
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
import RectangleNode from '../components/interface-builder/nodes/rectangle-node';

const nodeTypes = {
  rectangle: RectangleNode,
};

// Create rectangle nodes with connection points
const initialNodes: Node[] = [
  {
    id: 'rect-1',
    type: 'rectangle',
    position: { x: 100, y: 100 },
    data: {
      label: 'Rectangle 1',
      type: 'rectangle',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 15,
      text: 'Box 1',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
      connectionPoints: {
        input: [{ id: 'in1', type: 'default', position: 'left' }],
        output: [{ id: 'out1', type: 'default', position: 'right' }],
      },
    },
  },
  {
    id: 'rect-2',
    type: 'rectangle',
    position: { x: 400, y: 100 },
    data: {
      label: 'Rectangle 2',
      type: 'rectangle',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 15,
      text: 'Box 2',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      padding: 12,
      wordWrap: true,
      connectionPoints: {
        input: [{ id: 'in2', type: 'default', position: 'left' }],
        output: [{ id: 'out2', type: 'default', position: 'right' }],
      },
    },
  },
];

export default function TestRectangleDebug() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Try to create an edge programmatically
  useEffect(() => {
    const testEdge: Edge = {
      id: 'test-edge-1',
      source: 'rect-1',
      target: 'rect-2',
      sourceHandle: 'right',
      targetHandle: 'left-target',
      type: 'smoothstep',
      animated: true,
      style: { 
        strokeWidth: 4,
        stroke: '#ff0000',
        opacity: 1,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#ff0000',
      },
    };
    
    setEdges([testEdge]);
    setDebugInfo(prev => [...prev, `Added edge: ${testEdge.id} from ${testEdge.source}(${testEdge.sourceHandle}) to ${testEdge.target}(${testEdge.targetHandle})`]);
  }, [setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      console.log('Connection params:', params);
      setDebugInfo(prev => [...prev, `Connection attempt: ${JSON.stringify(params)}`]);
      
      const newEdge = {
        ...params,
        id: `edge-${Date.now()}`,
        type: 'smoothstep',
        animated: true,
        style: {
          strokeWidth: 4,
          stroke: '#00ff00',
          opacity: 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#00ff00',
        },
      };
      
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        setDebugInfo(prev => [...prev, `Edge created: ${newEdge.id}`]);
        return updated;
      });
    },
    [setEdges]
  );

  // Also try different handle combinations
  useEffect(() => {
    const timer = setTimeout(() => {
      const testEdges: Edge[] = [
        {
          id: 'test-edge-2',
          source: 'rect-1',
          target: 'rect-2',
          sourceHandle: 'bottom',
          targetHandle: 'top-target',
          type: 'smoothstep',
          style: { strokeWidth: 3, stroke: '#0000ff' },
        },
        {
          id: 'test-edge-3',
          source: 'rect-2',
          target: 'rect-1',
          sourceHandle: 'left',
          targetHandle: 'right-target',
          type: 'smoothstep',
          style: { strokeWidth: 3, stroke: '#ff00ff' },
        },
      ];
      
      setEdges(prev => [...prev, ...testEdges]);
      setDebugInfo(prev => [...prev, 'Added additional test edges']);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [setEdges]);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ padding: '10px', color: '#ffffff', maxHeight: '200px', overflow: 'auto' }}>
        <h2>Rectangle Edge Debug</h2>
        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <div>Nodes: {nodes.length}</div>
          <div>Edges: {edges.length}</div>
          <div style={{ marginTop: '10px' }}>
            <strong>Debug Log:</strong>
            {debugInfo.map((info, i) => (
              <div key={i}>{info}</div>
            ))}
          </div>
          <div style={{ marginTop: '10px' }}>
            <strong>Current Edges:</strong>
            {edges.map(edge => (
              <div key={edge.id}>
                {edge.id}: {edge.source}({edge.sourceHandle}) → {edge.target}({edge.targetHandle})
              </div>
            ))}
          </div>
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