import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Connection,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  BackgroundVariant,
  Panel,
  SelectionMode,
  useReactFlow,
  ReactFlowProvider,
  OnSelectionChangeParams,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useToast } from '@/hooks/use-toast';
import AlignmentToolbar from './alignment-toolbar';
import SmartGuides from './smart-guides';
import { alignNodes, distributeNodes, snapToGrid } from './utils/alignment';

// Import all node types
import InterfaceNode from './nodes/interface-node';
import ApplicationNode from './nodes/application-node';
import ProcessNode from './nodes/process-node';
import TextNode from './nodes/text-node';
import LineNode from './nodes/line-node';
import ShapeNode from './nodes/shape-node';
import InternalActivityNode from './nodes/internal-activity-node';
import DecisionNode from './nodes/decision-node';
import EnhancedRectangleNode from './nodes/enhanced-rectangle-node';
import ArrowNode from './nodes/arrow-node';
import SmartEdge from './edges/smart-edge';

const nodeTypes: NodeTypes = {
  interface: InterfaceNode,
  application: ApplicationNode,
  process: ProcessNode,
  text: TextNode,
  line: LineNode,
  shape: ShapeNode,
  internalActivity: InternalActivityNode,
  decision: DecisionNode,
  enhancedRectangle: EnhancedRectangleNode,
  arrow: ArrowNode,
};

const edgeTypes: EdgeTypes = {
  smart: SmartEdge,
};

interface EnhancedCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  onChange?: (nodes: Node[], edges: Edge[]) => void;
}

function EnhancedCanvasInner({ 
  initialNodes = [], 
  initialEdges = [], 
  onSave, 
  onChange
}: EnhancedCanvasProps) {
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const gridSize = 10;

  // Handle selection changes
  const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
    const { nodes } = params;
    setSelectedNodes(nodes || []);
  }, []);

  // Handle node drag start
  const onNodeDragStart = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNodeId(node.id);
  }, []);

  // Handle node drag stop
  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    setDraggedNodeId(null);
    
    if (snapToGridEnabled) {
      const snappedPosition = snapToGrid(node.position, gridSize);
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, position: snappedPosition };
          }
          return n;
        })
      );
    }
  }, [snapToGridEnabled, gridSize, setNodes]);

  // Handle node drag
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (snapToGridEnabled) {
      const snappedPosition = snapToGrid(node.position, gridSize);
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, position: snappedPosition };
          }
          return n;
        })
      );
    }
  }, [snapToGridEnabled, gridSize, setNodes]);

  // Alignment handlers
  const handleAlign = useCallback((type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const alignedNodes = alignNodes(selectedNodes, type);
    setNodes((nds) => {
      const updatedNodes = [...nds];
      alignedNodes.forEach((alignedNode) => {
        const index = updatedNodes.findIndex((n) => n.id === alignedNode.id);
        if (index !== -1) {
          updatedNodes[index] = alignedNode;
        }
      });
      return updatedNodes;
    });
    toast({
      title: 'Nodes aligned',
      description: `Aligned ${selectedNodes.length} nodes to ${type}`,
    });
  }, [selectedNodes, setNodes, toast]);

  // Distribution handlers
  const handleDistribute = useCallback((type: 'horizontal' | 'vertical') => {
    const distributedNodes = distributeNodes(selectedNodes, type);
    setNodes((nds) => {
      const updatedNodes = [...nds];
      distributedNodes.forEach((distributedNode) => {
        const index = updatedNodes.findIndex((n) => n.id === distributedNode.id);
        if (index !== -1) {
          updatedNodes[index] = distributedNode;
        }
      });
      return updatedNodes;
    });
    toast({
      title: 'Nodes distributed',
      description: `Distributed ${selectedNodes.length} nodes ${type}ly`,
    });
  }, [selectedNodes, setNodes, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('left');
            break;
          case 'c':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('center');
            break;
          case 'r':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('right');
            break;
          case 't':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('top');
            break;
          case 'm':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('middle');
            break;
          case 'b':
            e.preventDefault();
            if (selectedNodes.length > 1) handleAlign('bottom');
            break;
          case 'h':
            e.preventDefault();
            if (selectedNodes.length > 2) handleDistribute('horizontal');
            break;
          case 'v':
            e.preventDefault();
            if (selectedNodes.length > 2) handleDistribute('vertical');
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, handleAlign, handleDistribute]);

  // Call onChange when nodes or edges change
  useEffect(() => {
    if (onChange) {
      onChange(nodes, edges);
    }
  }, [nodes, edges, onChange]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        selectionMode={SelectionMode.Partial}
        panOnScroll
        selectionOnDrag
        fitView
      >
        <Background 
          color="#374151" 
          variant={showGrid ? BackgroundVariant.Dots : undefined}
          gap={gridSize}
        />
        <Controls />
        
        {/* Alignment Toolbar */}
        <Panel position="top-center" className="mt-4">
          <AlignmentToolbar
            selectedNodes={selectedNodes}
            onAlign={handleAlign}
            onDistribute={handleDistribute}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid(!showGrid)}
            showRulers={showRulers}
            onToggleRulers={() => setShowRulers(!showRulers)}
            snapToGrid={snapToGridEnabled}
            onToggleSnapToGrid={() => setSnapToGridEnabled(!snapToGridEnabled)}
          />
        </Panel>

        {/* Smart Guides */}
        <SmartGuides
          nodes={nodes}
          activeNodeId={draggedNodeId}
          threshold={5}
        />
      </ReactFlow>
    </div>
  );
}

export default function EnhancedCanvas(props: EnhancedCanvasProps) {
  return (
    <ReactFlowProvider>
      <EnhancedCanvasInner {...props} />
    </ReactFlowProvider>
  );
}