import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MarkerType,
  Handle,
  Position,
  NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Simple Rectangle Node with visible handles
const SimpleRectangleNode = ({ data, selected }: NodeProps) => {
  return (
    <div
      style={{
        width: '150px',
        height: '100px',
        border: '2px solid #ffffff',
        borderRadius: '15px',
        background: 'transparent',
        position: 'relative',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Top Handle */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
      
      {/* Right Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
      
      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
      
      {/* Left Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#555',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          borderRadius: '50%',
        }}
      />
      
      <div style={{ color: '#ffffff', fontSize: '14px' }}>
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  simpleRectangle: SimpleRectangleNode,
};

// Initial nodes
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'simpleRectangle',
    position: { x: 100, y: 100 },
    data: { label: 'Box 1' },
  },
  {
    id: '2',
    type: 'simpleRectangle',
    position: { x: 400, y: 100 },
    data: { label: 'Box 2' },
  },
  {
    id: '3',
    type: 'simpleRectangle',
    position: { x: 250, y: 300 },
    data: { label: 'Box 3' },
  },
];

// Initial edges - these should be visible!
const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    sourceHandle: 'right',
    targetHandle: 'left',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: '#ff0000' // Red color for visibility
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#ff0000',
    },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: '#00ff00' // Green color for visibility
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#00ff00',
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    sourceHandle: 'bottom',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 3,
      stroke: '#0000ff' // Blue color for visibility
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#0000ff',
    },
  },
];

export default function TestSimpleRectangles() {
  return (
    <div style={{ width: '100%', height: '100vh', background: '#1e1e1e' }}>
      <div style={{ padding: '10px', color: '#ffffff' }}>
        <h2>Simple Rectangle Edge Test - Edges Should Be Visible!</h2>
        <p>3 boxes with colored edges: Red (1→2), Green (1→3), Blue (2→3)</p>
      </div>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
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