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
import RectangleNode from '../components/interface-builder/nodes/rectangle-node';

const nodeTypes = {
  rectangle: RectangleNode,
};

// Initial nodes with rectangles that have connection points
const initialNodes: Node[] = [
  {
    id: '1',
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
      connectionPoints: {
        input: [{ id: 'in1', type: 'default', position: 'left' }],
        output: [{ id: 'out1', type: 'default', position: 'right' }],
      },
    },
  },
  {
    id: '2',
    type: 'rectangle',
    position: { x: 350, y: 100 },
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
      connectionPoints: {
        input: [{ id: 'in2', type: 'default', position: 'left' }],
        output: [{ id: 'out2', type: 'default', position: 'right' }],
      },
    },
  },
  {
    id: '3',
    type: 'rectangle',
    position: { x: 225, y: 250 },
    data: {
      label: 'Rectangle 3',
      type: 'rectangle',
      width: 150,
      height: 100,
      fillColor: 'transparent',
      strokeColor: '#ffffff',
      strokeWidth: 1,
      borderRadius: 15,
      text: 'Box 3',
      fontSize: 14,
      textColor: '#ffffff',
      textAlign: 'center',
      connectionPoints: {
        input: [{ id: 'in3', type: 'default', position: 'top' }],
        output: [{ id: 'out3', type: 'default', position: 'bottom' }],
      },
    },
  },
];

// Initial edges connecting the rectangles
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'right',
    targetHandle: 'left-target',
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
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    sourceHandle: 'bottom',
    targetHandle: 'top-target',
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
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'bottom',
    targetHandle: 'top-target',
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

export default function TestRectangleEdges() {
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
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '10px', background: '#1e1e1e', color: '#ffffff' }}>
        <h2>Rectangle Edge Test</h2>
        <p>Nodes: {nodes.length}, Edges: {edges.length}</p>
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