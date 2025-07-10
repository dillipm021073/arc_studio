import React from 'react';
import ReactFlow, {
  Node,
  Edge,
  MarkerType,
  Background,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Simple nodes to test arrow direction
const nodes: Node[] = [
  {
    id: 'A',
    position: { x: 100, y: 100 },
    data: { label: 'Node A (Source)' },
    style: {
      background: '#ff6b6b',
      color: 'white',
      border: '2px solid #c92a2a',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: 'B',
    position: { x: 400, y: 100 },
    data: { label: 'Node B (Target)' },
    style: {
      background: '#4dabf7',
      color: 'white',
      border: '2px solid #1864ab',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: 'C',
    position: { x: 100, y: 300 },
    data: { label: 'Node C' },
    style: {
      background: '#69db7c',
      color: 'white',
      border: '2px solid #2b8a3e',
      borderRadius: '8px',
      padding: '10px',
    },
  },
  {
    id: 'D',
    position: { x: 400, y: 300 },
    data: { label: 'Node D' },
    style: {
      background: '#ffd43b',
      color: 'black',
      border: '2px solid #fab005',
      borderRadius: '8px',
      padding: '10px',
    },
  },
];

// Test different edge configurations
const edges: Edge[] = [
  {
    id: 'A-B',
    source: 'A',
    target: 'B',
    label: 'A → B (markerEnd)',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#ff6b6b',
    },
    style: {
      stroke: '#ff6b6b',
      strokeWidth: 2,
    },
  },
  {
    id: 'C-D',
    source: 'C',
    target: 'D',
    label: 'C → D (default arrow)',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
    style: {
      stroke: '#69db7c',
      strokeWidth: 2,
    },
  },
  {
    id: 'B-C',
    source: 'B',
    target: 'C',
    label: 'B → C (larger arrow)',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 30,
      height: 30,
      color: '#4dabf7',
    },
    style: {
      stroke: '#4dabf7',
      strokeWidth: 3,
    },
  },
];

export default function TestArrowDirection() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: '20px', background: '#333', color: 'white' }}>
        <h2>Arrow Direction Test</h2>
        <p>Arrows should point FROM source TO target</p>
        <ul style={{ fontSize: '14px', marginTop: '10px' }}>
          <li>Red arrow: A → B (should point to B)</li>
          <li>Green arrow: C → D (should point to D)</li>
          <li>Blue arrow: B → C (should point to C)</li>
        </ul>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        attributionPosition="bottom-left"
      >
        <Background color="#222" />
        <Controls />
      </ReactFlow>
    </div>
  );
}