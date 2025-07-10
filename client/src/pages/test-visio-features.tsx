import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import ReactFlow, {
  Node,
  Edge,
  NodeTypes,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import EnhancedRectangleNode from '@/components/interface-builder/nodes/enhanced-rectangle-node';
import ArrowNode from '@/components/interface-builder/nodes/arrow-node';
import ShapeNode from '@/components/interface-builder/nodes/shape-node';

const nodeTypes: NodeTypes = {
  enhancedRectangle: EnhancedRectangleNode,
  arrow: ArrowNode,
  shape: ShapeNode,
};

export default function TestVisioFeatures() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const initialNodes: Node[] = [
    {
      id: '1',
      type: 'enhancedRectangle',
      position: { x: 100, y: 100 },
      data: {
        label: 'Enhanced Rectangle',
        width: 200,
        height: 100,
        rotation: 0,
        fillColor: '#2d3748',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        borderRadius: 8,
        text: 'Resize & Rotate Me!',
        fontSize: 16,
        textColor: '#ffffff',
        onUpdate: (data: any) => {
          console.log('Node updated:', data);
        },
      },
    },
    {
      id: '2',
      type: 'arrow',
      position: { x: 400, y: 100 },
      data: {
        width: 150,
        height: 60,
        fillColor: '#4a5568',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Flow',
        fontSize: 14,
        textColor: '#ffffff',
        arrowDirection: 'right',
        arrowStyle: 'single',
        headSize: 20,
      },
    },
    {
      id: '3',
      type: 'shape',
      position: { x: 150, y: 250 },
      data: {
        id: 'star',
        label: 'Star Shape',
        width: 120,
        height: 120,
        fillColor: '#805ad5',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        points: 5,
        innerRadius: 30,
        text: 'Star',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '4',
      type: 'shape',
      position: { x: 350, y: 250 },
      data: {
        id: 'hexagon',
        label: 'Hexagon Shape',
        width: 120,
        height: 120,
        fillColor: '#319795',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Process',
        fontSize: 14,
        textColor: '#ffffff',
      },
    },
    {
      id: '5',
      type: 'arrow',
      position: { x: 250, y: 400 },
      data: {
        width: 100,
        height: 150,
        fillColor: '#e53e3e',
        strokeColor: '#ffffff',
        strokeWidth: 2,
        text: 'Down',
        fontSize: 14,
        textColor: '#ffffff',
        arrowDirection: 'down',
        arrowStyle: 'double',
        headSize: 25,
      },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handlePaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-white">Visio-like Features Test</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            fitView
            className="bg-gray-900"
          >
            <Background color="#374151" variant={BackgroundVariant.Dots} />
            <Controls className="bg-gray-800 border-gray-700" />
          </ReactFlow>
        </div>

        {/* Info Panel */}
        <Card className="w-80 m-4 p-4 bg-gray-800 border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4">Visio-like Features</h2>
          
          <div className="space-y-4 text-sm text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">✨ New Features:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>8-point resize handles on selected shapes</li>
                <li>Rotation handle above selected shapes</li>
                <li>Snap-to-angle rotation (45° increments)</li>
                <li>Arrow shapes with multiple directions</li>
                <li>Enhanced shape selection feedback</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">🎯 Try These:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click on the rectangle to select it</li>
                <li>Drag the blue handles to resize</li>
                <li>Drag the rotation handle to rotate</li>
                <li>Double-click shapes to edit text</li>
                <li>Try different arrow directions</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">🔧 Keyboard Shortcuts:</h3>
              <ul className="space-y-1 list-disc list-inside">
                <li>Hold Shift while resizing for aspect ratio</li>
                <li>Rotation snaps to 45° angles</li>
                <li>Enter to confirm text edit</li>
                <li>Escape to cancel text edit</li>
              </ul>
            </div>

            {selectedNode && (
              <div>
                <h3 className="font-semibold text-white mb-2">📊 Selected Node:</h3>
                <div className="bg-gray-700 p-2 rounded text-xs">
                  <div>ID: {selectedNode.id}</div>
                  <div>Type: {selectedNode.type}</div>
                  <div>Position: ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</div>
                  {selectedNode.data.width && (
                    <div>Size: {selectedNode.data.width} × {selectedNode.data.height}</div>
                  )}
                  {selectedNode.data.rotation !== undefined && (
                    <div>Rotation: {selectedNode.data.rotation}°</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}