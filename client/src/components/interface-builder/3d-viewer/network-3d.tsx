import { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { Node, Edge } from 'reactflow';
import { Vector3, BufferGeometry, BufferAttribute, QuadraticBezierCurve3 } from 'three';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-white text-lg">Loading 3D View...</div>
        <div className="text-gray-400 text-sm">Initializing Three.js renderer</div>
      </div>
    </div>
  );
}

// Error fallback component
function ErrorFallback({ error }: { error?: Error }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <div className="text-white text-lg mb-2">3D View Unavailable</div>
        <div className="text-gray-400 text-sm mb-4">
          {error?.message || 'Unable to initialize 3D renderer. This may be due to browser compatibility or WebGL support.'}
        </div>
        <div className="text-gray-500 text-xs">
          Try refreshing the page or use the 2D view instead.
        </div>
      </div>
    </div>
  );
}

interface Network3DProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

// 3D Node Component
function Node3D({ 
  node, 
  position, 
  onClick 
}: { 
  node: Node; 
  position: [number, number, number]; 
  onClick?: (nodeId: string) => void;
}) {
  const meshRef = useRef<any>(null!);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Animate the node
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      if (hovered) {
        meshRef.current.scale.setScalar(1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  // Get node color based on type
  const getNodeColor = (nodeType: string, nodeId: string) => {
    if (nodeType === 'application') {
      if (nodeId.includes('web')) return '#3b82f6'; // Blue
      if (nodeId.includes('mobile')) return '#8b5cf6'; // Purple
      if (nodeId.includes('api') || nodeId.includes('service')) return '#10b981'; // Green
      if (nodeId.includes('database')) return '#6b7280'; // Gray
      if (nodeId.includes('cloud')) return '#06b6d4'; // Cyan
    }
    if (nodeType === 'interface') {
      if (nodeId.includes('rest') || nodeId.includes('graphql')) return '#3b82f6'; // Blue
      if (nodeId.includes('message')) return '#f59e0b'; // Orange
      if (nodeId.includes('file')) return '#22c55e'; // Green
    }
    if (nodeType === 'process') {
      return '#6366f1'; // Indigo
    }
    return '#64748b'; // Default gray
  };

  // Get node shape based on type
  const getNodeGeometry = (nodeType: string, nodeId: string) => {
    if (nodeType === 'application') {
      if (nodeId.includes('database')) {
        return <cylinderGeometry args={[1, 1, 0.5, 8]} />;
      }
      if (nodeId.includes('cloud')) {
        return <sphereGeometry args={[0.8, 16, 16]} />;
      }
      return <boxGeometry args={[1.5, 1, 0.8]} />;
    }
    if (nodeType === 'interface') {
      return <octahedronGeometry args={[0.8]} />;
    }
    if (nodeType === 'process') {
      return <dodecahedronGeometry args={[0.8]} />;
    }
    return <sphereGeometry args={[0.8]} />;
  };

  const color = getNodeColor(node.type || '', node.data.id);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={() => {
          setClicked(!clicked);
          onClick?.(node.id);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {getNodeGeometry(node.type || '', node.data.id)}
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={hovered ? 0.9 : 0.8}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.2 : 0}
        />
      </mesh>
      
      {/* Node Label */}
      <Html distanceFactor={10}>
        <div className={`
          bg-gray-900/90 text-white px-2 py-1 rounded text-xs
          transition-all duration-200 pointer-events-none
          ${hovered ? 'scale-110' : 'scale-100'}
        `}>
          {node.data.name}
        </div>
      </Html>

      {/* Status Indicator */}
      {node.data.status === 'active' && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
      )}
      
      {node.data.status === 'error' && (
        <mesh position={[0, 1.2, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}
    </group>
  );
}

// 3D Connection Component
function Connection3D({ 
  start, 
  end, 
  edge 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  edge: Edge;
}) {
  const lineRef = useRef<BufferGeometry>(null!);
  const materialRef = useRef<any>(null!);

  // Create curved line between nodes
  const points = useMemo(() => {
    const startVec = new Vector3(...start);
    const endVec = new Vector3(...end);
    const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);
    
    // Add curve height based on distance
    const distance = startVec.distanceTo(endVec);
    midVec.y += distance * 0.3;

    const curve = new QuadraticBezierCurve3(startVec, midVec, endVec);
    return curve.getPoints(50);
  }, [start, end]);

  // Animate the connection
  useFrame((state) => {
    if (materialRef.current && edge.animated) {
      materialRef.current.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  // Get connection color
  const getConnectionColor = () => {
    if (edge.data?.connectionType) {
      switch (edge.data.connectionType) {
        case 'HTTP Request':
        case 'HTTPS Request':
        case 'REST Request': return '#3b82f6';
        case 'API Call': return '#8b5cf6';
        case 'Service Call': return '#10b981';
        case 'Message': return '#f59e0b';
        case 'Database Query': return '#6b7280';
        default: return '#64748b';
      }
    }
    return '#64748b';
  };

  return (
    <line>
      <bufferGeometry ref={lineRef}>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flatMap(p => [p.x, p.y, p.z]))} // Native JS Float32Array
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial 
        ref={materialRef}
        color={getConnectionColor()} 
        transparent 
        opacity={0.6}
        linewidth={2}
      />
    </line>
  );
}

// Data Flow Particles
function DataFlowParticles({ 
  start, 
  end, 
  edge 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  edge: Edge;
}) {
  const particlesRef = useRef<any>(null!);
  const [particles] = useState(() => {
    const particleCount = 5;
    const positions = new Float32Array(particleCount * 3); // Native JS Float32Array
    return { positions, count: particleCount };
  });

  useFrame((state) => {
    if (particlesRef.current && edge.animated) {
      const time = state.clock.elapsedTime;
      for (let i = 0; i < particles.count; i++) {
        const progress = ((time * 0.5 + i * 0.2) % 1);
        const startVec = new Vector3(...start);
        const endVec = new Vector3(...end);
        const midVec = startVec.clone().add(endVec).multiplyScalar(0.5);
        const distance = startVec.distanceTo(endVec);
        midVec.y += distance * 0.3;

        const curve = new QuadraticBezierCurve3(startVec, midVec, endVec);
        const point = curve.getPoint(progress);
        
        particles.positions[i * 3] = point.x;
        particles.positions[i * 3 + 1] = point.y;
        particles.positions[i * 3 + 2] = point.z;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!edge.animated) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.count}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.1} transparent opacity={0.8} />
    </points>
  );
}

// Main Network3D Component
function NetworkScene({ nodes, edges, onNodeClick }: Network3DProps) {
  // Calculate 3D positions for nodes using force-directed layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, [number, number, number]>();
    
    // Ensure nodes is an array before processing
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    
    // Create a force-directed 3D layout
    if (safeNodes.length > 0) {
      safeNodes.forEach((node, index) => {
        const angle = (index / safeNodes.length) * Math.PI * 2;
        const radius = Math.max(5, safeNodes.length * 0.8);
        const layer = Math.floor(index / 8); // Create layers for many nodes
        
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = layer * 3 - (Math.floor(nodes.length / 8) * 1.5); // Center vertically
        
        positions.set(node.id, [x, y, z]);
      });
    } else {
      console.warn('nodes is not an array in Network3D:', nodes);
    }
    
    return positions;
  }, [nodes]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* Render Nodes */}
      {Array.isArray(nodes) && nodes.map((node) => {
        const position = nodePositions.get(node.id) || [0, 0, 0];
        return (
          <Node3D
            key={node.id}
            node={node}
            position={position}
            onClick={onNodeClick}
          />
        );
      })}

      {/* Render Connections */}
      {Array.isArray(edges) && edges.map((edge) => {
        const startPos = nodePositions.get(edge.source) || [0, 0, 0];
        const endPos = nodePositions.get(edge.target) || [0, 0, 0];
        
        return (
          <group key={edge.id}>
            <Connection3D start={startPos} end={endPos} edge={edge} />
            <DataFlowParticles start={startPos} end={endPos} edge={edge} />
          </group>
        );
      })}

      {/* Grid Helper */}
      <gridHelper args={[20, 20, '#374151', '#374151']} position={[0, -5, 0]} />
    </>
  );
}

export default function Network3D({ nodes, edges, onNodeClick, className }: Network3DProps) {
  const [error, setError] = useState<Error | null>(null);

  // Error boundary effect
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Three') || event.error?.message?.includes('WebGL')) {
        setError(event.error);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return <ErrorFallback error={error} />;
  }

  // Show empty state if no data
  if (!nodes.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📊</div>
          <div className="text-white text-lg mb-2">No Data to Visualize</div>
          <div className="text-gray-400 text-sm">
            Load a project or add components to see the 3D network topology
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className={`w-full h-full ${className}`}>
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            camera={{ position: [15, 10, 15], fov: 60 }}
            style={{ background: '#111827' }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
          >
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              maxPolarAngle={Math.PI}
              minDistance={5}
              maxDistance={50}
            />
            <NetworkScene nodes={nodes} edges={edges} onNodeClick={onNodeClick} />
          </Canvas>
        </Suspense>
      </div>
    );
  } catch (err) {
    return <ErrorFallback error={err as Error} />;
  }
}