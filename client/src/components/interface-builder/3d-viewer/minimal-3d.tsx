import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Node, Edge } from 'reactflow';

interface Minimal3DProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

// Simple 3D Node
function SimpleNode({ node, position, onClick }: any) {
  const meshRef = useRef<any>();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });

  const getColor = () => {
    if (node.type === 'application') return '#3b82f6';
    if (node.type === 'interface') return '#f59e0b';
    if (node.type === 'process') return '#6366f1';
    return '#64748b';
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={() => onClick?.(node.id)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color={getColor()} />
    </mesh>
  );
}

// Simple Connection Line
function SimpleLine({ start, end }: any) {
  const points = [start, end];
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={new Float32Array([...start, ...end])}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#64748b" />
    </line>
  );
}

// Main Scene
function Scene({ nodes, edges, onNodeClick }: Minimal3DProps) {
  // Calculate positions
  const nodePositions = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    const radius = 5;
    return {
      node,
      position: [
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ] as [number, number, number]
    };
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      
      {/* Nodes */}
      {nodePositions.map(({ node, position }) => (
        <SimpleNode
          key={node.id}
          node={node}
          position={position}
          onClick={onNodeClick}
        />
      ))}
      
      {/* Connections */}
      {edges.map((edge) => {
        const sourcePos = nodePositions.find(p => p.node.id === edge.source)?.position;
        const targetPos = nodePositions.find(p => p.node.id === edge.target)?.position;
        
        if (sourcePos && targetPos) {
          return (
            <SimpleLine
              key={edge.id}
              start={sourcePos}
              end={targetPos}
            />
          );
        }
        return null;
      })}
    </>
  );
}

export default function Minimal3D({ nodes, edges, onNodeClick, className }: Minimal3DProps) {
  const [error, setError] = useState(false);

  if (error || nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">🎯</div>
          <div className="text-white text-lg mb-2">
            {error ? '3D View Error' : 'No Data to Visualize'}
          </div>
          <div className="text-gray-400 text-sm">
            {error ? 'Try using the Simplified 3D mode' : 'Load a project to see the 3D view'}
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`w-full h-full ${className}`}>
        <Canvas camera={{ position: [10, 5, 10] }}>
          <OrbitControls />
          <Scene nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
        </Canvas>
      </div>
    );
  } catch (err) {
    setError(true);
    return null;
  }
}